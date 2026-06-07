import {
  collection,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase-client";

const BLOCKED_SLOTS_COLLECTION = "blockedSlots";

function blockedSlotDocId(startAt: Date) {
  return startAt.getTime().toString();
}

function blockedSlotToFirestore(startAt: Date) {
  return { startAt: Timestamp.fromDate(startAt) };
}

export async function getBlockedSlotTimesInRange(
  start: Date,
  end: Date
): Promise<number[]> {
  const q = query(
    collection(db, BLOCKED_SLOTS_COLLECTION),
    where("startAt", ">=", Timestamp.fromDate(start)),
    where("startAt", "<=", Timestamp.fromDate(end)),
    orderBy("startAt", "asc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((docSnap) => docSnap.data().startAt?.toDate?.()?.getTime() ?? 0);
}

export async function getBlockedSlotTimes(startAtMsList: number[]): Promise<number[]> {
  if (startAtMsList.length === 0) return [];
  const results: number[] = [];
  await Promise.all(
    startAtMsList.map(async (startAtMs) => {
      const docRef = doc(db, BLOCKED_SLOTS_COLLECTION, startAtMs.toString());
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        results.push(startAtMs);
      }
    })
  );
  return results;
}

export async function isBlockedSlot(startAt: Date): Promise<boolean> {
  const docRef = doc(db, BLOCKED_SLOTS_COLLECTION, blockedSlotDocId(startAt));
  const snap = await getDoc(docRef);
  return snap.exists();
}

export async function createBlockedSlots(startAtMsList: number[]): Promise<void> {
  if (startAtMsList.length === 0) return;
  await Promise.all(
    startAtMsList.map(async (startAtMs) => {
      const startAt = new Date(startAtMs);
      const docRef = doc(db, BLOCKED_SLOTS_COLLECTION, startAtMs.toString());
      await setDoc(docRef, blockedSlotToFirestore(startAt));
    })
  );
}

export async function deleteBlockedSlots(startAtMsList: number[]): Promise<void> {
  if (startAtMsList.length === 0) return;
  await Promise.all(
    startAtMsList.map(async (startAtMs) => {
      await deleteDoc(doc(db, BLOCKED_SLOTS_COLLECTION, startAtMs.toString()));
    })
  );
}
