import Link from "next/link";
import { Plus } from "lucide-react";
import { getDashboard, getUserTodaySales } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import {
  formatCOP,
  formatDay,
  formatNumber,
  longToday,
  shortCOP,
} from "@/lib/format";
import { ColorDot, PageHeader, SizeChip, stockState } from "@/components/ui";
import { MovementItem } from "@/components/MovementItem";

export default async function DashboardPage() {
  const user = await requireUser();
  // El administrador ve todo; el empleado ve su día, el stock por reponer y los movimientos.
  const isAdmin = can(user.role, "reportes.ver");
  const mine = getUserTodaySales(user.id);
  const { totals, month, today, lowCount, low, days, top, recent } =
    getDashboard();

  const weekTotal = days.reduce((s, d) => s + d.revenue, 0);
  const maxDay = Math.max(...days.map((d) => d.revenue), 1);
  const maxTop = Math.max(...top.map((t) => t.units), 1);

  const recentPanel = (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <h2 className="text-lg font-semibold">Últimos movimientos</h2>
        <Link href="/movimientos" className="text-sm font-medium text-cobalt hover:underline">
          Ver todos
        </Link>
      </div>
      <ul className="divide-y divide-line">
        {recent.map((m) => (
          <MovementItem key={m.id} m={m} />
        ))}
      </ul>
    </section>
  );

  return (
    <>
      <PageHeader
        title="Resumen"
        subtitle={longToday()}
        action={
          <Link href="/ventas" className="btn btn-primary">
            <Plus size={18} aria-hidden="true" />
            Nueva venta
          </Link>
        }
      />

      {isAdmin ? (
      <section
        aria-label="Cifras principales"
        className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-[1.5fr_1fr_1fr_1fr]"
      >
        <Figure
          className="col-span-2 lg:col-span-1"
          label="Ventas del mes"
          value={formatCOP(month.revenue)}
          note={`${formatNumber(month.units)} unidades · hoy ${formatCOP(today.revenue)}`}
          big
        />
        <Figure
          label="Unidades en stock"
          value={formatNumber(totals.units)}
          note={`${totals.products} productos`}
        />
        <Figure
          label="Valor del inventario"
          value={formatCOP(totals.cost_value)}
          note={`A precio de venta: ${shortCOP(totals.retail_value)}`}
        />
        <Figure
          label="Tallas por reponer"
          value={String(lowCount)}
          note={lowCount ? "En o bajo su mínimo" : "Todo en orden"}
          tone={lowCount ? "warn" : "ok"}
        />
      </section>
      ) : (
      <section
        aria-label="Cifras principales"
        className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-[1.5fr_1fr_1fr]"
      >
        <Figure
          className="col-span-2 lg:col-span-1"
          label="Tus ventas de hoy"
          value={formatCOP(mine.revenue)}
          note={`${formatNumber(mine.units)} ${mine.units === 1 ? "unidad" : "unidades"}`}
          big
        />
        <Figure
          label="Unidades en stock"
          value={formatNumber(totals.units)}
          note={`${totals.products} productos`}
        />
        <Figure
          label="Tallas por reponer"
          value={String(lowCount)}
          note={lowCount ? "En o bajo su mínimo" : "Todo en orden"}
          tone={lowCount ? "warn" : "ok"}
        />
      </section>
      )}

      <div className={`mt-5 grid gap-5 ${isAdmin ? "lg:grid-cols-[1.35fr_1fr]" : "lg:grid-cols-2"}`}>
        {isAdmin && (
        <section className="panel flex flex-col p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold">Ventas de los últimos 7 días</h2>
            <p className="font-display text-2xl font-semibold tabular-nums">
              {formatCOP(weekTotal)}
            </p>
          </div>
          <ol
            className="mt-auto grid grid-cols-7 items-end gap-2 pt-6 sm:gap-4"
            aria-label="Ventas por día"
          >
            {days.map((d, i) => {
              const isToday = i === days.length - 1;
              const { weekday, date } = formatDay(d.day);
              const h = d.revenue ? Math.max(6, Math.round((d.revenue / maxDay) * 150)) : 3;
              return (
                <li key={d.day} className="flex flex-col items-center gap-1.5">
                  <span className="h-4 text-[11px] text-muted tabular-nums">
                    {d.revenue ? shortCOP(d.revenue) : ""}
                  </span>
                  <span
                    className={`block w-full rounded-t-md ${
                      isToday ? "bg-cobalt" : d.revenue ? "bg-cobalt/30" : "bg-line"
                    }`}
                    style={{ height: h }}
                    title={`${weekday} ${date}: ${formatCOP(d.revenue)}`}
                  />
                  <span
                    className={`text-xs ${isToday ? "font-semibold text-ink" : "text-muted"}`}
                  >
                    {isToday ? "hoy" : `${weekday} ${date}`}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
        )}

        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <h2 className="text-lg font-semibold">Para reponer</h2>
            <Link href="/inventario" className="text-sm font-medium text-cobalt hover:underline">
              Ver inventario
            </Link>
          </div>
          {low.length === 0 ? (
            <p className="px-5 pb-6 text-muted">
              Ninguna talla está por debajo de su mínimo.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {low.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/inventario/${v.product_id}`}
                    className="flex items-center justify-between gap-3 px-5 py-2.5 hover:bg-paper"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{v.name}</span>
                      <span className="flex items-center gap-1.5 text-sm text-muted">
                        <ColorDot color={v.color} />
                        {v.color}
                      </span>
                    </span>
                    <SizeChip
                      size={v.size}
                      stock={v.stock}
                      state={stockState(v.stock, v.min_stock)}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {lowCount > low.length && (
            <p className="border-t border-line px-5 py-3 text-sm text-muted">
              y {lowCount - low.length} más en el inventario
            </p>
          )}
        </section>
        {!isAdmin && recentPanel}
      </div>

      {isAdmin && (
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="panel flex flex-col p-5">
          <h2 className="text-lg font-semibold">Más vendidos este mes</h2>
          {top.length === 0 ? (
            <p className="mt-3 text-muted">Aún no hay ventas este mes.</p>
          ) : (
            <ul className="mt-4 flex flex-1 flex-col justify-between gap-4">
              {top.map((t) => (
                <li key={t.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      href={`/inventario/${t.id}`}
                      className="truncate font-medium hover:text-cobalt"
                    >
                      {t.name}
                    </Link>
                    <span className="shrink-0 text-sm text-muted">
                      <b className="font-display text-xl font-semibold text-ink tabular-nums">
                        {t.units}
                      </b>{" "}
                      uds · {formatCOP(t.revenue)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-paper">
                    <div
                      className="h-full rounded-full bg-cobalt"
                      style={{ width: `${(t.units / maxTop) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {recentPanel}
      </div>
      )}
    </>
  );
}

function Figure({
  label,
  value,
  note,
  big,
  tone,
  className = "",
}: {
  label: string;
  value: string;
  note: string;
  big?: boolean;
  tone?: "warn" | "ok";
  className?: string;
}) {
  return (
    <div className={`bg-white p-5 ${className}`}>
      <p className="text-sm font-medium text-muted">{label}</p>
      <p
        className={`mt-1 font-display leading-none font-semibold tracking-tight tabular-nums ${
          big ? "text-6xl" : "text-5xl"
        } ${tone === "warn" ? "text-warn" : tone === "ok" ? "text-ok" : ""}`}
      >
        {value}
      </p>
      <p className="mt-2 text-sm text-muted">{note}</p>
    </div>
  );
}
