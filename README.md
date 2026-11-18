# inventario-de-ropa: inventario y ventas para tiendas de ropa deportiva

Next.js 16 + TypeScript + Tailwind CSS, con base de datos SQLite (un solo archivo, `data/cancha.db`).
Dos tipos de usuario: **administrador** y **empleado**.

La guía completa (instalar, usar, modificar el código, entregar a un cliente, respaldos y
solución de problemas) está en el documento "Guía de Cancha: instalar, usar y modificar".

## Resumen rápido

**En tu computador (desarrollo)** — necesitas Node.js 22 o más nuevo:

```
npm install
npm run seed      # productos de ejemplo, solo para demos
npm run dev       # http://localhost:3000
```

La primera vez, la app pide crear al administrador.

**En el computador del cliente (Windows):** `instalar.bat` una vez, luego `iniciar.bat`.
Antes de entregar, borra del paquete `node_modules`, `.next`, `data` y `.env.local`.

## Archivos útiles

| Archivo | Para qué |
|---|---|
| `instalar.bat` | Instala y prepara la app (pide el nombre de la tienda) |
| `iniciar.bat` | Inicia la app, hace un respaldo y abre el navegador |
| `respaldo.bat` | Copia de seguridad manual en `data\respaldos` |
| `olvide-mi-clave.bat` | Cambia la contraseña de un usuario |
| `lib/permissions.ts` | Qué puede hacer cada rol |
| `.env.local` | `STORE_NAME`, `SESSION_HOURS`, `CANCHA_BACKUP_DIR`, `COOKIE_SECURE` |
