"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { destroyUserSessions, getSessionUser } from "@/lib/auth";
import { NO_PERMISSION, can } from "@/lib/permissions";
import { checkPasswordRules, hashPassword } from "@/lib/password.mjs";
import { USERNAME_HELP, USERNAME_RULE, text, toInt, type FormState } from "@/lib/forms";

async function adminOnly() {
  const user = await getSessionUser();
  return user && can(user.role, "usuarios.gestionar") ? user : null;
}

export async function createUser(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!(await adminOnly())) return { error: NO_PERMISSION };

  const name = text(fd.get("name"));
  const username = text(fd.get("username")).toLowerCase();
  const role = text(fd.get("role"));
  const password = String(fd.get("password") ?? "");

  if (!name) return { error: "Escribe el nombre de la persona." };
  if (!USERNAME_RULE.test(username)) return { error: USERNAME_HELP };
  if (role !== "admin" && role !== "employee") return { error: "Elige el rol." };
  const rule = checkPasswordRules(password);
  if (rule) return { error: rule };

  try {
    getDb()
      .prepare("INSERT INTO users (username, name, role, password_hash) VALUES (?, ?, ?, ?)")
      .run(username, name, role, hashPassword(password));
  } catch (e) {
    if (e instanceof Error && e.message.includes("UNIQUE"))
      return { error: `El usuario "${username}" ya existe. Elige otro.` };
    throw e;
  }
  revalidatePath("/usuarios");
  return { ok: `Usuario ${username} creado. Entrégale su contraseña en persona.` };
}

export async function resetUserPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!(await adminOnly())) return { error: NO_PERMISSION };

  const userId = toInt(fd.get("user_id"));
  const password = String(fd.get("password") ?? "");
  const rule = checkPasswordRules(password);
  if (rule) return { error: rule };

  const info = getDb()
    .prepare("UPDATE users SET password_hash = ?, failed_attempts = 0, locked_until = 0 WHERE id = ?")
    .run(hashPassword(password), userId);
  if (info.changes === 0) return { error: "No encontramos al usuario." };

  await destroyUserSessions(userId);
  return { ok: "Contraseña cambiada. Se cerraron sus sesiones abiertas." };
}

export async function setUserActive(fd: FormData) {
  const admin = await adminOnly();
  if (!admin) return;

  const userId = toInt(fd.get("user_id"));
  const active = toInt(fd.get("active")) === 1 ? 1 : 0;
  if (userId === admin.id) return; // nadie se desactiva a sí mismo: así siempre queda un administrador

  getDb().prepare("UPDATE users SET active = ? WHERE id = ?").run(active, userId);
  if (!active) await destroyUserSessions(userId);
  revalidatePath("/usuarios");
}
