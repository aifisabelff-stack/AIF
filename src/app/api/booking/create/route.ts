import { NextResponse } from "next/server";
import { createPublicBooking } from "@/lib/appointment-actions";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await createPublicBooking(formData);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/booking/create]", err);
    return NextResponse.json(
      { error: "No se pudo registrar la cita. Inténtelo de nuevo." },
      { status: 500 }
    );
  }
}
