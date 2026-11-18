import type { Metadata } from "next";
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource-variable/public-sans";
import "./globals.css";

// Los datos cambian con cada venta: nunca se guardan páginas en caché.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Cancha · Inventario", template: "%s · Cancha" },
  description: "Inventario y ventas para tiendas de ropa deportiva.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
