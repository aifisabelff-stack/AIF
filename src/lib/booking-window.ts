import {
  addMonths,
  endOfMonth,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";

/** Mes en curso más los 2 siguientes (3 meses en total). */
export const BOOKING_VISIBLE_MONTH_COUNT = 3;

export function getBookingWindowBounds() {
  const now = new Date();
  const firstMonth = startOfMonth(now);
  const lastMonth = startOfMonth(
    addMonths(now, BOOKING_VISIBLE_MONTH_COUNT - 1)
  );
  const lastDay = endOfMonth(lastMonth);
  return { firstMonth, lastMonth, lastDay };
}

export function clampBookingViewMonth(month: Date): Date {
  const { firstMonth, lastMonth } = getBookingWindowBounds();
  const m = startOfMonth(month);
  if (isBefore(m, firstMonth)) return firstMonth;
  if (isAfter(m, lastMonth)) return lastMonth;
  return m;
}

export function canGoPrevBookingMonth(viewMonth: Date): boolean {
  return startOfMonth(viewMonth) > getBookingWindowBounds().firstMonth;
}

export function canGoNextBookingMonth(viewMonth: Date): boolean {
  return startOfMonth(viewMonth) < getBookingWindowBounds().lastMonth;
}

export function bookingMonthInWindow(year: number, month: number): boolean {
  const m = startOfMonth(new Date(year, month - 1, 1));
  const { firstMonth, lastMonth } = getBookingWindowBounds();
  return !isBefore(m, firstMonth) && !isAfter(m, lastMonth);
}

export function bookingDateInWindow(dateStr: string): boolean {
  const d = startOfDay(parseISO(dateStr));
  const { firstMonth, lastDay } = getBookingWindowBounds();
  return !isBefore(d, firstMonth) && !isAfter(d, lastDay);
}

export function bookingWindowError(): string {
  const { firstMonth, lastDay } = getBookingWindowBounds();
  return `Solo puede reservar entre ${firstMonth.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  })} y ${lastDay.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;
}
