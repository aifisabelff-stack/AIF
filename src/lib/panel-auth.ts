import { createHmac, scrypt, timingSafeEqual, randomBytes } from "crypto";
import { promisify } from "util";
import {
  PANEL_SESSION_COOKIE,
  PANEL_LOCK_COOKIE,
  PANEL_CONFIG_ID,
  SESSION_MAX_AGE_SEC,
  getPanelSessionSecret,
} from "@/lib/panel-auth-shared";

const scryptAsync = promisify(scrypt);

export {
  PANEL_SESSION_COOKIE,
  PANEL_LOCK_COOKIE,
  PANEL_CONFIG_ID,
  SESSION_MAX_AGE_SEC,
} from "@/lib/panel-auth-shared";
export { isProtectedPanelPath } from "@/lib/panel-auth-shared";

export async function hashPanelPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPanelPassword(
  password: string,
  stored: string | null | undefined
): Promise<boolean> {
  if (!stored) return false;
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  try {
    const derived = (await scryptAsync(password, salt, 64)) as Buffer;
    const expected = Buffer.from(hashHex, "hex");
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function signPayload(payload: string): string {
  return createHmac("sha256", getPanelSessionSecret())
    .update(payload)
    .digest("hex");
}

export function createPanelSessionToken(): string {
  const exp = Date.now() + SESSION_MAX_AGE_SEC * 1000;
  const payload = String(exp);
  return `${payload}.${signPayload(payload)}`;
}

export function verifyPanelSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(payload);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  try {
    const expected = signPayload(payload);
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
