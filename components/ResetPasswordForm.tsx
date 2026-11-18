"use client";

import { useEffect, useRef } from "react";
import { resetUserPassword } from "@/app/(app)/usuarios/actions";
import { useServerForm } from "@/components/useServerForm";
import { PasswordField } from "@/components/PasswordField";
import { FormMessage } from "@/components/ui";

export function ResetPasswordForm({ userId, userName }: { userId: number; userName: string }) {
  const { state, pending, onSubmit } = useServerForm(resetUserPassword);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <details className="group mt-2">
      <summary className="cursor-pointer text-sm font-medium text-cobalt hover:underline">
        Cambiar contraseña
      </summary>
      <form ref={formRef} onSubmit={onSubmit} className="mt-3 max-w-sm space-y-3">
        <input type="hidden" name="user_id" value={userId} />
        <PasswordField
          id={`reset_${userId}`}
          name="password"
          label={`Contraseña nueva para ${userName}`}
          autoComplete="new-password"
        />
        <FormMessage state={state} />
        <button type="submit" disabled={pending} className="btn btn-quiet">
          {pending ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
    </details>
  );
}
