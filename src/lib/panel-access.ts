import { getPanelAccessConfig as getFirestorePanelAccessConfig } from "@/lib/firestore-panel-access";

export async function getPanelAccessConfig() {
  return getFirestorePanelAccessConfig();
}

export async function isPanelPasswordProtectionEnabled() {
  const cfg = await getPanelAccessConfig();
  return !!cfg.passwordHash;
}
