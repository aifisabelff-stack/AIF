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
import { Therapy } from "./firestore-types";
import {
  asBoolean,
  asNumber,
  asString,
  FirestorePatch,
  toDate,
} from "./firestore-utils";

const THERAPIES_COLLECTION = "therapies";

// Convertir documento Firestore a Therapy
function firestoreToTherapy(docData: DocumentData, docId: string): Therapy {
  const price = asNumber(docData.price);
  return {
    id: docId,
    name: asString(docData.name),
    active: asBoolean(docData.active, true),
    price: price ?? null,
    duration: asNumber(docData.duration),
    sortOrder: asNumber(docData.sortOrder, 0) ?? 0,
    createdAt: toDate(docData.createdAt),
    updatedAt: toDate(docData.updatedAt),
  };
}

// Convertir Therapy a formato Firestore
function therapyToFirestore(therapy: Partial<Therapy>): FirestorePatch {
  const data: FirestorePatch = {};

  if (therapy.name !== undefined) data.name = therapy.name;
  if (therapy.active !== undefined) data.active = therapy.active;
  if (therapy.price !== undefined) data.price = therapy.price || null;
  if (therapy.duration !== undefined) data.duration = therapy.duration || null;
  if (therapy.sortOrder !== undefined) data.sortOrder = therapy.sortOrder || 0;

  return data;
}

/**
 * Crear nueva terapia
 */
export async function createTherapy(therapyData: Omit<Therapy, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const therapyId = doc(collection(db, THERAPIES_COLLECTION)).id;
  const now = Timestamp.now();

  const dataToStore = {
    ...therapyToFirestore(therapyData),
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, THERAPIES_COLLECTION, therapyId), dataToStore);
  return therapyId;
}

/**
 * Obtener terapia por ID
 */
export async function getTherapy(therapyId: string): Promise<Therapy | null> {
  const docSnap = await getDoc(doc(db, THERAPIES_COLLECTION, therapyId));
  return docSnap.exists() ? firestoreToTherapy(docSnap.data(), docSnap.id) : null;
}

/**
 * Obtener todas las terapias activas
 */
export async function getActiveTherapies(): Promise<Therapy[]> {
  const q = query(collection(db, THERAPIES_COLLECTION), where("active", "==", true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map((doc) => firestoreToTherapy(doc.data(), doc.id))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Obtener todas las terapias
 */
export async function getAllTherapies(): Promise<Therapy[]> {
  const q = query(
    collection(db, THERAPIES_COLLECTION),
    orderBy("sortOrder", "asc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => firestoreToTherapy(doc.data(), doc.id));
}

/**
 * Obtener terapia por nombre
 */
export async function getTherapyByName(name: string): Promise<Therapy | null> {
  const q = query(collection(db, THERAPIES_COLLECTION), where("name", "==", name));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return null;
  const doc = querySnapshot.docs[0];
  return firestoreToTherapy(doc.data(), doc.id);
}

export async function getTherapiesByNames(names: string[]): Promise<Therapy[]> {
  if (names.length === 0) return [];

  if (names.length <= 10) {
    const q = query(collection(db, THERAPIES_COLLECTION), where("name", "in", names));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docSnap) => firestoreToTherapy(docSnap.data(), docSnap.id));
  }

  const results: Therapy[] = [];
  for (const name of names) {
    const therapy = await getTherapyByName(name);
    if (therapy) results.push(therapy);
  }
  return results;
}

/**
 * Actualizar terapia
 */
export async function updateTherapy(therapyId: string, updates: Partial<Therapy>): Promise<void> {
  const dataToUpdate = {
    ...therapyToFirestore(updates),
    updatedAt: Timestamp.now(),
  };

  await updateDoc(doc(db, THERAPIES_COLLECTION, therapyId), dataToUpdate);
}

/**
 * Activar/Desactivar terapia
 */
export async function toggleTherapyActive(therapyId: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, THERAPIES_COLLECTION, therapyId), {
    active,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Eliminar terapia
 */
export async function deleteTherapy(therapyId: string): Promise<void> {
  await deleteDoc(doc(db, THERAPIES_COLLECTION, therapyId));
}

/**
 * Reordenar terapias
 */
export async function reorderTherapy(therapyId: string, newSortOrder: number): Promise<void> {
  await updateDoc(doc(db, THERAPIES_COLLECTION, therapyId), {
    sortOrder: newSortOrder,
    updatedAt: Timestamp.now(),
  });
}
