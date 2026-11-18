import { listRecentSales, listSaleOptions } from "@/lib/queries";
import { formatCOP, formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import { SaleForm } from "@/components/SaleForm";
import { requirePermission } from "@/lib/auth";

export const metadata = { title: "Vender" };

export default async function SalesPage() {
  await requirePermission("ventas.registrar");
  const options = listSaleOptions();
  const recent = listRecentSales(8);

  return (
    <>
      <PageHeader
        title="Vender"
        subtitle="Busca el producto, agrégalo y cobra. El stock se descuenta solo."
      />
      <SaleForm options={options} />

      <section className="panel mt-5 overflow-hidden">
        <h2 className="px-5 pt-5 pb-2 text-lg font-semibold">Ventas recientes</h2>
        {recent.length === 0 ? (
          <p className="px-5 pb-6 text-muted">Cuando registres una venta, aparecerá aquí.</p>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((s) => (
              <li key={s.ref} className="flex items-center justify-between gap-4 px-5 py-3">
                <div>
                  <p className="font-medium tabular-nums">{s.ref}</p>
                  <p className="text-sm text-muted">{formatDateTime(s.created_at)}</p>
                </div>
                <p className="text-right">
                  <span className="block font-medium tabular-nums">{formatCOP(s.total)}</span>
                  <span className="text-sm text-muted">
                    {s.units} {s.units === 1 ? "unidad" : "unidades"}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
