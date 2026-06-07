/** Franjas de la agenda clínica (intervalos de 30 min) */

export const SLOT_MINUTES = 30;

/** Duración por defecto al elegir tramo en el calendario */
export const DEFAULT_APPOINTMENT_DURATION_MINUTES = 30;

export const APPOINTMENT_DURATION_OPTIONS = [
  { value: "15", label: "15 min", minutes: 15 },
  { value: "30", label: "30 min", minutes: 30 },
  { value: "45", label: "45 min", minutes: 45 },
  { value: "60", label: "1 h", minutes: 60 },
] as const;

export type AppointmentDurationValue =
  (typeof APPOINTMENT_DURATION_OPTIONS)[number]["value"];

export function durationMinutesFromValue(value: string): number | null {
  const opt = APPOINTMENT_DURATION_OPTIONS.find((o) => o.value === value);
  return opt?.minutes ?? null;
}

/** Valor del select de duración a partir de inicio y fin de cita */
export function durationValueFromRange(startAt: Date, endAt: Date): AppointmentDurationValue {
  const mins = Math.round((endAt.getTime() - startAt.getTime()) / 60000);
  const exact = APPOINTMENT_DURATION_OPTIONS.find((o) => o.minutes === mins);
  if (exact) return exact.value;
  const allowed = APPOINTMENT_DURATION_OPTIONS.map((o) => o.minutes);
  const closest = allowed.reduce((a, b) =>
    Math.abs(b - mins) < Math.abs(a - mins) ? b : a
  );
  return (
    APPOINTMENT_DURATION_OPTIONS.find((o) => o.minutes === closest)?.value ?? "30"
  );
}

export const MORNING_HOURS = [9, 10, 11, 12, 13] as const;
export const AFTERNOON_HOURS = [14, 15, 16, 17, 18, 19] as const;
export const AFTERNOON_START_HOUR = 14;

/** Inicios de tramo dentro de cada hora (:00 y :30) */
export const SLOT_START_MINUTES = [0, 30] as const;

/** @deprecated Alias por compatibilidad interna */
export const QUARTER_MINUTES = SLOT_START_MINUTES;

export function buildSlotStart(day: Date, hour: number, minute: number): Date {
  const d = new Date(day);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function slotTimeKey(day: Date, hour: number, minute: number): number {
  return buildSlotStart(day, hour, minute).getTime();
}

export function formatSlotLabel(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function isValidAgendaSlot(hour: number, minute: number): boolean {
  if (!SLOT_START_MINUTES.includes(minute as (typeof SLOT_START_MINUTES)[number])) {
    return false;
  }
  if (hour >= 9 && hour <= 13) return true;
  if (hour >= 14 && hour <= 19) return true;
  return false;
}

/** Redondea la hora de inicio al tramo de 30 min */
export function floorToQuarter(date: Date): Date {
  const d = new Date(date);
  const m = d.getMinutes();
  d.setMinutes(Math.floor(m / SLOT_MINUTES) * SLOT_MINUTES, 0, 0);
  return d;
}

export type BlockInterval = "30" | "60" | "half" | "day" | "week" | "month";

export type HalfDayPeriod = "morning" | "afternoon";

export function slotKeysForHour(day: Date, hour: number): number[] {
  return SLOT_START_MINUTES.map((minute) => slotTimeKey(day, hour, minute));
}

/** Mañana 9:00–13:30 */
export function slotKeysForMorning(day: Date): number[] {
  const keys: number[] = [];
  for (const hour of MORNING_HOURS) {
    keys.push(...slotKeysForHour(day, hour));
  }
  return keys;
}

/** Tarde 14:00–19:30 */
export function slotKeysForAfternoon(day: Date): number[] {
  const keys: number[] = [];
  for (const hour of AFTERNOON_HOURS) {
    keys.push(...slotKeysForHour(day, hour));
  }
  return keys;
}

/** Todos los tramos de 30 min del día (9:00–19:30) */
export function slotKeysForDay(day: Date): number[] {
  return [...slotKeysForMorning(day), ...slotKeysForAfternoon(day)];
}

/** Todos los tramos de la semana (lunes–domingo) a partir del lunes de esa semana */
export function slotKeysForWeek(weekStartMonday: Date): number[] {
  const keys: number[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStartMonday);
    day.setDate(day.getDate() + i);
    keys.push(...slotKeysForDay(day));
  }
  return keys;
}

/** Todos los tramos del mes natural que contiene la fecha indicada */
export function slotKeysForMonth(monthAnchor: Date): number[] {
  const start = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
  const end = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 0);
  const keys: number[] = [];
  const d = new Date(start);
  while (d <= end) {
    keys.push(...slotKeysForDay(d));
    d.setDate(d.getDate() + 1);
  }
  return keys;
}

export function appointmentEndAt(startAt: Date, durationMinutes: number): Date {
  return new Date(startAt.getTime() + durationMinutes * 60 * 1000);
}

export function appointmentsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/** Cita que solapa un tramo de agenda de 30 min */
export function appointmentOccupiesSlot(
  appointmentStart: Date,
  appointmentEnd: Date,
  slotStart: Date
): boolean {
  const slotEnd = new Date(slotStart.getTime() + SLOT_MINUTES * 60 * 1000);
  return appointmentsOverlap(
    new Date(appointmentStart),
    new Date(appointmentEnd),
    slotStart,
    slotEnd
  );
}

/** Tramos de 30 min cubiertos por [startAt, endAt) */
export function agendaSlotsInRange(startAt: Date, endAt: Date): Date[] {
  const slots: Date[] = [];
  let cur = floorToQuarter(startAt);
  while (cur < endAt) {
    slots.push(new Date(cur));
    cur = new Date(cur.getTime() + SLOT_MINUTES * 60 * 1000);
  }
  return slots;
}

export function normalizeSlotKeys(keys: number[]): Date[] {
  const unique = [...new Set(keys)].map((ms) => floorToQuarter(new Date(ms)));
  for (const d of unique) {
    if (!isValidAgendaSlot(d.getHours(), d.getMinutes())) {
      throw new Error("Franja horaria no válida");
    }
  }
  return unique;
}

export function minAppointmentEnd(
  startAt: Date,
  durationMinutes: number = DEFAULT_APPOINTMENT_DURATION_MINUTES
): Date {
  return appointmentEndAt(startAt, durationMinutes);
}
