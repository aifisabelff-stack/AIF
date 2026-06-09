"use server";

import { getMonthAppointmentCounts } from "@/lib/queries";
import { requirePanelSession } from "@/lib/panel-page-auth";

export async function fetchMonthAppointmentCounts(monthKey: string) {
  await requirePanelSession();
  return getMonthAppointmentCounts(monthKey);
}
