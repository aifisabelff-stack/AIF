import { NextResponse } from "next/server";
import { requirePanelApiAuth } from "@/lib/api-auth";
import {
  createAppointmentModal,
  deleteAppointmentModal,
  updateAppointmentModal,
} from "@/lib/appointment-actions";

export async function POST(request: Request) {
  const denied = await requirePanelApiAuth();
  if (denied) return denied;
  try {
    const formData = await request.formData();
    const mode = formData.get("_mode");

    if (mode === "delete") {
      const id = String(formData.get("appointmentId") ?? "");
      const result = await deleteAppointmentModal(id);
      return NextResponse.json(result);
    }

    if (mode === "update") {
      const result = await updateAppointmentModal(formData);
      return NextResponse.json(result);
    }

    const result = await createAppointmentModal(formData);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/agenda/appointments/modal]", err);
    return NextResponse.json({ error: "No se pudo guardar la cita" }, { status: 500 });
  }
}
