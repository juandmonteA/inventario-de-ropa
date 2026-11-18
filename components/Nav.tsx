"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Boxes,
  LayoutDashboard,
  ShoppingBag,
  Users,
} from "lucide-react";

const items = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/inventario", label: "Inventario", icon: Boxes },
  { href: "/ventas", label: "Vender", icon: ShoppingBag },
  { href: "/movimientos", label: "Movimientos", icon: ArrowLeftRight },
];

const usersItem = { href: "/usuarios", label: "Usuarios", icon: Users };

export function Nav({
  orientation,
  showUsers,
}: {
  orientation: "side" | "top";
  showUsers: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Principal"
      className={
        orientation === "side"
          ? "flex flex-col gap-1"
          : "flex gap-1 overflow-x-auto"
      }
    >
      {(showUsers ? [...items, usersItem] : items).map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium whitespace-nowrap transition-colors ${
              active
                ? "bg-white/14 text-white"
                : "text-white/75 hover:bg-white/8 hover:text-white"
            }`}
          >
            {active && orientation === "side" && (
              <span
                aria-hidden="true"
                className="absolute top-2 bottom-2 -left-5 w-1 rounded-r bg-volt"
              />
            )}
            <Icon size={19} strokeWidth={2} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
