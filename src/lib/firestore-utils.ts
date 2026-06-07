import { DocumentData, Timestamp } from "firebase/firestore";

export type FirestorePatch = Record<string, unknown>;

export function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function asNumber(value: unknown, fallback?: number): number | undefined {
  return typeof value === "number" ? value : fallback;
}

export function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function toDate(value: unknown, fallback?: Date): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as Timestamp).toDate === "function"
  ) {
    return (value as Timestamp).toDate();
  }
  return fallback ?? new Date();
}

export function toOptionalDate(value: unknown): Date | undefined {
  if (value == null) return undefined;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as Timestamp).toDate === "function"
  ) {
    return (value as Timestamp).toDate();
  }
  return undefined;
}

export function clientIdFromDoc(docData: DocumentData): string {
  return asString(docData.clientId) || asString(docData.patientId);
}
