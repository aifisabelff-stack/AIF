"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildInvoiceEmailHtml } from "@/lib/invoice-email-html";
import { sendMail } from "@/lib/mail";
import { fullName } from "@/lib/utils";
import { invoiceSchema, expenseSchema } from "@/lib/validations";
import * as firestoreInvoices from "@/lib/firestore-invoices";
import * as firestoreExpenses from "@/lib/firestore-expenses";
import * as firestoreClients from "@/lib/firestore-clients";
import * as firestoreAppointments from "@/lib/firestore-appointments";
import { getTherapy } from "@/lib/firestore-therapies";
import type { InvoiceStatus } from "@/lib/firestore-types";
import { requirePanelSession } from "@/lib/panel-page-auth";

function parseOptionalDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createInvoice(formData: FormData) {
  await requirePanelSession();
  const patientId = formData.get("patientId") as string;
  const descriptions = formData.getAll("lineDescription") as string[];
  const quantities = formData.getAll("lineQuantity") as string[];
  const prices = formData.getAll("lineUnitPrice") as string[];

  const lines = descriptions
    .map((description, i) => ({
      description,
      quantity: parseFloat(quantities[i] || "1"),
      unitPrice: parseFloat(prices[i] || "0"),
    }))
    .filter((l) => l.description.trim());

  const parsed = invoiceSchema.safeParse({
    patientId,
    date: formData.get("date"),
    dueDate: formData.get("dueDate"),
    status: formData.get("status"),
    taxRate: formData.get("taxRate"),
    notes: formData.get("notes"),
    lines,
  });

  if (!parsed.success) throw new Error("Revise los datos de la factura");

  const data = parsed.data;
  const subtotal = data.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const taxAmount = subtotal * (data.taxRate / 100);
  const total = subtotal + taxAmount;
  const number = await firestoreInvoices.generateIafInvoiceNumber();

  const invoiceId = await firestoreInvoices.createInvoice({
    clientId: data.patientId,
    number,
    date: parseOptionalDate(data.date) ?? new Date(),
    dueDate: parseOptionalDate(data.dueDate) ?? undefined,
    status: data.status as InvoiceStatus,
    notes: data.notes || undefined,
    subtotal,
    taxRate: data.taxRate,
    taxAmount,
    total,
    items: data.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      total: l.quantity * l.unitPrice,
    })),
  });

  revalidatePath("/facturacion");
  revalidatePath("/estadisticas");
  redirect(`/facturacion/${invoiceId}`);
}

export async function markAppointmentAsPerformed(appointmentId: string) {
  await requirePanelSession();
  const appt = await firestoreAppointments.getAppointment(appointmentId);

  if (!appt) {
    throw new Error("Cita no encontrada");
  }

  if (appt.status !== "CONFIRMED") {
    throw new Error("Solo se pueden marcar como realizadas las citas confirmadas");
  }

  if (appt.invoiceId) {
    throw new Error("Esta cita ya tiene factura asociada");
  }

  const therapy = appt.offeredTherapyId ? await getTherapy(appt.offeredTherapyId) : null;
  const performedAt = new Date();
  const unitPrice = appt.price ?? therapy?.price ?? 0;
  const taxRate = 21;
  const subtotal = unitPrice;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  const number = await firestoreInvoices.generateIafInvoiceNumber();

  const sessionDate = performedAt.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  try {
    const invoiceId = await firestoreInvoices.createInvoice({
      clientId: appt.clientId,
      appointmentId: appt.id,
      number,
      date: performedAt,
      status: "PENDING_PAYMENT",
      notes: `Sesión realizada el ${sessionDate}`,
      subtotal,
      taxRate,
      taxAmount,
      total,
      items: [
        {
          description: appt.title,
          quantity: 1,
          unitPrice,
          total: unitPrice,
        },
      ],
    });

    await firestoreAppointments.updateAppointment(appointmentId, {
      status: "COMPLETED",
      performedAt,
      invoiceId,
    });
  } catch {
    throw new Error("No se pudo registrar la sesión realizada");
  }

  revalidatePath("/agenda");
  revalidatePath("/facturacion");
  revalidatePath("/estadisticas");
  revalidatePath("/panel");
}

export async function updateInvoiceStatus(id: string, status: string) {
  await requirePanelSession();
  await firestoreInvoices.updateInvoiceStatus(id, status as InvoiceStatus);
  revalidatePath("/facturacion");
  revalidatePath(`/facturacion/${id}`);
  revalidatePath("/estadisticas");
}

export async function deleteInvoice(id: string) {
  await requirePanelSession();
  await firestoreInvoices.deleteInvoice(id);
  revalidatePath("/facturacion");
  revalidatePath("/estadisticas");
  redirect("/facturacion");
}

export async function sendInvoiceByEmail(
  invoiceId: string
): Promise<{ success: true; email: string } | { error: string }> {
  await requirePanelSession();
  const invoice = await firestoreInvoices.getInvoice(invoiceId);

  if (!invoice) {
    return { error: "Factura no encontrada" };
  }

  const patient = firestoreClients.isValidClientId(invoice.clientId)
    ? await firestoreClients.getClient(invoice.clientId)
    : null;
  if (!patient) {
    return { error: "Paciente no encontrado" };
  }

  const email = patient.email?.trim();
  if (!email) {
    return {
      error:
        "El paciente no tiene dirección de email en la ficha. Añádala en Pacientes antes de enviar.",
    };
  }

  let appointment: { title: string; performedAt: Date | null } | null = null;
  if (invoice.appointmentId) {
    const appt = await firestoreAppointments.getAppointment(invoice.appointmentId);
    if (appt) {
      appointment = { title: appt.title, performedAt: appt.performedAt ?? null };
    }
  }

  const patientName = fullName(patient.firstName, patient.lastName);
  const html = buildInvoiceEmailHtml(
    {
      number: invoice.number,
      status: invoice.status,
      date: invoice.date,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      notes: invoice.notes ?? null,
      patient: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        dni: patient.dni ?? null,
      },
      lines: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.total,
      })),
      appointment,
    },
    patientName
  );
  const subject = `Factura ${invoice.number} — IAF Aesthetic`;

  const sent = await sendMail({ to: email, subject, html });
  if (!sent.ok) {
    return { error: sent.error };
  }

  return { success: true, email };
}

export async function createExpense(formData: FormData) {
  await requirePanelSession();
  const raw = Object.fromEntries(formData);
  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Revise los datos del gasto");

  const data = parsed.data;
  await firestoreExpenses.createExpense({
    date: parseOptionalDate(data.date) ?? new Date(),
    category: data.category,
    description: data.description,
    amount: data.amount,
    notes: data.notes || undefined,
  });

  revalidatePath("/gastos");
  revalidatePath("/estadisticas");
  redirect("/gastos");
}

export async function deleteExpense(id: string) {
  await requirePanelSession();
  await firestoreExpenses.deleteExpense(id);
  revalidatePath("/gastos");
  revalidatePath("/estadisticas");
}
