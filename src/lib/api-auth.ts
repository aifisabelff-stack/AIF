import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isPanelSessionValid } from "@/lib/panel-page-auth";
import { isPanelPasswordProtectionEnabled } from "@/lib/panel-access";
import { PANEL_SESSION_COOKIE } from "@/lib/panel-auth-shared";

export async function requirePanelApiAuth(): Promise<NextResponse | null> {
  const enabled = await isPanelPasswordProtectionEnabled();
  if (!enabled) return null;

  const jar = await cookies();
  const session = jar.get(PANEL_SESSION_COOKIE)?.value;
  if (!isPanelSessionValid(session)) {
    return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
  }

  return null;
}
