import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type Row = {
  sku: string;
  name: string;
  category: string;
  brand: string;
  color: string;
  size: string;
  stock: number;
  min_stock: number;
  cost: number;
  price: number;
};

function cell(v: string | number): string {
  const s = String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Descarga el inventario como CSV (separado por ;) para abrir en Excel. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return new Response("Inicia sesión para descargar el inventario.", { status: 401 });
  if (!can(user.role, "inventario.exportar"))
    return new Response("Tu usuario no tiene permiso para exportar.", { status: 403 });

  const rows = getDb()
    .prepare(
      `SELECT p.sku, p.name, p.category, p.brand, v.color, v.size,
              v.stock, v.min_stock, p.cost, p.price
       FROM variants v JOIN products p ON p.id = v.product_id
       WHERE p.active = 1
       ORDER BY p.name, v.color, v.id`,
    )
    .all() as Row[];

  const header = [
    "Código",
    "Producto",
    "Categoría",
    "Marca",
    "Color",
    "Talla",
    "Unidades",
    "Mínimo",
    "Costo",
    "Precio de venta",
    "Valor a costo",
  ];
  const lines = rows.map((r) =>
    [
      r.sku,
      r.name,
      r.category,
      r.brand,
      r.color,
      r.size,
      r.stock,
      r.min_stock,
      r.cost,
      r.price,
      r.stock * r.cost,
    ]
      .map(cell)
      .join(";"),
  );

  const date = new Date().toISOString().slice(0, 10);
  // El BOM (﻿) hace que Excel muestre bien las tildes y la ñ.
  return new Response("﻿" + [header.join(";"), ...lines].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inventario-${date}.csv"`,
    },
  });
}
