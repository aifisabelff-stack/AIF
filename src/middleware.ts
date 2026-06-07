import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isProtectedPanelPath,
  PANEL_LOCK_COOKIE,
  PANEL_SESSION_COOKIE,
} from "@/lib/panel-auth-shared";
import { verifyPanelSessionTokenEdge } from "@/lib/panel-auth-edge";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPanelPath(pathname)) {
    return NextResponse.next();
  }

  const lockOn = request.cookies.get(PANEL_LOCK_COOKIE)?.value === "1";
  if (!lockOn) {
    return NextResponse.next();
  }

  const session = request.cookies.get(PANEL_SESSION_COOKIE)?.value;
  if (await verifyPanelSessionTokenEdge(session)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/acceso", request.url);
  loginUrl.searchParams.set("desde", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/panel/:path*",
    "/agenda/:path*",
    "/pacientes/:path*",
    "/facturacion/:path*",
    "/gastos/:path*",
    "/estadisticas/:path*",
  ],
};

/** /acceso y /reserva quedan fuera del matcher — acceso público */
