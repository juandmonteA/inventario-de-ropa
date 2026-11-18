import { Brand } from "@/components/Brand";
import { Nav } from "@/components/Nav";
import { UserMenu, UserMenuCompact } from "@/components/UserMenu";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

const storeName = process.env.STORE_NAME ?? "Mi tienda deportiva";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Nota: un layout no se vuelve a ejecutar al navegar entre páginas, por eso
  // cada página y cada acción también verifican la sesión (lib/auth.ts).
  const user = await requireUser();
  const showUsers = can(user.role, "usuarios.gestionar");

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15.5rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 bg-royal p-5 text-white md:flex">
        <Brand storeName={storeName} />
        <Nav orientation="side" showUsers={showUsers} />
        <UserMenu user={user} />
      </aside>

      <header className="bg-royal px-4 pt-4 pb-3 text-white md:hidden">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Brand storeName={storeName} />
          <UserMenuCompact user={user} />
        </div>
        <Nav orientation="top" showUsers={showUsers} />
      </header>

      <main className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 md:px-10 md:py-9">
        {children}
      </main>
    </div>
  );
}
