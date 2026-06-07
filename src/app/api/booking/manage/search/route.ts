import { NextResponse } from "next/server";
import { searchAppointmentsToCancelByName } from "@/lib/booking-actions";

export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const appointments = await searchAppointmentsToCancelByName(q);
    return NextResponse.json({ appointments });
  } catch (err) {
    console.error("[api/booking/manage/search]", err);
    return NextResponse.json({ appointments: [] }, { status: 500 });
  }
}
