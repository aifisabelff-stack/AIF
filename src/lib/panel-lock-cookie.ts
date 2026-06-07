import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { isPanelPasswordProtectionEnabled } from "@/lib/panel-access";
import { PANEL_LOCK_COOKIE } from "@/lib/panel-auth-shared";

const CLEAR_LOCK = {
  path: "/",
  maxAge: 0,
  httpOnly: true,
  sameSite: "lax" as const,
};

/** Quita la cookie de bloqueo si la protección por contraseña está desactivada. */
export async function clearStalePanelLockCookie() {
  const enabled = await isPanelPasswordProtectionEnabled();
  if (enabled) return false;

  const jar = await cookies();
  if (jar.get(PANEL_LOCK_COOKIE)?.value !== "1") return false;

  jar.delete(PANEL_LOCK_COOKIE);
  return true;
}

export function applyPanelLockCookieToResponse(
  response: NextResponse,
  protectionEnabled: boolean
) {
  if (!protectionEnabled) {
    response.cookies.set(PANEL_LOCK_COOKIE, "", CLEAR_LOCK);
  }
}
