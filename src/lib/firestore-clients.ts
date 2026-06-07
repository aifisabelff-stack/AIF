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
import { Client, ClientStatus } from "./firestore-types";
import {
  asBoolean,
  asNumber,
  asOptionalString,
  asString,
  FirestorePatch,
  toDate,
  toOptionalDate,
} from "./firestore-utils";

const CLIENTS_COLLECTION = "clients";

export function isValidClientId(clientId: string | null | undefined): clientId is string {
  if (typeof clientId !== "string") return false;
  const id = clientId.trim();
  return id.length > 0 && !id.includes("/") && id !== CLIENTS_COLLECTION;
}

function clientDocRef(clientId: string) {
  if (!isValidClientId(clientId)) {
    throw new Error(`ID de cliente no válido: ${String(clientId)}`);
  }
  return doc(db, CLIENTS_COLLECTION, clientId.trim());
}

// Convertir documento Firestore a Cliente
function firestoreToClient(docData: DocumentData, docId: string): Client {
  const status = asString(docData.status, "ACTIVE") as ClientStatus;
  return {
    id: docId,
    firstName: asString(docData.firstName),
    lastName: asString(docData.lastName),
    email: asOptionalString(docData.email),
    phone: asOptionalString(docData.phone),
    dni: asOptionalString(docData.dni),
    birthDate: toOptionalDate(docData.birthDate),
    address: asOptionalString(docData.address),
    city: asOptionalString(docData.city),
    postalCode: asOptionalString(docData.postalCode),
    referredBy: asOptionalString(docData.referredBy),
    status,
    notes: asOptionalString(docData.notes),
    allergies: asOptionalString(docData.allergies),
    medications: asOptionalString(docData.medications),
    medicalConditions: asOptionalString(docData.medicalConditions),
    skinType: asOptionalString(docData.skinType),
    contraindications: asOptionalString(docData.contraindications),
    previousTreatments: asOptionalString(docData.previousTreatments),
    consentSigned: asBoolean(docData.consentSigned),
    consentDate: toOptionalDate(docData.consentDate),
    createdAt: toDate(docData.createdAt),
    updatedAt: toDate(docData.updatedAt),
    totalVisits: asNumber(docData.totalVisits, 0),
    lastVisit: toOptionalDate(docData.lastVisit),
    totalSpent: asNumber(docData.totalSpent, 0),
  };
}

// Convertir Cliente a formato Firestore
function clientToFirestore(client: Partial<Client>): FirestorePatch {
  const data: FirestorePatch = {};

  if (client.firstName !== undefined) data.firstName = client.firstName;
  if (client.lastName !== undefined) data.lastName = client.lastName;
  if (client.email !== undefined) data.email = client.email || null;
  if (client.phone !== undefined) data.phone = client.phone || null;
  if (client.dni !== undefined) data.dni = client.dni || null;
  if (client.birthDate !== undefined) data.birthDate = client.birthDate ? Timestamp.fromDate(new Date(client.birthDate)) : null;
  if (client.address !== undefined) data.address = client.address || null;
  if (client.city !== undefined) data.city = client.city || null;
  if (client.postalCode !== undefined) data.postalCode = client.postalCode || null;
  if (client.status !== undefined) data.status = client.status;
  if (client.notes !== undefined) data.notes = client.notes || null;
  if (client.allergies !== undefined) data.allergies = client.allergies || null;
  if (client.medications !== undefined) data.medications = client.medications || null;
  if (client.medicalConditions !== undefined) data.medicalConditions = client.medicalConditions || null;
  if (client.skinType !== undefined) data.skinType = client.skinType || null;
  if (client.contraindications !== undefined) data.contraindications = client.contraindications || null;
  if (client.previousTreatments !== undefined) data.previousTreatments = client.previousTreatments || null;
  if (client.referredBy !== undefined) data.referredBy = client.referredBy || null;
  if (client.consentSigned !== undefined) data.consentSigned = client.consentSigned;
  if (client.consentDate !== undefined) {
    data.consentDate = client.consentDate ? Timestamp.fromDate(new Date(client.consentDate)) : null;
  }

  return data;
}

/**
 * Crear un nuevo cliente
 */
