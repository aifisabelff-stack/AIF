import { cn } from "@/lib/utils";
import type { PatientStatus } from "@/lib/firestore-types";

const labels: Record<PatientStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  ARCHIVED: "Archivado",
};

const styles: Record<PatientStatus, string> = {
  ACTIVE: "bg-emerald-50/90 text-emerald-800 ring-emerald-200/80",
  INACTIVE: "bg-gold-300/30 text-iaf-800 ring-gold-300/50",
  ARCHIVED: "bg-iaf-100 text-iaf-600 ring-iaf-200",
};

export function StatusBadge({ status }: { status: PatientStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[status]
      )}
    >
      {labels[status]}
    </span>
  );
}
