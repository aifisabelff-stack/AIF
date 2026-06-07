import { format, subDays } from "date-fns";

export type DayKind = "weekday" | "weekend" | "holiday";

/** Domingo de Pascua (calendario gregoriano) */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function holidayDatesForYear(year: number): Map<string, string> {
  const easter = easterSunday(year);
  const goodFriday = subDays(easter, 2);

  const entries: [Date, string][] = [
    [new Date(year, 0, 1), "Año Nuevo"],
    [new Date(year, 0, 6), "Reyes"],
    [goodFriday, "Viernes Santo"],
    [new Date(year, 4, 1), "Fiesta del Trabajo"],
    [new Date(year, 7, 15), "Asunción"],
    [new Date(year, 9, 12), "Fiesta Nacional"],
    [new Date(year, 10, 1), "Todos los Santos"],
    [new Date(year, 11, 6), "Constitución"],
    [new Date(year, 11, 8), "Inmaculada"],
    [new Date(year, 11, 25), "Navidad"],
  ];

  const map = new Map<string, string>();
  for (const [date, name] of entries) {
    map.set(format(date, "yyyy-MM-dd"), name);
  }
  return map;
}

const cache = new Map<number, Map<string, string>>();

function holidaysInYear(year: number) {
  if (!cache.has(year)) cache.set(year, holidayDatesForYear(year));
  return cache.get(year)!;
}

export function getHolidayName(date: Date): string | null {
  const key = format(date, "yyyy-MM-dd");
  return holidaysInYear(date.getFullYear()).get(key) ?? null;
}

export function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6;
}

export function getDayKind(date: Date): DayKind {
  if (getHolidayName(date)) return "holiday";
  if (isWeekend(date)) return "weekend";
  return "weekday";
}

/** Días laborables en los que se pueden asignar citas por defecto (reserva web, etc.) */
export function isSchedulableDay(date: Date): boolean {
  return getDayKind(date) === "weekday";
}

/** Fin de semana o festivo: en agenda, no disponible por defecto en modo bloqueo */
export function isNonSchedulableDay(date: Date): boolean {
  return !isSchedulableDay(date);
}

export function parseAgendaDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function schedulableDayError(date: Date): string | null {
  const holiday = getHolidayName(date);
  if (holiday) {
    return `No se pueden asignar citas en festivo (${holiday})`;
  }
  if (isWeekend(date)) {
    return "No se pueden asignar citas en fin de semana";
  }
  return null;
}
