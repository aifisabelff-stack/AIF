"use client";

import { useEffect, useState } from "react";
import { Search, CheckCircle2 } from "lucide-react";
import { BookingDatePicker } from "@/components/booking/booking-date-picker";
import { TherapySelect, type TherapyOption } from "@/components/agenda/therapy-select";
import { readResponseJson } from "@/lib/http-json";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input, Label } from "@/components/ui/input";
import { DEFAULT_APPOINTMENT_DURATION_MINUTES } from "@/lib/agenda-slots";
import { cn, fullName, formatBookingSlotLabel } from "@/lib/utils";

type ClientType = "new" | "existing";

type PatientHit = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
};

type Props = {
  therapies: TherapyOption[];
  onBack: () => void;
  onDone: () => void;
};

export function BookingBookForm({ therapies, onBack, onDone }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [clientType, setClientType] = useState<ClientType>("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PatientHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientHit | null>(null);

  function handleSlotSelect(date: string, time: string) {
    setSelectedDate(date);
    setSelectedTime(time);
    setError(null);
  }

  function switchClientType(type: ClientType) {
    setClientType(type);
    setError(null);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedPatient(null);
  }

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

    try {
      const res = await fetch("/api/booking/create", {
        method: "POST",
        body: formData,
      });
      const result = await readResponseJson<{ error?: string }>(res);
      if (!res.ok || !result) {
        setError("No se pudo enviar la solicitud. Compruebe la conexión.");
        return;
      }
      if (result.error) {
        setError(result.error);
        return;
      }
      setConfirmed(true);
    } catch {
      setError("No se pudo enviar la solicitud. Compruebe la conexión.");
    } finally {
      setLoading(false);
    }
  }

  if (confirmed) {
    return (
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
        <Button type="button" className="mt-8" onClick={onDone}>
          Aceptar
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
      <div className="flex gap-2 rounded-xl border border-iaf-200/80 bg-white/60 p-1">
        <button
          type="button"
          onClick={() => switchClientType("new")}
          className={cn(
            "flex-1 cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
            "flex-1 cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
              <Input id="booking-firstName" name="firstName" required autoComplete="given-name" />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="booking-lastName">Primer apellido *</Label>
              <Input id="booking-lastName" name="lastName" required autoComplete="family-name" />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="booking-secondLastName">Segundo apellido</Label>
              <Input id="booking-secondLastName" name="secondLastName" autoComplete="additional-name" />
            </FieldGroup>
          </div>
          <FieldGroup>
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" type="tel" />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
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
              className="pl-9"
              required={!selectedPatient}
              autoComplete="off"
            />
          </div>
          {selectedPatient && (
            <button
              type="button"
              className="mt-2 cursor-pointer text-xs font-medium text-iaf-600"
              onClick={() => {
                setSelectedPatient(null);
                setSearchQuery("");
              }}
            >
              Cambiar cliente
            </button>
          )}
          {!selectedPatient && searchQuery.trim().length >= 2 && (
            <ul className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-iaf-200/80 bg-white shadow-sm">
              {searching && <li className="px-3 py-2 text-sm text-iaf-500">Buscando…</li>}
              {!searching &&
                searchResults.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-gold-50"
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
      <input type="hidden" name="durationMinutes" value={String(DEFAULT_APPOINTMENT_DURATION_MINUTES)} readOnly />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onBack}>
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
  );
}
