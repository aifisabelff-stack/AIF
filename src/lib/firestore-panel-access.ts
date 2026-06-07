import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase-client";
import { PanelAccessConfig } from "./firestore-types";
import { PANEL_CONFIG_ID } from "./panel-auth-shared";

const COLLECTION = "panelAccessConfig";

function firestoreToConfig(docData: Record<string, unknown>, docId: string): PanelAccessConfig {
  return {
    id: docId,
    enabled: (docData.enabled as boolean) ?? false,
    passwordHash: (docData.passwordHash as string | null | undefined) ?? null,
    updatedAt: (docData.updatedAt as { toDate?: () => Date })?.toDate?.() ?? new Date(),
  };
}

export async function getPanelAccessConfig(): Promise<PanelAccessConfig> {
  const ref = doc(db, COLLECTION, PANEL_CONFIG_ID);
  const docSnap = await getDoc(ref);

  if (!docSnap.exists()) {
    const now = Timestamp.now();
    const defaults = { enabled: false, passwordHash: null, updatedAt: now };
    await setDoc(ref, defaults);
    return firestoreToConfig(defaults, PANEL_CONFIG_ID);
  }

  const cfg = firestoreToConfig(docSnap.data(), docSnap.id);

  if (cfg.enabled && !cfg.passwordHash) {
    await updateDoc(ref, { enabled: false, updatedAt: Timestamp.now() });
    return { ...cfg, enabled: false };
  }

  return cfg;
}

export async function updatePanelAccessConfig(
  updates: Partial<Pick<PanelAccessConfig, "enabled" | "passwordHash">>
): Promise<PanelAccessConfig> {
  const ref = doc(db, COLLECTION, PANEL_CONFIG_ID);
  const data: Record<string, unknown> = { updatedAt: Timestamp.now() };

  if (updates.enabled !== undefined) data.enabled = updates.enabled;
  if (updates.passwordHash !== undefined) data.passwordHash = updates.passwordHash;

  await setDoc(ref, data, { merge: true });
  return getPanelAccessConfig();
}
