import { NextResponse } from "next/server";
import { rescheduleAppointmentByClient } from "@/lib/booking-actions";
import { readRequestJson } from "@/lib/http-json";

export async function POST(request: Request) {
  try {
    const body = await readRequestJson<{
      appointmentId?: string;
      date?: string;
      time?: string;
      duration?: string;
    }>(request);
    if (!body?.appointmentId || !body.date || !body.time) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    const result = await rescheduleAppointmentByClient(
      body.appointmentId,
      body.date,
      body.time,
      body.duration ?? "60"
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/booking/manage/reschedule]", err);
    return NextResponse.json({ error: "No se pudo cambiar la cita" }, { status: 500 });
  }
}
