import { MOVEMENT_LABEL, colorHex, type MovementType } from "@/lib/constants";

export type StockState = "ok" | "low" | "out";

export function stockState(stock: number, min: number): StockState {
  if (stock <= 0) return "out";
  if (stock <= min) return "low";
  return "ok";
}

const chipStyle: Record<StockState, string> = {
  ok: "border-line bg-white text-ink",
  low: "border-warn/30 bg-warn-tint text-warn",
  out: "border-bad/30 bg-bad-tint text-bad",
};

const stateText: Record<StockState, string> = {
  ok: "disponible",
  low: "stock bajo",
  out: "agotada",
};

/** La talla con su stock, como un número de camiseta. */
export function SizeChip({
  size,
  stock,
  state,
}: {
  size: string;
  stock: number;
  state: StockState;
}) {
  return (
    <span
      title={`Talla ${size}: ${stock} (${stateText[state]})`}
      className={`inline-flex min-w-11 flex-col items-center rounded-md border px-1.5 py-1 leading-none ${chipStyle[state]}`}
    >
      <span className="text-[11px] font-medium opacity-80">{size}</span>
      <span className="mt-0.5 font-display text-xl font-semibold tabular-nums">
        {stock}
      </span>
    </span>
  );
}

export function EmptyChip({ size }: { size: string }) {
  return (
    <span
      title={`Talla ${size}: no se maneja`}
      className="inline-flex min-w-11 flex-col items-center rounded-md border border-dashed border-line px-1.5 py-1 leading-none text-ink-soft/50"
    >
      <span className="text-[11px] font-medium">{size}</span>
      <span className="mt-0.5 font-display text-xl font-semibold">–</span>
    </span>
  );
}

export function ColorDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-3 shrink-0 rounded-full border border-black/15"
      style={{ backgroundColor: colorHex(color) }}
    />
  );
}

export function StatusPill({ state }: { state: StockState }) {
  const styles: Record<StockState, string> = {
    ok: "bg-ok-tint text-ok",
    low: "bg-warn-tint text-warn",
    out: "bg-bad-tint text-bad",
  };
  const label: Record<StockState, string> = {
    ok: "Disponible",
    low: "Stock bajo",
    out: "Sin stock",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[state]}`}
    >
      {label[state]}
    </span>
  );
}

const moveStyle: Record<MovementType, string> = {
  venta: "bg-cobalt-tint text-cobalt-deep",
  entrada: "bg-ok-tint text-ok",
  salida: "bg-warn-tint text-warn",
  ajuste: "bg-paper text-ink-soft",
};

export function MovementBadge({ type }: { type: MovementType }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${moveStyle[type]}`}
    >
      {MOVEMENT_LABEL[type]}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[2.6rem] leading-none font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Mensaje de error (rojo) o de éxito (verde) debajo de un formulario. */
export function FormMessage({ state }: { state: { error?: string; ok?: string } | undefined }) {
  if (state?.error)
    return (
      <p role="alert" className="rounded-lg bg-bad-tint px-4 py-3 text-sm font-medium text-bad">
        {state.error}
      </p>
    );
  if (state?.ok)
    return (
      <p role="status" className="rounded-lg bg-ok-tint px-4 py-3 text-sm font-medium text-ok">
        {state.ok}
      </p>
    );
  return null;
}
