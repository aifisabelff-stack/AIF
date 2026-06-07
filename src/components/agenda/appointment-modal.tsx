"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DurationSelect } from "@/components/agenda/duration-select";
import { TherapySelect, type TherapyOption } from "@/components/agenda/therapy-select";
import { FieldGroup, Input, Label, Select, Textarea } from "@/components/ui/input";
import { readResponseJson } from "@/lib/http-json";
import { cn } from "@/lib/utils";

export type PatientOption = { id: string; firstName: string; lastName: string };

export type AppointmentSlotInitial = {
  date: string;
  startTime: string;
  durationMinutes: string;
};

export type AppointmentEditInitial = AppointmentSlotInitial & {
  appointmentId: string;
  patientId: string;
  therapyId: string;
  status: string;
  notes: string;
  therapyLabel?: string;
};

export type AppointmentModalPayload =
  | { mode: "create"; initial: AppointmentSlotInitial }
  | { mode: "edit"; initial: AppointmentEditInitial };

type Props = {
  open: boolean;
  onClose: () => void;
  patients: PatientOption[];
  therapies: TherapyOption[];
  payload: AppointmentModalPayload | null;
  onRefresh?: () => Promise<void>;
  /** Vuelve al calendario de agenda para elegir nuevo día y hora */
  onChangeDay?: () => void;
};

export function AppointmentModal({
  open,
  onClose,
  patients,
  therapies,
  payload,
  onRefresh,
  onChangeDay,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");

  const isEdit = payload?.mode === "edit";
  const initial = payload?.initial ?? null;
  const edit = isEdit
    ? (payload as { mode: "edit"; initial: AppointmentEditInitial }).initial
    : null;

  const formKey = isEdit
    ? `edit-${edit!.appointmentId}-${initial?.date ?? ""}-${initial?.startTime ?? ""}`
    : `create-${initial?.date ?? ""}-${initial?.startTime ?? ""}`;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (open) setError(null);
  }, [open, payload]);

  useEffect(() => {
    if (initial) setSelectedDate(initial.date);
  }, [formKey, initial?.date]);

  function handleClose() {
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    fd.set("_mode", isEdit ? "update" : "create");

    let result: { error?: string; success?: boolean };
    try {
      const res = await fetch("/api/agenda/appointments/modal", {
        method: "POST",
        body: fd,
      });
      result =
        (await readResponseJson<{ error?: string; success?: boolean }>(res)) ??
        (res.ok ? {} : { error: "No se pudo guardar la cita" });
    } catch {
      result = { error: "No se pudo guardar la cita" };
    }

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    handleClose();
    if (onRefresh) {
      await onRefresh();
    } else {
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!isEdit || !edit) return;
    const ok = window.confirm("¿Seguro que quiere eliminar esta cita?");
    if (!ok) return;

    setDeleting(true);
    setError(null);

    const fd = new FormData();
    fd.set("_mode", "delete");
    fd.set("appointmentId", edit.appointmentId);

    let result: { error?: string; success?: boolean };
    try {
      const res = await fetch("/api/agenda/appointments/modal", {
        method: "POST",
        body: fd,
      });
      result =
        (await readResponseJson<{ error?: string; success?: boolean }>(res)) ??
        (res.ok ? {} : { error: "No se pudo eliminar la cita" });
    } catch {
      result = { error: "No se pudo eliminar la cita" };
    }
    setDeleting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    handleClose();
    if (onRefresh) {
      await onRefresh();
    } else {
      router.refresh();
    }
  }

  if (!open || !payload || !initial || !selectedDate) return null;

  const therapyMissing =
    edit?.therapyId && !therapies.some((t) => t.id === edit.therapyId);

  const dialog = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-iaf-950/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appointment-modal-title"
      onClick={handleClose}
    >
      <div
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gold-400/30 bg-cream-50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-gold-400/20 bg-cream-50 px-6 py-4">
          <h2
            id="appointment-modal-title"
            className="font-display text-xl font-semibold text-iaf-900"
          >
            {isEdit ? "Editar cita" : "Nueva cita"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-iaf-600 hover:bg-cream-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form key={formKey} onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
          <input type="hidden" name="allowNonSchedulableDay" value="1" />
          <input type="hidden" name="date" value={selectedDate} required />

          {isEdit && edit && (
            <input type="hidden" name="appointmentId" value={edit.appointmentId} />
          )}

          <FieldGroup>
            <Label htmlFor="modal-patientId">Paciente *</Label>
            <Select
              id="modal-patientId"
              name="patientId"
              required
              defaultValue={isEdit ? edit!.patientId : ""}
            >
              {!isEdit && (
                <option value="" disabled>
                  Seleccionar paciente
                </option>
              )}
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </Select>
          </FieldGroup>

          <FieldGroup>
            <Label htmlFor="modal-status">Estado</Label>
            <Select
              id="modal-status"
              name="status"
              defaultValue={isEdit ? edit!.status : "SCHEDULED"}
            >
              <option value="SCHEDULED">Programada</option>
              <option value="CONFIRMED">Confirmada</option>
              <option value="PENDING_CONFIRMATION">Pendiente de confirmar</option>
              <option value="COMPLETED">Completada</option>
              <option value="CANCELLED">Cancelada</option>
              <option value="NO_SHOW">No presentado</option>
            </Select>
          </FieldGroup>

          <FieldGroup>
            <Label htmlFor="modal-therapyId">Terapia *</Label>
            <Select
              id="modal-therapyId"
              name="therapyId"
              required
              defaultValue={isEdit ? edit!.therapyId : ""}
            >
              {!isEdit && (
                <option value="" disabled>
                  {therapies.length === 0
                    ? "No hay terapias activas"
                    : "Seleccionar terapia"}
                </option>
              )}
              {therapyMissing && edit?.therapyId && (
                <option value={edit.therapyId}>
                  {edit.therapyLabel ?? "Terapia actual"}
                </option>
              )}
              {therapies.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </FieldGroup>

          <div className="grid grid-cols-2 gap-3">
            <FieldGroup className="sm:col-span-2">
              <Label htmlFor="modal-date-display">Fecha *</Label>
              <div className="flex items-end gap-2">
                <Input
                  id="modal-date-display"
                  readOnly
                  value={format(parseISO(selectedDate), "dd/MM/yyyy")}
                  className="bg-cream-100/80 font-medium text-iaf-900"
                  aria-readonly
                />
                {isEdit && onChangeDay && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0 whitespace-nowrap"
                    onClick={onChangeDay}
                  >
                    Cambiar de día
                  </Button>
                )}
              </div>
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="modal-startTime">Inicio *</Label>
              <Input
                id="modal-startTime"
                name="startTime"
                type="time"
                required
                defaultValue={initial.startTime}
              />
            </FieldGroup>

            <DurationSelect
              id="modal-durationMinutes"
              name="durationMinutes"
              defaultValue={initial.durationMinutes}
            />
          </div>

          <FieldGroup>
            <Label htmlFor="modal-notes">Notas</Label>
            <Textarea
              id="modal-notes"
              name="notes"
              rows={2}
              placeholder="Preferencias, recordatorios..."
              defaultValue={isEdit ? edit!.notes : undefined}
            />
          </FieldGroup>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div
            className={cn(
              "grid gap-3 pt-2",
              isEdit ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
            )}
          >
            {isEdit && (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleDelete}
                disabled={loading || deleting}
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </Button>
            )}

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleClose}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading || deleting}
            >
              {loading
                ? "Guardando…"
                : isEdit
                  ? "Guardar cambios"
                  : "Reservar cita"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(dialog, document.body);
}
