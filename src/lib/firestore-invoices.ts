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
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase-client";
import { Invoice, InvoiceStatus, InvoiceItem } from "./firestore-types";
import {
  asNumber,
  asOptionalString,
  asString,
  clientIdFromDoc,
  FirestorePatch,
  toDate,
  toOptionalDate,
} from "./firestore-utils";

const INVOICES_COLLECTION = "invoices";

function sortByDate(invoices: Invoice[], direction: "asc" | "desc" = "desc") {
  return [...invoices].sort((a, b) => {
    const diff = a.date.getTime() - b.date.getTime();
    return direction === "asc" ? diff : -diff;
  });
}

async function getAllInvoicesUnsorted(): Promise<Invoice[]> {
  const querySnapshot = await getDocs(collection(db, INVOICES_COLLECTION));
  return querySnapshot.docs.map((doc) => firestoreToInvoice(doc.data(), doc.id));
}

// Convertir documento Firestore a Invoice
function firestoreToInvoice(docData: DocumentData, docId: string): Invoice {
  const status = asString(docData.status, "ISSUED") as InvoiceStatus;
  const items = Array.isArray(docData.items) ? (docData.items as InvoiceItem[]) : [];
  return {
    id: docId,
    clientId: clientIdFromDoc(docData),
    appointmentId: asOptionalString(docData.appointmentId),
    number: asString(docData.number),
    date: toDate(docData.date),
    dueDate: toOptionalDate(docData.dueDate),
    status,
    notes: asOptionalString(docData.notes),
    subtotal: asNumber(docData.subtotal, 0) ?? 0,
    taxRate: asNumber(docData.taxRate, 21) ?? 21,
    taxAmount: asNumber(docData.taxAmount, 0) ?? 0,
    total: asNumber(docData.total, 0) ?? 0,
    items,
    createdAt: toDate(docData.createdAt),
    updatedAt: toDate(docData.updatedAt),
  };
}

// Convertir Invoice a formato Firestore
function invoiceToFirestore(invoice: Partial<Invoice>): FirestorePatch {
  const data: FirestorePatch = {};

  if (invoice.clientId !== undefined) data.clientId = invoice.clientId;
  if (invoice.appointmentId !== undefined) data.appointmentId = invoice.appointmentId || null;
  if (invoice.number !== undefined) data.number = invoice.number;
  if (invoice.date !== undefined) data.date = Timestamp.fromDate(new Date(invoice.date));
  if (invoice.dueDate !== undefined) data.dueDate = invoice.dueDate ? Timestamp.fromDate(new Date(invoice.dueDate)) : null;
  if (invoice.status !== undefined) data.status = invoice.status;
  if (invoice.notes !== undefined) data.notes = invoice.notes || null;
  if (invoice.subtotal !== undefined) data.subtotal = invoice.subtotal;
  if (invoice.taxRate !== undefined) data.taxRate = invoice.taxRate;
  if (invoice.taxAmount !== undefined) data.taxAmount = invoice.taxAmount;
  if (invoice.total !== undefined) data.total = invoice.total;
  if (invoice.items !== undefined) data.items = invoice.items;

  return data;
}

/**
 * Crear una nueva factura
 */
export async function createInvoice(
  invoiceData: Omit<Invoice, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const invoiceId = doc(collection(db, INVOICES_COLLECTION)).id;
  const now = Timestamp.now();

  const dataToStore = {
    ...invoiceToFirestore(invoiceData),
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, INVOICES_COLLECTION, invoiceId), dataToStore);
  return invoiceId;
}

/**
 * Obtener factura por ID
 */
export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  const docSnap = await getDoc(doc(db, INVOICES_COLLECTION, invoiceId));
  return docSnap.exists() ? firestoreToInvoice(docSnap.data(), docSnap.id) : null;
}

/**
 * Obtener factura por número
 */
export async function getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
  const q = query(collection(db, INVOICES_COLLECTION), where("number", "==", invoiceNumber));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return null;
  const doc = querySnapshot.docs[0];
  return firestoreToInvoice(doc.data(), doc.id);
}

/**
 * Obtener facturas de un cliente
 */
export async function getClientInvoices(clientId: string): Promise<Invoice[]> {
  const q = query(collection(db, INVOICES_COLLECTION), where("clientId", "==", clientId));
  const querySnapshot = await getDocs(q);
  return sortByDate(
    querySnapshot.docs.map((doc) => firestoreToInvoice(doc.data(), doc.id))
  );
}

export async function getClientInvoicesByStatus(
  clientId: string,
  status: InvoiceStatus
): Promise<Invoice[]> {
  return sortByDate(
    (await getClientInvoices(clientId)).filter((invoice) => invoice.status === status)
  );
}

export async function getPendingInvoices(): Promise<Invoice[]> {
  const pending = new Set<InvoiceStatus>(["ISSUED", "PENDING_PAYMENT"]);
  return sortByDate((await getAllInvoices()).filter((invoice) => pending.has(invoice.status)));
}

export async function getOverdueInvoices(): Promise<Invoice[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pending = new Set<InvoiceStatus>(["ISSUED", "PENDING_PAYMENT"]);

  return sortByDate(
    (await getAllInvoices()).filter(
      (invoice) =>
        pending.has(invoice.status) &&
        invoice.dueDate != null &&
        invoice.dueDate.getTime() < today.getTime()
    )
  );
}

