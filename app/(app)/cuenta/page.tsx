import { requireUser } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export const metadata = { title: "Mi cuenta" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="Mi cuenta" subtitle={`${user.name} · ${ROLE_LABEL[user.role]}`} />
      <section className="panel max-w-2xl p-6">
        <h2 className="text-lg font-semibold">Cambiar contraseña</h2>
        <p className="mt-1 mb-5 text-muted">
          Usuario: <b className="font-semibold text-ink">{user.username}</b>. Al cambiarla se
          cierran tus sesiones en otros equipos.
        </p>
        <ChangePasswordForm />
      </section>
    </>
  );
}
