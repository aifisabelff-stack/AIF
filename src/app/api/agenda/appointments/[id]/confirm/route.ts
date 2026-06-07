import { NextResponse } from "next/server";
import { requirePanelApiAuth } from "@/lib/api-auth";
import { updateAppointmentStatus } from "@/lib/appointment-actions";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const denied = await requirePanelApiAuth();
  if (denied) return denied;
  try {
    const { id } = await params;
    await updateAppointmentStatus(id, "CONFIRMED");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/agenda/appointments/confirm]", err);
    return NextResponse.json({ error: "No se pudo confirmar la cita" }, { status: 500 });
  }
}
