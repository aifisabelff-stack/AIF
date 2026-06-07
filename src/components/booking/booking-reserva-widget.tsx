"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { X, CalendarPlus, CalendarClock } from "lucide-react";
import type { TherapyOption } from "@/components/agenda/therapy-select";
const BookingBookForm = dynamic(
  () => import("@/components/booking/booking-book-form").then((m) => m.BookingBookForm),
  { ssr: false }
);

const BookingManagePanel = dynamic(
  () => import("@/components/booking/booking-manage-panel").then((m) => m.BookingManagePanel),
  { ssr: false }
);

type Mode = "hub" | "book" | "manage";

const hubBtnRose =
  "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-btn px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-md shadow-iaf-400/20 transition-all hover:bg-rose-btn-hover";

const hubBtnSecondary =
  "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gold-400/30 bg-white/90 px-4 py-3 text-sm font-medium text-iaf-800 transition-all hover:border-gold-400/50 hover:bg-cream-100";

type Props = {
  therapies: TherapyOption[];
};

export function BookingReservaWidget({ therapies }: Props) {
  const [mode, setMode] = useState<Mode>("hub");

  function goHome() {
    window.location.href = "/";
  }

  return (
    <div className="relative z-10 w-full rounded-2xl border border-gold-400/30 bg-cream-50 shadow-xl">
      <div className="flex items-center justify-between border-b border-gold-400/20 px-6 py-4">
        <h2 className="font-display text-xl font-semibold text-iaf-900">
          {mode === "hub"
            ? "Reservar y gestionar tu cita"
            : mode === "manage"
              ? "Gestionar mi cita"
              : "Pedir nueva cita"}
        </h2>
        <button
          type="button"
          onClick={goHome}
          className="cursor-pointer rounded-lg p-1.5 text-iaf-600 hover:bg-cream-200"
          aria-label="Volver al inicio"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {mode === "hub" && (
        <div className="space-y-4 px-6 py-6">
          <p className="text-sm leading-relaxed text-iaf-700">
            Desde aquí puede solicitar una nueva cita o gestionar una cita ya reservada: cambiar
            la fecha y hora o anularla.
          </p>
          <button
            type="button"
            className={hubBtnRose}
            onClick={() => setMode("book")}
          >
            <CalendarPlus className="h-5 w-5" />
            Pedir nueva cita
          </button>
          <button
            type="button"
            className={hubBtnSecondary}
            onClick={() => setMode("manage")}
          >
            <CalendarClock className="h-5 w-5" />
            Gestionar mi cita
          </button>
          <button type="button" className={hubBtnSecondary} onClick={goHome}>
            <X className="h-5 w-5" />
            Cerrar
          </button>
        </div>
      )}

      {mode === "book" && (
        <BookingBookForm
          therapies={therapies}
          onBack={() => setMode("hub")}
          onDone={() => setMode("hub")}
        />
      )}

      {mode === "manage" && (
        <BookingManagePanel onDone={goHome} onBack={() => setMode("hub")} />
      )}
    </div>
  );
}
