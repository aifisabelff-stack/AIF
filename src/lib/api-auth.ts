import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyPanelSessionToken } from "@/lib/panel-auth";
import { PANEL_LOCK_COOKIE, PANEL_SESSION_COOKIE } from "@/lib/panel-auth-shared";
import { getPanelAccessConfig } from "@/lib/panel-access";

export async function requirePanelApiAuth(): Promise<NextResponse | null> {
  const config = await getPanelAccessConfig();
  if (!config.enabled) return null;

  const jar = await cookies();
  if (jar.get(PANEL_LOCK_COOKIE)?.value !== "1") {
    return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
  }

  const session = jar.get(PANEL_SESSION_COOKIE)?.value;
  if (!(await verifyPanelSessionToken(session))) {
    return NextResponse.json({ error: "Sesion invalida" }, { status: 401 });
  }

  return null;
}
