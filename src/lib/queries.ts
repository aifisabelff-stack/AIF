import { cache } from "react";
import { ensureDefaultOfferedTherapies } from "@/lib/ensure-offered-therapies";
import { getActiveTherapies, getAllTherapies } from "@/lib/firestore-therapies";
import {
  getAppointmentsInRange,
  getClientAppointments,
  getUpcomingAppointments,
  countUpcomingAppointments,
  getAppointment,
} from "@/lib/firestore-appointments";
import { getBlockedSlotTimesInRange } from "@/lib/firestore-blocked-slots";
import * as firestoreClients from "@/lib/firestore-clients";
import * as firestoreInvoices from "@/lib/firestore-invoices";
import * as firestoreExpenses from "@/lib/firestore-expenses";
import * as firestoreTreatments from "@/lib/firestore-treatments";
import type { ClientStatus, AgendaAppointment } from "@/lib/firestore-types";
import { APPOINTMENT_STATUS_LABELS, defaultAgendaWeekDate } from "@/lib/utils";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  startOfWeek,
  endOfWeek,
  parseISO,
} from "date-fns";

const ensureTherapiesReady = cache(ensureDefaultOfferedTherapies);

function validClientIds(ids: Array<string | null | undefined>): string[] {
  return [...new Set(ids.filter(firestoreClients.isValidClientId))];
}

function filterClientsByQuery(
  clients: Awaited<ReturnType<typeof firestoreClients.getAllClients>>,
  query?: string
) {
  if (!query?.trim()) return clients;
  const q = query.trim().toLowerCase();
  return clients.filter(
    (c) =>
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.dni?.toLowerCase().includes(q) ||
      c.phone?.includes(query.trim()) ||
      c.email?.toLowerCase().includes(q)
  );
}

function mapInvoiceLines(invoice: Awaited<ReturnType<typeof firestoreInvoices.getInvoice>>) {
  if (!invoice) return [];
  return invoice.items.map((item, index) => ({
    id: `${invoice.id}-line-${index}`,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    amount: item.total,
    treatment: null as { name: string } | null,
  }));
}

export async function getDashboardStats() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [total, active, recent, upcomingRaw, monthRevenue, monthExpenses] = await Promise.all([
    firestoreClients.countClients(),
    firestoreClients.countActiveClients(),
    firestoreClients.getRecentClients(5),
    getUpcomingAppointments(30),
    firestoreInvoices.sumInvoicesByStatus("PAID", monthStart, monthEnd),
    firestoreExpenses.sumExpensesInRange(monthStart, monthEnd),
  ]);

  const patientIds = validClientIds(upcomingRaw.map((a) => a.clientId));
  const patients = await firestoreClients.getClientsByIds(patientIds);
  const patientById = new Map(patients.map((p) => [p.id, p]));

  const upcomingAppts = upcomingRaw.slice(0, 5).map((a) => ({
    ...a,
    patientId: a.clientId,
    patient: patientById.get(a.clientId) ?? {
      id: a.clientId,
      firstName: "",
      lastName: "",
    },
  }));

  return {
    total,
    active,
    recent,
    upcomingAppts,
    monthRevenue,
    monthExpenses,
  };
}

export async function searchPatients(query?: string, status?: ClientStatus) {
  let clients = status
    ? await firestoreClients.getClientsByStatus(status)
    : await firestoreClients.getAllClients();

  clients = filterClientsByQuery(clients, query);

  const latestTreatments = await firestoreTreatments.getLatestTreatmentByClientIds(
    clients.map((c) => c.id)
  );

  return clients.map((client) => {
    const latest = latestTreatments.get(client.id);
    return {
      ...client,
      _count: { treatments: latest ? 1 : 0 },
      treatments: latest ? [{ name: latest.name, date: latest.date }] : [],
    };
  });
}

