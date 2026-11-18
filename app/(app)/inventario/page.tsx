import Link from "next/link";
import { Download, Plus, Search } from "lucide-react";
import { listCategories, listProducts, type ProductWithVariants } from "@/lib/queries";
import { formatCOP, formatNumber } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { sizeOrder } from "@/lib/constants";
import {
  ColorDot,
  PageHeader,
  SizeChip,
  StatusPill,
  stockState,
  type StockState,
} from "@/components/ui";

export const metadata = { title: "Inventario" };

type Params = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function summarize(p: ProductWithVariants) {
  const bySize = new Map<string, { stock: number; min: number }>();
  for (const v of p.variants) {
    const cur = bySize.get(v.size) ?? { stock: 0, min: 0 };
    cur.stock += v.stock;
    cur.min += v.min_stock;
    bySize.set(v.size, cur);
  }
  const sizes = [...bySize.entries()]
    .sort((a, b) => sizeOrder(p.size_kind, a[0]) - sizeOrder(p.size_kind, b[0]))
    .map(([size, s]) => ({ size, stock: s.stock, state: stockState(s.stock, s.min) }));

  const colors = [...new Set(p.variants.map((v) => v.color))];
  let state: StockState = "ok";
  if (p.total_stock === 0) state = "out";
  else if (p.variants.some((v) => stockState(v.stock, v.min_stock) !== "ok")) state = "low";
  return { sizes, colors, state };
}

export default async function InventoryPage({ searchParams }: { searchParams: Params }) {
  const user = await requireUser();
  const canCreate = can(user.role, "inventario.crear");
  const canExport = can(user.role, "inventario.exportar");
  const sp = await searchParams;
  const q = first(sp.q)?.trim() ?? "";
  const categoria = first(sp.categoria) ?? "";
  const products = listProducts({ q, category: categoria });
  const categories = listCategories();
  const filtering = Boolean(q || categoria);

  return (
    <>
      <PageHeader
        title="Inventario"
        subtitle={`${products.length} ${products.length === 1 ? "producto" : "productos"}${filtering ? " con este filtro" : ""}`}
        action={
          canCreate || canExport ? (
            <div className="flex gap-2">
              {canExport && (
                <a href="/api/inventario" className="btn btn-quiet" download>
                  <Download size={17} aria-hidden="true" />
                  Exportar a Excel
                </a>
              )}
              {canCreate && (
                <Link href="/inventario/nuevo" className="btn btn-primary">
                  <Plus size={18} aria-hidden="true" />
                  Nuevo producto
                </Link>
              )}
            </div>
          ) : undefined
        }
      />

      <form className="mb-4 flex flex-wrap gap-2" role="search">
        <div className="relative min-w-60 flex-1">
          <Search
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
          />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre, código o marca"
            aria-label="Buscar productos"
            className="input pl-9"
          />
        </div>
        <select
          name="categoria"
          defaultValue={categoria}
          aria-label="Categoría"
          className="input w-auto min-w-44"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button className="btn btn-quiet">Buscar</button>
        {filtering && (
          <Link href="/inventario" className="btn text-cobalt hover:underline">
            Quitar filtros
          </Link>
        )}
      </form>

      {products.length === 0 ? (
        <div className="panel px-6 py-14 text-center">
          <p className="text-lg font-semibold">
            {filtering ? "No encontramos productos con ese filtro" : "Aún no tienes productos"}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-muted">
            {filtering
              ? "Prueba con otra palabra o quita los filtros."
              : canCreate
                ? "Crea el primero con sus tallas y colores y empieza a controlar el stock."
                : "El administrador aún no ha cargado productos."}
          </p>
          {(filtering || canCreate) && (
            <Link
              href={filtering ? "/inventario" : "/inventario/nuevo"}
              className="btn btn-primary mt-5"
            >
              {filtering ? "Quitar filtros" : "Crear el primer producto"}
            </Link>
          )}
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div
            aria-hidden="true"
            className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1.7fr)_6.5rem_7rem] gap-4 border-b border-line bg-paper/60 px-5 py-2.5 text-sm font-medium text-muted md:grid"
          >
            <span>Producto</span>
            <span>Unidades por talla</span>
            <span className="text-right">Precio</span>
            <span className="text-right">Estado</span>
          </div>
          <ul className="divide-y divide-line">
            {products.map((p) => {
              const { sizes, colors, state } = summarize(p);
              return (
                <li key={p.id}>
                  <Link
                    href={`/inventario/${p.id}`}
                    className="grid items-center gap-x-4 grid-cols-[1fr_auto] gap-y-3 px-5 py-4 transition-colors hover:bg-cobalt-tint/40 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.7fr)_6.5rem_7rem]"
                  >
                    <div className="col-span-2 min-w-0 md:col-span-1">
                      <p className="truncate text-base font-semibold">{p.name}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-sm text-muted">
                        <span className="truncate">
                          {p.sku} · {p.brand || p.category}
                        </span>
                        <span className="flex shrink-0 -space-x-1">
                          {colors.slice(0, 5).map((c) => (
                            <span key={c} className="rounded-full ring-2 ring-white">
                              <ColorDot color={c} />
                            </span>
                          ))}
                        </span>
                      </p>
                    </div>
                    <div className="col-span-2 flex flex-wrap gap-1.5 md:col-span-1">
                      {sizes.map((s) => (
                        <SizeChip key={s.size} size={s.size} stock={s.stock} state={s.state} />
                      ))}
                    </div>
                    <p className="font-medium tabular-nums md:text-right">{formatCOP(p.price)}</p>
                    <div className="flex items-center gap-2 md:flex-col md:items-end md:gap-1">
                      <StatusPill state={state} />
                      <span className="text-xs text-muted">{formatNumber(p.total_stock)} uds</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
