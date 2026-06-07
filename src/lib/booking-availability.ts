import {
  format,
  startOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  parseISO,
  isBefore,
} from "date-fns";
import {
  MORNING_HOURS,
  AFTERNOON_HOURS,
  SLOT_START_MINUTES,
  buildSlotStart,
  appointmentEndAt,
  appointmentsOverlap,
  agendaSlotsInRange,
  floorToQuarter,
  durationMinutesFromValue,
  formatSlotLabel,
} from "@/lib/agenda-slots";
import { isSchedulableDay } from "@/lib/holidays";

const ACTIVE_STATUSES = [
  "PENDING_CONFIRMATION",
  "SCHEDULED",
  "CONFIRMED",
  "COMPLETED",
  "NO_SHOW",
] as const;

export type AppointmentSpan = { startAt: Date; endAt: Date };

export function enumerateSlotStarts(day: Date): Date[] {
  const slots: Date[] = [];
  const hours = [...MORNING_HOURS, ...AFTERNOON_HOURS];
  for (const hour of hours) {
    for (const minute of SLOT_START_MINUTES) {
      slots.push(buildSlotStart(day, hour, minute));
    }
  }
  return slots;
}

export function isSlotBookable(
  slotStart: Date,
  durationMinutes: number,
  appointments: AppointmentSpan[],
  blockedMs: Set<number>,
  now: Date = new Date()
): boolean {
  if (isBefore(slotStart, now)) return false;

  const endAt = appointmentEndAt(slotStart, durationMinutes);

  for (const sub of agendaSlotsInRange(slotStart, endAt)) {
    if (blockedMs.has(sub.getTime())) return false;
  }

  return !appointments.some((a) =>
    appointmentsOverlap(slotStart, endAt, a.startAt, a.endAt)
  );
}

export function availableSlotsForDay(
  day: Date,
  durationMinutes: number,
  appointments: AppointmentSpan[],
  blockedMs: Set<number>,
  now: Date = new Date()
): string[] {
  if (!isSchedulableDay(day)) return [];

  if (isBefore(startOfDay(day), startOfDay(now))) return [];

  const times: string[] = [];
  for (const slotStart of enumerateSlotStarts(day)) {
    if (isSlotBookable(slotStart, durationMinutes, appointments, blockedMs, now)) {
      times.push(formatSlotLabel(slotStart.getHours(), slotStart.getMinutes()));
    }
  }
  return times;
}

export function dayHasAvailability(
  day: Date,
  durationMinutes: number,
  appointments: AppointmentSpan[],
  blockedMs: Set<number>,
  now: Date = new Date()
): boolean {
  return (
    availableSlotsForDay(day, durationMinutes, appointments, blockedMs, now).length > 0
  );
}

export function availableDaysInMonth(
  year: number,
  month: number,
  durationMinutes: number,
  appointments: AppointmentSpan[],
  blockedMs: Set<number>,
  now: Date = new Date()
): string[] {
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(start);
  const today = startOfDay(now);

  return eachDayOfInterval({ start, end })
    .filter((day) => !isBefore(day, today))
    .filter((day) =>
      dayHasAvailability(day, durationMinutes, appointments, blockedMs, now)
    )
    .map((day) => format(day, "yyyy-MM-dd"));
}

export function availableWeekSchedule(
  weekStartKey: string,
  durationMinutes: number,
  appointments: AppointmentSpan[],
  blockedMs: Set<number>,
  now: Date = new Date()
) {
  const weekStart = startOfWeek(parseISO(weekStartKey), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return days.map((day) => {
    const date = format(day, "yyyy-MM-dd");
    const slots = availableSlotsForDay(
      day,
      durationMinutes,
      appointments,
      blockedMs,
      now
    );
    return {
      date,
      schedulable: isSchedulableDay(day),
      slots,
      hasSlots: slots.length > 0,
    };
  });
}

export function parseDurationMinutes(value: string): number | null {
  return durationMinutesFromValue(value);
}

export { ACTIVE_STATUSES as BOOKING_ACTIVE_STATUSES };
