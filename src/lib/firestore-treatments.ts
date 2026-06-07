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
import { Treatment } from "./firestore-types";
import {
  asNumber,
  asOptionalString,
  asString,
  FirestorePatch,
  toDate,
  toOptionalDate,
} from "./firestore-utils";

const TREATMENTS_COLLECTION = "treatments";

function sortByDate(treatments: Treatment[], direction: "asc" | "desc" = "desc") {
  return [...treatments].sort((a, b) => {
    const diff = a.date.getTime() - b.date.getTime();
    return direction === "asc" ? diff : -diff;
  });
}

async function getTreatmentsByClientId(clientId: string): Promise<Treatment[]> {
  const q = query(collection(db, TREATMENTS_COLLECTION), where("clientId", "==", clientId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => firestoreToTreatment(doc.data(), doc.id));
}

// Convertir documento Firestore a Treatment
function firestoreToTreatment(docData: DocumentData, docId: string): Treatment {
  return {
    id: docId,
    clientId: asString(docData.clientId),
    name: asString(docData.name),
    area: asOptionalString(docData.area),
    product: asOptionalString(docData.product),
    dosage: asOptionalString(docData.dosage),
    date: toDate(docData.date),
    notes: asOptionalString(docData.notes),
    nextSession: toOptionalDate(docData.nextSession),
    price: asNumber(docData.price),
    createdAt: toDate(docData.createdAt),
    updatedAt: toDate(docData.updatedAt),
  };
}

// Convertir Treatment a formato Firestore
function treatmentToFirestore(treatment: Partial<Treatment>): FirestorePatch {
  const data: FirestorePatch = {};

  if (treatment.clientId !== undefined) data.clientId = treatment.clientId;
  if (treatment.name !== undefined) data.name = treatment.name;
  if (treatment.area !== undefined) data.area = treatment.area || null;
  if (treatment.product !== undefined) data.product = treatment.product || null;
  if (treatment.dosage !== undefined) data.dosage = treatment.dosage || null;
  if (treatment.date !== undefined) data.date = Timestamp.fromDate(new Date(treatment.date));
  if (treatment.notes !== undefined) data.notes = treatment.notes || null;
  if (treatment.nextSession !== undefined) data.nextSession = treatment.nextSession ? Timestamp.fromDate(new Date(treatment.nextSession)) : null;
  if (treatment.price !== undefined) data.price = treatment.price || null;

  return data;
}

/**
 * Crear un nuevo tratamiento
 */
export async function createTreatment(treatmentData: Omit<Treatment, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const treatmentId = doc(collection(db, TREATMENTS_COLLECTION)).id;
  const now = Timestamp.now();

  const dataToStore = {
    ...treatmentToFirestore(treatmentData),
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, TREATMENTS_COLLECTION, treatmentId), dataToStore);
  return treatmentId;
}

/**
 * Obtener tratamiento por ID
 */
export async function getTreatment(treatmentId: string): Promise<Treatment | null> {
  const docSnap = await getDoc(doc(db, TREATMENTS_COLLECTION, treatmentId));
  return docSnap.exists() ? firestoreToTreatment(docSnap.data(), docSnap.id) : null;
}

/**
 * Obtener todos los tratamientos de un cliente
 */
export async function getClientTreatments(clientId: string): Promise<Treatment[]> {
  return sortByDate(await getTreatmentsByClientId(clientId));
}

export async function getClientTreatmentsInRange(
  clientId: string,
  startDate: Date,
  endDate: Date
): Promise<Treatment[]> {
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  return sortByDate(
    (await getTreatmentsByClientId(clientId)).filter((t) => {
      const ms = t.date.getTime();
      return ms >= startMs && ms <= endMs;
    })
  );
}

export async function getClientTreatmentsByName(
  clientId: string,
  treatmentName: string
): Promise<Treatment[]> {
  return sortByDate(
    (await getTreatmentsByClientId(clientId)).filter((t) => t.name === treatmentName)
  );
}

export async function getTreatmentsWithNextSession(clientId: string): Promise<Treatment[]> {
  return (await getTreatmentsByClientId(clientId))
    .filter((t) => t.nextSession != null)
    .sort((a, b) => (a.nextSession?.getTime() ?? 0) - (b.nextSession?.getTime() ?? 0));
}

export async function getRecentClientTreatments(clientId: string, days: number = 30): Promise<Treatment[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startMs = startDate.getTime();

  return sortByDate(
    (await getTreatmentsByClientId(clientId)).filter((t) => t.date.getTime() >= startMs)
  );
}

/**
 * Obtener tratamientos desde una fecha (estadísticas)
 */
export async function getTreatmentsSince(startDate: Date): Promise<Treatment[]> {
  const q = query(
    collection(db, TREATMENTS_COLLECTION),
    where("date", ">=", Timestamp.fromDate(startDate))
  );
  const querySnapshot = await getDocs(q);
  return sortByDate(
    querySnapshot.docs.map((doc) => firestoreToTreatment(doc.data(), doc.id))
  );
}

/**
 * Obtener el tratamiento más reciente por cliente
 */
export async function getLatestTreatmentByClientIds(
  clientIds: string[]
): Promise<Map<string, Treatment>> {
  const map = new Map<string, Treatment>();
  if (clientIds.length === 0) return map;

  await Promise.all(
    clientIds.map(async (clientId) => {
      const treatments = await getClientTreatments(clientId);
      if (treatments[0]) map.set(clientId, treatments[0]);
    })
  );

  return map;
}

/**
 * Actualizar tratamiento
 */
export async function updateTreatment(treatmentId: string, updates: Partial<Treatment>): Promise<void> {
  const dataToUpdate = {
    ...treatmentToFirestore(updates),
    updatedAt: Timestamp.now(),
  };

  await updateDoc(doc(db, TREATMENTS_COLLECTION, treatmentId), dataToUpdate);
}

/**
 * Programar próxima sesión de tratamiento
 */
export async function scheduleTreatmentFollowUp(treatmentId: string, nextSessionDate: Date): Promise<void> {
  await updateDoc(doc(db, TREATMENTS_COLLECTION, treatmentId), {
    nextSession: Timestamp.fromDate(nextSessionDate),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Eliminar tratamiento
 */
export async function deleteTreatment(treatmentId: string): Promise<void> {
  await deleteDoc(doc(db, TREATMENTS_COLLECTION, treatmentId));
}

/**
 * Contar tratamientos de un cliente
 */
export async function countClientTreatments(clientId: string): Promise<number> {
  const q = query(collection(db, TREATMENTS_COLLECTION), where("clientId", "==", clientId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

/**
 * Obtener ingresos totales por tratamientos de un cliente
 */
export async function getTotalTreatmentRevenue(clientId: string): Promise<number> {
  const q = query(collection(db, TREATMENTS_COLLECTION), where("clientId", "==", clientId));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.reduce((total, doc) => {
    const price = doc.data().price || 0;
    return total + price;
  }, 0);
}

/**
 * Obtener tipos de tratamientos únicos de un cliente
 */
export async function getClientUniqueTreatmentNames(clientId: string): Promise<string[]> {
  const treatments = sortByDate(await getTreatmentsByClientId(clientId));
  const uniqueNames = new Set<string>();
  for (const treatment of treatments) {
    if (treatment.name) uniqueNames.add(treatment.name);
  }
  return Array.from(uniqueNames);
}
