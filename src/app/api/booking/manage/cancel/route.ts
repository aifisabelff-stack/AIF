import { NextResponse } from "next/server";
import { cancelAppointmentByClient } from "@/lib/booking-actions";
import { readRequestJson } from "@/lib/http-json";

export async function POST(request: Request) {
  try {
    const body = await readRequestJson<{ appointmentId?: string }>(request);
    const appointmentId = body?.appointmentId;
    if (!body || !appointmentId) {
      return NextResponse.json({ error: "Cita no indicada" }, { status: 400 });
    }
    const result = await cancelAppointmentByClient(appointmentId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/booking/manage/cancel]", err);
    return NextResponse.json({ error: "No se pudo anular la cita" }, { status: 500 });
  }
}
