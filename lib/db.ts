import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { initDb } from "./schema.mjs";

const g = globalThis as unknown as { __cancha_db?: Database.Database };

/**
 * Devuelve la conexión a la base de datos (un solo archivo: data/cancha.db).
 * Para guardarla en otra carpeta, define la variable CANCHA_DATA_DIR.
 */
export function getDb(): Database.Database {
  if (!g.__cancha_db) {
    const dir = process.env.CANCHA_DATA_DIR ?? path.join(process.cwd(), "data");
    fs.mkdirSync(dir, { recursive: true });
    const db = new Database(path.join(dir, "cancha.db"));
    initDb(db);
    g.__cancha_db = db;
  }
  return g.__cancha_db;
}
