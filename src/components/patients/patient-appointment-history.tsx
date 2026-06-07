import { isCancelledByClient } from "@/lib/client-cancellation";
import {
  APPOINTMENT_STATUS_LABELS,
  cn,
  formatCurrency,
  formatDate,
  formatTime,
} from "@/lib/utils";

type AppointmentRow = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  status: string;
  notes: string | null;
  offeredTherapy: { name: string; price: number | null } | null;
};

const statusStyles: Record<string, string> = {
  PENDING_CONFIRMATION: "bg-red-50 text-red-800",
  SCHEDULED: "bg-iaf-50 text-iaf-800",
  CONFIRMED: "bg-emerald-50 text-emerald-800",
  COMPLETED: "bg-iaf-100 text-iaf-700",
  CANCELLED: "bg-gray-100 text-gray-700",
  CANCELLED_BY_CLIENT: "bg-gray-100 text-gray-600",
  NO_SHOW: "bg-amber-50 text-amber-900",
};

function statusLabel(a: AppointmentRow): string {
  if (a.status === "CANCELLED" && isCancelledByClient(a.notes)) {
    return "Anulada por Cliente";
  }
  return APPOINTMENT_STATUS_LABELS[a.status] ?? a.status;
}

function statusStyleKey(a: AppointmentRow): string {
  if (a.status === "CANCELLED" && isCancelledByClient(a.notes)) {
    return "CANCELLED_BY_CLIENT";
  }
  return a.status;
}

function formatDuration(startAt: Date, endAt: Date): string {
  const mins = Math.round((endAt.getTime() - startAt.getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

export function PatientAppointmentHistory({
  appointments,
}: {
  appointments: AppointmentRow[];
}) {
  if (appointments.length === 0) {
    return (
      <p className="text-sm text-iaf-500">Este cliente no tiene citas registradas.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-iaf-100/80">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-iaf-100 bg-cream-100/80 text-xs font-semibold uppercase tracking-wide text-iaf-600">
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Horario</th>
            <th className="px-4 py-3">Terapia</th>
            <th className="px-4 py-3 text-right">Precio</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Notas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-iaf-50">
          {appointments.map((a) => {
            const therapyName = a.offeredTherapy?.name ?? a.title;
            const styleKey = statusStyleKey(a);
            const price =
              a.offeredTherapy?.price != null && a.offeredTherapy.price > 0
                ? formatCurrency(a.offeredTherapy.price)
                : "—";

            return (
              <tr key={a.id} className="bg-white/60 hover:bg-iaf-50/40">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-iaf-900">
                  {formatDate(a.startAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-iaf-700">
                  {formatTime(a.startAt)} – {formatTime(a.endAt)}
                  <span className="mt-0.5 block text-xs text-iaf-500">
                    {formatDuration(a.startAt, a.endAt)}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-iaf-900">{therapyName}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-iaf-700">
                  {price}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-block rounded-md px-2 py-0.5 text-xs font-semibold",
                      statusStyles[styleKey] ?? statusStyles.SCHEDULED
                    )}
                  >
                    {statusLabel(a)}
                  </span>
                </td>
                <td className="max-w-[12rem] px-4 py-3 text-iaf-600">
                  {a.notes ? (
                    <span className="line-clamp-2" title={a.notes}>
                      {a.notes}
                    </span>
                  ) : (
                    <span className="text-iaf-300">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
