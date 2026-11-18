import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createHash, randomBytes } from "node:crypto";
import { getDb } from "./db";
import { can, type Permission, type Role } from "./permissions";

export const SESSION_COOKIE = "cancha_session";
const SESSION_HOURS = Number(process.env.SESSION_HOURS) || 12;

export type SessionUser = {
  id: number;
  username: string;
  name: string;
  role: Role;
};

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** Crea la sesión en la base de datos y deja la cookie en el navegador. */
export async function createSession(userId: number) {
  const db = getDb();
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const expiresAt = now + SESSION_HOURS * 60 * 60 * 1000;

  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now);
  db.prepare(
    "INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
  ).run(sha256(token), userId, now, expiresAt);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Pon COOKIE_SECURE=true solo si publicas la app con https://
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE id = ?").run(sha256(token));
  jar.delete(SESSION_COOKIE);
}

/** Cierra todas las sesiones de un usuario (menos la actual, si se indica). */
export async function destroyUserSessions(userId: number, keepCurrent = false) {
  const db = getDb();
  if (keepCurrent) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    db.prepare("DELETE FROM sessions WHERE user_id = ? AND id != ?").run(
      userId,
      token ? sha256(token) : "",
    );
  } else {
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  }
}

/** Usuario de la sesión actual, o null. Se consulta una sola vez por petición. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.username, u.name, u.role
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > ? AND u.active = 1`,
    )
    .get(sha256(token), Date.now()) as SessionUser | undefined;
  return row ?? null;
});

/** Para páginas: si no hay sesión, manda al inicio de sesión. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Para páginas: si el rol no tiene el permiso, vuelve al resumen. */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) redirect("/");
  return user;
}

export function hasUsers(): boolean {
  return Boolean(getDb().prepare("SELECT 1 FROM users LIMIT 1").get());
}
