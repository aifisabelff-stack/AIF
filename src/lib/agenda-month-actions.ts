"use server";

import { getMonthAppointmentCounts } from "@/lib/queries";

export async function fetchMonthAppointmentCounts(monthKey: string) {
  return getMonthAppointmentCounts(monthKey);
}
