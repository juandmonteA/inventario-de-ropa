// Esquema de la base de datos. Lo comparten la app (lib/db.ts) y los scripts
// (scripts/*.mjs), por eso es JavaScript plano.

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  username        TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  name            TEXT    NOT NULL,
  role            TEXT    NOT NULL CHECK (role IN ('admin','employee')),
  password_hash   TEXT    NOT NULL,
  active          INTEGER NOT NULL DEFAULT 1,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until    INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

-- id es el hash SHA-256 del código que viaja en la cookie: aunque alguien lea la
-- base de datos, no puede usar las sesiones.
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT    PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  sku         TEXT    NOT NULL UNIQUE,
  category    TEXT    NOT NULL,
  brand       TEXT    NOT NULL DEFAULT '',
  price       INTEGER NOT NULL,
  cost        INTEGER NOT NULL DEFAULT 0,
  size_kind   TEXT    NOT NULL DEFAULT 'ropa',
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS variants (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size        TEXT    NOT NULL,
  color       TEXT    NOT NULL,
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock   INTEGER NOT NULL DEFAULT 3,
  UNIQUE (product_id, size, color)
);

-- qty es el cambio de stock con signo: entrada +, salida -, venta -, conteo +/-
CREATE TABLE IF NOT EXISTS movements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  variant_id  INTEGER NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  type        TEXT    NOT NULL CHECK (type IN ('entrada','salida','venta','ajuste')),
  qty         INTEGER NOT NULL,
  unit_price  INTEGER NOT NULL DEFAULT 0,
  ref         TEXT    NOT NULL DEFAULT '',
  note        TEXT    NOT NULL DEFAULT '',
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_movements_created ON movements (created_at);
CREATE INDEX IF NOT EXISTS idx_movements_variant ON movements (variant_id);
CREATE INDEX IF NOT EXISTS idx_variants_product  ON variants (product_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user     ON sessions (user_id);
`;

export function initDb(db) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  migrate(db);
}

// Cambios para bases de datos creadas con versiones anteriores.
function migrate(db) {
  const cols = db.prepare("PRAGMA table_info(movements)").all();
  if (!cols.some((c) => c.name === "user_id")) {
    db.exec(
      "ALTER TABLE movements ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL",
    );
  }
}
