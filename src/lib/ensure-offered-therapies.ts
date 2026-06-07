import {
  collection,
  doc,
  getDocs,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase-client";
import { DEFAULT_OFFERED_THERAPIES } from "@/lib/therapies";
import { asNumber, asString } from "./firestore-utils";

const THERAPIES_COLLECTION = "therapies";
const DEFAULT_NAMES = DEFAULT_OFFERED_THERAPIES.map((t) => t.name);

/** Evita repetir la comprobación en la misma ventana de tiempo (mismo proceso Node). */
let lastSyncAt = 0;
const SYNC_TTL_MS = 120_000;

function catalogMatchesDb(rows: { name: string; sortOrder: number }[]) {
  const byName = new Map(rows.map((r) => [r.name, r]));
  if (rows.some((r) => !DEFAULT_NAMES.includes(r.name))) return false;
  return DEFAULT_OFFERED_THERAPIES.every((item) => {
    const row = byName.get(item.name);
    return row && row.sortOrder === item.sortOrder;
  });
}

/** Sincroniza el catálogo con Firestore solo cuando falta algo o cambió el catálogo. */
export async function ensureDefaultOfferedTherapies() {
  if (Date.now() - lastSyncAt < SYNC_TTL_MS) return;

  const snapshot = await getDocs(collection(db, THERAPIES_COLLECTION));
  const rows = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return { id: docSnap.id, name: asString(data.name), sortOrder: asNumber(data.sortOrder, 0) ?? 0 };
  });

  if (catalogMatchesDb(rows)) {
    lastSyncAt = Date.now();
    return;
  }

  const batch = writeBatch(db);
  const existingByName = new Map(rows.map((r) => [r.name, r]));
  const now = Timestamp.now();

  for (const docSnap of snapshot.docs) {
    const name = asString(docSnap.data().name);
    if (!DEFAULT_NAMES.includes(name)) {
      batch.delete(doc(db, THERAPIES_COLLECTION, docSnap.id));
    }
  }

  for (const item of DEFAULT_OFFERED_THERAPIES) {
    const existing = existingByName.get(item.name);
    if (existing) {
      batch.update(doc(db, THERAPIES_COLLECTION, existing.id), {
        sortOrder: item.sortOrder,
      });
    } else {
      const therapyRef = doc(collection(db, THERAPIES_COLLECTION));
      batch.set(therapyRef, {
        name: item.name,
        sortOrder: item.sortOrder,
        active: true,
        price: item.price,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  await batch.commit();
  lastSyncAt = Date.now();
}
