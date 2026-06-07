import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase-client";
import { MonthlyStats } from "./firestore-types";
import * as appointments from "./firestore-appointments";
import * as invoices from "./firestore-invoices";
import * as clients from "./firestore-clients";
import { asNumber, asString, FirestorePatch } from "./firestore-utils";

const STATS_COLLECTION = "stats";

// Convertir documento Firestore a MonthlyStats
function firestoreToStats(docData: DocumentData): MonthlyStats {
  const byTherapy =
    docData.byTherapy && typeof docData.byTherapy === "object" && !Array.isArray(docData.byTherapy)
      ? (docData.byTherapy as MonthlyStats["byTherapy"])
      : {};
  return {
    month: asString(docData.month),
    totalRevenue: asNumber(docData.totalRevenue, 0) ?? 0,
    totalAppointments: asNumber(docData.totalAppointments, 0) ?? 0,
    completedAppointments: asNumber(docData.completedAppointments, 0) ?? 0,
    cancelledAppointments: asNumber(docData.cancelledAppointments, 0) ?? 0,
    newClients: asNumber(docData.newClients, 0) ?? 0,
    byTherapy,
  };
}

/**
 * Obtener estadísticas de un mes
 * Formato: "YYYY-MM" (ej: "2026-06")
 */
export async function getMonthlyStats(month: string): Promise<MonthlyStats | null> {
  const docSnap = await getDoc(doc(db, STATS_COLLECTION, month));
  return docSnap.exists() ? firestoreToStats(docSnap.data()) : null;
}

/**
 * Calcular y guardar estadísticas mensuales
 */
export async function calculateAndSaveMonthlyStats(month: string): Promise<MonthlyStats> {
  const [year, monthNum] = month.split("-").map(Number);
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0, 23, 59, 59);

  // Obtener citas del mes
  const allAppointments = await appointments.getUpcomingAppointments(365); // Buffer grande
  const monthAppointments = allAppointments.filter((apt) => {
    const aptDate = new Date(apt.startAt);
    return aptDate >= startDate && aptDate <= endDate;
  });

  // Obtener facturas del mes
  const monthInvoices = await invoices.getInvoicesInRange(startDate, endDate);

  // Calcular estadísticas
  const completedCount = monthAppointments.filter((apt) => apt.status === "COMPLETED").length;
  const cancelledCount = monthAppointments.filter((apt) => apt.status === "CANCELLED").length;

  // Ingresos totales
  const totalRevenue = monthInvoices.reduce((sum, inv) => {
    if (inv.status === "PAID" || inv.status === "ISSUED") {
      return sum + inv.total;
    }
    return sum;
  }, 0);

  // Ingresos por terapia
  const byTherapy: Record<string, { revenue: number; count: number }> = {};
  monthAppointments.forEach((apt) => {
    const therapyName = apt.therapyName || "Sin especificar";
    if (!byTherapy[therapyName]) {
      byTherapy[therapyName] = { revenue: 0, count: 0 };
    }
    byTherapy[therapyName].count++;
    if (apt.price) {
      byTherapy[therapyName].revenue += apt.price;
    }
  });

  // Clientes nuevos del mes
  const activeClients = await clients.getActiveClients();
  const newClientsCount = activeClients.filter((client) => {
    const clientDate = new Date(client.createdAt);
    return clientDate >= startDate && clientDate <= endDate;
  }).length;

  const stats: MonthlyStats = {
    month,
    totalRevenue,
    totalAppointments: monthAppointments.length,
    completedAppointments: completedCount,
    cancelledAppointments: cancelledCount,
    newClients: newClientsCount,
    byTherapy,
  };

  // Guardar estadísticas
  await setDoc(doc(db, STATS_COLLECTION, month), stats);

  return stats;
}

/**
 * Obtener estadísticas de un rango de meses
 */
