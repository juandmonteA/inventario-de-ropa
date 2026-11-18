// Ayudas para leer los datos de un formulario (FormData).

export type FormState = { error?: string; ok?: string } | undefined;

export function text(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

export function toInt(value: FormDataEntryValue | null, fallback = 0): number {
  const n = Math.trunc(Number(String(value ?? "").replace(/[^\d-]/g, "")));
  return Number.isFinite(n) ? n : fallback;
}

/** Usuario: 3 a 30 caracteres, solo minúsculas, números, punto, guion o guion bajo. */
export const USERNAME_RULE = /^[a-z0-9._-]{3,30}$/;
export const USERNAME_HELP =
  "Usa de 3 a 30 caracteres: letras sin tildes, números, punto o guion.";
