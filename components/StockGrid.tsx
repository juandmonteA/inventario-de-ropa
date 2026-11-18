/** Una casilla de unidades por talla. Vacía = no manejas esa talla. */
export function StockGrid({ sizes }: { sizes: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => (
        <label key={size} className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-ink-soft">{size}</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            name={`stock_${size}`}
            placeholder="–"
            className="input w-[3.75rem] px-1 text-center tabular-nums"
          />
        </label>
      ))}
    </div>
  );
}
