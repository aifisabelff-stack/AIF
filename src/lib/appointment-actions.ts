"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  agendaSlotsInRange,
  appointmentEndAt,
  appointmentsOverlap,
  durationMinutesFromValue,
} from "@/lib/agenda-slots";
import { bookingDateInWindow, bookingWindowError } from "@/lib/booking-window";
import { parseAgendaDate, schedulableDayError } from "@/lib/holidays";
import { clinicDateTimeToUtc } from "@/lib/clinic-timezone";
import {
  appointmentSchema,
  appointmentUpdateSchema,
  publicBookingSchema,
} from "@/lib/validations";
import * as appointments from "@/lib/firestore-appointments";
import { getTherapy } from "@/lib/firestore-therapies";
import { isBlockedSlot } from "@/lib/firestore-blocked-slots";
import * as firestoreClients from "@/lib/firestore-clients";

type ApptStatus =
  | "PENDING_CONFIRMATION"
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

const ACTIVE_STATUSES = [
  "PENDING_CONFIRMATION",
  "SCHEDULED",
  "CONFIRMED",
  "COMPLETED",
  "NO_SHOW",
] as const;

function bookingPatientLastName(lastName: string, secondLastName?: string) {
  return [lastName.trim(), secondLastName?.trim() ?? ""].filter(Boolean).join(" ");
}

function confirmedAtForStatus(
  status: ApptStatus,
  existingConfirmedAt: Date | null | undefined
): Date | null | undefined {
  if (status === "CONFIRMED") {
    return existingConfirmedAt ?? new Date();
  }
  if (status === "PENDING_CONFIRMATION") {
    return null;
  }
  return undefined;
}

function combineDateTime(date: string, time: string) {
  return clinicDateTimeToUtc(date, time);
}

function resolveAppointmentTimes(
  date: string,
  startTime: string,
  durationValue: string
) {
  const minutes = durationMinutesFromValue(durationValue);
  if (!minutes) {
    throw new Error("Duración no válida");
  }
  const startAt = combineDateTime(date, startTime);
  const endAt = appointmentEndAt(startAt, minutes);
  return { startAt, endAt, minutes };
}

async function assertAppointmentSlotFree(
  startAt: Date,
  endAt: Date,
  date: string,
  excludeAppointmentId?: string
) {
  for (const slot of agendaSlotsInRange(startAt, endAt)) {
    if (await isBlockedSlot(slot)) {
      throw new Error("Ese horario está bloqueado como no disponible");
    }
  }

  const sameDay = await appointments.getAppointmentsForDay(new Date(date));
  const activeAppointments = sameDay.filter(
    (appointment) =>
      appointment.status !== "CANCELLED" &&
      appointment.id !== excludeAppointmentId
  );

  if (
    activeAppointments.some((a) =>
      appointmentsOverlap(startAt, endAt, a.startAt, a.endAt)
    )
  ) {
    throw new Error("Ya hay una cita en ese horario");
  }
}

async function resolveActiveTherapy(therapyId: string) {
  const therapy = await getTherapy(therapyId);
  if (!therapy) {
    throw new Error("Terapia no válida");
  }
  if (!therapy.active) {
    throw new Error("Esa terapia no está disponible actualmente");
  }
  return therapy;
}

export async function createAppointment(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = appointmentSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Revise los datos de la cita");

  const data = parsed.data;
  const dayError = schedulableDayError(parseAgendaDate(data.date));
  if (dayError) throw new Error(dayError);

  const { startAt, endAt } = resolveAppointmentTimes(
    data.date,
    data.startTime,
    data.durationMinutes
  );
  await assertAppointmentSlotFree(startAt, endAt, data.date);

  const therapy = await resolveActiveTherapy(data.therapyId);

  if (!data.patientId?.trim()) {
    throw new Error("Seleccione un paciente");
  }

  const status = data.status as ApptStatus;
  await appointments.createAppointment({
    clientId: data.patientId.trim(),
    treatmentId: data.treatmentId || null,
    offeredTherapyId: therapy.id,
    therapyName: therapy.name,
    title: therapy.name,
    startAt,
    endAt,
    notes: data.notes || undefined,
    status,
    confirmedAt: confirmedAtForStatus(status, null) ?? undefined,
  });

  revalidatePath("/agenda");
  revalidatePath("/");
  redirect("/agenda");
}

