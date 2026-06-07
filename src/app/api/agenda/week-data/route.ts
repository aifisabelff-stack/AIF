import { NextResponse } from "next/server";
import { requirePanelApiAuth } from "@/lib/api-auth";
import { getWeekAppointments, getWeekBlockedSlots } from "@/lib/queries";
import { formatWeekLabel, getWeekRange } from "@/lib/utils";

export async function GET(request: Request) {
  const denied = await requirePanelApiAuth();
  if (denied) return denied;

  try {
    const semana = new URL(request.url).searchParams.get("semana") ?? undefined;
    const { key, start } = getWeekRange(semana);
    const [appointments, blockedSlotTimes] = await Promise.all([
      getWeekAppointments(key),
      getWeekBlockedSlots(key),
    ]);

    return NextResponse.json({
      weekKey: key,
      weekLabel: formatWeekLabel(start),
      appointments: appointments.map((a) => ({
        ...a,
        startAt: a.startAt.toISOString(),
        endAt: a.endAt.toISOString(),
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        confirmedAt: a.confirmedAt?.toISOString() ?? null,
        performedAt: a.performedAt?.toISOString() ?? null,
      })),
      blockedSlotTimes,
    });
  } catch (err) {
    console.error("[api/agenda/week-data]", err);
    return NextResponse.json({ error: "No se pudo cargar la semana" }, { status: 500 });
  }
}
