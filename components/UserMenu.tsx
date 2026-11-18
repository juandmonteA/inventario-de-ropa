import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { logout } from "@/app/auth-actions";
import { ROLE_LABEL } from "@/lib/permissions";
import type { SessionUser } from "@/lib/auth";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/** Barra lateral: quién tiene la sesión abierta, su cuenta y el botón de salir. */
export function UserMenu({ user }: { user: SessionUser }) {
  return (
    <div className="mt-auto space-y-3">
      <div className="flex items-center gap-3 rounded-lg bg-white/8 p-3">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-volt font-display text-lg font-semibold text-royal"
        >
          {initials(user.name)}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate font-medium">{user.name}</p>
          <p className="text-xs text-white/70">{ROLE_LABEL[user.role]}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Link
          href="/cuenta"
          className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-medium text-white/80 hover:bg-white/8 hover:text-white"
        >
          <UserRound size={16} aria-hidden="true" />
          Mi cuenta
        </Link>
        <form action={logout} className="flex-1">
          <button className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-medium text-white/80 hover:bg-white/8 hover:text-white">
            <LogOut size={16} aria-hidden="true" />
            Salir
          </button>
        </form>
      </div>
    </div>
  );
}

/** Versión compacta para el encabezado en el celular. */
export function UserMenuCompact({ user }: { user: SessionUser }) {
  return (
    <div className="flex items-center gap-1">
      <Link
        href="/cuenta"
        className="max-w-32 truncate rounded-lg px-2 py-1.5 text-sm font-medium text-white/85 hover:bg-white/8"
      >
        {user.name}
      </Link>
      <form action={logout}>
        <button
          aria-label="Cerrar sesión"
          className="grid size-9 cursor-pointer place-items-center rounded-lg text-white/85 hover:bg-white/8"
        >
          <LogOut size={18} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