/** Alta de cita desde el calendario (modal, sin redirección) */
export async function createAppointmentModal(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = appointmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Revise los datos de la cita" };
  }

  const data = parsed.data;
  const allowNonSchedulable = raw.allowNonSchedulableDay === "1";
  if (!allowNonSchedulable) {
    const dayError = schedulableDayError(parseAgendaDate(data.date));
    if (dayError) return { error: dayError };
  }

  let startAt: Date;
  let endAt: Date;
  try {
    ({ startAt, endAt } = resolveAppointmentTimes(
      data.date,
      data.startTime,
      data.durationMinutes
    ));
    await assertAppointmentSlotFree(startAt, endAt, data.date);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Horario no válido" };
  }

  let therapy;
  try {
    therapy = await resolveActiveTherapy(data.therapyId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Terapia no válida" };
  }

  if (!data.patientId?.trim()) {
    return { error: "Seleccione un paciente" };
  }

  const status = data.status as ApptStatus;
  try {
    await appointments.createAppointment({
      clientId: data.patientId.trim(),
      treatmentId: data.treatmentId || null,
      offeredTherapyId: therapy.id,
      therapyName: therapy.name,
      title: therapy.name,
      startAt,
      endAt,
      notes: data.notes || undefined,
      status,
      confirmedAt: confirmedAtForStatus(status, null) ?? undefined,
    });
  } catch {
    return { error: "No se pudo guardar la cita" };
  }

  revalidatePath("/agenda");
  revalidatePath("/panel");
  return { success: true as const };
}

