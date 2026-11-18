"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { addColor } from "@/app/actions";
import { StockGrid } from "@/components/StockGrid";

export function AddColorForm({
  productId,
  sizes,
}: {
  productId: number;
  sizes: readonly string[];
}) {
  const [state, formAction, pending] = useActionState(addColor, undefined);
  const formRef = useRef<HTMLFormElement>(null);

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
      <input type="hidden" name="product_id" value={productId} />
      <div className="max-w-xs">
        <label htmlFor="new_color" className="label">
          Color
        </label>
        <input id="new_color" name="color" required placeholder="Ej. Azul rey" className="input" />
      </div>
      <div>
        <p className="label">Unidades por talla</p>
        <StockGrid sizes={sizes} />
        <p className="mt-2 text-sm text-muted">Deja en blanco las tallas que no manejas.</p>
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

      <button type="submit" disabled={pending} className="btn btn-quiet">
        {pending ? "Guardando…" : "Agregar color"}
      </button>
    </form>
  );
}
