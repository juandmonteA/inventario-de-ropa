"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { SIZE_SETS, type SizeKind } from "@/lib/constants";
import { getSessionUser } from "@/lib/auth";
import { NO_PERMISSION, can, type Permission } from "@/lib/permissions";
import { text, toInt, type FormState } from "@/lib/forms";

/** Usuario con sesión válida y con el permiso pedido; si no, null. */
async function allowed(permission: Permission) {
  const user = await getSessionUser();
  return user && can(user.role, permission) ? user : null;
}

function isSizeKind(value: string): value is SizeKind {
  return value in SIZE_SETS;
}

/** Lee los campos stock_<talla>. Un campo vacío significa "no manejo esa talla". */
function readStocks(fd: FormData, kind: SizeKind) {
  const rows: { size: string; qty: number }[] = [];
  for (const size of SIZE_SETS[kind]) {
    const raw = text(fd.get(`stock_${size}`));
    if (raw === "") continue;
    rows.push({ size, qty: Math.max(0, toInt(raw)) });
  }
  return rows;
}

function makeSku(category: string): string {
  const base =
    category
      .normalize("NFD")
      .replace(/[^A-Za-z]/g, "")
      .slice(0, 3)
      .toUpperCase() || "PRD";
  return `${base}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function createProduct(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  if (!(await allowed("inventario.crear"))) return { error: NO_PERMISSION };
  const name = text(fd.get("name"));
  const category = text(fd.get("category"));
  const brand = text(fd.get("brand"));
  const kindRaw = text(fd.get("size_kind"));
  const color = text(fd.get("color"));
  const price = toInt(fd.get("price"));
  const cost = toInt(fd.get("cost"));
  const minStock = Math.max(0, toInt(fd.get("min_stock"), 3));
  const sku = (text(fd.get("sku")) || makeSku(category)).toUpperCase();

  const user = (await allowed("inventario.crear"))!;
  if (!name) return { error: "Escribe el nombre del producto." };
  if (!category) return { error: "Elige o escribe una categoría." };
  if (!isSizeKind(kindRaw)) return { error: "Elige el tipo de talla." };
  if (price <= 0) return { error: "El precio de venta debe ser mayor que 0." };
  if (!color) return { error: "Indica el color de este primer lote." };

  const stocks = readStocks(fd, kindRaw);
  if (!stocks.length)
    return { error: "Escribe las unidades de al menos una talla." };

  const db = getDb();
  let productId: number;
  try {
    productId = db.transaction(() => {
      const info = db
        .prepare(
          `INSERT INTO products (name, sku, category, brand, price, cost, size_kind)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(name, sku, category, brand, price, cost, kindRaw);
      const id = Number(info.lastInsertRowid);
      insertVariants(id, color, stocks, minStock, user.id);
      return id;
    })();
  } catch (e) {
    if (e instanceof Error && e.message.includes("UNIQUE")) {
      return { error: `Ya existe un producto con el código ${sku}.` };
    }
    throw e;
  }

  refresh();
  redirect(`/inventario/${productId}`);
}

function insertVariants(
  productId: number,
  color: string,
  stocks: { size: string; qty: number }[],
  minStock: number,
  userId: number,
) {
  const db = getDb();
  const insertVariant = db.prepare(
    `INSERT INTO variants (product_id, size, color, stock, min_stock)
     VALUES (?, ?, ?, ?, ?)`,
  );
  const insertMovement = db.prepare(
    `INSERT INTO movements (variant_id, type, qty, note, user_id)
     VALUES (?, 'entrada', ?, 'Stock inicial', ?)`,
  );
  for (const { size, qty } of stocks) {
    const v = insertVariant.run(productId, size, color, qty, minStock);
    if (qty > 0) insertMovement.run(Number(v.lastInsertRowid), qty, userId);
  }
}

export async function addColor(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await allowed("inventario.crear");
  if (!user) return { error: NO_PERMISSION };
  const productId = toInt(fd.get("product_id"));
  const color = text(fd.get("color"));
  if (!color) return { error: "Escribe el nombre del color." };

  const db = getDb();
  const product = db
    .prepare("SELECT id, size_kind FROM products WHERE id = ? AND active = 1")
    .get(productId) as { id: number; size_kind: SizeKind } | undefined;
  if (!product) return { error: "No encontramos el producto." };

  const stocks = readStocks(fd, product.size_kind);
  if (!stocks.length)
    return { error: "Escribe las unidades de al menos una talla." };

  const existing = db
    .prepare("SELECT 1 FROM variants WHERE product_id = ? AND color = ? LIMIT 1")
    .get(productId, color);
  if (existing) return { error: `El color ${color} ya existe en este producto.` };

  const row = db
    .prepare("SELECT min_stock FROM variants WHERE product_id = ? LIMIT 1")
    .get(productId) as { min_stock: number } | undefined;

  db.transaction(() =>
    insertVariants(productId, color, stocks, row?.min_stock ?? 3, user.id),
  )();

  refresh();
  return { ok: `Color ${color} agregado.` };
}

