// Copia de seguridad de la base de datos (seguro aunque la app esté abierta).
//   npm run backup
// Guarda en data/respaldos (o en CANCHA_BACKUP_DIR, por ejemplo una USB: E:\respaldos)
// y conserva las 30 copias más recientes.
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// Lee .env.local (nombre de la tienda, carpeta de datos o de respaldos), igual que la app.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no existe: se usan los valores por defecto
}

const dataDir = process.env.CANCHA_DATA_DIR ?? path.join(process.cwd(), "data");
const source = path.join(dataDir, "cancha.db");
const KEEP = 30;

if (!fs.existsSync(source)) {
  console.log("Aún no hay datos que respaldar.");
  process.exit(0);
}

const outDir = process.env.CANCHA_BACKUP_DIR ?? path.join(dataDir, "respaldos");
fs.mkdirSync(outDir, { recursive: true });

const d = new Date();
const pad = (n) => String(n).padStart(2, "0");
const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
const dest = path.join(outDir, `cancha-${stamp}.db`);

const db = new Database(source, { readonly: true });
try {
  await db.backup(dest);
} finally {
  db.close();
}

const copies = fs
  .readdirSync(outDir)
  .filter((f) => /^cancha-.*\.db$/.test(f))
  .sort();
for (const old of copies.slice(0, Math.max(0, copies.length - KEEP))) {
  fs.rmSync(path.join(outDir, old));
}
console.log(`Respaldo guardado: ${dest}`);
