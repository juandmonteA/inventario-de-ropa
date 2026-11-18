import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProduct, listMovements } from "@/lib/queries";
import { SIZE_SETS, sizeOrder } from "@/lib/constants";
import { formatCOP, formatNumber } from "@/lib/format";
import { archiveProduct } from "@/app/actions";
import { ColorDot, EmptyChip, SizeChip, stockState } from "@/components/ui";
import { MovementItem } from "@/components/MovementItem";
import { MoveForm } from "@/components/MoveForm";
import { AddColorForm } from "@/components/AddColorForm";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const product = getProduct(Number((await params).id));
  return { title: product?.name ?? "Producto" };
}

export default async function ProductPage({ params }: Props) {
  const user = await requireUser();
  const seeCosts = can(user.role, "costos.ver");
  const canMove = can(user.role, "stock.mover");
  const canCreate = can(user.role, "inventario.crear");
  const canArchive = can(user.role, "inventario.archivar");

  const { id } = await params;
  const product = getProduct(Number(id));
  if (!product) notFound();

  const colors = [...new Set(product.variants.map((v) => v.color))];
  const sizes = [...new Set(product.variants.map((v) => v.size))].sort(
    (a, b) => sizeOrder(product.size_kind, a) - sizeOrder(product.size_kind, b),
  );
  const cell = (color: string, size: string) =>
    product.variants.find((v) => v.color === color && v.size === size);

  const history = listMovements({ productId: product.id, limit: 8 });
  const margin =
    product.cost > 0 ? Math.round(((product.price - product.cost) / product.price) * 100) : null;

  const options = product.variants.map((v) => ({
    id: v.id,
    label: `${v.color} · ${v.size}`,
    stock: v.stock,
  }));

  return (
    <>
      <Link
        href="/inventario"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-cobalt"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Inventario
      </Link>

      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-display text-[2.6rem] leading-none font-semibold tracking-tight">
            {product.name}
          </h1>
          <p className="mt-2 text-muted">
            {product.sku} · {product.category}
            {product.brand ? ` · ${product.brand}` : ""}
          </p>
        </div>
        <dl className="flex gap-8">
          <Fact label="Precio de venta" value={formatCOP(product.price)} />
          {seeCosts && <Fact label="Costo" value={formatCOP(product.cost)} />}
          {seeCosts && margin !== null && <Fact label="Margen" value={`${margin}%`} />}
        </dl>
      </div>

      <section className="panel overflow-hidden">
        <div className="flex items-baseline justify-between gap-3 px-5 pt-5 pb-3">
          <h2 className="text-lg font-semibold">Unidades por color y talla</h2>
          <p className="text-muted">
            <b className="font-display text-2xl font-semibold text-ink tabular-nums">
              {formatNumber(product.total_stock)}
            </b>{" "}
            en total
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left">
            <thead className="sr-only">
              <tr>
                <th>Color</th>
                {sizes.map((s) => (
                  <th key={s}>Talla {s}</th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line border-t border-line">
              {colors.map((color) => {
                const total = product.variants
                  .filter((v) => v.color === color)
                  .reduce((s, v) => s + v.stock, 0);
                return (
                  <tr key={color}>
                    <th scope="row" className="px-5 py-3 text-left font-medium whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        <ColorDot color={color} />
                        {color}
                      </span>
                    </th>
                    {sizes.map((size) => {
                      const v = cell(color, size);
                      return (
                        <td key={size} className="px-1 py-3">
                          {v ? (
                            <SizeChip
                              size={size}
                              stock={v.stock}
                              state={stockState(v.stock, v.min_stock)}
                            />
                          ) : (
                            <EmptyChip size={size} />
                          )}
                        </td>
                      );
                    })}
                    <td className="px-5 py-3 text-right text-sm text-muted whitespace-nowrap">
                      {total} uds
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {(canMove || canCreate) && (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {canMove && (
            <section className="panel p-5">
              <h2 className="mb-4 text-lg font-semibold">Registrar movimiento</h2>
              <MoveForm options={options} />
            </section>
          )}
          {canCreate && (
            <section className="panel p-5">
              <h2 className="mb-4 text-lg font-semibold">Agregar otro color</h2>
              <AddColorForm productId={product.id} sizes={SIZE_SETS[product.size_kind]} />
            </section>
          )}
        </div>
      )}

      <section className="panel mt-5 overflow-hidden">
        <h2 className="px-5 pt-5 pb-2 text-lg font-semibold">Historial de este producto</h2>
        {history.length === 0 ? (
          <p className="px-5 pb-6 text-muted">Todavía no hay movimientos.</p>
        ) : (
          <ul className="divide-y divide-line">
            {history.map((m) => (
              <MovementItem key={m.id} m={m} showProduct={false} />
            ))}
          </ul>
        )}
      </section>

      {canArchive && (
      <details className="mt-8 text-sm text-muted">
        <summary className="cursor-pointer font-medium hover:text-ink">Archivar producto</summary>
        <form action={archiveProduct} className="mt-3 max-w-md rounded-lg border border-line bg-white p-4">
          <p>
            El producto deja de aparecer en el inventario y en Vender. Su historial de ventas se
            conserva.
          </p>
          <input type="hidden" name="product_id" value={product.id} />
          <button className="btn mt-3 border border-bad/30 text-bad hover:bg-bad-tint">
            Archivar {product.name}
          </button>
        </form>
      </details>
      )}
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-display text-3xl leading-tight font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
