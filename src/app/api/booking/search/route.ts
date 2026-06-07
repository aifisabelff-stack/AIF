import { NextResponse } from "next/server";
import { searchPatientsForBooking } from "@/lib/booking-actions";

export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const patients = await searchPatientsForBooking(q);
    return NextResponse.json({ patients });
  } catch (err) {
    console.error("[api/booking/search]", err);
    return NextResponse.json({ patients: [], error: "Error de búsqueda" }, { status: 500 });
  }
}
