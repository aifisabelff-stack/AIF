"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, Search, CalendarPlus, CalendarClock } from "lucide-react";
import { BookingManagePanel } from "@/components/booking/booking-manage-panel";
import { Button } from "@/components/ui/button";
import { TherapySelect, type TherapyOption } from "@/components/agenda/therapy-select";
import { DEFAULT_APPOINTMENT_DURATION_MINUTES } from "@/lib/agenda-slots";
import { BookingDatePicker } from "@/components/booking/booking-date-picker";
import { FieldGroup, Input, Label } from "@/components/ui/input";
import { readResponseJson } from "@/lib/http-json";
import { cn, fullName, formatBookingSlotLabel } from "@/lib/utils";

type ClientType = "new" | "existing";

type PatientHit = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
};

type ModalMode = "hub" | "book" | "manage";

type Props = {
  open: boolean;
  therapies: TherapyOption[];
  /** Página /reserva: sin capa oscura que bloquee la pantalla */
  embedded?: boolean;
  onClose?: () => void;
};

export function BookingModal({ open, onClose, therapies, embedded = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>("hub");
  const [clientType, setClientType] = useState<ClientType>("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PatientHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientHit | null>(null);

  useEffect(() => {
    if (!open || embedded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, embedded]);

  const resetForm = useCallback(() => {
    setError(null);
    setConfirmed(false);
    setSelectedDate("");
    setSelectedTime("");
    setClientType("new");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedPatient(null);
    setModalMode("hub");
  }, []);

  function handleSlotSelect(date: string, time: string) {
    setSelectedDate(date);
    setSelectedTime(time);
    setError(null);
  }

  function handleClose() {
    resetForm();
    if (embedded) {
      window.location.href = "/";
      return;
    }
    onClose?.();
  }

  useEffect(() => {
    if (!open) resetForm();
  }, [open, resetForm]);

  useEffect(() => {
    if (clientType !== "existing") {
      setSearchResults([]);
      return;
    }
    if (selectedPatient) return;

    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/booking/search?q=${encodeURIComponent(q)}`,
          { cache: "no-store" }
        );
        const data = await readResponseJson<{ patients?: PatientHit[] }>(res);
        setSearchResults(data?.patients ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, clientType, selectedPatient]);

  function switchClientType(type: ClientType) {
    setClientType(type);
    setError(null);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedPatient(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      setError("Seleccione un día con hueco libre y un horario en el calendario");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("date", selectedDate);
    formData.set("time", selectedTime);
    formData.set("clientType", clientType);
    if (clientType === "existing" && selectedPatient) {
      formData.set("patientId", selectedPatient.id);
    }

    let result: { error?: string; success?: boolean };
    try {
      const res = await fetch("/api/booking/create", {
        method: "POST",
        body: formData,
      });
      result =
        (await readResponseJson<{ error?: string; success?: boolean }>(res)) ??
        (res.ok ? {} : { error: "No se pudo enviar la solicitud. Compruebe la conexión." });
    } catch {
      result = { error: "No se pudo enviar la solicitud. Compruebe la conexión." };
    }

    setLoading(false);

    if (!result || result.error) {
      setError(result?.error ?? "No se pudo enviar la solicitud. Compruebe la conexión.");
      return;
    }

    setConfirmed(true);
  }

  const title =
    confirmed
      ? "Cita solicitada"
      : modalMode === "hub"
        ? "Reservar y gestionar tu cita"
        : modalMode === "manage"
          ? "Gestionar mi cita"
          : "Pedir nueva cita";

  if (!open) return null;

  const panel = (
    <div
      className={cn(
        embedded
          ? "w-full rounded-2xl border border-gold-400/30 bg-cream-50 shadow-xl"
          : "relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gold-400/30 bg-cream-50 shadow-2xl"
      )}
      role={embedded ? undefined : "dialog"}
      aria-modal={embedded ? undefined : true}
      aria-labelledby="booking-title"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gold-400/20 bg-cream-50 px-6 py-4">
          <h2 id="booking-title" className="font-display text-xl font-semibold text-iaf-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-iaf-600 hover:bg-cream-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {modalMode === "hub" ? (
          <div className="space-y-4 px-6 py-6">
            <p className="text-sm leading-relaxed text-iaf-700">
              Desde aquí puede solicitar una nueva cita o gestionar una cita ya reservada: cambiar
              la fecha y hora o anularla.
            </p>
            <Button
              type="button"
              variant="rose"
              className="w-full justify-center gap-2 py-3"
              onClick={() => {
                setModalMode("book");
                setError(null);
              }}
            >
              <CalendarPlus className="h-5 w-5" />
              Pedir nueva cita
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-center gap-2 py-3"
              onClick={() => {
                setModalMode("manage");
                setError(null);
              }}
            >
              <CalendarClock className="h-5 w-5" />
              Gestionar mi cita
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-center gap-2 py-3"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
              Cerrar
            </Button>
          </div>
        ) : modalMode === "manage" ? (
          <BookingManagePanel
            onDone={handleClose}
            onBack={() => {
              setModalMode("hub");
              setError(null);
            }}
          />
        ) : confirmed ? (
          <div className="px-6 py-10 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
            <p className="mt-4 font-display text-lg font-semibold text-iaf-900">
              ¡Solicitud recibida!
            </p>
            <p className="mt-3 text-sm leading-relaxed text-iaf-700">
              Hemos registrado su cita para el{" "}
              <strong className="font-semibold text-iaf-900">
                {formatBookingSlotLabel(selectedDate, selectedTime)}
              </strong>
              . Le contactaremos por teléfono o email.
            </p>
            <Button type="button" className="mt-8" onClick={handleClose}>
              Aceptar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
            <div className="flex gap-2 rounded-xl border border-iaf-200/80 bg-white/60 p-1">
              <button
                type="button"
                onClick={() => switchClientType("new")}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  clientType === "new"
                    ? "bg-gold-500 text-white shadow-sm"
                    : "text-iaf-600 hover:bg-iaf-50"
                )}
              >
                Nuevo cliente
              </button>
              <button
                type="button"
                onClick={() => switchClientType("existing")}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  clientType === "existing"
                    ? "bg-gold-500 text-white shadow-sm"
                    : "text-iaf-600 hover:bg-iaf-50"
                )}
              >
                Ya soy cliente
              </button>
            </div>

            {clientType === "new" ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <FieldGroup>
                    <Label htmlFor="booking-firstName">Nombre *</Label>
                    <Input
                      id="booking-firstName"
                      name="firstName"
                      required
                      autoComplete="given-name"
                      placeholder="Nombre"
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <Label htmlFor="booking-lastName">Primer apellido *</Label>
                    <Input
                      id="booking-lastName"
                      name="lastName"
                      required
                      autoComplete="family-name"
                      placeholder="Primer apellido"
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <Label htmlFor="booking-secondLastName">Segundo apellido</Label>
                    <Input
                      id="booking-secondLastName"
                      name="secondLastName"
                      autoComplete="additional-name"
                      placeholder="Segundo apellido"
                    />
                  </FieldGroup>
                </div>
                <p className="text-xs text-iaf-500">
                  Indique al menos un teléfono o un email de contacto (no hace falta rellenar
                  ambos).
                </p>
                <FieldGroup>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="600 000 000"
                  />
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor="email">Dirección de email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="correo@email.com"
                  />
                </FieldGroup>
              </>
            ) : (
              <FieldGroup>
                <Label htmlFor="patient-search">Buscar por nombre *</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-iaf-400" />
                  <Input
                    id="patient-search"
                    value={
                      selectedPatient
                        ? fullName(selectedPatient.firstName, selectedPatient.lastName)
                        : searchQuery
                    }
                    onChange={(e) => {
                      setSelectedPatient(null);
                      setSearchQuery(e.target.value);
                    }}
                    placeholder="Escriba nombre o apellidos (mín. 2 letras)"
                    className="pl-9"
                    required={!selectedPatient}
                    autoComplete="off"
                  />
                </div>
                {selectedPatient && (
                  <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-sm">
                    <span className="text-emerald-900">
                      {fullName(selectedPatient.firstName, selectedPatient.lastName)}
                      {selectedPatient.phone && (
                        <span className="block text-xs text-emerald-700">
                          {selectedPatient.phone}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      className="text-xs font-medium text-iaf-600 hover:text-iaf-900"
                      onClick={() => {
                        setSelectedPatient(null);
                        setSearchQuery("");
                      }}
                    >
                      Cambiar
                    </button>
                  </div>
                )}
                {!selectedPatient && searchQuery.trim().length >= 2 && (
                  <ul className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-iaf-200/80 bg-white shadow-sm">
                    {searching && (
                      <li className="px-3 py-2 text-sm text-iaf-500">Buscando…</li>
                    )}
                    {!searching && searchResults.length === 0 && (
                      <li className="px-3 py-2 text-sm text-iaf-500">
                        No hay clientes con ese nombre
                      </li>
                    )}
                    {!searching &&
                      searchResults.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm font-medium text-iaf-900 hover:bg-gold-50"
                            onClick={() => {
                              setSelectedPatient(p);
                              setSearchResults([]);
                            }}
                          >
                            {fullName(p.firstName, p.lastName)}
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
                <input type="hidden" name="patientId" value={selectedPatient?.id ?? ""} />
              </FieldGroup>
            )}

            <TherapySelect therapies={therapies} id="booking-therapyId" />
            <BookingDatePicker
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onSelect={handleSlotSelect}
            />
            <input type="hidden" name="date" value={selectedDate} readOnly />
            <input type="hidden" name="time" value={selectedTime} readOnly />
            <input
              type="hidden"
              name="durationMinutes"
              value={String(DEFAULT_APPOINTMENT_DURATION_MINUTES)}
              readOnly
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
                  setModalMode("hub");
                  setError(null);
                }}
              >
                Volver
              </Button>
              <Button
                type="submit"
                variant="rose"
                className="flex-1"
                disabled={
                  loading ||
                  therapies.length === 0 ||
                  (clientType === "existing" && !selectedPatient) ||
                  !selectedDate ||
                  !selectedTime
                }
              >
                {loading ? "Enviando…" : "Solicitar cita"}
              </Button>
            </div>
          </form>
        )}
    </div>
  );

  if (embedded) return panel;

  const dialog = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-iaf-950/40 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      {panel}
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(dialog, document.body);
}
