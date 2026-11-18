// Aquí se decide QUÉ puede hacer cada rol. Para cambiar un permiso, edita una línea.
// Ejemplo: para que los empleados también registren mercancía que llega,
// cambia  "stock.mover": ["admin"]  por  "stock.mover": ["admin", "employee"].

export type Role = "admin" | "employee";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  employee: "Empleado",
};

const PERMISSIONS = {
  // Todos los usuarios
  "ventas.registrar": ["admin", "employee"],
  "inventario.ver": ["admin", "employee"],
  "movimientos.ver": ["admin", "employee"],

  // Solo el administrador
  "inventario.crear": ["admin"], // productos nuevos y colores nuevos
  "stock.mover": ["admin"], // entradas, salidas y conteos
  "inventario.archivar": ["admin"],
  "inventario.exportar": ["admin"],
  "costos.ver": ["admin"], // costo, margen y valor del inventario
  "reportes.ver": ["admin"], // ventas del mes, gráfico y más vendidos
  "usuarios.gestionar": ["admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export const NO_PERMISSION = "Tu usuario no tiene permiso para hacer esto.";