export async function getInvoicesInRange(startDate: Date, endDate: Date): Promise<Invoice[]> {
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  return sortByDate(
    (await getAllInvoices()).filter((invoice) => {
      const ms = invoice.date.getTime();
      return ms >= startMs && ms <= endMs;
    })
  );
}

/**
 * Actualizar factura
 */
export async function updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<void> {
  const dataToUpdate = {
    ...invoiceToFirestore(updates),
    updatedAt: Timestamp.now(),
  };

  await updateDoc(doc(db, INVOICES_COLLECTION, invoiceId), dataToUpdate);
}

/**
 * Cambiar estado de factura
 */
export async function updateInvoiceStatus(invoiceId: string, status: InvoiceStatus): Promise<void> {
  await updateDoc(doc(db, INVOICES_COLLECTION, invoiceId), {
    status,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Marcar factura como pagada
 */
export async function markInvoiceAsPaid(invoiceId: string): Promise<void> {
  await updateDoc(doc(db, INVOICES_COLLECTION, invoiceId), {
    status: "PAID",
    updatedAt: Timestamp.now(),
  });
}

/**
 * Marcar factura como vencida
 */
export async function markInvoiceAsOverdue(invoiceId: string): Promise<void> {
  await updateDoc(doc(db, INVOICES_COLLECTION, invoiceId), {
    status: "PENDING_PAYMENT",
    updatedAt: Timestamp.now(),
  });
}

/**
 * Eliminar factura
 */
export async function deleteInvoice(invoiceId: string): Promise<void> {
  await deleteDoc(doc(db, INVOICES_COLLECTION, invoiceId));
}

/**
 * Obtener todas las facturas
 */
export async function getAllInvoices(): Promise<Invoice[]> {
  return sortByDate(await getAllInvoicesUnsorted());
}

export async function getInvoicesByStatus(status: InvoiceStatus): Promise<Invoice[]> {
  const q = query(collection(db, INVOICES_COLLECTION), where("status", "==", status));
  const querySnapshot = await getDocs(q);
  return sortByDate(
    querySnapshot.docs.map((doc) => firestoreToInvoice(doc.data(), doc.id))
  );
}

/**
 * Generar número de factura IAF-{año}-{secuencia}
 */
export async function generateIafInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `IAF-${year}-`;
  const invoices = await getAllInvoices();
  const last = invoices
    .filter((inv) => inv.number.startsWith(prefix))
    .sort((a, b) => b.number.localeCompare(a.number))[0];
  const seq = last ? parseInt(last.number.split("-").pop() ?? "0", 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

/**
 * Contar facturas por estados
 */
export async function countInvoicesByStatuses(statuses: InvoiceStatus[]): Promise<number> {
  const invoices = await getAllInvoices();
  return invoices.filter((inv) => statuses.includes(inv.status)).length;
}

export async function sumInvoicesByStatus(
  status: InvoiceStatus,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  const invoices = startDate
    ? await getInvoicesInRange(startDate, endDate ?? new Date())
    : await getAllInvoices();
  return invoices
    .filter((inv) => inv.status === status)
    .reduce((sum, inv) => sum + inv.total, 0);
}

export async function countInvoicesWithStatus(status: InvoiceStatus): Promise<number> {
  const q = query(collection(db, INVOICES_COLLECTION), where("status", "==", status));
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

export async function getInvoiceStatusBreakdown(): Promise<
  { status: InvoiceStatus; _count: number; _sum: { total: number } }[]
> {
  const invoices = await getAllInvoices();
  const map = new Map<InvoiceStatus, { count: number; total: number }>();

  for (const inv of invoices) {
    const current = map.get(inv.status) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += inv.total;
    map.set(inv.status, current);
  }

  return Array.from(map.entries()).map(([status, data]) => ({
    status,
    _count: data.count,
    _sum: { total: data.total },
  }));
}

/**
 * Generar número de factura único (formato alternativo)
 */
export async function generateInvoiceNumber(): Promise<string> {
  return generateIafInvoiceNumber();
}

/**
 * Calcular ingresos totales
 */
export async function calculateTotalRevenue(): Promise<number> {
  const q = query(
    collection(db, INVOICES_COLLECTION),
    where("status", "in", ["ISSUED", "PAID"])
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.reduce((total, doc) => {
    return total + (doc.data().total || 0);
  }, 0);
}

/**
 * Calcular ingresos en un rango de fechas
 */
export async function calculateRevenueInRange(startDate: Date, endDate: Date): Promise<number> {
  const invoices = await getInvoicesInRange(startDate, endDate);
  return invoices.reduce((total, invoice) => {
    if (invoice.status === "PAID" || invoice.status === "ISSUED") {
      return total + invoice.total;
    }
    return total;
  }, 0);
}

/**
 * Calcular ingresos por cliente
 */
export async function calculateClientRevenue(clientId: string): Promise<number> {
  const invoices = await getClientInvoices(clientId);
  return invoices.reduce((total, invoice) => {
    if (invoice.status === "PAID" || invoice.status === "ISSUED") {
      return total + invoice.total;
    }
    return total;
  }, 0);
}

/**
 * Contar facturas pagadas
 */
export async function countPaidInvoices(): Promise<number> {
  const q = query(collection(db, INVOICES_COLLECTION), where("status", "==", "PAID"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

/**
 * Contar facturas pendientes
 */
export async function countPendingInvoices(): Promise<number> {
  return countInvoicesByStatuses(["ISSUED", "PENDING_PAYMENT"]);
}
