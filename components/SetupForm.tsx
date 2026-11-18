"use client";

import { setupAdmin } from "@/app/auth-actions";
import { useServerForm } from "@/components/useServerForm";
import { PasswordField } from "@/components/PasswordField";
import { FormMessage } from "@/components/ui";
import { USERNAME_HELP } from "@/lib/forms";

export function SetupForm() {
  const { state, pending, onSubmit } = useServerForm(setupAdmin);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="label">
          Tu nombre
        </label>
        <input id="name" name="name" required autoFocus autoComplete="name" className="input" />
      </div>
      <div>
        <label htmlFor="username" className="label">
          Usuario para entrar
        </label>
        <input
          id="username"
          name="username"
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Ej. dueno"
          className="input"
        />
        <p className="mt-1.5 text-sm text-muted">{USERNAME_HELP}</p>
      </div>
      <PasswordField
        id="password"
        name="password"
        label="Contraseña"
        autoComplete="new-password"
        hint="Mínimo 8 caracteres, con letras y números."
      />
      <PasswordField id="confirm" name="confirm" label="Repite la contraseña" autoComplete="new-password" />
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Creando…" : "Crear administrador"}
      </button>
    </form>
  );
}
