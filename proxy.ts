import { NextResponse, type NextRequest } from "next/server";

// Revisión rápida: sin cookie de sesión no se entra a nada, salvo al login.
// La verificación real (¿la sesión existe y sigue vigente?, ¿qué rol tiene?)
// se hace en cada página y acción con lib/auth.ts.
const PUBLIC_PATHS = ["/login", "/configurar"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasCookie = request.cookies.has("cancha_session");

  if (!hasCookie && !PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
