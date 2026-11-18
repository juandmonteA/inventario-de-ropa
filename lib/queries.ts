import { getDb } from "./db";
import type { MovementType, SizeKind } from "./constants";

export type Variant = {
  id: number;
  product_id: number;
  size: string;
  color: string;
  stock: number;
  min_stock: number;
};

export type Product = {
  id: number;
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: number;
  cost: number;
  size_kind: SizeKind;
  created_at: string;
};

export type ProductWithVariants = Product & {
  variants: Variant[];
  total_stock: number;
};

export type Movement = {
  id: number;
  type: MovementType;
  qty: number;
  unit_price: number;
  ref: string;
  note: string;
  created_at: string;
  size: string;
  color: string;
  product_id: number;
  name: string;
  sku: string;
  user_name: string | null;
};

export type SaleOption = {
  id: number;
  size: string;
  color: string;
  stock: number;
  name: string;
  sku: string;
  brand: string;
  price: number;
};

function attachVariants(products: Product[]): ProductWithVariants[] {
  if (!products.length) return [];
  const db = getDb();
  const variants = db
    .prepare(
      `SELECT * FROM variants
       WHERE product_id IN (${products.map(() => "?").join(",")})
       ORDER BY color, id`,
    )
    .all(...products.map((p) => p.id)) as Variant[];

  return products.map((p) => {
    const vs = variants.filter((v) => v.product_id === p.id);
    return {
      ...p,
      variants: vs,
      total_stock: vs.reduce((sum, v) => sum + v.stock, 0),
    };
  });
}

export function listProducts(
  opts: { q?: string; category?: string } = {},
): ProductWithVariants[] {
  const where = ["active = 1"];
  const params: string[] = [];
  if (opts.q) {
    where.push("(name LIKE ? OR sku LIKE ? OR brand LIKE ?)");
    const like = `%${opts.q}%`;
    params.push(like, like, like);
  }
  if (opts.category) {
    where.push("category = ?");
    params.push(opts.category);
  }
  const products = getDb()
    .prepare(
      `SELECT * FROM products WHERE ${where.join(" AND ")}
       ORDER BY created_at DESC, id DESC`,
    )
    .all(...params) as Product[];
  return attachVariants(products);
}

export function getProduct(id: number): ProductWithVariants | null {
  const product = getDb()
    .prepare("SELECT * FROM products WHERE id = ? AND active = 1")
    .get(id) as Product | undefined;
  return product ? attachVariants([product])[0] : null;
}

export function listCategories(): string[] {
  return (
    getDb()
      .prepare(
        "SELECT DISTINCT category FROM products WHERE active = 1 ORDER BY category",
      )
      .all() as { category: string }[]
  ).map((r) => r.category);
}

export function listMovements(
  opts: { type?: string; productId?: number; limit?: number } = {},
): Movement[] {
  const where = ["1 = 1"];
  const params: (string | number)[] = [];
  if (opts.type) {
    where.push("m.type = ?");
    params.push(opts.type);
  }
  if (opts.productId) {
    where.push("p.id = ?");
    params.push(opts.productId);
  }
  params.push(opts.limit ?? 100);
  return getDb()
    .prepare(
      `SELECT m.id, m.type, m.qty, m.unit_price, m.ref, m.note, m.created_at,
              v.size, v.color, p.id AS product_id, p.name, p.sku,
              u.name AS user_name
       FROM movements m
       JOIN variants v ON v.id = m.variant_id
       JOIN products p ON p.id = v.product_id
       LEFT JOIN users u ON u.id = m.user_id
       WHERE ${where.join(" AND ")}
       ORDER BY m.id DESC
       LIMIT ?`,
    )
    .all(...params) as Movement[];
}

export function listSaleOptions(): SaleOption[] {
  return getDb()
    .prepare(
      `SELECT v.id, v.size, v.color, v.stock, p.name, p.sku, p.brand, p.price
       FROM variants v
       JOIN products p ON p.id = v.product_id
       WHERE p.active = 1 AND v.stock > 0
       ORDER BY p.name, v.color, v.id`,
    )
    .all() as SaleOption[];
}

export function listRecentSales(limit = 8) {
  return getDb()
    .prepare(
      `SELECT ref, MIN(created_at) AS created_at,
              SUM(-qty) AS units, SUM(-qty * unit_price) AS total
       FROM movements
       WHERE type = 'venta'
       GROUP BY ref
       ORDER BY MAX(id) DESC
       LIMIT ?`,
    )
    .all(limit) as {
    ref: string;
    created_at: string;
    units: number;
    total: number;
  }[];
}

