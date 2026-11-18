"use client";

import { useEffect, useRef } from "react";
import { createUser } from "@/app/(app)/usuarios/actions";
import { useServerForm } from "@/components/useServerForm";
import { PasswordField } from "@/components/PasswordField";
import { FormMessage } from "@/components/ui";
import { USERNAME_HELP } from "@/lib/forms";

const roles = [
  { value: "employee", label: "Empleado" },
  { value: "admin", label: "Administrador" },
] as const;

export function NewUserForm() {
  const { state, pending, onSubmit } = useServerForm(createUser);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="new_name" className="label">
          Nombre
        </label>
        <input id="new_name" name="name" required autoComplete="off" className="input" />
      </div>
      <div>
        <label htmlFor="new_username" className="label">
          Usuario para entrar
        </label>
        <input
          id="new_username"
          name="username"
          required
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Ej. maria"
          className="input"
        />
        <p className="mt-1.5 text-sm text-muted">{USERNAME_HELP}</p>
      </div>
      <PasswordField
        id="new_password"
        name="password"
        label="Contraseña inicial"
        autoComplete="new-password"
        hint="Mínimo 8 caracteres, con letras y números. La persona puede cambiarla en Mi cuenta."
      />
      <fieldset>
        <legend className="label">Rol</legend>
        <div className="inline-flex gap-1 rounded-lg border border-line bg-paper p-1">
          {roles.map((r) => (
            <label key={r.value} className="cursor-pointer">
              <input
                type="radio"
                name="role"
                value={r.value}
                defaultChecked={r.value === "employee"}
                className="peer sr-only"
              />
              <span className="block rounded-md px-3 py-1.5 text-sm font-medium text-ink-soft peer-checked:bg-royal peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cobalt">
                {r.label}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">
          El empleado vende y consulta el inventario. El administrador puede hacer todo, incluido
          manejar usuarios.
        </p>
      </fieldset>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Creando…" : "Crear usuario"}
      </button>
    </form>
  );
}
