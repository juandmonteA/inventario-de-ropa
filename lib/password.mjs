// Contraseñas: nunca se guardan tal cual, solo un "hash" con scrypt (viene con Node,
// no necesita instalar nada). Lo usan la app y los scripts de la carpeta scripts/.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;

export function hashPassword(password) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, KEY_LENGTH, { N, r: R, p: P });
  return `scrypt$${N}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export function verifyPassword(password, stored) {
  const parts = String(stored).split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;
  const n = Number(parts[1]);
  const salt = Buffer.from(parts[2], "base64");
  const expected = Buffer.from(parts[3], "base64");
  const key = scryptSync(password, salt, expected.length, { N: n, r: R, p: P });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export const MIN_PASSWORD_LENGTH = 8;

/** Devuelve un mensaje de error, o null si la contraseña es aceptable. */
export function checkPasswordRules(password) {
  if (password.length < MIN_PASSWORD_LENGTH)
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (/^\d+$/.test(password))
    return "La contraseña no puede ser solo números. Mezcla letras y números.";
  return null;
}
