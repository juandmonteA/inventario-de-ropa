// Cambia la contraseña de un usuario desde la línea de comandos.
// Sirve si el administrador olvidó la suya:
//   npm run reset-password                      (pregunta usuario y contraseña)
//   npm run reset-password -- usuario nueva-contraseña
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { initDb } from "../lib/schema.mjs";
import { checkPasswordRules, hashPassword } from "../lib/password.mjs";

// Lee .env.local (nombre de la tienda, carpeta de datos o de respaldos), igual que la app.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no existe: se usan los valores por defecto
}

let [username, password] = process.argv.slice(2);
if (!username || !password) {
  // Sin argumentos preguntamos aquí mismo: así la contraseña puede llevar cualquier símbolo
  // sin que el .bat de Windows la estropee.
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const lines = rl[Symbol.asyncIterator](); // guarda las líneas aunque lleguen juntas
  const ask = async (question) => {
    process.stdout.write(question);
    const { value } = await lines.next();
    return value ?? "";
  };
  username = (await ask("Usuario (por ejemplo: laura): ")).trim();
  password = await ask("Contraseña nueva (mínimo 8 caracteres, con letras y números): ");
  rl.close();
}
if (!username || !password) {
  console.log("Faltó el usuario o la contraseña. No se cambió nada.");
  process.exit(1);
}
const rule = checkPasswordRules(password);
if (rule) {
  console.log(rule);
  process.exit(1);
}

const dir = process.env.CANCHA_DATA_DIR ?? path.join(process.cwd(), "data");
fs.mkdirSync(dir, { recursive: true });
const db = new Database(path.join(dir, "cancha.db"));
initDb(db);

const user = db.prepare("SELECT id FROM users WHERE username = ?").get(username.toLowerCase());
if (!user) {
  console.log(`No existe el usuario "${username}".`);
  process.exit(1);
}
db.prepare(
  "UPDATE users SET password_hash = ?, active = 1, failed_attempts = 0, locked_until = 0 WHERE id = ?",
).run(hashPassword(password), user.id);
db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);
console.log(`Listo. El usuario "${username}" ya puede entrar con la contraseña nueva.`);