export async function moveStock(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await allowed("stock.mover");
  if (!user) return { error: NO_PERMISSION };
  const variantId = toInt(fd.get("variant_id"));
  const type = text(fd.get("type"));
  const qty = toInt(fd.get("qty"), -1);
  const note = text(fd.get("note"));

  if (!["entrada", "salida", "ajuste"].includes(type))
    return { error: "Elige el tipo de movimiento." };
  if (qty < 0 || (type !== "ajuste" && qty === 0))
    return { error: "Escribe una cantidad válida." };

  const db = getDb();
  const variant = db
    .prepare("SELECT id, stock FROM variants WHERE id = ?")
    .get(variantId) as { id: number; stock: number } | undefined;
  if (!variant) return { error: "Elige la talla y el color." };

  let delta: number;
  if (type === "entrada") delta = qty;
  else if (type === "salida") {
    if (qty > variant.stock)
      return {
        error: `Solo hay ${variant.stock} unidades; no se pueden sacar ${qty}.`,
      };
    delta = -qty;
  } else {
    delta = qty - variant.stock;
    if (delta === 0)
      return { error: "El conteo coincide con el stock actual." };
  }

  db.transaction(() => {
    db.prepare("UPDATE variants SET stock = stock + ? WHERE id = ?").run(
      delta,
      variantId,
    );
    db.prepare(
      `INSERT INTO movements (variant_id, type, qty, note, user_id) VALUES (?, ?, ?, ?, ?)`,
    ).run(variantId, type, delta, note, user.id);
  })();

  refresh();
  const after = variant.stock + delta;
  return { ok: `Listo. Ahora hay ${after} unidades.` };
}

export type SaleInput = {
  lines: { variantId: number; qty: number; price: number }[];
  note?: string;
};

export type SaleResult =
  | { ok: true; ref: string; total: number; units: number }
  | { ok: false; error: string };

export async function registerSale(input: SaleInput): Promise<SaleResult> {
  const user = await allowed("ventas.registrar");
  if (!user) return { ok: false, error: NO_PERMISSION };

  // Agrupa líneas repetidas de la misma variante.
  const merged = new Map<number, { qty: number; price: number }>();
  for (const l of input.lines ?? []) {
    const qty = Math.trunc(Number(l.qty));
    const price = Math.trunc(Number(l.price));
    if (!Number.isFinite(qty) || qty <= 0)
      return { ok: false, error: "Hay una cantidad inválida en la venta." };
    if (!Number.isFinite(price) || price < 0)
      return { ok: false, error: "Hay un precio inválido en la venta." };
    const prev = merged.get(l.variantId);
    merged.set(l.variantId, { qty: (prev?.qty ?? 0) + qty, price });
  }
  if (!merged.size) return { ok: false, error: "Agrega productos a la venta." };

  const db = getDb();
  const ref = `V-${Date.now().toString(36).toUpperCase()}`;
  const note = String(input.note ?? "").trim().slice(0, 200);

  try {
    const result = db.transaction(() => {
      let total = 0;
      let units = 0;
      for (const [variantId, { qty, price }] of merged) {
        const v = db
          .prepare(
            `SELECT v.stock, v.size, v.color, p.name
             FROM variants v JOIN products p ON p.id = v.product_id
             WHERE v.id = ?`,
          )
          .get(variantId) as
          | { stock: number; size: string; color: string; name: string }
          | undefined;
        if (!v) throw new Error("Un producto de la venta ya no existe.");
        if (v.stock < qty)
          throw new Error(
            `${v.name} (${v.color}, ${v.size}): solo quedan ${v.stock} unidades.`,
          );
        db.prepare("UPDATE variants SET stock = stock - ? WHERE id = ?").run(
          qty,
          variantId,
        );
        db.prepare(
          `INSERT INTO movements (variant_id, type, qty, unit_price, ref, note, user_id)
           VALUES (?, 'venta', ?, ?, ?, ?, ?)`,
        ).run(variantId, -qty, price, ref, note, user.id);
        total += qty * price;
        units += qty;
      }
      return { total, units };
    })();
    refresh();
    return { ok: true, ref, ...result };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo registrar la venta.",
    };
  }
}

export async function archiveProduct(fd: FormData) {
  if (!(await allowed("inventario.archivar"))) redirect("/");
  const id = toInt(fd.get("product_id"));
  getDb().prepare("UPDATE products SET active = 0 WHERE id = ?").run(id);
  refresh();
  redirect("/inventario");
}
