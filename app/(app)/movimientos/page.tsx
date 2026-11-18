import Link from "next/link";
import { listMovements } from "@/lib/queries";
import { formatCOP, formatDateTime } from "@/lib/format";
import { ColorDot, MovementBadge, PageHeader } from "@/components/ui";
import { MovementItem } from "@/components/MovementItem";
import { requirePermission } from "@/lib/auth";

export const metadata = { title: "Movimientos" };

const filters = [
  { value: "", label: "Todos" },
  { value: "venta", label: "Ventas" },
  { value: "entrada", label: "Entradas" },
  { value: "salida", label: "Salidas" },
  { value: "ajuste", label: "Conteos" },
];

type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function MovementsPage({ searchParams }: { searchParams: Params }) {
  await requirePermission("movimientos.ver");
  const raw = (await searchParams).tipo;
  const tipo = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  const type = filters.some((f) => f.value === tipo) ? tipo : "";
  const movements = listMovements({ type: type || undefined, limit: 200 });

  return (
    <>
      <PageHeader
        title="Movimientos"
        subtitle="Todo lo que entra y sale del inventario, con fecha y hora."
      />

      <nav aria-label="Filtrar por tipo" className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = f.value === type;
          return (
            <Link
              key={f.value}
              href={f.value ? `/movimientos?tipo=${f.value}` : "/movimientos"}
              aria-current={active ? "page" : undefined}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-royal bg-royal text-white"
                  : "border-line bg-white text-ink-soft hover:bg-paper"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {movements.length === 0 ? (
        <div className="panel px-6 py-14 text-center">
          <p className="text-lg font-semibold">No hay movimientos de este tipo</p>
          <p className="mt-1 text-muted">Aparecerán aquí cuando registres ventas o cambios de stock.</p>
        </div>
      ) : (
        <>
          <div className="panel hidden overflow-hidden md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line bg-paper/60 text-sm text-muted">
                  <th className="px-5 py-2.5 font-medium">Fecha</th>
                  <th className="px-3 py-2.5 font-medium">Producto</th>
                  <th className="px-3 py-2.5 font-medium">Tipo</th>
                  <th className="px-3 py-2.5 text-right font-medium">Unidades</th>
                  <th className="px-3 py-2.5 text-right font-medium">Valor</th>
                  <th className="px-3 py-2.5 font-medium">Hecho por</th>
                  <th className="px-5 py-2.5 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {movements.map((m) => (
                  <tr key={m.id} className="align-middle">
                    <td className="px-5 py-3 text-sm whitespace-nowrap text-muted">
                      {formatDateTime(m.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/inventario/${m.product_id}`}
                        className="font-medium hover:text-cobalt"
                      >
                        {m.name}
                      </Link>
                      <span className="flex items-center gap-1.5 text-sm text-muted">
                        <ColorDot color={m.color} />
                        {m.color} · {m.size}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <MovementBadge type={m.type} />
                    </td>
                    <td className="px-3 py-3 text-right font-display text-xl font-semibold tabular-nums">
                      {m.qty > 0 ? "+" : "−"}
                      {Math.abs(m.qty)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {m.type === "venta" ? formatCOP(-m.qty * m.unit_price) : "–"}
                    </td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">{m.user_name ?? "–"}</td>
                    <td className="px-5 py-3 text-sm text-muted">
                      {[m.ref, m.note].filter(Boolean).join(" · ") || "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="panel divide-y divide-line overflow-hidden md:hidden">
            {movements.map((m) => (
              <MovementItem key={m.id} m={m} />
            ))}
          </ul>

          {movements.length === 200 && (
            <p className="mt-3 text-sm text-muted">Mostrando los últimos 200 movimientos.</p>
          )}
        </>
      )}
    </>
  );
}