export async function getMonthlyStatsRange(startMonth: string, endMonth: string): Promise<MonthlyStats[]> {
  const [startYear, startMonthNum] = startMonth.split("-").map(Number);
  const [endYear, endMonthNum] = endMonth.split("-").map(Number);

  const stats: MonthlyStats[] = [];
  let currentYear = startYear;
  let currentMonth = startMonthNum;

  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonthNum)) {
    const monthStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
    const monthlyStat = await getMonthlyStats(monthStr);

    if (monthlyStat) {
      stats.push(monthlyStat);
    }

    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }

  return stats;
}

/**
 * Obtener estadísticas generales del año actual
 */
export async function getCurrentYearStats(): Promise<{
  totalRevenue: number;
  totalAppointments: number;
  completedAppointments: number;
  newClients: number;
  monthlyStats: MonthlyStats[];
}> {
  const year = new Date().getFullYear();
  const startMonth = `${year}-01`;
  const endMonth = `${year}-12`;

  const monthlyStats = await getMonthlyStatsRange(startMonth, endMonth);

  const totals = {
    totalRevenue: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    newClients: 0,
    monthlyStats,
  };

  monthlyStats.forEach((stat) => {
    totals.totalRevenue += stat.totalRevenue;
    totals.totalAppointments += stat.totalAppointments;
    totals.completedAppointments += stat.completedAppointments;
    totals.newClients += stat.newClients;
  });

  return totals;
}

/**
 * Obtener top terapias por ingresos
 */
export async function getTopTherapiesByRevenue(month: string, limit: number = 5): Promise<Array<{
  name: string;
  revenue: number;
  count: number;
}>> {
  const stat = await getMonthlyStats(month);
  if (!stat) return [];

  return Object.entries(stat.byTherapy)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/**
 * Obtener tasa de cancelación de citas
 */
export async function getCancellationRate(month: string): Promise<number> {
  const stat = await getMonthlyStats(month);
  if (!stat || stat.totalAppointments === 0) return 0;

  return (stat.cancelledAppointments / stat.totalAppointments) * 100;
}

/**
 * Obtener tasa de finalización de citas
 */
export async function getCompletionRate(month: string): Promise<number> {
  const stat = await getMonthlyStats(month);
  if (!stat || stat.totalAppointments === 0) return 0;

  return (stat.completedAppointments / stat.totalAppointments) * 100;
}

/**
 * Obtener ingresos promedio por cita
 */
export async function getAverageRevenuePerAppointment(month: string): Promise<number> {
  const stat = await getMonthlyStats(month);
  if (!stat || stat.totalAppointments === 0) return 0;

  return stat.totalRevenue / stat.totalAppointments;
}

/**
 * Obtener comparación con mes anterior
 */
export async function getMonthComparison(currentMonth: string): Promise<{
  current: MonthlyStats | null;
  previous: MonthlyStats | null;
  revenueChange: number;
  appointmentChange: number;
}> {
  const [year, monthNum] = currentMonth.split("-").map(Number);

  let prevYear = year;
  let prevMonth = monthNum - 1;

  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear--;
  }

  const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;

  const current = await getMonthlyStats(currentMonth);
  const previous = await getMonthlyStats(prevMonthStr);

  return {
    current,
    previous,
    revenueChange: current ? (previous ? current.totalRevenue - previous.totalRevenue : current.totalRevenue) : 0,
    appointmentChange: current ? (previous ? current.totalAppointments - previous.totalAppointments : current.totalAppointments) : 0,
  };
}

/**
 * Actualizar estadísticas mensuales (para ajustes manuales)
 */
export async function updateMonthlyStats(month: string, updates: Partial<MonthlyStats>): Promise<void> {
  const docRef = doc(db, STATS_COLLECTION, month);
  const data: FirestorePatch = {};

  if (updates.totalRevenue !== undefined) data.totalRevenue = updates.totalRevenue;
  if (updates.totalAppointments !== undefined) data.totalAppointments = updates.totalAppointments;
  if (updates.completedAppointments !== undefined) data.completedAppointments = updates.completedAppointments;
  if (updates.cancelledAppointments !== undefined) data.cancelledAppointments = updates.cancelledAppointments;
  if (updates.newClients !== undefined) data.newClients = updates.newClients;
  if (updates.byTherapy !== undefined) data.byTherapy = updates.byTherapy;

  await updateDoc(docRef, data);
}
