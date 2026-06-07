import { NextResponse } from "next/server";
import { requirePanelApiAuth } from "@/lib/api-auth";
import { getMonthAppointmentCounts } from "@/lib/queries";

export async function GET(request: Request) {
  const denied = await requirePanelApiAuth();
  if (denied) return denied;
  try {
    const monthKey = new URL(request.url).searchParams.get("monthKey") ?? "";
    if (!/^\d{4}-\d{2}$/.test(monthKey)) {
      return NextResponse.json({ error: "Mes no válido" }, { status: 400 });
    }
    const data = await getMonthAppointmentCounts(monthKey);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/agenda/month-counts]", err);
    return NextResponse.json({ error: "Error al cargar el mes" }, { status: 500 });
  }
}
