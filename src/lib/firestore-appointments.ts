import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase-client";
import { Appointment, AppointmentStatus } from "./firestore-types";
import {
  asNumber,
  asOptionalString,
  asString,
  clientIdFromDoc,
  FirestorePatch,
  toDate,
  toOptionalDate,
} from "./firestore-utils";

const APPOINTMENTS_COLLECTION = "appointments";

function sortByStartAt(appointments: Appointment[], direction: "asc" | "desc" = "asc") {
  return [...appointments].sort((a, b) => {
    const diff = a.startAt.getTime() - b.startAt.getTime();
    return direction === "asc" ? diff : -diff;
  });
}

// Convertir documento Firestore a Appointment
function firestoreToAppointment(docData: DocumentData, docId: string): Appointment {
  const status = asString(docData.status, "SCHEDULED") as AppointmentStatus;
  const therapyId = asOptionalString(docData.therapyId);
  const offeredTherapyId =
    asOptionalString(docData.offeredTherapyId) ?? therapyId ?? null;
  return {
    id: docId,
    clientId: clientIdFromDoc(docData),
    therapyId,
    offeredTherapyId,
    therapyName: asOptionalString(docData.therapyName) ?? null,
    title: asString(docData.title),
    startAt: toDate(docData.startAt),
    endAt: toDate(docData.endAt),
    status,
    notes: asOptionalString(docData.notes),
    confirmedAt: toOptionalDate(docData.confirmedAt),
    performedAt: toOptionalDate(docData.performedAt),
    price: asNumber(docData.price),
    treatmentId: asOptionalString(docData.treatmentId) ?? null,
    invoiceId: asOptionalString(docData.invoiceId) ?? null,
    createdAt: toDate(docData.createdAt),
    updatedAt: toDate(docData.updatedAt),
  };
}

// Convertir Appointment a formato Firestore
function appointmentToFirestore(appointment: Partial<Appointment>): FirestorePatch {
  const data: FirestorePatch = {};

  if (appointment.clientId !== undefined) data.clientId = appointment.clientId;
  if (appointment.offeredTherapyId !== undefined) data.offeredTherapyId = appointment.offeredTherapyId || null;
  if (appointment.therapyId !== undefined && appointment.offeredTherapyId === undefined) {
    data.offeredTherapyId = appointment.therapyId || null;
  }
  if (appointment.therapyName !== undefined) data.therapyName = appointment.therapyName || null;
  if (appointment.title !== undefined) data.title = appointment.title;
  if (appointment.startAt !== undefined) data.startAt = Timestamp.fromDate(new Date(appointment.startAt));
  if (appointment.endAt !== undefined) data.endAt = Timestamp.fromDate(new Date(appointment.endAt));
  if (appointment.status !== undefined) data.status = appointment.status;
  if (appointment.notes !== undefined) data.notes = appointment.notes || null;
  if (appointment.confirmedAt !== undefined) data.confirmedAt = appointment.confirmedAt ? Timestamp.fromDate(new Date(appointment.confirmedAt)) : null;
  if (appointment.performedAt !== undefined) data.performedAt = appointment.performedAt ? Timestamp.fromDate(new Date(appointment.performedAt)) : null;
  if (appointment.price !== undefined) data.price = appointment.price || null;
  if (appointment.treatmentId !== undefined) data.treatmentId = appointment.treatmentId || null;
  if (appointment.invoiceId !== undefined) data.invoiceId = appointment.invoiceId || null;

  return data;
}

/**
 * Crear una nueva cita
 */
export async function createAppointment(appointmentData: Omit<Appointment, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const appointmentId = doc(collection(db, APPOINTMENTS_COLLECTION)).id;
  const now = Timestamp.now();

  const dataToStore = {
    ...appointmentToFirestore(appointmentData),
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, APPOINTMENTS_COLLECTION, appointmentId), dataToStore);
  return appointmentId;
}

/**
 * Obtener cita por ID
 */
export async function getAppointment(appointmentId: string): Promise<Appointment | null> {
  const docSnap = await getDoc(doc(db, APPOINTMENTS_COLLECTION, appointmentId));
  return docSnap.exists() ? firestoreToAppointment(docSnap.data(), docSnap.id) : null;
}

/**
 * Obtener citas de un cliente
 */
export async function getClientAppointments(clientId: string): Promise<Appointment[]> {
  const q = query(
    collection(db, APPOINTMENTS_COLLECTION),
    where("clientId", "==", clientId)
  );
  const querySnapshot = await getDocs(q);
  return sortByStartAt(
    querySnapshot.docs.map((doc) => firestoreToAppointment(doc.data(), doc.id)),
    "desc"
  );
}

export async function getAppointmentsInRange(
  startDate: Date,
  endDate: Date,
  statuses?: AppointmentStatus[]
): Promise<Appointment[]> {
  const q = query(
    collection(db, APPOINTMENTS_COLLECTION),
    where("startAt", ">=", Timestamp.fromDate(startDate)),
    where("startAt", "<=", Timestamp.fromDate(endDate)),
    orderBy("startAt", "asc")
  );

  const querySnapshot = await getDocs(q);
  let appointments = querySnapshot.docs.map((doc) => firestoreToAppointment(doc.data(), doc.id));

  if (statuses?.length) {
    const allowed = new Set(statuses);
    appointments = appointments.filter((a) => allowed.has(a.status));
  }

  return appointments;
}

