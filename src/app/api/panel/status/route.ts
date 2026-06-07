import { NextResponse } from "next/server";
import { isPanelPasswordProtectionEnabled } from "@/lib/panel-access";
import { applyPanelLockCookieToResponse } from "@/lib/panel-lock-cookie";

export async function GET() {
  try {
    const enabled = await isPanelPasswordProtectionEnabled();
    const response = NextResponse.json({ enabled });
    applyPanelLockCookieToResponse(response, enabled);
    return response;
  } catch (err) {
    console.error("[panel/status]", err);
    const response = NextResponse.json({ enabled: false, error: "status_unavailable" });
    applyPanelLockCookieToResponse(response, false);
    return response;
  }
}
