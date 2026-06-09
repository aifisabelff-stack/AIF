"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { patientSchema, treatmentSchema } from "@/lib/validations";
import * as firestoreClients from "@/lib/firestore-clients";
import * as firestoreTreatments from "@/lib/firestore-treatments";
import { requirePanelSession } from "@/lib/panel-page-auth";

function parseOptionalDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createPatient(formData: FormData) {
  await requirePanelSession();
  const raw = Object.fromEntries(formData);
  const parsed = patientSchema.safeParse({
    ...raw,
    consentSigned: raw.consentSigned === "on" || raw.consentSigned === "true",
  });

  if (!parsed.success) {
    throw new Error("Revise los datos del formulario");
  }

  const data = parsed.data;

  if (data.dni) {
    const existing = await firestoreClients.getClientByDni(data.dni);
    if (existing) throw new Error("Ya existe un paciente con este DNI");
  }

  const patientId = await firestoreClients.createClient({
    firstName: data.firstName,
    lastName: data.lastName,
    dni: data.dni || undefined,
    birthDate: parseOptionalDate(data.birthDate) ?? undefined,
    phone: data.phone || undefined,
    email: data.email || undefined,
    address: data.address || undefined,
    city: data.city || undefined,
    postalCode: data.postalCode || undefined,
    referredBy: data.referredBy || undefined,
    status: data.status,
    notes: data.notes || undefined,
    allergies: data.allergies || undefined,
    medications: data.medications || undefined,
    medicalConditions: data.medicalConditions || undefined,
    skinType: data.skinType || undefined,
    contraindications: data.contraindications || undefined,
    previousTreatments: data.previousTreatments || undefined,
    consentSigned: data.consentSigned ?? false,
    consentDate: parseOptionalDate(data.consentDate) ?? undefined,
  });

  revalidatePath("/");
  revalidatePath("/pacientes");
  redirect(`/pacientes/${patientId}`);
}

export async function updatePatient(id: string, formData: FormData) {
  await requirePanelSession();
  const raw = Object.fromEntries(formData);
  const parsed = patientSchema.safeParse({
    ...raw,
    consentSigned: raw.consentSigned === "on" || raw.consentSigned === "true",
  });

  if (!parsed.success) {
    throw new Error("Revise los datos del formulario");
  }

  const data = parsed.data;

  if (data.dni) {
    const existing = await firestoreClients.getClientByDni(data.dni);
    if (existing && existing.id !== id) {
      throw new Error("Ya existe un paciente con este DNI");
    }
  }

  await firestoreClients.updateClient(id, {
    firstName: data.firstName,
    lastName: data.lastName,
    dni: data.dni || undefined,
    birthDate: parseOptionalDate(data.birthDate) ?? undefined,
    phone: data.phone || undefined,
    email: data.email || undefined,
    address: data.address || undefined,
    city: data.city || undefined,
    postalCode: data.postalCode || undefined,
    referredBy: data.referredBy || undefined,
    status: data.status,
    notes: data.notes || undefined,
    allergies: data.allergies || undefined,
    medications: data.medications || undefined,
    medicalConditions: data.medicalConditions || undefined,
    skinType: data.skinType || undefined,
    contraindications: data.contraindications || undefined,
    previousTreatments: data.previousTreatments || undefined,
    consentSigned: data.consentSigned ?? false,
    consentDate: parseOptionalDate(data.consentDate) ?? undefined,
  });

  revalidatePath("/");
  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${id}`);
  redirect(`/pacientes/${id}`);
}

export async function deletePatient(id: string) {
  await requirePanelSession();
  await firestoreClients.deleteClient(id);
  revalidatePath("/");
  revalidatePath("/pacientes");
  redirect("/pacientes");
}

export async function createTreatment(formData: FormData) {
  await requirePanelSession();
  const raw = Object.fromEntries(formData);
  const parsed = treatmentSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error("Revise los datos del tratamiento");
  }

  const data = parsed.data;

  await firestoreTreatments.createTreatment({
    clientId: data.patientId,
    name: data.name,
    date: parseOptionalDate(data.date) ?? new Date(),
    area: data.area || undefined,
    product: data.product || undefined,
    dosage: data.dosage || undefined,
    notes: data.notes || undefined,
    nextSession: parseOptionalDate(data.nextSession) ?? undefined,
    price: data.price ?? undefined,
  });

  revalidatePath(`/pacientes/${data.patientId}`);
}

export async function deleteTreatment(id: string, patientId: string) {
  await requirePanelSession();
  await firestoreTreatments.deleteTreatment(id);
  revalidatePath(`/pacientes/${patientId}`);
}
