import { NextResponse } from "next/server";
import { requirePanelApiAuth } from "@/lib/api-auth";
import { deleteAppointment } from "@/lib/appointment-actions";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const denied = await requirePanelApiAuth();
  if (denied) return denied;
  try {
    const { id } = await params;
    await deleteAppointment(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/agenda/appointments/delete]", err);
    const message = err instanceof Error ? err.message : "No se pudo eliminar la cita";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