export async function getAppointmentsByClientIdAndStatuses(
  clientId: string,
  statuses: AppointmentStatus[]
): Promise<Appointment[]> {
  if (statuses.length === 0) return [];

  const q = query(
    collection(db, APPOINTMENTS_COLLECTION),
    where("clientId", "==", clientId)
  );

  const querySnapshot = await getDocs(q);
  const allowed = new Set(statuses);
  return sortByStartAt(
    querySnapshot.docs
      .map((doc) => firestoreToAppointment(doc.data(), doc.id))
      .filter((a) => allowed.has(a.status))
  );
}

/**
 * Obtener citas de un cliente en rango de fechas
 */
export async function getClientAppointmentsInRange(
  clientId: string,
  startDate: Date,
  endDate: Date
): Promise<Appointment[]> {
  const q = query(
    collection(db, APPOINTMENTS_COLLECTION),
    where("clientId", "==", clientId)
  );
  const querySnapshot = await getDocs(q);
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  return sortByStartAt(
    querySnapshot.docs
      .map((doc) => firestoreToAppointment(doc.data(), doc.id))
      .filter((a) => {
        const ms = a.startAt.getTime();
        return ms >= startMs && ms < endMs;
      })
  );
}

/**
 * Obtener citas del día
 */
export async function getAppointmentsForDay(date: Date): Promise<Appointment[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, APPOINTMENTS_COLLECTION),
    where("startAt", ">=", Timestamp.fromDate(startOfDay)),
    where("startAt", "<=", Timestamp.fromDate(endOfDay)),
    orderBy("startAt", "asc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => firestoreToAppointment(doc.data(), doc.id));
}

/**
 * Obtener citas próximas (próximos 7 días)
 */
export async function getUpcomingAppointments(days: number = 7): Promise<Appointment[]> {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const activeStatuses = new Set<AppointmentStatus>([
    "PENDING_CONFIRMATION",
    "SCHEDULED",
    "CONFIRMED",
  ]);

  const appointments = await getAppointmentsInRange(now, futureDate);
  return appointments.filter((a) => activeStatuses.has(a.status));
}

/**
 * Obtener citas completadas de un cliente
 */
export async function getCompletedAppointments(clientId: string): Promise<Appointment[]> {
  const q = query(
    collection(db, APPOINTMENTS_COLLECTION),
    where("clientId", "==", clientId)
  );
  const querySnapshot = await getDocs(q);
  return sortByStartAt(
    querySnapshot.docs
      .map((doc) => firestoreToAppointment(doc.data(), doc.id))
      .filter((a) => a.status === "COMPLETED"),
    "desc"
  );
}

/**
 * Obtener citas por estado
 */
export async function getAppointmentsByStatus(status: AppointmentStatus): Promise<Appointment[]> {
  const q = query(collection(db, APPOINTMENTS_COLLECTION), where("status", "==", status));
  const querySnapshot = await getDocs(q);
  return sortByStartAt(
    querySnapshot.docs.map((doc) => firestoreToAppointment(doc.data(), doc.id))
  );
}

/**
 * Actualizar cita
 */
export async function updateAppointment(appointmentId: string, updates: Partial<Appointment>): Promise<void> {
  const dataToUpdate = {
    ...appointmentToFirestore(updates),
    updatedAt: Timestamp.now(),
  };

  await updateDoc(doc(db, APPOINTMENTS_COLLECTION, appointmentId), dataToUpdate);
}

/**
 * Cambiar estado de cita
 */
export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): Promise<void> {
  const data: FirestorePatch = {
    status,
    updatedAt: Timestamp.now(),
  };

  // Establecer automáticamente confirmadAt cuando se confirma
  if (status === "CONFIRMED" || status === "SCHEDULED") {
    data.confirmedAt = Timestamp.now();
  }

  // Establecer performedAt cuando se completa
  if (status === "COMPLETED") {
    data.performedAt = Timestamp.now();
  }

  await updateDoc(doc(db, APPOINTMENTS_COLLECTION, appointmentId), data);
}

/**
 * Confirmar cita
 */
export async function confirmAppointment(appointmentId: string): Promise<void> {
  await updateDoc(doc(db, APPOINTMENTS_COLLECTION, appointmentId), {
    status: "CONFIRMED",
    confirmedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Cancelar cita
 */
export async function cancelAppointment(appointmentId: string, reason?: string): Promise<void> {
  await updateDoc(doc(db, APPOINTMENTS_COLLECTION, appointmentId), {
    status: "CANCELLED",
    notes: reason || "",
    updatedAt: Timestamp.now(),
  });
}

/**
 * Marcar cita como completada
 */
export async function completeAppointment(appointmentId: string): Promise<void> {
  await updateDoc(doc(db, APPOINTMENTS_COLLECTION, appointmentId), {
    status: "COMPLETED",
    performedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Eliminar cita
 */
export async function deleteAppointment(appointmentId: string): Promise<void> {
  await deleteDoc(doc(db, APPOINTMENTS_COLLECTION, appointmentId));
}

/**
 * Contar citas de un cliente
 */
export async function countClientAppointments(clientId: string): Promise<number> {
  const q = query(collection(db, APPOINTMENTS_COLLECTION), where("clientId", "==", clientId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

/**
 * Contar citas completadas de un cliente
 */
export async function countCompletedAppointments(clientId: string): Promise<number> {
  const q = query(
    collection(db, APPOINTMENTS_COLLECTION),
    where("clientId", "==", clientId),
    where("status", "==", "COMPLETED")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

export async function countUpcomingAppointments(): Promise<number> {
  const now = new Date();
  const appointments = await getAppointmentsInRange(
    now,
    new Date(now.getFullYear() + 1, 11, 31),
    ["PENDING_CONFIRMATION", "SCHEDULED", "CONFIRMED"]
  );
  return appointments.length;
}
