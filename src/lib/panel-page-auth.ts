import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isPanelPasswordProtectionEnabled } from "@/lib/panel-access";
import { PANEL_SESSION_COOKIE } from "@/lib/panel-auth-shared";
import { verifyPanelSessionToken } from "@/lib/panel-auth";

export function isPanelSessionValid(session: string | undefined): boolean {
  return verifyPanelSessionToken(session);
}

/** Protege páginas de gestión (layout servidor). */
export async function assertPanelPageAccess(fallbackPath = "/panel"): Promise<void> {
  const enabled = await isPanelPasswordProtectionEnabled();
  if (!enabled) return;

  const jar = await cookies();
  const session = jar.get(PANEL_SESSION_COOKIE)?.value;
  if (isPanelSessionValid(session)) return;

  redirect(`/acceso?desde=${encodeURIComponent(fallbackPath)}`);
}

/** Protege server actions y lógica interna del panel. */
export async function requirePanelSession(): Promise<void> {
  const enabled = await isPanelPasswordProtectionEnabled();
  if (!enabled) return;

  const jar = await cookies();
  const session = jar.get(PANEL_SESSION_COOKIE)?.value;
  if (!isPanelSessionValid(session)) {
    throw new Error("No autorizado");
  }
}
