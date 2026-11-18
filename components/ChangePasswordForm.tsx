"use client";

import { useEffect, useRef } from "react";
import { changeOwnPassword } from "@/app/auth-actions";
import { useServerForm } from "@/components/useServerForm";
import { PasswordField } from "@/components/PasswordField";
import { FormMessage } from "@/components/ui";

export function ChangePasswordForm() {
  const { state, pending, onSubmit } = useServerForm(changeOwnPassword);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="max-w-sm space-y-4">
      <PasswordField id="current" name="current" label="Contraseña actual" autoComplete="current-password" />
      <PasswordField
        id="next"
        name="next"
        label="Contraseña nueva"
        autoComplete="new-password"
        hint="Mínimo 8 caracteres, con letras y números."
      />
      <PasswordField id="confirm" name="confirm" label="Repite la contraseña nueva" autoComplete="new-password" />
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
