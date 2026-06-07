import { NextResponse } from "next/server";
import { requirePanelApiAuth } from "@/lib/api-auth";
import { readRequestJson } from "@/lib/http-json";
import { toggleOfferedTherapyGroup } from "@/lib/therapy-actions";

export async function POST(request: Request) {
  const denied = await requirePanelApiAuth();
  if (denied) return denied;
  try {
    const body = await readRequestJson<{ groupKey?: string }>(request);
    const groupKey = body?.groupKey;
    if (!body || !groupKey) {
      return NextResponse.json({ error: "Terapia no indicada" }, { status: 400 });
    }
    const result = await toggleOfferedTherapyGroup(groupKey);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/panel/therapies/toggle-group]", err);
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }
}