export async function getPatient(id: string) {
  if (!firestoreClients.isValidClientId(id)) return null;

  const client = await firestoreClients.getClient(id);
  if (!client) return null;

  const [appointments, treatments] = await Promise.all([
    getClientAppointments(id),
    firestoreTreatments.getClientTreatments(id),
  ]);

  return {
    ...client,
    visits: [] as never[],
    treatments,
    appointments: appointments.map((a) => ({
      ...a,
      patientId: a.clientId,
      notes: a.notes ?? null,
      offeredTherapy: {
        name: a.therapyName ?? a.title,
        price: a.price ?? null,
      },
    })),
  };
}

export async function getPatientsForSelect() {
  const clients = await firestoreClients.getActiveClients();
  return clients.map(({ id, firstName, lastName }) => ({ id, firstName, lastName }));
}

export async function getOfferedTherapies() {
  await ensureTherapiesReady();
  return getAllTherapies();
}

export async function getActiveOfferedTherapies() {
  await ensureTherapiesReady();
  return getActiveTherapies();
}

/** Recuento de citas por día (yyyy-MM-dd) en un mes, excluye canceladas. */
export async function getMonthAppointmentCounts(monthKey?: string) {
  const base = monthKey ? parseISO(`${monthKey}-01`) : new Date();
  const start = startOfMonth(base);
  const end = endOfMonth(base);

  const rows = await getAppointmentsInRange(start, end);

  const counts: Record<string, number> = {};
  for (const row of rows.filter((a) => a.status !== "CANCELLED")) {
    const dayKey = format(row.startAt, "yyyy-MM-dd");
    counts[dayKey] = (counts[dayKey] ?? 0) + 1;
  }

  return {
    monthKey: format(start, "yyyy-MM"),
    counts,
  };
}

export async function getWeekAppointments(weekKey?: string): Promise<AgendaAppointment[]> {
  const base = weekKey ? parseISO(weekKey) : defaultAgendaWeekDate();
  const start = startOfWeek(base, { weekStartsOn: 1 });
  const end = endOfWeek(base, { weekStartsOn: 1 });

  const appointments = await getAppointmentsInRange(start, end);
  const patientIds = validClientIds(appointments.map((a) => a.clientId));
  const patients = await firestoreClients.getClientsByIds(patientIds);
  const patientById = new Map(patients.map((patient) => [patient.id, patient]));

  return appointments.map((appointment) => ({
    ...appointment,
    patientId: appointment.clientId,
    patient: patientById.get(appointment.clientId) ?? {
      id: appointment.clientId,
      firstName: "",
      lastName: "",
      phone: "",
    },
    treatment: null,
    offeredTherapy: {
      price: appointment.price ?? null,
      name: appointment.therapyName ?? undefined,
    },
    invoice: appointment.invoiceId ? { id: appointment.invoiceId } : null,
  }));
}

export async function getWeekBlockedSlots(weekKey?: string) {
  const base = weekKey ? parseISO(weekKey) : defaultAgendaWeekDate();
  const start = startOfWeek(base, { weekStartsOn: 1 });
  const end = endOfWeek(base, { weekStartsOn: 1 });

  return getBlockedSlotTimesInRange(start, end);
}

export async function getInvoices(status?: string) {
  const invoices = status
    ? await firestoreInvoices.getInvoicesByStatus(
        status as "DRAFT" | "ISSUED" | "PENDING_PAYMENT" | "PAID" | "CANCELLED"
      )
    : await firestoreInvoices.getAllInvoices();

  const patientIds = validClientIds(invoices.map((inv) => inv.clientId));
  const patients = await firestoreClients.getClientsByIds(patientIds);
  const patientById = new Map(patients.map((p) => [p.id, p]));

  return invoices.map((inv) => ({
    ...inv,
    patientId: inv.clientId,
    patient: patientById.get(inv.clientId) ?? {
      id: inv.clientId,
      firstName: "—",
      lastName: "",
    },
    _count: { lines: inv.items.length },
  }));
}

