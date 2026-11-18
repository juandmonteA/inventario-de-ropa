"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { createProduct } from "@/app/actions";
import { SIZE_KIND_LABEL, SIZE_SETS, type SizeKind } from "@/lib/constants";
import { StockGrid } from "@/components/StockGrid";

export function NewProductForm({ categories }: { categories: string[] }) {
  const [kind, setKind] = useState<SizeKind>("ropa");
  const [state, formAction, pending] = useActionState(createProduct, undefined);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  return (
    <form onSubmit={onSubmit} className="panel max-w-3xl space-y-6 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="label">
            Nombre del producto
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Ej. Camiseta Dry-Fit Pulse"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="category" className="label">
            Categoría
          </label>
          <input
            id="category"
            name="category"
            required
            list="categories"
            placeholder="Elige o escribe una"
            className="input"
          />
          <datalist id="categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="brand" className="label">
            Marca <span className="font-normal text-muted">(opcional)</span>
          </label>
          <input id="brand" name="brand" className="input" />
        </div>
        <div>
          <label htmlFor="price" className="label">
            Precio de venta
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={1}
            required
            inputMode="numeric"
            placeholder="59900"
            className="input tabular-nums"
          />
        </div>
        <div>
          <label htmlFor="cost" className="label">
            Costo <span className="font-normal text-muted">(lo que te cuesta)</span>
          </label>
          <input
            id="cost"
            name="cost"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="24000"
            className="input tabular-nums"
          />
        </div>
        <div>
          <label htmlFor="sku" className="label">
            Código <span className="font-normal text-muted">(opcional)</span>
          </label>
          <input
            id="sku"
            name="sku"
            placeholder="Se crea solo si lo dejas vacío"
            className="input uppercase placeholder:normal-case"
          />
        </div>
        <div>
          <label htmlFor="min_stock" className="label">
            Avisar cuando queden
          </label>
          <input
            id="min_stock"
            name="min_stock"
            type="number"
            min={0}
            defaultValue={3}
            inputMode="numeric"
            className="input tabular-nums"
          />
        </div>
      </div>

      <fieldset>
        <legend className="label">Tipo de talla</legend>
        <div className="inline-flex flex-wrap gap-1 rounded-lg border border-line bg-paper p-1">
          {(Object.keys(SIZE_SETS) as SizeKind[]).map((k) => (
            <label key={k} className="cursor-pointer">
              <input
                type="radio"
                name="size_kind"
                value={k}
                checked={kind === k}
                onChange={() => setKind(k)}
                className="peer sr-only"
              />
              <span className="block rounded-md px-3 py-1.5 text-sm font-medium text-ink-soft peer-checked:bg-royal peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cobalt">
                {SIZE_KIND_LABEL[k]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-4 rounded-lg bg-paper p-4">
        <div className="max-w-xs">
          <label htmlFor="color" className="label">
            Color de este primer lote
          </label>
          <input
            id="color"
            name="color"
            required
            placeholder="Ej. Negro"
            className="input"
          />
        </div>
        <div>
          <p className="label">Unidades por talla</p>
          <StockGrid key={kind} sizes={SIZE_SETS[kind]} />
          <p className="mt-2 text-sm text-muted">
            Deja en blanco las tallas que no manejas. Más colores se agregan después, desde el
            producto.
          </p>
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-bad-tint px-4 py-3 text-sm font-medium text-bad">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Guardando…" : "Crear producto"}
        </button>
        <Link href="/inventario" className="btn btn-quiet">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
