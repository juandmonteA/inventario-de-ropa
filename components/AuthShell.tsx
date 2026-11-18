import { BrandMark } from "@/components/Brand";

/** Marco de las pantallas de acceso: panel azul con el nombre de la tienda + formulario. */
export function AuthShell({
  storeName,
  title,
  subtitle,
  children,
}: {
  storeName: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[1fr_32rem]">
      <section className="relative flex flex-col justify-between gap-10 overflow-hidden bg-royal px-6 py-8 text-white md:p-12">
        <div className="relative z-10 flex items-center gap-3">
          <BrandMark size={36} />
          <p className="font-display text-3xl font-semibold tracking-tight">Cancha</p>
        </div>

        <div className="relative z-10">
          <h2 className="font-display text-5xl leading-[0.95] font-semibold tracking-tight break-words md:text-8xl">
            {storeName}
          </h2>
          <p className="mt-3 max-w-sm text-lg text-white/75 md:mt-5">
            Inventario por talla y color, ventas y reposición en un solo lugar.
          </p>
        </div>

        <svg
          aria-hidden="true"
          viewBox="0 0 200 200"
          className="pointer-events-none absolute -right-10 -bottom-16 hidden w-[28rem] text-volt opacity-15 md:block"
        >
          <path
            d="M30 190 L90 20 M85 190 L145 20 M140 190 L200 20"
            stroke="currentColor"
            strokeWidth="26"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </section>

      <main className="flex items-center justify-center px-6 py-10 md:px-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-[2.6rem] leading-none font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mt-2 mb-7 text-muted">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