export async function createClient(clientData: Omit<Client, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const clientId = doc(collection(db, CLIENTS_COLLECTION)).id;
  const now = Timestamp.now();

  const dataToStore = {
    ...clientToFirestore(clientData),
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(clientDocRef(clientId), dataToStore);
  return clientId;
}

/**
 * Obtener cliente por ID
 */
export async function getClient(clientId: string): Promise<Client | null> {
  if (!isValidClientId(clientId)) return null;
  const docSnap = await getDoc(clientDocRef(clientId));
  return docSnap.exists() ? firestoreToClient(docSnap.data(), docSnap.id) : null;
}

export async function getClientsByIds(clientIds: string[]): Promise<Client[]> {
  const validIds = [...new Set(clientIds.filter(isValidClientId))];
  if (validIds.length === 0) return [];

  const clients: Client[] = [];
  await Promise.all(
    validIds.map(async (clientId) => {
      const docSnap = await getDoc(clientDocRef(clientId));
      if (docSnap.exists()) {
        clients.push(firestoreToClient(docSnap.data(), docSnap.id));
      }
    })
  );

  return clients;
}

/**
 * Obtener todos los clientes activos
 */
export async function getActiveClients(): Promise<Client[]> {
  const q = query(collection(db, CLIENTS_COLLECTION), where("status", "==", "ACTIVE"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map((doc) => firestoreToClient(doc.data(), doc.id))
    .sort((a, b) => {
      const last = a.lastName.localeCompare(b.lastName, "es");
      return last !== 0 ? last : a.firstName.localeCompare(b.firstName, "es");
    });
}

/**
 * Buscar clientes por nombre o email
 */
export async function searchClients(searchTerm: string): Promise<Client[]> {
  const lowerSearch = searchTerm.toLowerCase();
  const clients = await getActiveClients();

  return clients.filter(
    (client) =>
      client.firstName.toLowerCase().includes(lowerSearch) ||
      client.lastName.toLowerCase().includes(lowerSearch) ||
      client.email?.toLowerCase().includes(lowerSearch) ||
      client.phone?.includes(searchTerm)
  );
}

/**
 * Obtener clientes por estado
 */
export async function getClientsByStatus(status: ClientStatus): Promise<Client[]> {
  const q = query(collection(db, CLIENTS_COLLECTION), where("status", "==", status));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map((doc) => firestoreToClient(doc.data(), doc.id))
    .sort((a, b) => {
      const last = a.lastName.localeCompare(b.lastName, "es");
      return last !== 0 ? last : a.firstName.localeCompare(b.firstName, "es");
    });
}

/**
 * Actualizar cliente
 */
export async function updateClient(clientId: string, updates: Partial<Client>): Promise<void> {
  const dataToUpdate = {
    ...clientToFirestore(updates),
    updatedAt: Timestamp.now(),
  };

  await updateDoc(clientDocRef(clientId), dataToUpdate);
}

export async function updateClientStatus(clientId: string, status: ClientStatus): Promise<void> {
  await updateDoc(clientDocRef(clientId), {
    status,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Actualizar estadísticas del cliente
 */
export async function updateClientStats(
  clientId: string,
  updates: {
    totalVisits?: number;
    lastVisit?: Date;
    totalSpent?: number;
  }
): Promise<void> {
  const data: FirestorePatch = { updatedAt: Timestamp.now() };

  if (updates.totalVisits !== undefined) data.totalVisits = updates.totalVisits;
  if (updates.lastVisit !== undefined) data.lastVisit = Timestamp.fromDate(updates.lastVisit);
  if (updates.totalSpent !== undefined) data.totalSpent = updates.totalSpent;

  await updateDoc(clientDocRef(clientId), data);
}

export async function deleteClient(clientId: string): Promise<void> {
  await deleteDoc(clientDocRef(clientId));
}

/**
 * Obtener cliente por DNI
 */
export async function getClientByDni(dni: string): Promise<Client | null> {
  const q = query(collection(db, CLIENTS_COLLECTION), where("dni", "==", dni));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return null;
  const doc = querySnapshot.docs[0];
  return firestoreToClient(doc.data(), doc.id);
}

/**
 * Obtener cliente por email
 */
export async function getClientByEmail(email: string): Promise<Client | null> {
  const q = query(collection(db, CLIENTS_COLLECTION), where("email", "==", email));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return null;
  const doc = querySnapshot.docs[0];
  return firestoreToClient(doc.data(), doc.id);
}

/**
 * Contar clientes activos
 */
export async function countActiveClients(): Promise<number> {
  const q = query(collection(db, CLIENTS_COLLECTION), where("status", "==", "ACTIVE"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

export async function countClients(): Promise<number> {
  const querySnapshot = await getDocs(collection(db, CLIENTS_COLLECTION));
  return querySnapshot.size;
}

export async function countClientsByStatus(status: ClientStatus): Promise<number> {
  const q = query(collection(db, CLIENTS_COLLECTION), where("status", "==", status));
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

export async function getAllClients(): Promise<Client[]> {
  const querySnapshot = await getDocs(collection(db, CLIENTS_COLLECTION));
  return querySnapshot.docs
    .map((d) => firestoreToClient(d.data(), d.id))
    .sort((a, b) => {
      const last = a.lastName.localeCompare(b.lastName, "es");
      if (last !== 0) return last;
      return a.firstName.localeCompare(b.firstName, "es");
    });
}

export async function getRecentClients(limitCount = 5): Promise<Client[]> {
  const clients = await getAllClients();
  return clients
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limitCount);
}

export async function countClientsCreatedBetween(start: Date, end: Date): Promise<number> {
  const clients = await getAllClients();
  return clients.filter((c) => c.createdAt >= start && c.createdAt <= end).length;
}

export async function findClientByContact(
  phone?: string | null,
  email?: string | null
): Promise<Client | null> {
  if (email) {
    const byEmail = await getClientByEmail(email);
    if (byEmail) return byEmail;
  }
  if (phone) {
    const clients = await getAllClients();
    return clients.find((c) => c.phone === phone) ?? null;
  }
  return null;
}

export async function getActiveClient(clientId: string): Promise<Client | null> {
  const client = await getClient(clientId);
  if (!client || client.status !== "ACTIVE") return null;
  return client;
}
