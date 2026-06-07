import { NextResponse } from "next/server";
import { endOfMonth, startOfMonth } from "date-fns";
import {
  availableDaysInMonth,
  parseDurationMinutes,
} from "@/lib/booking-availability";
import { bookingMonthInWindow } from "@/lib/booking-window";
import * as appointments from "@/lib/firestore-appointments";
import { getBlockedSlotTimesInRange } from "@/lib/firestore-blocked-slots";

async function loadBookingData(start: Date, end: Date) {
  const appointmentsRange = await appointments.getAppointmentsInRange(start, end, [
    "PENDING_CONFIRMATION",
    "SCHEDULED",
    "CONFIRMED",
    "COMPLETED",
    "NO_SHOW",
  ]);

  const blocked = await getBlockedSlotTimesInRange(start, end);

  return {
    appointments: appointmentsRange,
    blockedMs: new Set(blocked),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") ?? "", 10);
    const month = parseInt(searchParams.get("month") ?? "", 10);
    const duration = searchParams.get("duration") ?? "60";

    const mins = parseDurationMinutes(duration);
    if (!mins || !Number.isFinite(year) || !Number.isFinite(month)) {
      return NextResponse.json({ availableDays: [] });
    }

    if (!bookingMonthInWindow(year, month)) {
      return NextResponse.json({ availableDays: [] });
    }

    const start = startOfMonth(new Date(year, month - 1, 1));
    const end = endOfMonth(start);
    const { appointments, blockedMs } = await loadBookingData(start, end);
    const availableDays = availableDaysInMonth(
      year,
      month,
      mins,
      appointments,
      blockedMs
    );

    return NextResponse.json({ availableDays });
  } catch (err) {
    console.error("[api/booking/month]", err);
    return NextResponse.json(
      { error: "No se pudo cargar el mes", availableDays: [] },
      { status: 500 }
    );
  }
}
