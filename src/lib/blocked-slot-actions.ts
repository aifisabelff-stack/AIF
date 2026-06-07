"use server";

import { revalidatePath } from "next/cache";
import {
  appointmentOccupiesSlot,
  normalizeSlotKeys,
  SLOT_START_MINUTES,
} from "@/lib/agenda-slots";
import { getAppointmentsInRange } from "@/lib/firestore-appointments";
import {
  getBlockedSlotTimes,
  createBlockedSlots,
  deleteBlockedSlots,
} from "@/lib/firestore-blocked-slots";

const ACTIVE_STATUSES = [
  "PENDING_CONFIRMATION",
  "SCHEDULED",
  "CONFIRMED",
  "COMPLETED",
  "NO_SHOW",
] as const;

async function occupiedSlotTimes(slots: Date[]): Promise<Set<number>> {
  if (slots.length === 0) return new Set();

  const times = new Set(slots.map((s) => s.getTime()));
  const min = Math.min(...times);
  const max = Math.max(...times);
  const dayStart = new Date(min);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(max);
  dayEnd.setHours(23, 59, 59, 999);

  const appointments = await getAppointmentsInRange(dayStart, dayEnd, [
    ...ACTIVE_STATUSES,
  ]);

  const occupied = new Set<number>();
  for (const slot of slots) {
    if (
      appointments.some((a) =>
        appointmentOccupiesSlot(a.startAt, a.endAt, slot)
      )
    ) {
      occupied.add(slot.getTime());
    }
  }
  return occupied;
}

/** Bloquea o desbloquea un grupo de tramos en una sola operación */
export async function toggleBlockedSlots(startAtMsList: number[]) {
  const slots = normalizeSlotKeys(startAtMsList);
  if (slots.length === 0) {
    return { blocked: false };
  }

  const existingTimes = new Set(
    await getBlockedSlotTimes(slots.map((slot) => slot.getTime()))
  );
  const shouldBlock = existingTimes.size < slots.length;

  if (shouldBlock) {
    const occupied = await occupiedSlotTimes(slots);
    const isHourBlock =
      slots.length === SLOT_START_MINUTES.length &&
      slots.every(
        (s, _, arr) =>
          s.toDateString() === arr[0].toDateString() &&
          s.getHours() === arr[0].getHours()
      );
    if (isHourBlock && slots.some((s) => occupied.has(s.getTime()))) {
      return {
        blocked: false,
        error: "No se puede bloquear: hay citas en esa hora",
      };
    }
    const toCreate = slots.filter(
      (s) => !existingTimes.has(s.getTime()) && !occupied.has(s.getTime())
    );
    if (toCreate.length === 0) {
      return {
        blocked: false,
        error: "No se puede bloquear: hay citas en ese horario",
      };
    }
    await createBlockedSlots(toCreate.map((startAt) => startAt.getTime()));
  } else {
    await deleteBlockedSlots(slots.map((slot) => slot.getTime()));
  }

  revalidatePath("/agenda");
  return { blocked: shouldBlock };
}

/** Un solo tramo de 30 min */
export async function toggleBlockedSlot(startAtMs: number) {
  return toggleBlockedSlots([startAtMs]);
}
