"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { updatePanelAccessConfig as updateFirestorePanelAccessConfig } from "@/lib/firestore-panel-access";
import {
  createPanelSessionToken,
  hashPanelPassword,
  PANEL_LOCK_COOKIE,
  PANEL_SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  verifyPanelPassword,
  verifyPanelSessionToken,
} from "@/lib/panel-auth";
import { getPanelAccessConfig, isPanelPasswordProtectionEnabled } from "@/lib/panel-access";

async function setLockCookie(enabled: boolean) {
  const jar = await cookies();
  if (enabled) {
    jar.set(PANEL_LOCK_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    jar.delete(PANEL_LOCK_COOKIE);
  }
}

/** Alinea la cookie de bloqueo con la configuración real (evita pedir contraseña si está desactivada). */
async function syncLockCookieWithConfig() {
  const enabled = await isPanelPasswordProtectionEnabled();
  await setLockCookie(enabled);
}

async function setSessionCookie() {
  const jar = await cookies();
  jar.set(PANEL_SESSION_COOKIE, createPanelSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

/** Solo lectura: no modificar cookies aquí (rompe la acción en el cliente). */
export async function getPanelAccessPublicStatus() {
  const enabled = await isPanelPasswordProtectionEnabled();
  return { enabled };
}

export async function verifyPanelAccessPassword(password: string) {
  const cfg = await getPanelAccessConfig();
  if (!cfg.passwordHash) {
    await setLockCookie(false);
    await setSessionCookie();
    return { success: true as const, protectionEnabled: false };
  }

  const ok = await verifyPanelPassword(password, cfg.passwordHash);
  if (!ok) {
    return { error: "Contraseña incorrecta" };
  }

  await setLockCookie(true);
  await setSessionCookie();
  return { success: true as const, protectionEnabled: true };
}

export async function getPanelAccessSettingsForAdmin() {
  const cfg = await getPanelAccessConfig();
  const jar = await cookies();
  const hasSession = verifyPanelSessionToken(
    jar.get(PANEL_SESSION_COOKIE)?.value
  );
  const protectionOn = cfg.enabled && !!cfg.passwordHash;

  if (protectionOn && !hasSession) {
    return { error: "Sin autorización" as const };
  }

  return {
    enabled: cfg.enabled,
    protectionActive: protectionOn,
    hasPassword: !!cfg.passwordHash,
  };
}

export async function updatePanelAccessConfig(formData: FormData) {
  const enabledRaw = String(formData.get("enabled") ?? "false").toLowerCase();
  const enabled = enabledRaw === "true" || enabledRaw === "on";
  const password = String(formData.get("password") ?? "").trim();
  const confirm = String(formData.get("confirmPassword") ?? "").trim();

  const cfg = await getPanelAccessConfig();
  const jar = await cookies();
  const hasSession = verifyPanelSessionToken(
    jar.get(PANEL_SESSION_COOKIE)?.value
  );
  const protectionOn = cfg.enabled && !!cfg.passwordHash;

  if (enabled && protectionOn && !hasSession) {
    return { error: "Debe iniciar sesión en el panel para cambiar la contraseña" };
  }

  if (enabled) {
    if (password.length < 4) {
      return { error: "La contraseña debe tener al menos 4 caracteres" };
    }
    if (password !== confirm) {
      return { error: "Las contraseñas no coinciden" };
    }
    const passwordHash = await hashPanelPassword(password);
    await updateFirestorePanelAccessConfig({ enabled: true, passwordHash });
    await setLockCookie(true);
    await setSessionCookie();
  } else {
    await updateFirestorePanelAccessConfig({ enabled: false, passwordHash: null });
    await setLockCookie(false);
    jar.delete(PANEL_SESSION_COOKIE);
  }

  await syncLockCookieWithConfig();
  revalidatePath("/");
  revalidatePath("/panel");
  return { success: true as const };
}