export async function getInvoice(id: string) {
  const invoice = await firestoreInvoices.getInvoice(id);
  if (!invoice) return null;

  const patient = firestoreClients.isValidClientId(invoice.clientId)
    ? await firestoreClients.getClient(invoice.clientId)
    : null;
  let appointment: {
    id: string;
    title: string;
    startAt: Date;
    performedAt: Date | null;
  } | null = null;

  if (invoice.appointmentId) {
    const appt = await getAppointment(invoice.appointmentId);
    if (appt) {
      appointment = {
        id: appt.id,
        title: appt.title,
        startAt: appt.startAt,
        performedAt: appt.performedAt ?? null,
      };
    }
  }

  return {
    ...invoice,
    notes: invoice.notes ?? null,
    patientId: invoice.clientId,
    patient: patient
      ? {
          ...patient,
          dni: patient.dni ?? null,
          email: patient.email ?? null,
          phone: patient.phone ?? null,
        }
      : {
          id: invoice.clientId,
          firstName: "",
          lastName: "",
          dni: null,
          email: null,
          phone: null,
          status: "ACTIVE" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
    lines: mapInvoiceLines(invoice),
    appointment,
  };
}

export async function getExpenses() {
  return firestoreExpenses.getAllExpenses();
}

export async function getStatistics(months = 6) {
  const now = new Date();
  const from = startOfMonth(subMonths(now, months - 1));

  const [invoices, expenses, treatments] = await Promise.all([
    firestoreInvoices.getInvoicesInRange(from, now),
    firestoreExpenses.getExpensesSince(from),
    firestoreTreatments.getTreatmentsSince(from),
  ]);

  const monthKeys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    monthKeys.push(format(startOfMonth(subMonths(now, i)), "yyyy-MM"));
  }

  const monthlyFinance = monthKeys.map((key) => {
    const income = invoices
      .filter((inv) => inv.status === "PAID" && format(inv.date, "yyyy-MM") === key)
      .reduce((s, inv) => s + inv.total, 0);
    const issued = invoices
      .filter((inv) => inv.status === "ISSUED" && format(inv.date, "yyyy-MM") === key)
      .reduce((s, inv) => s + inv.total, 0);
    const expense = expenses
      .filter((e) => format(e.date, "yyyy-MM") === key)
      .reduce((s, e) => s + e.amount, 0);
    const label = format(parseISO(`${key}-01`), "MMM yy");
    return { key, label, income, issued, expense, profit: income - expense };
  });

  const procedureCounts = treatments.reduce<Record<string, { count: number; revenue: number }>>(
    (acc, t) => {
      if (!acc[t.name]) acc[t.name] = { count: 0, revenue: 0 };
      acc[t.name].count += 1;
      acc[t.name].revenue += t.price ?? 0;
      return acc;
    },
    {}
  );

  const topProcedures = Object.entries(procedureCounts)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const expenseByCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  const currentMonth = format(now, "yyyy-MM");
  const cmIncome = invoices
    .filter((i) => i.status === "PAID" && format(i.date, "yyyy-MM") === currentMonth)
    .reduce((s, i) => s + i.total, 0);
  const cmExpenses = expenses
    .filter((e) => format(e.date, "yyyy-MM") === currentMonth)
    .reduce((s, e) => s + e.amount, 0);
  const cmTreatments = treatments.filter((t) => format(t.date, "yyyy-MM") === currentMonth).length;

  const [pendingInvoices, upcomingAppts, invoiceStatusBreakdown] = await Promise.all([
    firestoreInvoices.countInvoicesByStatuses(["ISSUED", "PENDING_PAYMENT"]),
    countUpcomingAppointments(),
    firestoreInvoices.getInvoiceStatusBreakdown(),
  ]);

  return {
    monthlyFinance,
    topProcedures,
    expenseByCategory,
    kpis: {
      monthIncome: cmIncome,
      monthExpenses: cmExpenses,
      monthProfit: cmIncome - cmExpenses,
      monthTreatments: cmTreatments,
      pendingInvoices,
      upcomingAppts,
      totalPaidYtd: invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0),
    },
    invoiceStatusBreakdown,
  };
}

