"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Minus, Plus, Search, X } from "lucide-react";
import { registerSale, type SaleResult } from "@/app/actions";
import type { SaleOption } from "@/lib/queries";
import { formatCOP } from "@/lib/format";
import { ColorDot } from "@/components/ui";

type Line = { qty: number; price: number };

export function SaleForm({ options }: { options: SaleOption[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<number, Line>>({});
  const [note, setNote] = useState("");
  const [result, setResult] = useState<SaleResult | null>(null);
  const [pending, startTransition] = useTransition();

  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);

  const found = useMemo(() => {
    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const list = tokens.length
      ? options.filter((o) => {
          const hay = `${o.name} ${o.sku} ${o.brand} ${o.color} ${o.size}`.toLowerCase();
          return tokens.every((t) => hay.includes(t));
        })
      : options;
    return list.slice(0, 40);
  }, [options, query]);

  const lines = Object.entries(cart)
    .map(([id, l]) => ({ opt: byId.get(Number(id)), ...l }))
    .filter((l): l is { opt: SaleOption; qty: number; price: number } => Boolean(l.opt));
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const units = lines.reduce((s, l) => s + l.qty, 0);

  function add(o: SaleOption) {
    setResult(null);
    setCart((c) => {
      const cur = c[o.id];
      if (!cur) return { ...c, [o.id]: { qty: 1, price: o.price } };
      if (cur.qty >= o.stock) return c;
      return { ...c, [o.id]: { ...cur, qty: cur.qty + 1 } };
    });
  }

  function setQty(o: SaleOption, qty: number) {
    if (qty <= 0) return remove(o.id);
    setCart((c) => ({ ...c, [o.id]: { ...c[o.id], qty: Math.min(qty, o.stock) } }));
  }

  function setPrice(id: number, price: number) {
    setCart((c) => ({ ...c, [id]: { ...c[id], price } }));
  }

  function remove(id: number) {
    setCart((c) => {
      const next = { ...c };
      delete next[id];
      return next;
    });
  }

  function checkout() {
    startTransition(async () => {
      const res = await registerSale({
        lines: lines.map((l) => ({ variantId: l.opt.id, qty: l.qty, price: l.price })),
        note,
      });
      setResult(res);
      if (res.ok) {
        setCart({});
        setNote("");
        router.refresh();
      }
    });
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_24rem]">
      <section className="panel overflow-hidden">
        <div className="border-b border-line p-4">
          <div className="relative">
            <Search
              size={17}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca por nombre, color o talla. Ej. leggings negro M"
              aria-label="Buscar producto para vender"
              className="input pl-9"
              autoFocus
            />
          </div>
        </div>
        {found.length === 0 ? (
          <p className="px-5 py-10 text-center text-muted">
            {options.length === 0
              ? "No hay unidades en stock para vender."
              : "Ninguna opción con unidades coincide con tu búsqueda."}
          </p>
        ) : (
          <ul className="max-h-[32rem] divide-y divide-line overflow-y-auto">
            {found.map((o) => {
              const inCart = cart[o.id]?.qty ?? 0;
              const full = inCart >= o.stock;
              return (
                <li key={o.id} className="relative">
                  <button
                    type="button"
                    onClick={() => add(o)}
                    disabled={full}
                    className="flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-cobalt-tint/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{o.name}</span>
                      <span className="flex items-center gap-1.5 text-sm text-muted">
                        <ColorDot color={o.color} />
                        {o.color} · talla {o.size} · {o.stock - inCart}{" "}
                        {o.stock - inCart === 1 ? "disponible" : "disponibles"}
                      </span>
                    </span>
                    <span className="font-medium tabular-nums">{formatCOP(o.price)}</span>
                    <span
                      aria-hidden="true"
                      className="grid size-8 place-items-center rounded-full bg-cobalt-tint text-cobalt"
                    >
                      {inCart > 0 ? (
                        <span className="text-sm font-semibold">{inCart}</span>
                      ) : (
                        <Plus size={17} />
                      )}
                    </span>
                    <span className="sr-only">
                      {full ? "Ya agregaste todas las unidades" : "Agregar a la venta"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <aside className="panel lg:sticky lg:top-6" aria-label="Venta actual">
        <div className="flex items-baseline justify-between px-5 pt-5 pb-3">
          <h2 className="text-lg font-semibold">Venta actual</h2>
          {units > 0 && (
            <span className="text-sm text-muted">
              {units} {units === 1 ? "unidad" : "unidades"}
            </span>
          )}
        </div>

        {lines.length === 0 ? (
          <p className="px-5 pb-6 text-muted">
            Toca un producto de la lista para agregarlo.
          </p>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {lines.map(({ opt, qty, price }) => (
              <li key={opt.id} className="space-y-2 px-5 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{opt.name}</p>
                    <p className="flex items-center gap-1.5 text-sm text-muted">
                      <ColorDot color={opt.color} />
                      {opt.color} · {opt.size}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(opt.id)}
                    aria-label={`Quitar ${opt.name} de la venta`}
                    className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-muted hover:bg-paper hover:text-ink"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-lg border border-line">
                    <button
                      type="button"
                      onClick={() => setQty(opt, qty - 1)}
                      aria-label="Quitar una unidad"
                      className="grid size-8 cursor-pointer place-items-center hover:bg-paper"
                    >
                      <Minus size={15} aria-hidden="true" />
                    </button>
                    <span className="w-8 text-center font-display text-xl font-semibold tabular-nums">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(opt, qty + 1)}
                      disabled={qty >= opt.stock}
                      aria-label="Agregar una unidad"
                      className="grid size-8 cursor-pointer place-items-center hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus size={15} aria-hidden="true" />
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-muted">
                    <span>Precio</span>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={price}
                      onChange={(e) => setPrice(opt.id, Math.max(0, Math.trunc(Number(e.target.value)) || 0))}
                      className="input h-8 w-24 px-2 text-right tabular-nums"
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-3 border-t border-line p-5">
          <div className="flex items-baseline justify-between">
            <span className="font-medium text-ink-soft">Total</span>
            <span className="font-display text-4xl leading-none font-semibold tabular-nums">
              {formatCOP(total)}
            </span>
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota (opcional). Ej. cliente, forma de pago"
            aria-label="Nota de la venta"
            maxLength={200}
            className="input"
          />
          <button
            type="button"
            onClick={checkout}
            disabled={pending || lines.length === 0}
            className="btn btn-primary w-full"
          >
            {pending ? "Registrando…" : `Cobrar ${formatCOP(total)}`}
          </button>

          {result && !result.ok && (
            <p role="alert" className="rounded-lg bg-bad-tint px-4 py-3 text-sm font-medium text-bad">
              {result.error}
            </p>
          )}
          {result?.ok && (
            <p
              role="status"
              className="flex items-start gap-2 rounded-lg bg-ok-tint px-4 py-3 text-sm font-medium text-ok"
            >
              <CheckCircle2 size={18} className="mt-px shrink-0" aria-hidden="true" />
              <span>
                Venta registrada: {result.units} {result.units === 1 ? "unidad" : "unidades"} por{" "}
                {formatCOP(result.total)}. Código {result.ref}.
              </span>
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
