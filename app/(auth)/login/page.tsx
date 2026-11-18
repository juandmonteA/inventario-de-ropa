import { redirect } from "next/navigation";
import { getSessionUser, hasUsers } from "@/lib/auth";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "Iniciar sesión" };

export default async function LoginPage() {
  if (!hasUsers()) redirect("/configurar");
  if (await getSessionUser()) redirect("/");

  return (
    <AuthShell
      storeName={process.env.STORE_NAME ?? "Mi tienda deportiva"}
      title="Iniciar sesión"
      subtitle="Escribe el usuario y la contraseña que te dio el administrador."
    >
      <LoginForm />
    </AuthShell>
  );
}
