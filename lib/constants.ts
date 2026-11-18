export const SIZE_SETS = {
  ropa: ["XS", "S", "M", "L", "XL", "XXL"],
  calzado: ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44"],
  unica: ["Única"],
} as const;

export type SizeKind = keyof typeof SIZE_SETS;

export const SIZE_KIND_LABEL: Record<SizeKind, string> = {
  ropa: "Ropa (XS a XXL)",
  calzado: "Calzado (35 a 44)",
  unica: "Talla única",
};

export const CATEGORIES = [
  "Camisetas",
  "Shorts",
  "Leggings",
  "Sudaderas",
  "Chaquetas",
  "Tenis",
  "Medias",
  "Accesorios",
];

export type MovementType = "entrada" | "salida" | "venta" | "ajuste";

export const MOVEMENT_LABEL: Record<MovementType, string> = {
  entrada: "Entrada",
  salida: "Salida",
  venta: "Venta",
  ajuste: "Conteo",
};

const COLOR_HEX: Record<string, string> = {
  negro: "#111827",
  blanco: "#FFFFFF",
  gris: "#9AA3B2",
  "gris oscuro": "#4B5563",
  azul: "#2563EB",
  "azul rey": "#1D4ED8",
  "azul marino": "#1E3A8A",
  celeste: "#7DD3FC",
  rojo: "#DC2626",
  vino: "#7F1D3D",
  naranja: "#F97316",
  amarillo: "#FACC15",
  verde: "#16A34A",
  "verde oliva": "#65763A",
  rosado: "#F9A8D4",
  morado: "#7C3AED",
  beige: "#D9C7A3",
};

export function colorHex(name: string): string {
  const key = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
  return COLOR_HEX[key] ?? "#CBD2DE";
}

export function sizeOrder(kind: SizeKind, size: string): number {
  const i = (SIZE_SETS[kind] as readonly string[]).indexOf(size);
  return i === -1 ? 999 : i;
}
