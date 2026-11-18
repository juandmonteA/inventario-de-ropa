const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatCOP(n: number): string {
  return cop.format(n);
}

const compact = new Intl.NumberFormat("es-CO", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Para etiquetas pequeñas de gráficos: "$ 480 mil", "$ 1,2 M". */
export function shortCOP(n: number): string {
  return `$ ${compact.format(n)}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-CO").format(n);
}

// SQLite entrega fechas como "YYYY-MM-DD HH:MM:SS" (hora local del servidor).
function parse(s: string): Date {
  return new Date(s.replace(" ", "T"));
}

export function formatDateTime(s: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(parse(s));
}

export function formatDay(day: string): { weekday: string; date: string } {
  const d = parse(`${day} 12:00:00`);
  return {
    weekday: new Intl.DateTimeFormat("es-CO", { weekday: "short" })
      .format(d)
      .replace(".", ""),
    date: new Intl.DateTimeFormat("es-CO", { day: "numeric" }).format(d),
  };
}

export function longToday(): string {
  const s = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1);
}
