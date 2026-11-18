"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import {
  createSession,
  destroySession,
  destroyUserSessions,
  getSessionUser,
} from "@/lib/auth";
import { checkPasswordRules, hashPassword, verifyPassword } from "@/lib/password.mjs";
import { USERNAME_HELP, USERNAME_RULE, text, type FormState } from "@/lib/forms";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 10;
const WRONG = "Usuario o contraseña incorrectos.";

// Se usa para que tardar lo mismo con usuarios que no existen (no revela cuáles existen).
const DUMMY_HASH = hashPassword("contraseña-de-relleno");

type UserRow = {
  id: number;
  password_hash: string;
  active: number;
  failed_attempts: number;
  locked_until: number;
};

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const username = text(fd.get("username")).toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!username || !password) return { error: "Escribe tu usuario y tu contraseña." };

  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as
    | UserRow
    | undefined;

  if (!user) {
    verifyPassword(password, DUMMY_HASH);
    return { error: WRONG };
  }

  const now = Date.now();
  if (user.locked_until > now) {
    const mins = Math.ceil((user.locked_until - now) / 60000);
    return {
      error: `Demasiados intentos fallidos. Vuelve a intentarlo en ${mins} ${mins === 1 ? "minuto" : "minutos"}.`,
    };
  }

  if (!verifyPassword(password, user.password_hash)) {
    const attempts = user.failed_attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      db.prepare("UPDATE users SET failed_attempts = 0, locked_until = ? WHERE id = ?").run(
        now + LOCK_MINUTES * 60000,
        user.id,
      );
      return {
        error: `Demasiados intentos fallidos. El acceso queda bloqueado ${LOCK_MINUTES} minutos.`,
      };
    }
    db.prepare("UPDATE users SET failed_attempts = ? WHERE id = ?").run(attempts, user.id);
    return { error: WRONG };
  }

  if (!user.active)
    return { error: "Este usuario está desactivado. Pídele al administrador que lo active." };

  db.prepare("UPDATE users SET failed_attempts = 0, locked_until = 0 WHERE id = ?").run(user.id);
  await createSession(user.id);
  redirect("/");
}

/** Primera configuración: crea al administrador. Solo funciona si aún no hay usuarios. */
export async function setupAdmin(_prev: FormState, fd: FormData): Promise<FormState> {
  const name = text(fd.get("name"));
  const username = text(fd.get("username")).toLowerCase();
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");

  if (!name) return { error: "Escribe tu nombre." };
  if (!USERNAME_RULE.test(username)) return { error: USERNAME_HELP };
  const rule = checkPasswordRules(password);
  if (rule) return { error: rule };
  if (password !== confirm) return { error: "Las contraseñas no coinciden." };

  const db = getDb();
  const hash = hashPassword(password);
  const id = db.transaction(() => {
    if (db.prepare("SELECT 1 FROM users LIMIT 1").get()) return null;
    const info = db
      .prepare("INSERT INTO users (username, name, role, password_hash) VALUES (?, ?, 'admin', ?)")
      .run(username, name, hash);
    return Number(info.lastInsertRowid);
  })();

  if (id === null) redirect("/login");
  await createSession(id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function changeOwnPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");

  const row = getDb().prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as
    | { password_hash: string }
    | undefined;
  if (!row || !verifyPassword(current, row.password_hash))
    return { error: "La contraseña actual no es correcta." };
  const rule = checkPasswordRules(next);
  if (rule) return { error: rule };
  if (next !== confirm) return { error: "Las contraseñas nuevas no coinciden." };

  getDb().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(next), user.id);
  await destroyUserSessions(user.id, true); // cierra las demás sesiones abiertas
  return { ok: "Contraseña cambiada." };
}
