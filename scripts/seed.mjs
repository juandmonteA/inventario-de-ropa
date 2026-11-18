// Carga datos de ejemplo para mostrar la app a un cliente.
//   npm run seed          -> solo si la base está vacía
//   npm run seed:reset    -> borra todo y vuelve a cargar los ejemplos
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { initDb } from "../lib/schema.mjs";

// Lee .env.local (nombre de la tienda, carpeta de datos o de respaldos), igual que la app.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no existe: se usan los valores por defecto
}

const dir = process.env.CANCHA_DATA_DIR ?? path.join(process.cwd(), "data");
fs.mkdirSync(dir, { recursive: true });
const db = new Database(path.join(dir, "cancha.db"));
initDb(db);

const reset = process.argv.includes("--reset");
const existing = db.prepare("SELECT COUNT(*) AS n FROM products").get().n;
if (existing > 0 && !reset) {
  console.log(
    `La base ya tiene ${existing} productos. Usa "npm run seed:reset" para reemplazarlos.`,
  );
  process.exit(0);
}
if (reset) {
  db.exec(
    "DELETE FROM movements; DELETE FROM variants; DELETE FROM products; DELETE FROM sqlite_sequence WHERE name IN ('products', 'variants', 'movements');",
  );
}

// Números pseudoaleatorios repetibles: los datos de ejemplo siempre salen iguales.
let seed = 20261017;
function rand() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const between = (a, b) => a + Math.floor(rand() * (b - a + 1));

const ROPA = ["XS", "S", "M", "L", "XL", "XXL"];
const CALZADO = ["37", "38", "39", "40", "41", "42", "43"];
const UNICA = ["Única"];

const catalog = [
  ["Camiseta Dry-Fit Pulse", "CAM-1001", "Camisetas", "Velox", 59900, 24000, "ropa", ["Negro", "Azul rey", "Blanco"], ROPA.slice(1, 6)],
  ["Camiseta Compresión Térmica", "CAM-1002", "Camisetas", "Kinetic", 89900, 38000, "ropa", ["Negro", "Gris"], ROPA.slice(1, 5)],
  ["Short Running Aero 5\"", "SHO-2001", "Shorts", "Aero", 69900, 27000, "ropa", ["Negro", "Naranja"], ROPA.slice(0, 5)],
  ["Short Baloncesto Mesh", "SHO-2002", "Shorts", "Kinetic", 79900, 31000, "ropa", ["Rojo", "Blanco"], ROPA.slice(1, 6)],
  ["Leggings Seamless Flow", "LEG-3001", "Leggings", "Velox", 119900, 46000, "ropa", ["Negro", "Vino", "Verde"], ROPA.slice(0, 5)],
  ["Licra Ciclista Alta", "LEG-3002", "Leggings", "Velox", 99900, 38000, "ropa", ["Negro", "Gris"], ROPA.slice(0, 5)],
  ["Sudadera Jogger Fleece", "SUD-4001", "Sudaderas", "Aero", 149900, 62000, "ropa", ["Gris", "Negro"], ROPA.slice(1, 6)],
  ["Hoodie Training Core", "SUD-4002", "Sudaderas", "Kinetic", 169900, 70000, "ropa", ["Gris", "Azul marino"], ROPA.slice(1, 6)],
  ["Chaqueta Cortavientos Trail", "CHA-5001", "Chaquetas", "Aero", 189900, 79000, "ropa", ["Negro", "Amarillo"], ROPA.slice(1, 6)],
  ["Tenis Running Impulse", "TEN-6001", "Tenis", "Velox", 259900, 118000, "calzado", ["Blanco", "Negro"], CALZADO],
  ["Tenis Training Flex", "TEN-6002", "Tenis", "Kinetic", 229900, 101000, "calzado", ["Gris", "Azul"], CALZADO],
  ["Medias Deportivas x3", "MED-7001", "Medias", "Aero", 29900, 10000, "unica", ["Blanco", "Negro"], UNICA],
  ["Gorra Running Light", "ACC-8001", "Accesorios", "Velox", 39900, 14000, "unica", ["Negro", "Blanco"], UNICA],
  ["Botella Térmica 750 ml", "ACC-8002", "Accesorios", "Aero", 49900, 19000, "unica", ["Azul", "Negro"], UNICA],
];

const insertProduct = db.prepare(
  `INSERT INTO products (name, sku, category, brand, price, cost, size_kind, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime', ?))`,
);
const insertVariant = db.prepare(
  `INSERT INTO variants (product_id, size, color, stock, min_stock) VALUES (?, ?, ?, ?, ?)`,
);
const insertMovement = db.prepare(
  `INSERT INTO movements (variant_id, type, qty, unit_price, ref, note, created_at)
   VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime', ?, ?))`,
);
const setStock = db.prepare("UPDATE variants SET stock = ? WHERE id = ?");

const variants = []; // { id, price, stock, label }

db.transaction(() => {
  catalog.forEach(
    ([name, sku, category, brand, price, cost, kind, colors, sizes], i) => {
      const pid = Number(
        insertProduct.run(name, sku, category, brand, price, cost, kind, `-${30 - i} days`)
          .lastInsertRowid,
      );
      for (const color of colors) {
        for (const size of sizes) {
          const stock = kind === "unica" ? between(14, 36) : between(8, 22);
          const minStock = kind === "calzado" ? 2 : 3;
          const vid = Number(
            insertVariant.run(pid, size, color, stock, minStock).lastInsertRowid,
          );
          insertMovement.run(vid, "entrada", stock, 0, "", "Stock inicial", "-20 days", "-2 hours");
          variants.push({ id: vid, price, stock });
        }
      }
    },
  );

  // Ventas de los últimos 14 días, más movidas los fines de semana.
  let saleNo = 0;
  for (let day = 13; day >= 0; day--) {
    const tickets = between(2, 5);
    for (let t = 0; t < tickets; t++) {
      saleNo++;
      const ref = `V-DEMO${String(saleNo).padStart(3, "0")}`;
      const hoursAgo = `-${between(0, 9)} hours`;
      const lines = between(1, 2);
      for (let l = 0; l < lines; l++) {
        const v = variants[between(0, variants.length - 1)];
        if (v.stock <= 0) continue;
        const qty = Math.min(v.stock, between(1, 2));
        v.stock -= qty;
        setStock.run(v.stock, v.id);
        insertMovement.run(v.id, "venta", -qty, v.price, ref, "", `-${day} days`, hoursAgo);
      }
    }
  }

  // Deja pocas tallas casi agotadas (como si un conteo físico encontrara menos
  // unidades) para que se vean las alertas sin inflar las ventas.
  const almostOut = [4, 21, 47, 63, 88].map((i) => variants[i]).filter(Boolean);
  almostOut.forEach((v, i) => {
    const left = i === 0 ? 0 : i % 3;
    if (v.stock <= left) return;
    insertMovement.run(v.id, "ajuste", left - v.stock, 0, "", "Conteo de inventario", "-1 days", "-2 hours");
    v.stock = left;
    setStock.run(left, v.id);
  });
})();

const n = db.prepare("SELECT COUNT(*) AS n FROM variants").get().n;
console.log(`Listo: ${catalog.length} productos y ${n} combinaciones de color y talla.`);
