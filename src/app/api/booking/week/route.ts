import { NextResponse } from "next/server";
import { endOfWeek, format, parseISO, startOfWeek } from "date-fns";
import {
  availableWeekSchedule,
  parseDurationMinutes,
} from "@/lib/booking-availability";
import { bookingDateInWindow } from "@/lib/booking-window";
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
    const weekStartKey = searchParams.get("weekStart") ?? "";
    const duration = searchParams.get("duration") ?? "60";

    const mins = parseDurationMinutes(duration);
    if (!mins || !weekStartKey) {
      return NextResponse.json({ days: [] });
    }

    const weekStart = startOfWeek(parseISO(weekStartKey), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const { appointments, blockedMs } = await loadBookingData(weekStart, weekEnd);

    const days = availableWeekSchedule(
      format(weekStart, "yyyy-MM-dd"),
      mins,
      appointments,
      blockedMs
    ).map((d) => {
      if (!bookingDateInWindow(d.date)) {
        return { ...d, slots: [], hasSlots: false };
      }
      return d;
    });

    return NextResponse.json({ days });
  } catch (err) {
    console.error("[api/booking/week]", err);
    return NextResponse.json(
      { error: "No se pudo cargar la semana", days: [] },
      { status: 500 }
    );
  }
}