/** Modificación de cita desde el calendario (modal, sin redirección) */
export async function updateAppointmentModal(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = appointmentUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Revise los datos de la cita" };
  }

  const data = parsed.data;
  const existing = await appointments.getAppointment(data.appointmentId);
  if (!existing) {
    return { error: "Cita no encontrada" };
  }
  if (existing.status === "COMPLETED") {
    return { error: "Las citas realizadas no se pueden cambiar" };
  }

  const allowNonSchedulable = raw.allowNonSchedulableDay === "1";
  if (!allowNonSchedulable) {
    const dayError = schedulableDayError(parseAgendaDate(data.date));
    if (dayError) return { error: dayError };
  }

  let startAt: Date;
  let endAt: Date;
  try {
    ({ startAt, endAt } = resolveAppointmentTimes(
      data.date,
      data.startTime,
      data.durationMinutes
    ));
    await assertAppointmentSlotFree(
      startAt,
      endAt,
      data.date,
      data.appointmentId
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Horario no válido" };
  }

  let therapy;
  try {
    therapy = await getTherapy(data.therapyId);
    if (!therapy) throw new Error("Terapia no válida");
    if (!therapy.active && therapy.id !== existing.offeredTherapyId) {
      throw new Error("Esa terapia no está disponible actualmente");
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Terapia no válida" };
  }

  if (!data.patientId?.trim()) {
    return { error: "Seleccione un paciente" };
  }

  const status = data.status as ApptStatus;
  const confirmedAt = confirmedAtForStatus(status, existing.confirmedAt);
  try {
    await appointments.updateAppointment(data.appointmentId, {
      clientId: data.patientId.trim(),
      treatmentId: data.treatmentId || null,
      offeredTherapyId: therapy.id,
      therapyName: therapy.name,
      title: therapy.name,
      startAt,
      endAt,
      notes: data.notes || undefined,
      status,
      ...(confirmedAt != null ? { confirmedAt } : {}),
    });
  } catch {
    return { error: "No se pudo actualizar la cita" };
  }

  revalidatePath("/agenda");
  revalidatePath("/panel");
  return { success: true as const };
}

export async function createPublicBooking(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = publicBookingSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: "Revise los datos del formulario" };
  }

  const data = parsed.data;
  const dayError = schedulableDayError(parseAgendaDate(data.date));
  if (dayError) return { error: dayError };

  if (!bookingDateInWindow(data.date)) {
    return { error: bookingWindowError() };
  }

  let startAt: Date;
  let endAt: Date;
  try {
    ({ startAt, endAt } = resolveAppointmentTimes(
      data.date,
      data.time,
      data.durationMinutes
    ));
    if (startAt < new Date()) {
      return { error: "La fecha y hora deben ser futuras" };
    }
    await assertAppointmentSlotFree(startAt, endAt, data.date);
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Ese horario no está disponible",
    };
  }

  let therapy;
  try {
    therapy = await resolveActiveTherapy(data.therapyId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Terapia no válida" };
  }

  let patientId: string;
  let bookingNote: string;

  if (data.clientType === "existing") {
    if (!data.patientId) {
      return { error: "Seleccione un cliente existente." };
    }
    const existing = await firestoreClients.getActiveClient(data.patientId);
    if (!existing) {
      return { error: "Cliente no encontrado. Busque de nuevo o elija «Nuevo cliente»." };
    }
    patientId = existing.id;
    bookingNote = `Reserva web (cliente existente).${
      existing.email ? ` Email: ${existing.email}` : ""
    }`;
  } else {
    const firstName = data.firstName!.trim();
    const lastName = bookingPatientLastName(data.lastName!, data.secondLastName);
    const phone = data.phone?.trim() || null;
    const email = data.email?.trim() || null;

    let patient = await firestoreClients.findClientByContact(phone, email);

    if (!patient) {
      patientId = await firestoreClients.createClient({
        firstName,
        lastName,
        phone: phone ?? undefined,
        email: email ?? undefined,
        notes: "Alta desde reserva web",
        referredBy: "Web — Reserva online",
        status: "ACTIVE",
      });
      patient = (await firestoreClients.getClient(patientId))!;
    } else {
      await firestoreClients.updateClient(patient.id, {
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
        firstName: patient.firstName || firstName,
        lastName: patient.lastName === "Web" ? lastName : patient.lastName,
      });
      patientId = patient.id;
    }
    const contactParts = [
      email ? `Email: ${email}` : null,
      phone ? `Tel: ${phone}` : null,
    ].filter(Boolean);
    bookingNote = `Reserva web.${contactParts.length ? ` ${contactParts.join(" · ")}` : ""}`;
  }

  await appointments.createAppointment({
    clientId: patientId,
    offeredTherapyId: therapy.id,
    therapyName: therapy.name,
    title: therapy.name,
    startAt,
    endAt,
    status: "PENDING_CONFIRMATION",
    notes: bookingNote,
  });

  revalidatePath("/agenda");
  revalidatePath("/");
  revalidatePath("/panel");

  return { success: true as const };
}

export async function updateAppointmentStatus(id: string, status: string) {
  const nextStatus = status as ApptStatus;
  await appointments.updateAppointmentStatus(id, nextStatus);
  revalidatePath("/agenda");
  revalidatePath("/panel");
}

export async function deleteAppointment(id: string) {
  const existing = await appointments.getAppointment(id);
  if (!existing) {
    throw new Error("Cita no encontrada");
  }
  if (existing.status === "COMPLETED") {
    throw new Error("Las citas realizadas no se pueden eliminar");
  }
  await appointments.deleteAppointment(id);
  revalidatePath("/agenda");
}

/** Borrado de cita desde modal (sin redirección) */
export async function deleteAppointmentModal(id: string) {
  try {
    const existing = await appointments.getAppointment(id);
    if (!existing) {
      return { error: "Cita no encontrada" };
    }
    if (existing.status === "COMPLETED") {
      return { error: "Las citas realizadas no se pueden eliminar" };
    }
    await appointments.deleteAppointment(id);
  } catch {
    return { error: "No se pudo eliminar la cita" };
  }
  revalidatePath("/agenda");
  revalidatePath("/panel");
  return { success: true as const };
}
