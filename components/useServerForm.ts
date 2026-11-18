"use client";

import { startTransition, useActionState } from "react";
import type { FormState } from "@/lib/forms";

/**
 * Conecta un formulario con una acción del servidor sin borrar lo escrito
 * cuando la acción devuelve un error (React lo borraría por defecto).
 */
export function useServerForm(
  action: (prev: FormState, fd: FormData) => Promise<FormState>,
) {
  const [state, formAction, pending] = useActionState(action, undefined);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  return { state, pending, onSubmit };
}
