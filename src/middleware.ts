import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isProtectedPanelPath,
  PANEL_SESSION_COOKIE,
} from "@/lib/panel-auth-shared";
import { verifyPanelSessionTokenEdge } from "@/lib/panel-auth-edge";

async function isPanelProtectionEnabled(request: NextRequest): Promise<boolean> {
  try {
    const statusUrl = new URL("/api/panel/status", request.url);
    const res = await fetch(statusUrl, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
    if (!res.ok) return process.env.NODE_ENV === "production";
    const data = (await res.json()) as { enabled?: boolean };
    return data.enabled === true;
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPanelPath(pathname)) {
    return NextResponse.next();
  }

  const protectionEnabled = await isPanelProtectionEnabled(request);
  if (!protectionEnabled) {
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