export function getDashboard() {
  const db = getDb();

  const totals = db
    .prepare(
      `SELECT COALESCE(SUM(v.stock), 0)            AS units,
              COALESCE(SUM(v.stock * p.cost), 0)   AS cost_value,
              COALESCE(SUM(v.stock * p.price), 0)  AS retail_value,
              COUNT(DISTINCT p.id)                 AS products
       FROM variants v JOIN products p ON p.id = v.product_id
       WHERE p.active = 1`,
    )
    .get() as {
    units: number;
    cost_value: number;
    retail_value: number;
    products: number;
  };

  const month = db
    .prepare(
      `SELECT COALESCE(SUM(-qty * unit_price), 0) AS revenue,
              COALESCE(SUM(-qty), 0)              AS units
       FROM movements
       WHERE type = 'venta'
         AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')`,
    )
    .get() as { revenue: number; units: number };

  const today = db
    .prepare(
      `SELECT COALESCE(SUM(-qty * unit_price), 0) AS revenue
       FROM movements
       WHERE type = 'venta'
         AND date(created_at) = date('now', 'localtime')`,
    )
    .get() as { revenue: number };

  const lowWhere = "p.active = 1 AND v.stock <= v.min_stock";
  const lowCount = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM variants v
         JOIN products p ON p.id = v.product_id WHERE ${lowWhere}`,
      )
      .get() as { n: number }
  ).n;

  const low = db
    .prepare(
      `SELECT v.id, v.size, v.color, v.stock, v.min_stock,
              p.id AS product_id, p.name, p.sku
       FROM variants v JOIN products p ON p.id = v.product_id
       WHERE ${lowWhere}
       ORDER BY v.stock ASC, p.name
       LIMIT 5`,
    )
    .all() as {
    id: number;
    size: string;
    color: string;
    stock: number;
    min_stock: number;
    product_id: number;
    name: string;
    sku: string;
  }[];

  const days = db
    .prepare(
      `WITH RECURSIVE d(day) AS (
         SELECT date('now', 'localtime', '-6 days')
         UNION ALL
         SELECT date(day, '+1 day') FROM d WHERE day < date('now', 'localtime')
       )
       SELECT d.day AS day,
              COALESCE((SELECT SUM(-qty * unit_price) FROM movements
                        WHERE type = 'venta' AND date(created_at) = d.day), 0) AS revenue
       FROM d`,
    )
    .all() as { day: string; revenue: number }[];

  const top = db
    .prepare(
      `SELECT p.id, p.name, SUM(-m.qty) AS units, SUM(-m.qty * m.unit_price) AS revenue
       FROM movements m
       JOIN variants v ON v.id = m.variant_id
       JOIN products p ON p.id = v.product_id
       WHERE m.type = 'venta'
         AND strftime('%Y-%m', m.created_at) = strftime('%Y-%m', 'now', 'localtime')
       GROUP BY p.id
       ORDER BY units DESC
       LIMIT 5`,
    )
    .all() as { id: number; name: string; units: number; revenue: number }[];

  return {
    totals,
    month,
    today,
    lowCount,
    low,
    days,
    top,
    recent: listMovements({ limit: 5 }),
  };
}

/** Lo que ha vendido una persona hoy (para el resumen del empleado). */
export function getUserTodaySales(userId: number) {
  return getDb()
    .prepare(
      `SELECT COALESCE(SUM(-qty * unit_price), 0) AS revenue,
              COALESCE(SUM(-qty), 0)              AS units
       FROM movements
       WHERE type = 'venta' AND user_id = ?
         AND date(created_at) = date('now', 'localtime')`,
    )
    .get(userId) as { revenue: number; units: number };
}

export type UserRow = {
  id: number;
  username: string;
  name: string;
  role: "admin" | "employee";
  active: number;
  created_at: string;
  sales: number;
};

export function listUsers(): UserRow[] {
  return getDb()
    .prepare(
      `SELECT u.id, u.username, u.name, u.role, u.active, u.created_at,
              (SELECT COUNT(DISTINCT m.ref) FROM movements m
               WHERE m.user_id = u.id AND m.type = 'venta') AS sales
       FROM users u
       ORDER BY u.active DESC, u.role, u.name`,
    )
    .all() as UserRow[];
}
