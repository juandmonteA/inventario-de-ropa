import { redirect } from "next/navigation";
import { hasUsers } from "@/lib/auth";
import { AuthShell } from "@/components/AuthShell";
import { SetupForm } from "@/components/SetupForm";

export const metadata = { title: "Primera configuración" };

export default function SetupPage() {
  // Solo existe mientras no haya usuarios: después, esta página ya no sirve.
  if (hasUsers()) redirect("/login");

  return (
    <AuthShell
      storeName={process.env.STORE_NAME ?? "Mi tienda deportiva"}
      title="Crea al administrador"
      subtitle="Es el dueño de la cuenta. Desde Usuarios podrá crear el acceso de cada empleado."
    >
      <SetupForm />
    </AuthShell>
  );
}
