/** Marca en notas cuando el cliente anula desde la web */
export const CLIENT_CANCELLED_NOTE = "Anulada por cliente";

export function isCancelledByClient(notes: string | null | undefined): boolean {
  if (!notes) return false;
  return notes.toLowerCase().includes(CLIENT_CANCELLED_NOTE.toLowerCase());
}

export function appendClientCancellationNote(existing: string | null | undefined): string {
  if (isCancelledByClient(existing)) return existing ?? CLIENT_CANCELLED_NOTE;
  return existing?.trim()
    ? `${existing.trim()}\n${CLIENT_CANCELLED_NOTE}`
    : CLIENT_CANCELLED_NOTE;
}
