import { NextResponse } from "next/server";
import { requirePanelApiAuth } from "@/lib/api-auth";
import { readRequestJson } from "@/lib/http-json";
import { toggleBlockedSlots } from "@/lib/blocked-slot-actions";

export async function POST(request: Request) {
  const denied = await requirePanelApiAuth();
  if (denied) return denied;
  try {
    const body = await readRequestJson<{ slots?: number[] }>(request);
    const slots = Array.isArray(body?.slots) ? body.slots : [];
    const result = await toggleBlockedSlots(slots);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/agenda/blocked-slots]", err);
    return NextResponse.json(
      { blocked: false, error: "No se pudo actualizar la disponibilidad" },
      { status: 500 }
    );
  }
}
