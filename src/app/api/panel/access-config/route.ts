import { NextResponse } from "next/server";
import { requirePanelApiAuth } from "@/lib/api-auth";
import { updatePanelAccessConfig } from "@/lib/panel-access-actions";

export async function POST(request: Request) {
  const denied = await requirePanelApiAuth();
  if (denied) return denied;
  try {
    const formData = await request.formData();
    const result = await updatePanelAccessConfig(formData);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/panel/access-config]", err);
    return NextResponse.json({ error: "No se pudo guardar la configuración" }, { status: 500 });
  }
}
