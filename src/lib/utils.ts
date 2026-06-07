import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  startOfWeek,
  endOfWeek,
  format,
  parseISO,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export function formatDate(date: Date | string | null | undefined, style: "short" | "long" = "short") {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: style === "long" ? "long" : "2-digit",
    year: "numeric",
  });
}

export function formatTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(date: Date | string) {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/** Fecha y hora elegidas en el formulario de reserva (yyyy-MM-dd + HH:mm). */
export function formatBookingSlotLabel(date: string, time: string) {
  const dayLabel = format(parseISO(date), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  const capitalized = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
  return `${capitalized} a las ${time}`;
}

export function formatCurrency(amount: number | null | undefined) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
}

/** Semana por defecto en agenda: la actual; en fin de semana, la siguiente. */
export function defaultAgendaWeekDate(): Date {
  const now = new Date();
  const day = now.getDay();
  if (day === 0 || day === 6) {
    return addWeeks(startOfWeek(now, { weekStartsOn: 1 }), 1);
  }
  return now;
}

export function getWeekRange(weekParam?: string) {
  const base = weekParam ? parseISO(weekParam) : defaultAgendaWeekDate();
  const start = startOfWeek(base, { weekStartsOn: 1 });
  const end = endOfWeek(base, { weekStartsOn: 1 });
  return { start, end, key: format(start, "yyyy-MM-dd") };
}

export function formatWeekLabel(start: Date) {
  const end = endOfWeek(start, { weekStartsOn: 1 });
  return `${format(start, "d MMM", { locale: es })} – ${format(end, "d MMM yyyy", { locale: es })}`;
}

export function prevWeekKey(key: string) {
  return format(subWeeks(parseISO(key), 1), "yyyy-MM-dd");
}

export function nextWeekKey(key: string) {
  return format(addWeeks(parseISO(key), 1), "yyyy-MM-dd");
}

export function formatMonthKey(date: Date) {
  return format(date, "yyyy-MM");
}

export function prevMonthKey(key: string) {
  return format(subMonths(parseISO(`${key}-01`), 1), "yyyy-MM");
}

export function nextMonthKey(key: string) {
  return format(addMonths(parseISO(`${key}-01`), 1), "yyyy-MM");
}

export const EXPENSE_LABELS: Record<string, string> = {
  SUMINISTROS: "Suministros",
  ALQUILER: "Alquiler",
  MARKETING: "Marketing",
  EQUIPAMIENTO: "Equipamiento",
  PERSONAL: "Personal",
  OTROS: "Otros",
};

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  PENDING_CONFIRMATION: "Pendiente de confirmar",
  SCHEDULED: "Programada",
  CONFIRMED: "Confirmada",
  COMPLETED: "Realizada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No presentado",
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  ISSUED: "Emitida",
  PENDING_PAYMENT: "Pendiente de pago",
  PAID: "Pagada",
  CANCELLED: "Anulada",
};
