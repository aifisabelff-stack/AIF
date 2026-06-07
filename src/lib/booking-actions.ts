"use server";

import { revalidatePath } from "next/cache";
import {
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { CancellableAppointmentHit } from "@/lib/booking-types";
import { appendClientCancellationNote } from "@/lib/client-cancellation";
import { fullName } from "@/lib/utils";
import {
  availableDaysInMonth,
  availableWeekSchedule,
  BOOKING_ACTIVE_STATUSES,
  parseDurationMinutes,
} from "@/lib/booking-availability";
import {
  agendaSlotsInRange,
  appointmentEndAt,
  appointmentsOverlap,
  durationMinutesFromValue,
  floorToQuarter,
} from "@/lib/agenda-slots";
import { parseAgendaDate, schedulableDayError } from "@/lib/holidays";
import { bookingDateInWindow, bookingMonthInWindow, bookingWindowError } from "@/lib/booking-window";
import { searchPatients } from "@/lib/queries";
import * as appointments from "@/lib/firestore-appointments";
import { getBlockedSlotTimesInRange } from "@/lib/firestore-blocked-slots";

const BOOKING_ACTIVE_STATUSES_FOR_SLOTS = [
  "PENDING_CONFIRMATION",
  "SCHEDULED",
  "CONFIRMED",
  "COMPLETED",
  "NO_SHOW",
] as const;

function combineDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

async function assertBookingSlotFree(
  startAt: Date,
  endAt: Date,
  date: string,
  excludeAppointmentId?: string
) {
  for (const slot of agendaSlotsInRange(startAt, endAt)) {
    const blocked = await getBlockedSlotTimesInRange(slot, slot);
    if (blocked.length > 0) {
      throw new Error("Ese horario está bloqueado como no disponible");
    }
  }

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const sameDay = await appointments.getAppointmentsInRange(
    dayStart,
    dayEnd,
    [...BOOKING_ACTIVE_STATUSES_FOR_SLOTS]
  );

  const activeAppointments = sameDay.filter(
    (appointment) => appointment.id !== excludeAppointmentId
  );

  if (
    activeAppointments.some((a) =>
      appointmentsOverlap(startAt, endAt, a.startAt, a.endAt)
    )
  ) {
    throw new Error("Ya hay una cita en ese horario");
  }
}

async function loadBookingData(rangeStart: Date, rangeEnd: Date) {
  const [appointmentRange, blocked] = await Promise.all([
    appointments.getAppointmentsInRange(rangeStart, rangeEnd, [
      ...BOOKING_ACTIVE_STATUSES,
    ]),
    getBlockedSlotTimesInRange(rangeStart, rangeEnd),
  ]);

  const blockedMs = new Set(
    blocked.map((startAtMs) => floorToQuarter(new Date(startAtMs)).getTime())
  );

  return {
    appointments: appointmentRange.map((a) => ({
      startAt: a.startAt,
      endAt: a.endAt,
    })),
    blockedMs,
  };
}

export async function getBookingMonthAvailability(
  year: number,
  month: number,
  durationMinutes: string
) {
  const mins = parseDurationMinutes(durationMinutes);
  if (!mins) return { availableDays: [] as string[] };

  if (!bookingMonthInWindow(year, month)) {
    return { availableDays: [] as string[] };
  }

  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(start);
  const { appointments, blockedMs } = await loadBookingData(start, end);

  const availableDays = availableDaysInMonth(
    year,
    month,
    mins,
    appointments,
    blockedMs
  );

  return { availableDays };
}

export async function getBookingWeekAvailability(
  weekStartKey: string,
  durationMinutes: string
) {
  const mins = parseDurationMinutes(durationMinutes);
  if (!mins) return { days: [] as ReturnType<typeof availableWeekSchedule> };

  const weekStart = startOfWeek(parseISO(weekStartKey), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const { appointments, blockedMs } = await loadBookingData(weekStart, weekEnd);

  const days = availableWeekSchedule(
    format(weekStart, "yyyy-MM-dd"),
    mins,
    appointments,
    blockedMs
  ).map((d) => {
    if (!bookingDateInWindow(d.date)) {
      return { ...d, slots: [], hasSlots: false };
    }
    return d;
  });

  return { days };
}

const CANCELLABLE_STATUSES = [
  "PENDING_CONFIRMATION",
  "SCHEDULED",
  "CONFIRMED",
] as const;

export type { CancellableAppointmentHit } from "@/lib/booking-types";

export async function searchAppointmentsToCancelByName(query: string) {
  const q = query.trim();
  if (q.length < 2) return [] as CancellableAppointmentHit[];

  const patients = await searchPatients(q, "ACTIVE");
  if (patients.length === 0) return [];

  const patientIds = patients.map((p) => p.id);
  const now = new Date();
  const appointmentsByPatient = await Promise.all(
    patientIds.map((patientId) =>
      appointments.getAppointmentsByClientIdAndStatuses(
        patientId,
        [...CANCELLABLE_STATUSES]
      )
    )
  );

  const appointmentsToCancel = appointmentsByPatient.flat();
  const filteredAppointments = appointmentsToCancel.filter((a) =>
    patientIds.includes(a.clientId) && a.startAt >= now
  );

  return filteredAppointments.map((a) => ({
    id: a.id,
    title: a.title,
    startAt: a.startAt.toISOString(),
    patientName: fullName(
      patients.find((p) => p.id === a.clientId)?.firstName ?? "",
      patients.find((p) => p.id === a.clientId)?.lastName ?? ""
    ),
    phone: patients.find((p) => p.id === a.clientId)?.phone,
    status: a.status,
  }));
}

export async function cancelAppointmentByClient(appointmentId: string) {
  if (!appointmentId?.trim()) {
    return { error: "Seleccione una cita" };
  }

  const appt = await appointments.getAppointment(appointmentId);

  if (!appt) {
    return { error: "Cita no encontrada" };
  }

  if (appt.status === "CANCELLED") {
    return { error: "Esta cita ya está anulada" };
  }

  if (
    !CANCELLABLE_STATUSES.includes(
      appt.status as (typeof CANCELLABLE_STATUSES)[number]
    )
  ) {
    return { error: "Esta cita no se puede anular desde la web" };
  }

  if (appt.startAt < new Date()) {
    return { error: "No se pueden anular citas que ya han pasado" };
  }

  try {
    await appointments.updateAppointment(appointmentId, {
      status: "CANCELLED",
      notes: appendClientCancellationNote(appt.notes),
    });
  } catch {
    return { error: "No se pudo anular la cita" };
  }

  revalidatePath("/agenda");
  revalidatePath("/");
  revalidatePath("/estadisticas");
  revalidatePath("/panel");

  return { success: true as const };
}

export async function rescheduleAppointmentByClient(
  appointmentId: string,
  date: string,
  time: string,
  durationMinutes: string
) {
  if (!appointmentId?.trim()) {
    return { error: "Seleccione una cita" };
  }

  const mins = durationMinutesFromValue(durationMinutes);
  if (!mins) {
    return { error: "Duración no válida" };
  }

  const dayError = schedulableDayError(parseAgendaDate(date));
  if (dayError) return { error: dayError };

  if (!bookingDateInWindow(date)) {
    return { error: bookingWindowError() };
  }

  const appt = await appointments.getAppointment(appointmentId);

  if (!appt) {
    return { error: "Cita no encontrada" };
  }

  if (
    !CANCELLABLE_STATUSES.includes(
      appt.status as (typeof CANCELLABLE_STATUSES)[number]
    )
  ) {
    return { error: "Esta cita no se puede modificar desde la web" };
  }

  if (appt.startAt < new Date()) {
    return { error: "No se pueden modificar citas que ya han pasado" };
  }

  const startAt = combineDateTime(date, time);
  const endAt = appointmentEndAt(startAt, mins);

  if (startAt < new Date()) {
    return { error: "La fecha y hora deben ser futuras" };
  }

  try {
    await assertBookingSlotFree(startAt, endAt, date, appointmentId);
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Ese horario no está disponible",
    };
  }

  const rescheduleNote = "Cambio de fecha solicitado por cliente (web)";
  const notes = appt.notes?.includes(rescheduleNote)
    ? appt.notes
    : appt.notes?.trim()
      ? `${appt.notes.trim()}\n${rescheduleNote}`
      : rescheduleNote;

  try {
    await appointments.updateAppointment(appointmentId, {
      startAt,
      endAt,
      status: "PENDING_CONFIRMATION",
      notes,
    });
  } catch {
    return { error: "No se pudo cambiar la cita" };
  }

  revalidatePath("/agenda");
  revalidatePath("/");
  revalidatePath("/estadisticas");
  revalidatePath("/panel");

  return { success: true as const };
}

export async function searchPatientsForBooking(query: string) {
  const q = query.trim();
  if (q.length < 2) return [];

  const patients = await searchPatients(q, "ACTIVE");

  return patients.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    phone: p.phone,
    email: p.email,
  }));
}
