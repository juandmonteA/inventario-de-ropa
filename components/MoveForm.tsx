"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { moveStock } from "@/app/actions";

type Option = { id: number; label: string; stock: number };

const kinds = [
  {
    value: "entrada",
    label: "Entrada",
    qtyLabel: "Cantidad",
    help: "Llegó mercancía nueva o una devolución de cliente.",
  },
  {
    value: "salida",
    label: "Salida",
    qtyLabel: "Cantidad",
    help: "Daño, regalo o devolución al proveedor. Las ventas se registran en Vender.",
  },
  {
    value: "ajuste",
    label: "Conteo",
    qtyLabel: "Unidades contadas",
    help: "Escribe cuántas unidades hay realmente en el estante; ajustamos la diferencia.",
  },
] as const;

export function MoveForm({ options }: { options: Option[] }) {
  const [kind, setKind] = useState<(typeof kinds)[number]["value"]>("entrada");
  const [state, formAction, pending] = useActionState(moveStock, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const current = kinds.find((k) => k.value === kind)!;

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="variant_id" className="label">
          Color y talla
        </label>
        <select id="variant_id" name="variant_id" required defaultValue="" className="input">
          <option value="" disabled>
            Elige una opción
          </option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label} ({o.stock} en stock)
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="label">Tipo de movimiento</legend>
        <div className="inline-flex gap-1 rounded-lg border border-line bg-paper p-1">
          {kinds.map((k) => (
            <label key={k.value} className="cursor-pointer">
              <input
                type="radio"
                name="type"
                value={k.value}
                checked={kind === k.value}
                onChange={() => setKind(k.value)}
                className="peer sr-only"
              />
              <span className="block rounded-md px-3 py-1.5 text-sm font-medium text-ink-soft peer-checked:bg-royal peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cobalt">
                {k.label}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">{current.help}</p>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <div>
          <label htmlFor="qty" className="label">
            {current.qtyLabel}
          </label>
          <input
            id="qty"
            name="qty"
            type="number"
            min={kind === "ajuste" ? 0 : 1}
            required
            inputMode="numeric"
            className="input tabular-nums"
          />
        </div>
        <div>
          <label htmlFor="note" className="label">
            Nota <span className="font-normal text-muted">(opcional)</span>
          </label>
          <input id="note" name="note" className="input" placeholder="Ej. Pedido de octubre" />
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-bad-tint px-4 py-3 text-sm font-medium text-bad">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="rounded-lg bg-ok-tint px-4 py-3 text-sm font-medium text-ok">
          {state.ok}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Guardando…" : "Registrar movimiento"}
      </button>
    </form>
  );
}
