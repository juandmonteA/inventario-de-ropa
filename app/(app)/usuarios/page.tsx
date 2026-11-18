import { requirePermission } from "@/lib/auth";
import { listUsers } from "@/lib/queries";
import { ROLE_LABEL } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";
import { NewUserForm } from "@/components/NewUserForm";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { setUserActive } from "./actions";

export const metadata = { title: "Usuarios" };

export default async function UsersPage() {
  const me = await requirePermission("usuarios.gestionar");
  const users = listUsers();

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Quién puede entrar al sistema y qué puede hacer."
      />

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_24rem]">
        <section className="panel overflow-hidden">
          <h2 className="px-5 pt-5 pb-2 text-lg font-semibold">
            {users.length} {users.length === 1 ? "usuario" : "usuarios"}
          </h2>
          <ul className="divide-y divide-line">
            {users.map((u) => (
              <li key={u.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold">{u.name}</span>
                      {u.id === me.id && (
                        <span className="rounded-md bg-paper px-2 py-0.5 text-xs font-semibold text-ink-soft">
                          Tú
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted">
                      {u.username} · {u.sales} {u.sales === 1 ? "venta" : "ventas"} registradas
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.role === "admin" ? "bg-cobalt-tint text-cobalt-deep" : "bg-paper text-ink-soft"
                      }`}
                    >
                      {ROLE_LABEL[u.role]}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.active ? "bg-ok-tint text-ok" : "bg-bad-tint text-bad"
                      }`}
                    >
                      {u.active ? "Activo" : "Desactivado"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-start gap-x-6">
                  <ResetPasswordForm userId={u.id} userName={u.name} />
                  {u.id !== me.id && (
                    <form action={setUserActive} className="mt-2">
                      <input type="hidden" name="user_id" value={u.id} />
                      <input type="hidden" name="active" value={u.active ? 0 : 1} />
                      <button
                        className={`cursor-pointer text-sm font-medium hover:underline ${
                          u.active ? "text-bad" : "text-ok"
                        }`}
                      >
                        {u.active ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-5 lg:sticky lg:top-6">
          <h2 className="mb-4 text-lg font-semibold">Nuevo usuario</h2>
          <NewUserForm />
        </section>
      </div>
    </>
  );
}
