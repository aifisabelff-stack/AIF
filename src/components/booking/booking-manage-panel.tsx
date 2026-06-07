"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Search, CheckCircle2, CalendarClock, Ban } from "lucide-react";
import type { CancellableAppointmentHit } from "@/lib/booking-types";
import { DEFAULT_APPOINTMENT_DURATION_MINUTES } from "@/lib/agenda-slots";
import { BookingDatePicker } from "@/components/booking/booking-date-picker";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input, Label } from "@/components/ui/input";
import { readResponseJson } from "@/lib/http-json";
import { cn } from "@/lib/utils";

type Props = {
  onDone: () => void;
  onBack: () => void;
};

type ManageStep = "search" | "action" | "reschedule";
type DoneKind = "cancelled" | "rescheduled" | null;

const BOOKING_DURATION = String(DEFAULT_APPOINTMENT_DURATION_MINUTES);

export function BookingManagePanel({ onDone, onBack }: Props) {
  const [step, setStep] = useState<ManageStep>("search");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<DoneKind>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<CancellableAppointmentHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<CancellableAppointmentHit | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/booking/manage/search?q=${encodeURIComponent(q)}`,
          { cache: "no-store" }
        );
        const data = await readResponseJson<{
          appointments?: CancellableAppointmentHit[];
        }>(res);
        const hits = data?.appointments ?? [];
        setResults(hits);
        if (selected && !hits.some((h) => h.id === selected.id)) {
          setSelected(null);
        }
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selected]);

  function handleSlotSelect(date: string, time: string) {
    setSelectedDate(date);
    setSelectedTime(time);
    setError(null);
  }

  async function handleCancel() {
    if (!selected) {
      setError("Seleccione la cita que desea anular");
      return;
    }

    setLoading(true);
    setError(null);
    let result: { error?: string };
    try {
      const res = await fetch("/api/booking/manage/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: selected.id }),
      });
      result =
        (await readResponseJson<{ error?: string }>(res)) ??
        (res.ok ? {} : { error: "No se pudo anular la cita" });
    } catch {
      result = { error: "No se pudo anular la cita" };
    }
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setDone("cancelled");
  }

  async function handleReschedule() {
    if (!selected) {
      setError("Seleccione una cita");
      return;
    }
    if (!selectedDate || !selectedTime) {
      setError("Seleccione un día y horario en el calendario");
      return;
    }

    setLoading(true);
    setError(null);
    let result: { error?: string };
    try {
      const res = await fetch("/api/booking/manage/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selected.id,
          date: selectedDate,
          time: selectedTime,
          duration: BOOKING_DURATION,
        }),
      });
      result =
        (await readResponseJson<{ error?: string }>(res)) ??
        (res.ok ? {} : { error: "No se pudo cambiar la cita" });
    } catch {
      result = { error: "No se pudo cambiar la cita" };
    }
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setDone("rescheduled");
  }

  if (done === "cancelled") {
    return (
      <div className="px-6 py-10 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
        <p className="mt-4 font-display text-lg font-semibold text-iaf-900">
          Cita anulada
        </p>
        <p className="mt-3 text-sm leading-relaxed text-iaf-700">
          Su cita ha quedado anulada. En la agenda de la clínica aparecerá como{" "}
          <span className="font-semibold text-gray-700">Anulada por Cliente</span>.
        </p>
        <Button type="button" className="mt-8" onClick={onDone}>
          Aceptar
        </Button>
      </div>
    );
  }

  if (done === "rescheduled") {
    return (
      <div className="px-6 py-10 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
        <p className="mt-4 font-display text-lg font-semibold text-iaf-900">
          Fecha actualizada
        </p>
        <p className="mt-3 text-sm leading-relaxed text-iaf-700">
          Hemos registrado el cambio de fecha. La cita quedará como{" "}
          <span className="font-semibold text-red-600">pendiente de confirmar (PDT)</span>{" "}
          hasta que la clínica la valide. Le contactaremos si es necesario.
        </p>
        <Button type="button" className="mt-8" onClick={onDone}>
          Aceptar
        </Button>
      </div>
    );
  }

  if (step === "reschedule" && selected) {
    const when = format(parseISO(selected.startAt), "EEEE d MMMM · HH:mm", {
      locale: es,
    });

    return (
      <div className="space-y-4 px-6 py-6">
        <p className="text-sm text-iaf-600">
          Cita actual: <strong className="text-iaf-900">{selected.title}</strong> — {when}
        </p>
        <p className="text-sm text-iaf-600">Elija la nueva fecha y hora disponibles:</p>

        <BookingDatePicker
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onSelect={handleSlotSelect}
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => {
              setStep("action");
              setSelectedDate("");
              setSelectedTime("");
              setError(null);
            }}
          >
            Volver
          </Button>
          <Button
            type="button"
            variant="rose"
            className="flex-1"
            disabled={loading || !selectedDate || !selectedTime}
            onClick={handleReschedule}
          >
            {loading ? "Guardando…" : "Confirmar nueva fecha"}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "action" && selected) {
    const when = format(parseISO(selected.startAt), "EEE d MMM · HH:mm", {
      locale: es,
    });

    return (
      <div className="space-y-4 px-6 py-6">
        <div className="rounded-xl border border-gold-400/30 bg-gold-50/50 px-4 py-3 text-sm">
          <p className="font-medium text-iaf-900">{selected.title}</p>
          <p className="mt-1 text-iaf-600">{when}</p>
          <p className="mt-0.5 text-xs text-iaf-500">
            {selected.patientName}
            {selected.phone ? ` · ${selected.phone}` : ""} ·{" "}
            {APPOINTMENT_STATUS_LABELS[selected.status] ?? selected.status}
          </p>
        </div>

        <p className="text-sm text-iaf-600">¿Qué desea hacer con esta cita?</p>

        <div className="grid gap-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-start gap-2"
            onClick={() => {
              setStep("reschedule");
              setSelectedDate("");
              setSelectedTime("");
              setError(null);
            }}
          >
            <CalendarClock className="h-4 w-4 shrink-0" />
            Cambiar fecha y hora
          </Button>
          <Button
            type="button"
            variant="rose"
            className="w-full justify-start gap-2"
            disabled={loading}
            onClick={handleCancel}
          >
            <Ban className="h-4 w-4 shrink-0" />
            {loading ? "Anulando…" : "Anular cita"}
          </Button>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <Button
          type="button"
          variant="ghost"
          className="w-full text-sm"
          onClick={() => {
            setSelected(null);
            setStep("search");
            setError(null);
          }}
        >
          Elegir otra cita
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-6 py-6">
      <p className="text-sm text-iaf-600">
        Escriba su nombre para ver sus citas futuras. Podrá cambiar la fecha o anularlas.
      </p>

      <FieldGroup>
        <Label htmlFor="manage-name-search">Nombre y apellidos *</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-iaf-400" />
          <Input
            id="manage-name-search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelected(null);
              setError(null);
            }}
            placeholder="Mínimo 2 letras"
            className="pl-9"
            autoComplete="name"
          />
        </div>
      </FieldGroup>

      {searchQuery.trim().length >= 2 && (
        <div className="space-y-2">
          {searching && <p className="text-sm text-iaf-500">Buscando citas…</p>}
          {!searching && results.length === 0 && (
            <p className="rounded-lg bg-iaf-50 px-3 py-2 text-sm text-iaf-600">
              No hay citas futuras a su nombre que se puedan gestionar.
            </p>
          )}
          {!searching && results.length > 0 && (
            <ul className="max-h-52 space-y-2 overflow-y-auto">
              {results.map((appt) => {
                const when = format(parseISO(appt.startAt), "EEE d MMM · HH:mm", {
                  locale: es,
                });
                return (
                  <li key={appt.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(appt);
                        setStep("action");
                        setError(null);
                      }}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                        "border-iaf-200/80 bg-white hover:border-gold-300 hover:bg-gold-50/50"
                      )}
                    >
                      <span className="font-medium text-iaf-900">{appt.title}</span>
                      <span className="mt-0.5 block text-xs text-iaf-600">{when}</span>
                      <span className="mt-0.5 block text-xs text-iaf-500">
                        {APPOINTMENT_STATUS_LABELS[appt.status] ?? appt.status}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="pt-2">
        <Button type="button" variant="secondary" className="w-full" onClick={onBack}>
          Volver
        </Button>
      </div>
    </div>
  );
}