export async function getClientStatistics(months = 6) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const from = startOfMonth(subMonths(now, months - 1));

  const [monthAppointments, rangeAppointments, activePatients, newPatientsMonth] =
    await Promise.all([
      getAppointmentsInRange(monthStart, monthEnd),
      getAppointmentsInRange(from, monthEnd),
      firestoreClients.countActiveClients(),
      firestoreClients.countClientsCreatedBetween(monthStart, monthEnd),
    ]);

  const patientIds = validClientIds(monthAppointments.map((a) => a.clientId));
  const patients = await firestoreClients.getClientsByIds(patientIds);
  const patientById = new Map(patients.map((p) => [p.id, p]));

  const statusCounts: Record<string, number> = {};
  const therapyCounts: Record<string, number> = {};
  const patientApptCounts: Record<string, { count: number; name: string }> = {};
  let webBookings = 0;

  for (const a of monthAppointments) {
    statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;

    const therapyName = a.therapyName ?? a.title;
    therapyCounts[therapyName] = (therapyCounts[therapyName] ?? 0) + 1;

    const pid = a.clientId;
    const patient = patientById.get(pid);
    if (!patientApptCounts[pid]) {
      patientApptCounts[pid] = {
        count: 0,
        name: patient ? `${patient.firstName} ${patient.lastName}`.trim() : "—",
      };
    }
    patientApptCounts[pid].count += 1;

    if (a.notes?.includes("Reserva web")) webBookings += 1;
  }

  const uniqueClients = Object.keys(patientApptCounts).length;
  const recurringClients = Object.values(patientApptCounts).filter((p) => p.count > 1).length;

  const statusBreakdown = Object.entries(statusCounts)
    .map(([status, count]) => ({
      status,
      label: APPOINTMENT_STATUS_LABELS[status] ?? status,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const therapyBreakdown = Object.entries(therapyCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const topClients = Object.entries(patientApptCounts)
    .map(([id, { count, name }]) => ({ id, name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const monthKeys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    monthKeys.push(format(startOfMonth(subMonths(now, i)), "yyyy-MM"));
  }

  const monthlyAppointments = monthKeys.map((key) => {
    const inMonth = rangeAppointments.filter((a) => format(a.startAt, "yyyy-MM") === key);
    return {
      key,
      label: format(parseISO(`${key}-01`), "MMM yy"),
      total: inMonth.length,
      confirmed: inMonth.filter((a) => a.status === "CONFIRMED").length,
      completed: inMonth.filter((a) => a.status === "COMPLETED").length,
      cancelled: inMonth.filter((a) => a.status === "CANCELLED").length,
      pending: inMonth.filter((a) => a.status === "PENDING_CONFIRMATION").length,
    };
  });

  const total = monthAppointments.length;
  const confirmed = statusCounts.CONFIRMED ?? 0;
  const cancelled = statusCounts.CANCELLED ?? 0;
  const pending = statusCounts.PENDING_CONFIRMATION ?? 0;
  const completed = statusCounts.COMPLETED ?? 0;

  return {
    monthKey: format(now, "yyyy-MM"),
    kpis: {
      totalAppointments: total,
      uniqueClients,
      recurringClients,
      newPatientsMonth,
      activePatients,
      pending,
      scheduled: statusCounts.SCHEDULED ?? 0,
      confirmed,
      completed,
      cancelled,
      noShow: statusCounts.NO_SHOW ?? 0,
      webBookings,
      topTherapy: therapyBreakdown[0]?.name ?? null,
      topTherapyCount: therapyBreakdown[0]?.count ?? 0,
      confirmationRate: total > 0 ? Math.round(((confirmed + completed) / total) * 100) : 0,
      cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
    },
    statusBreakdown,
    therapyBreakdown,
    monthlyAppointments,
    topClients,
  };
}

export async function getBillingSummary() {
  const [totalPaid, issuedTotal, pendingTotal, draftCount, totalExpenses] = await Promise.all([
    firestoreInvoices.sumInvoicesByStatus("PAID"),
    firestoreInvoices.sumInvoicesByStatus("ISSUED"),
    firestoreInvoices.sumInvoicesByStatus("PENDING_PAYMENT"),
    firestoreInvoices.countInvoicesWithStatus("DRAFT"),
    firestoreExpenses.sumAllExpenses(),
  ]);

  return {
    totalPaid,
    totalPending: issuedTotal + pendingTotal,
    draftCount,
    totalExpenses,
  };
}
