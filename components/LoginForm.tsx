"use client";

import { login } from "@/app/auth-actions";
import { useServerForm } from "@/components/useServerForm";
import { PasswordField } from "@/components/PasswordField";
import { FormMessage } from "@/components/ui";

export function LoginForm() {
  const { state, pending, onSubmit } = useServerForm(login);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="label">
          Usuario
        </label>
        <input
          id="username"
          name="username"
          required
          autoFocus
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          className="input"
        />
      </div>
      <PasswordField id="password" name="password" label="Contraseña" autoComplete="current-password" />
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
