"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { addDays, format, parseISO, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Sun,
  Sunset,
  Ban,
  Check,
  Pencil,
  CalendarPlus,
  CalendarRange,
} from "lucide-react";
import { readResponseJson } from "@/lib/http-json";
import {
  cn,
  fullName,
  formatTime,
  formatDateTime,
  prevWeekKey,
  nextWeekKey,
  prevMonthKey,
  nextMonthKey,
  APPOINTMENT_STATUS_LABELS,
} from "@/lib/utils";
import { MonthAgendaView } from "@/components/agenda/month-agenda-view";
import {
  MORNING_HOURS,
  AFTERNOON_HOURS,
  AFTERNOON_START_HOUR,
  SLOT_START_MINUTES,
  SLOT_MINUTES,
  slotTimeKey,
  slotKeysForHour,
  slotKeysForDay,
  slotKeysForWeek,
  slotKeysForMonth,
  slotKeysForMorning,
  slotKeysForAfternoon,
  formatSlotLabel,
  appointmentOccupiesSlot,
  buildSlotStart,
  DEFAULT_APPOINTMENT_DURATION_MINUTES,
  durationValueFromRange,
  type BlockInterval,
  type HalfDayPeriod,
} from "@/lib/agenda-slots";
import {
  getDayKind,
  getHolidayName,
  isSchedulableDay,
  type DayKind,
} from "@/lib/holidays";
import { getClinicDateParts } from "@/lib/clinic-timezone";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import {
  AppointmentModal,
  type AppointmentEditInitial,
  type AppointmentModalPayload,
  type PatientOption,
} from "@/components/agenda/appointment-modal";
import type { TherapyOption } from "@/components/agenda/therapy-select";
import { isCancelledByClient } from "@/lib/client-cancellation";
import type { AgendaAppointment } from "@/lib/firestore-types";

type Appt = AgendaAppointment & {
  treatment: { name: string } | null;
};

const BLOCK_INTERVALS: { id: BlockInterval; label: string; hint: string }[] = [
  { id: "30", label: "30 min", hint: "Cada media hora" },
  { id: "60", label: "1 h", hint: "Hora completa" },
  { id: "half", label: "Media jornada", hint: "Mañana o tarde entera" },
  { id: "day", label: "1 día", hint: "Día entero" },
  { id: "week", label: "1 semana", hint: "Semana visible en el calendario" },
  { id: "month", label: "1 mes", hint: "Mes del calendario en pantalla" },
];

const statusColors: Record<string, string> = {
  PENDING_CONFIRMATION: "border-l-red-500 bg-red-50/95 ring-1 ring-red-200/70",
  SCHEDULED: "border-l-iaf-400 bg-iaf-50/80",
  CONFIRMED: "border-l-emerald-500 bg-emerald-50/95 ring-1 ring-emerald-200/70",
  COMPLETED: "border-l-amber-500 bg-amber-50/95 ring-1 ring-amber-200/70",
  CANCELLED: "border-l-gray-300 bg-gray-50 opacity-60",
  CANCELLED_BY_CLIENT: "border-l-gray-400 bg-gray-100/90 opacity-80 ring-1 ring-gray-300/60",
  NO_SHOW: "border-l-amber-400 bg-amber-50/60",
};

/** Etiqueta de estado en la esquina inferior derecha de la cita */
const statusCornerConfig: Record<
  string,
  { compact: string; full: string; className: string }
> = {
  PENDING_CONFIRMATION: { compact: "PDT", full: "Pend.", className: "text-red-600" },
  CONFIRMED: { compact: "OK", full: "Conf.", className: "text-emerald-600" },
  SCHEDULED: { compact: "PRG", full: "Prog.", className: "text-iaf-600" },
  COMPLETED: { compact: "REAL", full: "Realiz.", className: "text-amber-700" },
  CANCELLED: { compact: "ANU", full: "Anul.", className: "text-gray-500" },
  NO_SHOW: { compact: "NP", full: "N.pres.", className: "text-amber-700" },
};

function AppointmentStatusCorner({
  a,
  compact,
}: {
  a: Appt;
  compact?: boolean;
}) {
  if (a.status === "CANCELLED" && isCancelledByClient(a.notes)) {
    return (
      <span
        className={cn(
          "pointer-events-none absolute bottom-0 right-0 z-[2] font-bold leading-none text-gray-600",
          compact ? "pb-px pr-px text-[6px]" : "pb-0.5 pr-0.5 text-[7px] sm:text-[8px]"
        )}
        title="Anulada por Cliente"
      >
        {compact ? "Anul.Cli." : "Anul. Cliente"}
      </span>
    );
  }

  const cfg = statusCornerConfig[a.status] ?? {
    compact: "?",
    full: "?",
    className: "text-iaf-600",
  };
  const label = compact ? cfg.compact : cfg.full;

  return (
    <span
      className={cn(
        "pointer-events-none absolute bottom-0 right-0 z-[2] font-bold leading-none",
        compact ? "pb-px pr-px text-[7px]" : "pb-0.5 pr-0.5 text-[8px] sm:text-[9px]",
        cfg.className
      )}
      title={APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}
    >
      {label}
    </span>
  );
}

const dayHeaderStyles: Record<DayKind, string> = {
  weekday: "bg-white/95 text-iaf-900",
  weekend: "bg-iaf-100/90 text-iaf-900 ring-1 ring-iaf-200/80",
  holiday: "bg-gold-100/95 text-gold-900 ring-1 ring-gold-300/80",
};

/** Hoy: recuadro marrón; día elegido en listado: círculo amarillo en el número */
function dayHeaderNumberClass(isToday: boolean, isSelected: boolean) {
  return cn(
    "font-display text-lg font-semibold",
    isSelected &&
      "mx-auto flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-yellow-400 bg-yellow-50/90",
    isToday &&
      !isSelected &&
      "mx-auto inline-flex h-9 w-9 items-center justify-center rounded-md border-2 border-gold-700"
  );
}

const dayCellStyles: Record<DayKind, string> = {
  weekday: "bg-white/90",
  weekend: "bg-iaf-100/80",
  holiday: "bg-gold-100/70",
};

/** Altura mínima de un tramo de 30 min; crece si hay varias citas a la misma hora */
const QUARTER_SLOT_MIN_HEIGHT = "min-h-[2.45rem]";
const HOUR_SLOTS_MIN_HEIGHT = "min-h-[4.95rem]";

function formatHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function slotTimesForPicker(day: Date, hour: number, minute: number) {
  return {
    date: format(day, "yyyy-MM-dd"),
    startTime: formatSlotLabel(hour, minute),
    durationMinutes: String(DEFAULT_APPOINTMENT_DURATION_MINUTES),
  };
}

function apptsInQuarter(day: Date, dayAppts: Appt[], hour: number, minute: number) {
  const dayKey = format(day, "yyyy-MM-dd");
  return dayAppts.filter((a) => {
    if (!apptShowsInCalendar(a)) return false;
    const { dateKey, hour: apptHour, minute: apptMinute } = getClinicDateParts(
      new Date(a.startAt)
    );
    return dateKey === dayKey && apptHour === hour && apptMinute === minute;
  });
}

function apptsInHour(dayAppts: Appt[], hour: number) {
  return dayAppts.filter((a) => getClinicDateParts(new Date(a.startAt)).hour === hour);
}

function isActiveAppt(a: Appt) {
  return a.status !== "CANCELLED";
}

function apptShowsInCalendar(a: Appt) {
  return isActiveAppt(a) || (a.status === "CANCELLED" && isCancelledByClient(a.notes));
}

function apptCardStyle(a: Appt) {
  if (a.status === "CANCELLED" && isCancelledByClient(a.notes)) {
    return statusColors.CANCELLED_BY_CLIENT;
  }
  return statusColors[a.status] ?? statusColors.SCHEDULED;
}

/** Franja superior del listado (mismo tono que la tarjeta, más oscuro) */
const listApptStatusBannerStyles: Record<string, string> = {
  PENDING_CONFIRMATION: "bg-red-100 text-red-800 border-red-200/70",
  SCHEDULED: "bg-iaf-100 text-iaf-800 border-iaf-200/80",
  CONFIRMED: "bg-emerald-100 text-emerald-800 border-emerald-200/70",
  COMPLETED: "bg-amber-100 text-amber-900 border-amber-200/70",
  CANCELLED: "bg-gray-100 text-gray-700 border-gray-200/80",
  CANCELLED_BY_CLIENT: "bg-gray-200 text-gray-800 border-gray-300/70",
  NO_SHOW: "bg-amber-100 text-amber-800 border-amber-200/60",
};

function listApptStatusLabel(a: Appt) {
  if (a.status === "CANCELLED" && isCancelledByClient(a.notes)) {
    return "Anulada por Cliente";
  }
  return APPOINTMENT_STATUS_LABELS[a.status] ?? a.status;
}

function listApptStatusBannerClass(a: Appt) {
  const key =
    a.status === "CANCELLED" && isCancelledByClient(a.notes)
      ? "CANCELLED_BY_CLIENT"
      : a.status;
  return listApptStatusBannerStyles[key] ?? listApptStatusBannerStyles.SCHEDULED;
}

/** Orden en el listado del día seleccionado (no cronológico) */
const LIST_APPT_STATUS_SORT_ORDER: Record<string, number> = {
  PENDING_CONFIRMATION: 0,
  CONFIRMED: 1,
  SCHEDULED: 2,
  COMPLETED: 3,
  NO_SHOW: 4,
  CANCELLED: 5,
  CANCELLED_BY_CLIENT: 6,
};

function listApptStatusSortIndex(a: Appt) {
  if (a.status === "CANCELLED" && isCancelledByClient(a.notes)) {
    return LIST_APPT_STATUS_SORT_ORDER.CANCELLED_BY_CLIENT;
  }
  return LIST_APPT_STATUS_SORT_ORDER[a.status] ?? 50;
}

function appointmentDurationLabel(a: Appt) {
  const minutes = Math.max(
    0,
    Math.round((new Date(a.endAt).getTime() - new Date(a.startAt).getTime()) / 60000)
  );
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
  }
  return `${minutes} min`;
}

function slotHasActiveAppointment(allAppointments: Appt[], slotKey: number) {
  const slotStart = new Date(slotKey);
  const slotEnd = new Date(slotKey + SLOT_MINUTES * 60 * 1000);
  return allAppointments.some(
    (a) =>
      isActiveAppt(a) &&
      appointmentOccupiesSlot(
        new Date(a.startAt),
        new Date(a.endAt),
        slotStart
      )
  );
}

function keysBlockable(keys: number[], allAppointments: Appt[]) {
  return keys.filter((k) => !slotHasActiveAppointment(allAppointments, k));
}

/** Bloqueo de hora completa (2 tramos de 30 min) */
function isFullHourBlock(keys: number[]) {
  if (keys.length !== SLOT_START_MINUTES.length) return false;
  const first = new Date(keys[0]);
  const dayStr = first.toDateString();
  const hour = first.getHours();
  const mins = keys.map((k) => new Date(k).getMinutes()).sort((a, b) => a - b);
  if (mins.join(",") !== "0,30") return false;
  return keys.every((k) => {
    const d = new Date(k);
    return d.toDateString() === dayStr && d.getHours() === hour;
  });
}

function groupBlockedState(keys: number[], blockedSet: Set<number>) {
  const blocked = keys.filter((k) => blockedSet.has(k)).length;
  if (blocked === 0) return "none" as const;
  if (blocked === keys.length) return "all" as const;
  return "partial" as const;
}

/** Bloqueo mostrado en modo «No disponibilidad» (incluye fines de semana y festivos por defecto) */
function isSlotEffectivelyBlocked(
  slotKey: number,
  blockedSet: Set<number>,
  editMode: boolean,
  unblockedNonSchedulable: Set<number>
) {
  if (blockedSet.has(slotKey)) return true;
  const day = new Date(slotKey);
  if (editMode && !isSchedulableDay(day) && !unblockedNonSchedulable.has(slotKey)) {
    return true;
  }
  return false;
}

function groupEffectiveBlockedState(
  keys: number[],
  blockedSet: Set<number>,
  editMode: boolean,
  unblockedNonSchedulable: Set<number>
) {
  const blocked = keys.filter((k) =>
    isSlotEffectivelyBlocked(k, blockedSet, editMode, unblockedNonSchedulable)
  ).length;
  if (blocked === 0) return "none" as const;
  if (blocked === keys.length) return "all" as const;
  return "partial" as const;
}

/** Tramo libre para «Añadir cita» (fines de semana/festivos permitidos; solo bloqueos reales en BD) */
function isSlotAvailableForAdd(
  slotKey: number,
  blockedSet: Set<number>,
  hasAppt: boolean
) {
  if (hasAppt) return false;
  return !blockedSet.has(slotKey);
}

const blockBtnStyles = {
  none: "border-iaf-200/80 bg-white/60 text-iaf-500 hover:border-iaf-400 hover:bg-iaf-100/80",
  partial: "border-amber-400/80 bg-amber-100/70 text-amber-900",
  all: "border-iaf-500 bg-iaf-400/90 text-white",
};

type AgendaToolbarMode = "block" | "add" | "edit" | "month";

function agendaToolbarButtonClass(active: boolean, mode: AgendaToolbarMode) {
  const styles: Record<AgendaToolbarMode, { off: string; on: string }> = {
    block: {
      off: "border-iaf-200/80 bg-white/90 text-iaf-700 hover:border-iaf-400 hover:bg-iaf-50",
      on: "border-iaf-600 bg-iaf-600 text-white shadow-md shadow-iaf-500/25 hover:bg-iaf-700 hover:border-iaf-700",
    },
    add: {
      off: "border-emerald-200/80 bg-white/90 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-50",
      on: "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-500/25 hover:bg-emerald-700 hover:border-emerald-700",
    },
    edit: {
      off: "border-blue-200/80 bg-white/90 text-blue-800 hover:border-blue-400 hover:bg-blue-50",
      on: "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 hover:border-blue-700",
    },
    month: {
      off: "border-violet-200/80 bg-white/90 text-violet-800 hover:border-violet-400 hover:bg-violet-50",
      on: "border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-500/25 hover:bg-violet-700 hover:border-violet-700",
    },
  };
  return cn(
    "text-xs sm:text-sm border",
    active ? styles[mode].on : styles[mode].off
  );
}

const blockBtnDisabled =
  "cursor-not-allowed border-iaf-200/60 bg-iaf-100/50 text-iaf-400 opacity-70";

function AppointmentCard({
  a,
  compact,
  selectable,
  highlightReschedule,
  onSelect,
}: {
  a: Appt;
  compact?: boolean;
  selectable?: boolean;
  highlightReschedule?: boolean;
  onSelect?: (a: Appt) => void;
}) {
  const content = (
    <div
      className={cn(
        "relative h-full",
        compact ? "pr-3 pb-1" : "pr-4 pb-1.5"
      )}
    >
      <p className="font-medium text-iaf-900 line-clamp-1">{a.title}</p>
      <p className="flex items-center gap-0.5 text-iaf-600">
        <Clock className="h-2 w-2 shrink-0" />
        {formatTime(a.startAt)} · {appointmentDurationLabel(a)}
      </p>
      {!compact &&
        (selectable ? (
          <span className="line-clamp-1 text-iaf-500">
            {fullName(a.patient.firstName, a.patient.lastName)}
          </span>
        ) : (
          <Link
            href={`/pacientes/${a.patient.id}`}
            className="text-iaf-500 hover:text-iaf-800 line-clamp-1"
          >
            {fullName(a.patient.firstName, a.patient.lastName)}
          </Link>
        ))}
      <AppointmentStatusCorner a={a} compact={compact} />
    </div>
  );

  const cardClass = cn(
    "relative shrink-0 rounded-md border-l-[3px] px-1 py-0.5",
    compact ? "min-h-[2.35rem] text-[8px]" : "min-h-[2.75rem] text-[9px] sm:text-[10px]",
    apptCardStyle(a),
    highlightReschedule &&
      "animate-pulse border-red-500 bg-red-50/90 ring-2 ring-red-400/70",
    selectable &&
      "cursor-pointer transition-shadow hover:ring-2 hover:ring-blue-400/80"
  );

  if (selectable && onSelect) {
    return (
      <li>
        <button
          type="button"
          onClick={() => onSelect(a)}
          className={cn("w-full text-left", cardClass)}
          title="Editar esta cita"
        >
          {content}
        </button>
      </li>
    );
  }

  return <li className={cardClass}>{content}</li>;
}

function ApptsOverlay({
  appts,
  compact,
  editApptMode,
  highlightAppointmentId,
  onSelectAppt,
}: {
  appts: Appt[];
  compact?: boolean;
  editApptMode?: boolean;
  highlightAppointmentId?: string | null;
  onSelectAppt?: (a: Appt) => void;
}) {
  if (appts.length === 0) return null;
  return (
    <ul
      className={cn(
        "mb-0.5 flex flex-col gap-1",
        editApptMode ? "pointer-events-auto relative z-[1]" : "pointer-events-none"
      )}
    >
      {appts.map((a) => (
        <AppointmentCard
          key={a.id}
          a={a}
          compact={compact}
          selectable={editApptMode && a.status !== "COMPLETED"}
          highlightReschedule={highlightAppointmentId === a.id}
          onSelect={onSelectAppt}
        />
      ))}
    </ul>
  );
}

function QuarterSlot({
  day,
  hour,
  minute,
  dayAppts,
  blockedSet,
  unblockedNonSchedulable,
  editMode,
  addMode,
  editApptMode,
  highlightAppointmentId,
  onToggleGroup,
  onPickSlot,
  onPickAppointment,
  pending,
  allAppointments,
}: {
  day: Date;
  hour: number;
  minute: number;
  dayAppts: Appt[];
  blockedSet: Set<number>;
  unblockedNonSchedulable: Set<number>;
  editMode: boolean;
  addMode: boolean;
  editApptMode: boolean;
  highlightAppointmentId?: string | null;
  onToggleGroup: (keys: number[]) => void;
  onPickSlot: (day: Date, hour: number, minute: number) => void;
  onPickAppointment?: (a: Appt) => void;
  pending: boolean;
  allAppointments: Appt[];
}) {
  const appts = apptsInQuarter(day, dayAppts, hour, minute);
  const keys = [slotTimeKey(day, hour, minute)];
  const slotKey = keys[0];
  const label = formatSlotLabel(hour, minute);
  const hasAppt = slotHasActiveAppointment(allAppointments, slotKey);
  const displayBlocked = isSlotEffectivelyBlocked(
    slotKey,
    blockedSet,
    editMode,
    unblockedNonSchedulable
  );
  const canToggle = displayBlocked || !hasAppt;
  const canBook = isSlotAvailableForAdd(slotKey, blockedSet, hasAppt);
  const defaultUnavailableDay = addMode && !isSchedulableDay(day);

  if (addMode) {
    if (!canBook) {
      return (
        <div
          className={cn(
            QUARTER_SLOT_MIN_HEIGHT,
            "rounded-sm border border-transparent px-0.5 py-0.5",
            displayBlocked && "border-iaf-300/80 bg-iaf-300/50"
          )}
        >
          {displayBlocked && (
            <p className="flex items-center justify-center gap-0.5 text-[8px] font-medium text-iaf-700">
              <Ban className="h-2 w-2" />
              No disp.
            </p>
          )}
          <ApptsOverlay
            appts={appts}
            compact
            editApptMode={editApptMode}
            highlightAppointmentId={highlightAppointmentId}
            onSelectAppt={onPickAppointment}
          />
        </div>
      );
    }
    if (defaultUnavailableDay) {
      const dayKind = getDayKind(day);
      return (
        <button
          type="button"
          onClick={() => onPickSlot(day, hour, minute)}
          className={cn(
            "flex w-full items-center justify-center rounded-sm border border-iaf-300/80 bg-iaf-300/50 px-0.5 py-0.5 text-[8px] font-medium text-iaf-700 transition-colors hover:border-emerald-400 hover:bg-emerald-50/90 hover:text-emerald-900",
            QUARTER_SLOT_MIN_HEIGHT
          )}
          title={`${label} — ${dayKind === "holiday" ? "festivo" : "fin de semana"}; pulsa para añadir cita`}
        >
          <span className="flex items-center gap-0.5 truncate font-semibold">
            <Ban className="h-2 w-2" />
            No disp. + cita
          </span>
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => onPickSlot(day, hour, minute)}
        className={cn(
          "flex w-full items-center justify-center rounded-sm border border-emerald-300/80 bg-emerald-50/80 px-0.5 py-0.5 text-[8px] font-semibold text-emerald-900 transition-colors hover:border-emerald-500 hover:bg-emerald-100",
          QUARTER_SLOT_MIN_HEIGHT
        )}
        title={`${label} — nueva cita`}
      >
        {label}
      </button>
    );
  }

  if (editMode) {
    if (hasAppt && !displayBlocked) {
      return (
        <div
          className={cn(
            QUARTER_SLOT_MIN_HEIGHT,
            "rounded-sm border border-transparent bg-white/40 px-0.5 py-0.5"
          )}
        >
          <ApptsOverlay
            appts={appts}
            compact
            editApptMode={editApptMode}
            highlightAppointmentId={highlightAppointmentId}
            onSelectAppt={onPickAppointment}
          />
        </div>
      );
    }
    return (
      <div className={cn("flex flex-col gap-px", QUARTER_SLOT_MIN_HEIGHT)}>
        <ApptsOverlay
          appts={appts}
          compact
          editApptMode={editApptMode}
          highlightAppointmentId={highlightAppointmentId}
          onSelectAppt={onPickAppointment}
        />
        <button
          type="button"
          disabled={pending || !canToggle}
          onClick={() => onToggleGroup(keys)}
          className={cn(
            "flex min-h-[1.25rem] w-full shrink-0 flex-col items-center justify-center rounded-sm border px-0.5 py-0.5 text-[8px] transition-colors",
            !canToggle ? blockBtnDisabled : displayBlocked ? blockBtnStyles.all : blockBtnStyles.none,
            pending && "opacity-60"
          )}
          title={
            displayBlocked ? `${label} — desbloquear` : `${label} — bloquear`
          }
        >
          <span className="font-semibold">{label}</span>
          {displayBlocked && <Ban className="h-2.5 w-2.5" />}
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        QUARTER_SLOT_MIN_HEIGHT,
        "rounded-sm border border-transparent px-0.5 py-0.5",
        displayBlocked && "border-iaf-300/80 bg-iaf-300/50"
      )}
    >
      {displayBlocked && (
        <p className="flex items-center justify-center gap-0.5 text-[8px] font-medium text-iaf-700">
          <Ban className="h-2 w-2" />
          No disp.
        </p>
      )}
      <ApptsOverlay
        appts={appts}
        editApptMode={editApptMode}
        highlightAppointmentId={highlightAppointmentId}
        onSelectAppt={onPickAppointment}
      />
      {!displayBlocked && appts.length === 0 && (
        <span className="block text-center text-[8px] text-iaf-300">·</span>
      )}
    </div>
  );
}

function HourBlockCell({
  day,
  hour,
  dayAppts,
  blockedSet,
  editMode,
  unblockedNonSchedulable,
  editApptMode,
  highlightAppointmentId,
  onToggleGroup,
  onPickAppointment,
  pending,
  allAppointments,
}: {
  day: Date;
  hour: number;
  dayAppts: Appt[];
  blockedSet: Set<number>;
  editMode: boolean;
  unblockedNonSchedulable: Set<number>;
  editApptMode: boolean;
  highlightAppointmentId?: string | null;
  onToggleGroup: (keys: number[]) => void;
  onPickAppointment?: (a: Appt) => void;
  pending: boolean;
  allAppointments: Appt[];
}) {
  const keys = slotKeysForHour(day, hour);
  const state = groupEffectiveBlockedState(
    keys,
    blockedSet,
    editMode,
    unblockedNonSchedulable
  );
  const appts = apptsInHour(dayAppts, hour).filter(apptShowsInCalendar);
  const hasAppt = keys.some((k) => slotHasActiveAppointment(allAppointments, k));
  const canToggle = state !== "none" || !hasAppt;

  if (editMode) {
    if (hasAppt && state !== "all") {
      return (
        <div className="p-0.5">
          <ApptsOverlay
            appts={appts}
            editApptMode={editApptMode}
            highlightAppointmentId={highlightAppointmentId}
            onSelectAppt={onPickAppointment}
          />
        </div>
      );
    }
    return (
      <div className="p-0.5">
        <ApptsOverlay
          appts={appts}
          editApptMode={editApptMode}
          highlightAppointmentId={highlightAppointmentId}
          onSelectAppt={onPickAppointment}
        />
        <button
          type="button"
          disabled={pending || !canToggle}
          onClick={() => onToggleGroup(keys)}
          className={cn(
            "flex min-h-[2.5rem] w-full flex-col items-center justify-center rounded-md border px-1 py-1 text-[10px] font-semibold transition-colors",
            !canToggle ? blockBtnDisabled : blockBtnStyles[state],
            pending && "opacity-60"
          )}
          title={
            hasAppt && state !== "all"
              ? `${formatHourLabel(hour)} — hay citas, no se puede bloquear`
              : undefined
          }
        >
          {formatHourLabel(hour)}
          {state === "all" && <Ban className="mt-0.5 h-3 w-3" />}
          {state === "partial" && (
            <span className="mt-0.5 text-[8px] font-normal">Parcial</span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-px p-0.5", HOUR_SLOTS_MIN_HEIGHT)}>
      {SLOT_START_MINUTES.map((minute) => (
        <QuarterSlot
          key={minute}
          day={day}
          hour={hour}
          minute={minute}
          dayAppts={dayAppts}
          blockedSet={blockedSet}
          unblockedNonSchedulable={unblockedNonSchedulable}
          editMode={false}
          addMode={false}
          editApptMode={editApptMode}
          highlightAppointmentId={highlightAppointmentId}
          onToggleGroup={onToggleGroup}
          onPickSlot={() => {}}
          onPickAppointment={onPickAppointment}
          pending={pending}
          allAppointments={allAppointments}
        />
      ))}
    </div>
  );
}

function HourCell({
  day,
  hour,
  dayAppts,
  blockedSet,
  unblockedNonSchedulable,
  editMode,
  addMode,
  editApptMode,
  highlightAppointmentId,
  interval,
  onToggleGroup,
  onPickSlot,
  onPickAppointment,
  pending,
  allAppointments,
}: {
  day: Date;
  hour: number;
  dayAppts: Appt[];
  blockedSet: Set<number>;
  unblockedNonSchedulable: Set<number>;
  editMode: boolean;
  addMode: boolean;
  editApptMode: boolean;
  highlightAppointmentId?: string | null;
  interval: BlockInterval;
  onToggleGroup: (keys: number[]) => void;
  onPickSlot: (day: Date, hour: number, minute: number) => void;
  onPickAppointment?: (a: Appt) => void;
  pending: boolean;
  allAppointments: Appt[];
}) {
  if (editMode && interval === "60") {
    return (
      <HourBlockCell
        day={day}
        hour={hour}
        dayAppts={dayAppts}
        blockedSet={blockedSet}
        editMode
        unblockedNonSchedulable={unblockedNonSchedulable}
        editApptMode={editApptMode}
        highlightAppointmentId={highlightAppointmentId}
        onToggleGroup={onToggleGroup}
        onPickAppointment={onPickAppointment}
        pending={pending}
        allAppointments={allAppointments}
      />
    );
  }

  return (
    <div className={cn("flex flex-col gap-px p-0.5", HOUR_SLOTS_MIN_HEIGHT)}>
      {SLOT_START_MINUTES.map((minute) => (
        <QuarterSlot
          key={minute}
          day={day}
          hour={hour}
          minute={minute}
          dayAppts={dayAppts}
          blockedSet={blockedSet}
          unblockedNonSchedulable={unblockedNonSchedulable}
          editMode={editMode && interval === "30"}
          addMode={addMode}
          editApptMode={editApptMode}
          highlightAppointmentId={highlightAppointmentId}
          onToggleGroup={onToggleGroup}
          onPickSlot={onPickSlot}
          onPickAppointment={onPickAppointment}
          pending={pending}
          allAppointments={allAppointments}
        />
      ))}
    </div>
  );
}

function SectionHeaderRow({
  colSpan,
  label,
  range,
  icon: Icon,
  variant = "morning",
  collapsed = false,
  onToggleCollapse,
}: {
  colSpan: number;
  label: string;
  range: string;
  icon: typeof Sun;
  variant?: "morning" | "afternoon";
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  return (
    <tr className="bg-sky-100/80 border-b border-iaf-200/60">
      <td
        colSpan={colSpan}
        className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-sky-900"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <Icon
              className={cn(
                "h-4 w-4",
                variant === "afternoon" ? "text-sky-600" : "text-gold-600"
              )}
              strokeWidth={2}
            />
            {label}
            <span className="font-normal normal-case text-iaf-600">({range})</span>
          </span>
          {onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="inline-flex items-center gap-1 rounded-full border border-iaf-200 bg-white px-2 py-1 text-[11px] font-semibold text-iaf-700 transition hover:bg-iaf-50"
            >
              {collapsed ? (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  Mostrar
                </>
              ) : (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Ocultar
                </>
              )}
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function HalfDayToggleRow({
  days,
  apptsByDay,
  blockedSet,
  editMode,
  unblockedNonSchedulable,
  period,
  onToggleGroup,
  pending,
  allAppointments,
}: {
  days: Date[];
  apptsByDay: Appt[][];
  blockedSet: Set<number>;
  editMode: boolean;
  unblockedNonSchedulable: Set<number>;
  period: HalfDayPeriod;
  onToggleGroup: (keys: number[]) => void;
  pending: boolean;
  allAppointments: Appt[];
}) {
  const rowLabel = period === "morning" ? "Mañana entera" : "Tarde entera";

  return (
    <tr className="bg-sky-100/50">
      <th
        className="border-r border-b border-iaf-200/60 bg-sky-200/40 px-1 py-2 text-center text-[10px] font-bold leading-tight text-sky-900"
        scope="row"
      >
        {rowLabel}
      </th>
      {days.map((day, dayIndex) => {
        const kind = getDayKind(day);
        const isToday = isSameDay(day, new Date());
        const keys =
          period === "morning" ? slotKeysForMorning(day) : slotKeysForAfternoon(day);
        const state = groupEffectiveBlockedState(
          keys,
          blockedSet,
          editMode,
          unblockedNonSchedulable
        );
        const periodAppts = apptsByDay[dayIndex].filter((a) => {
          if (!isActiveAppt(a)) return false;
          const h = getClinicDateParts(new Date(a.startAt)).hour;
          return period === "morning" ? h < AFTERNOON_START_HOUR : h >= AFTERNOON_START_HOUR;
        });
        const blockable = keysBlockable(keys, allAppointments);
        const canToggle = state === "all" || blockable.length > 0;

        return (
          <td
            key={`half-${period}-${day.toISOString()}`}
            className={cn(
              "border-b border-iaf-200/50 p-1",
              dayCellStyles[kind],
              isToday && "ring-1 ring-inset ring-iaf-300"
            )}
          >
            <button
              type="button"
              disabled={pending || !canToggle}
              onClick={() => onToggleGroup(keys)}
              className={cn(
                "flex w-full flex-col items-center rounded-md border px-1 py-2 text-[10px] font-semibold transition-colors",
                !canToggle ? blockBtnDisabled : blockBtnStyles[state],
                pending && "opacity-60"
              )}
              title={
                !canToggle ? "Hay citas en esta jornada" : undefined
              }
            >
              <span>{format(day, "EEE d", { locale: es })}</span>
              {periodAppts.length > 0 && (
                <span className="mt-0.5 text-[9px] font-normal opacity-90">
                  {periodAppts.length} cita{periodAppts.length !== 1 ? "s" : ""}
                </span>
              )}
              {state === "all" && <Ban className="mt-0.5 h-3 w-3" />}
              {state === "partial" && (
                <span className="mt-0.5 text-[8px] font-normal">Parcial</span>
              )}
            </button>
          </td>
        );
      })}
    </tr>
  );
}

function HourRow({
  hour,
  days,
  apptsByDay,
  blockedSet,
  unblockedNonSchedulable,
  editMode,
  pickSlotMode,
  rescheduleMode,
  editApptMode,
  highlightAppointmentId,
  interval,
  onToggleGroup,
  onPickSlot,
  onPickAppointment,
  pending,
  allAppointments,
}: {
  hour: number;
  days: Date[];
  apptsByDay: Appt[][];
  blockedSet: Set<number>;
  unblockedNonSchedulable: Set<number>;
  editMode: boolean;
  pickSlotMode: boolean;
  rescheduleMode: boolean;
  editApptMode: boolean;
  highlightAppointmentId?: string | null;
  interval: BlockInterval;
  onToggleGroup: (keys: number[]) => void;
  onPickSlot: (day: Date, hour: number, minute: number) => void;
  onPickAppointment?: (a: Appt) => void;
  pending: boolean;
  allAppointments: Appt[];
}) {
  return (
    <tr className="bg-sky-50/80">
      <th
        className="sticky left-0 z-20 w-[3.25rem] border-r border-b border-iaf-200/60 bg-cream-50/95 px-1 py-1 text-center text-[11px] font-semibold text-iaf-700"
        scope="row"
      >
        {formatHourLabel(hour)}
      </th>
      {days.map((day, i) => {
        const kind = getDayKind(day);
        const isToday = isSameDay(day, new Date());

        return (
          <td
            key={`${day.toISOString()}-${hour}`}
            className={cn(
              "min-w-[4.5rem] border-b border-iaf-200/50 align-top transition-colors duration-200 hover:bg-cream-50/80",
              dayCellStyles[kind],
              isToday && "ring-1 ring-inset ring-iaf-300",
              editMode &&
                interval !== "day" &&
                interval !== "half" &&
                interval !== "week" &&
                interval !== "month" &&
                "ring-1 ring-inset ring-gold-300/40",
              pickSlotMode &&
                (rescheduleMode
                  ? "ring-1 ring-inset ring-violet-300/50"
                  : "ring-1 ring-inset ring-emerald-300/50"),
              editApptMode && "ring-1 ring-inset ring-blue-300/50"
            )}
          >
            <HourCell
              day={day}
              hour={hour}
              dayAppts={apptsByDay[i]}
              blockedSet={blockedSet}
              unblockedNonSchedulable={unblockedNonSchedulable}
              editMode={editMode}
              addMode={pickSlotMode}
              editApptMode={editApptMode}
              highlightAppointmentId={highlightAppointmentId}
              interval={interval}
              onToggleGroup={onToggleGroup}
              onPickSlot={onPickSlot}
              onPickAppointment={onPickAppointment}
              pending={pending}
              allAppointments={allAppointments}
            />
          </td>
        );
      })}
    </tr>
  );
}

export function WeekCalendar({
  weekKey,
  weekLabel: weekLabelProp,
  appointments,
  blockedSlotTimes,
  patients,
  therapies,
  monthKey,
  monthCounts,
  weekNavPending = false,
  onNavigateWeek,
  onRefresh,
  refreshSignal,
}: {
  weekKey: string;
  weekLabel?: string;
  appointments: Appt[];
  blockedSlotTimes: number[];
  patients: PatientOption[];
  therapies: TherapyOption[];
  monthKey: string;
  monthCounts: Record<string, number>;
  weekNavPending?: boolean;
  onNavigateWeek?: (direction: "prev" | "next") => void;
  onRefresh?: () => Promise<void>;
  refreshSignal?: number;
}) {
  const weekStart = parseISO(weekKey);
  const currentMonthStart = parseISO(`${monthKey}-01`);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const apptsByDay = days.map((day) => {
    const dayKey = format(day, "yyyy-MM-dd");
    return appointments.filter(
      (a) => getClinicDateParts(new Date(a.startAt)).dateKey === dayKey
    );
  });
  const colSpan = days.length + 1;

  const router = useRouter();
  const [apptActionError, setApptActionError] = useState<string | null>(null);

  async function postAgendaAction(url: string) {
    const res = await fetch(url, { method: "POST" });
    const data = await readResponseJson<{ error?: string }>(res);
    if (!res.ok || !data || data.error) {
      throw new Error(data?.error ?? "No se pudo completar la acción");
    }
  }

  function runApptAction(url: string) {
    setApptActionError(null);
    startTransition(async () => {
      try {
        await postAgendaAction(url);
        if (onRefresh) {
          await onRefresh();
        } else {
          router.refresh();
        }
      } catch (e) {
        setApptActionError(e instanceof Error ? e.message : "Error en la cita");
      }
    });
  }

  async function toggleBlockedViaApi(keysToSend: number[]) {
    const res = await fetch("/api/agenda/blocked-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots: keysToSend }),
    });
    return (
      (await readResponseJson<{ blocked?: boolean; error?: string }>(res)) ?? {
        blocked: false,
        error: "Respuesta no válida del servidor",
      }
    );
  }

  const [monthView, setMonthView] = useState(false);
  const [agendaMonthKey, setAgendaMonthKey] = useState(monthKey);

  useEffect(() => {
    setAgendaMonthKey(monthKey);
  }, [monthKey]);
  const [editMode, setEditMode] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [editApptMode, setEditApptMode] = useState(false);
  const [interval, setInterval] = useState<BlockInterval>("60");
  const [halfPeriod, setHalfPeriod] = useState<HalfDayPeriod>("morning");
  const [collapsedPeriods, setCollapsedPeriods] = useState<Record<HalfDayPeriod, boolean>>({
    morning: false,
    afternoon: false,
  });
  const [blockedSet, setBlockedSet] = useState(() => new Set(blockedSlotTimes));
  const [unblockedNonSchedulable, setUnblockedNonSchedulable] = useState<Set<number>>(
    () => new Set()
  );
  const [pending, startTransition] = useTransition();
  const [blockError, setBlockError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPayload, setModalPayload] = useState<AppointmentModalPayload | null>(
    null
  );
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [rescheduleDraft, setRescheduleDraft] = useState<AppointmentEditInitial | null>(
    null
  );
  const highlightedAppointmentId = rescheduleDraft?.appointmentId ?? null;

  const rescheduleMode = rescheduleDraft !== null;
  const pickSlotMode = addMode || rescheduleMode;

  const handlePickSlot = useCallback(
    (day: Date, hour: number, minute: number) => {
      if (rescheduleDraft) {
        setModalPayload({
          mode: "edit",
          initial: {
            ...rescheduleDraft,
            date: format(day, "yyyy-MM-dd"),
            startTime: formatSlotLabel(hour, minute),
          },
        });
        setRescheduleDraft(null);
        setEditApptMode(true);
        setModalOpen(true);
        return;
      }
      if (!addMode) return;
      setModalPayload({
        mode: "create",
        initial: slotTimesForPicker(day, hour, minute),
      });
      setModalOpen(true);
    },
    [addMode, rescheduleDraft]
  );

  const handleRequestChangeDay = useCallback(() => {
    if (modalPayload?.mode !== "edit") return;
    setRescheduleDraft(modalPayload.initial);
    setModalOpen(false);
    setEditApptMode(false);
    setEditMode(false);
    setAddMode(false);
    setMonthView(false);
  }, [modalPayload]);

  const cancelReschedule = useCallback(() => {
    if (!rescheduleDraft) return;
    setModalPayload({ mode: "edit", initial: rescheduleDraft });
    setRescheduleDraft(null);
    setEditApptMode(true);
    setModalOpen(true);
  }, [rescheduleDraft]);

  const handlePickAppointment = useCallback((a: Appt) => {
    if (!editApptMode) return;
    const start = new Date(a.startAt);
    setModalPayload({
      mode: "edit",
      initial: {
        appointmentId: a.id,
        patientId: a.patientId,
        therapyId: a.offeredTherapyId ?? "",
        date: format(start, "yyyy-MM-dd"),
        startTime: format(start, "HH:mm"),
        durationMinutes: durationValueFromRange(
          new Date(a.startAt),
          new Date(a.endAt)
        ),
        status: a.status,
        notes: a.notes ?? "",
        therapyLabel: a.title,
      },
    });
    setModalOpen(true);
  }, [editApptMode]);

  useEffect(() => {
    setBlockedSet(new Set(blockedSlotTimes));
  }, [blockedSlotTimes, weekKey]);

  useEffect(() => {
    setSelectedDayKey(null);
  }, [weekKey]);

  useEffect(() => {
    if (!editMode) setUnblockedNonSchedulable(new Set());
  }, [editMode]);

  useEffect(() => {
    setAgendaMonthKey(monthKey);
  }, [monthKey]);

  const agendaMonthDate = parseISO(`${agendaMonthKey}-01`);

  const handleSelectDay = useCallback((day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    setSelectedDayKey((prev) => (prev === key ? null : key));
  }, []);

  const selectedDay = selectedDayKey
    ? days.find((d) => format(d, "yyyy-MM-dd") === selectedDayKey) ?? null
    : null;

  const listAppointments = (
    selectedDayKey
      ? appointments.filter(
          (a) => getClinicDateParts(new Date(a.startAt)).dateKey === selectedDayKey
        )
      : [...appointments]
  ).sort((a, b) => {
    if (selectedDayKey) {
      const byStatus = listApptStatusSortIndex(a) - listApptStatusSortIndex(b);
      if (byStatus !== 0) return byStatus;
    }
    return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
  });

  const handleToggleGroup = useCallback(
    (keys: number[]) => {
      if (!editMode || keys.length === 0) return;

      const allEffective = keys.every((k) =>
        isSlotEffectivelyBlocked(k, blockedSet, editMode, unblockedNonSchedulable)
      );

      if (allEffective) {
        const dbBlocked = keys.filter((k) => blockedSet.has(k));
        const virtualKeys = keys.filter(
          (k) =>
            !blockedSet.has(k) &&
            !isSchedulableDay(new Date(k)) &&
            !unblockedNonSchedulable.has(k)
        );

        if (virtualKeys.length > 0) {
          setUnblockedNonSchedulable((prev) => {
            const next = new Set(prev);
            virtualKeys.forEach((k) => next.add(k));
            return next;
          });
        }

        if (dbBlocked.length === 0) {
          setBlockError(null);
          return;
        }

        setBlockError(null);
        const keysToSend = dbBlocked;

        startTransition(async () => {
          setBlockedSet((prev) => {
            const next = new Set(prev);
            keysToSend.forEach((k) => next.delete(k));
            return next;
          });
          try {
            const result = await toggleBlockedViaApi(keysToSend);
            if (result.error) {
              setBlockError(result.error);
              setBlockedSet(new Set(blockedSlotTimes));
              setUnblockedNonSchedulable(new Set());
              return;
            }
            setBlockedSet((prev) => {
              const next = new Set(prev);
              keysToSend.forEach((k) =>
                result.blocked ? next.add(k) : next.delete(k)
              );
              return next;
            });
          } catch {
            setBlockedSet(new Set(blockedSlotTimes));
          }
        });
        return;
      }

      const wasUnblocked = keys.filter((k) => unblockedNonSchedulable.has(k));
      setUnblockedNonSchedulable((prev) => {
        const next = new Set(prev);
        keys.forEach((k) => next.delete(k));
        return next;
      });

      const hasOccupied = keys.some((k) => slotHasActiveAppointment(appointments, k));
      if (isFullHourBlock(keys) && hasOccupied) {
        setBlockError("No se puede bloquear: hay citas en esa hora");
        return;
      }

      const keysToSend = keysBlockable(keys, appointments).filter(
        (k) => isSchedulableDay(new Date(k)) || wasUnblocked.includes(k)
      );

      if (keysToSend.length === 0) {
        setBlockError(null);
        return;
      }

      if (isFullHourBlock(keys) && keysToSend.length < keys.length) {
        setBlockError("No se puede bloquear: hay citas en esa hora");
        return;
      }

      setBlockError(null);

      startTransition(async () => {
        setBlockedSet((prev) => {
          const next = new Set(prev);
          keysToSend.forEach((k) => next.add(k));
          return next;
        });
        try {
          const result = await toggleBlockedViaApi(keysToSend);
          if (result.error) {
            setBlockError(result.error);
            setBlockedSet(new Set(blockedSlotTimes));
            return;
          }
          setBlockedSet((prev) => {
            const next = new Set(prev);
            keysToSend.forEach((k) =>
              result.blocked ? next.add(k) : next.delete(k)
            );
            return next;
          });
        } catch {
          setBlockedSet(new Set(blockedSlotTimes));
        }
      });
    },
    [editMode, blockedSet, blockedSlotTimes, appointments, unblockedNonSchedulable]
  );

  const weekBlockKeys = slotKeysForWeek(weekStart);
  const monthBlockKeys = slotKeysForMonth(weekStart);
  const weekBlockState = editMode
    ? groupEffectiveBlockedState(
        weekBlockKeys,
        blockedSet,
        editMode,
        unblockedNonSchedulable
      )
    : groupBlockedState(weekBlockKeys, blockedSet);
  const monthBlockState = editMode
    ? groupEffectiveBlockedState(
        monthBlockKeys,
        blockedSet,
        editMode,
        unblockedNonSchedulable
      )
    : groupBlockedState(monthBlockKeys, blockedSet);
  const canToggleWeekBlock =
    weekBlockState !== "none" || keysBlockable(weekBlockKeys, appointments).length > 0;
  const canToggleMonthBlock =
    monthBlockState !== "none" || keysBlockable(monthBlockKeys, appointments).length > 0;

  const intervalHint =
    interval === "30"
      ? "Pulsa cada tramo de 30 min"
      : interval === "60"
        ? "Pulsa una hora para bloquear los 2 tramos"
        : interval === "half"
          ? `Elige mañana o tarde y pulsa el día en la fila «${halfPeriod === "morning" ? "Mañana entera" : "Tarde entera"}»`
          : interval === "day"
            ? "Pulsa el nombre del día en la cabecera"
            : interval === "week"
              ? "Use el botón para bloquear o desbloquear toda la semana visible"
              : "Use el botón para bloquear o desbloquear todo el mes en pantalla";

  const navLinkClass =
    "inline-flex items-center gap-1 rounded-xl border-2 border-iaf-200/90 bg-white px-3 py-2.5 text-xs font-medium text-iaf-700 shadow-sm transition-colors hover:border-gold-400/50 hover:bg-cream-50 sm:text-sm";

  return (
    <div className="space-y-6">
      <section
        className="overflow-hidden rounded-2xl border-2 border-gold-400/55 bg-white shadow-lg shadow-iaf-900/[0.07] ring-1 ring-iaf-200/90"
        aria-label="Calendario y acciones de agenda"
      >
        <div className="border-b border-gold-400/35 bg-gradient-to-b from-cream-50 to-white px-3 py-4 sm:px-6">
          <div className="min-w-0 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
              {monthView ? "Vista mensual" : "Semana en curso"}
            </p>
            <h2 className="font-display mt-1 text-2xl font-bold capitalize tracking-tight text-iaf-900 sm:text-3xl">
              {monthView
                ? format(agendaMonthDate, "MMMM yyyy", { locale: es })
                : format(weekStart, "MMMM yyyy", { locale: es })}
            </h2>
            {!monthView && weekLabelProp ? (
              <p className="mt-1 text-xs text-iaf-600 sm:text-sm">{weekLabelProp}</p>
            ) : null}
            <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300 sm:mt-3 sm:w-20" />
          </div>
        </div>

        <div className="border-b border-iaf-200/80 bg-cream-50/60 px-4 py-3 sm:px-5">
          <div className="rounded-xl border-2 border-gold-400/25 bg-white p-2 shadow-inner sm:p-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              </div>

              {(pending || blockError || apptActionError) && (
                <div className="flex flex-wrap items-center gap-2">
                  {pending && (
                    <span className="shrink-0 whitespace-nowrap text-xs text-iaf-500">
                      Guardando…
                    </span>
                  )}
                  {blockError && (
                    <span className="shrink-0 whitespace-nowrap text-xs font-medium text-amber-800">
                      {blockError}
                    </span>
                  )}
                  {apptActionError && (
                    <span className="shrink-0 whitespace-nowrap text-xs font-medium text-red-700">
                      {apptActionError}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {rescheduleMode && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-200/80 bg-violet-50/90 px-4 py-2.5 sm:px-5">
            <p className="text-xs text-violet-900 sm:text-sm">
              Elija el <span className="font-semibold">nuevo día y hora</span> en el calendario
              (tramo libre en verde).
            </p>
            <Button type="button" variant="secondary" className="text-xs" onClick={cancelReschedule}>
              Volver al formulario sin cambiar
            </Button>
          </div>
        )}

        <div className="space-y-4 bg-cream-50/40 px-4 py-4 sm:px-6 sm:py-5">
          {monthView ? (
            <MonthAgendaView
              monthKey={agendaMonthKey}
              serverMonthKey={monthKey}
              initialCounts={monthCounts}
              refreshSignal={refreshSignal}
              embedded
              hideHeaderNav
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-iaf-200/80 bg-white/90 px-3 py-2.5 text-xs text-iaf-600">
        <div className="flex items-center gap-2">
          {monthView ? (
            <button
              type="button"
              onClick={() => setAgendaMonthKey((k) => prevMonthKey(k))}
              className={cn(navLinkClass, "shrink-0 whitespace-nowrap")}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
          ) : onNavigateWeek ? (
            <button
              type="button"
              aria-busy={weekNavPending}
              onClick={() => onNavigateWeek("prev")}
              className={cn(
                navLinkClass,
                "shrink-0 whitespace-nowrap",
                weekNavPending && "opacity-70"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
          ) : (
            <Link
              href={`/agenda?semana=${prevWeekKey(weekKey)}`}
              prefetch
              className={cn(navLinkClass, "shrink-0 whitespace-nowrap")}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className={cn(
              agendaToolbarButtonClass(editMode, "block"),
              "shrink-0 whitespace-nowrap text-xs"
            )}
            disabled={monthView}
            onClick={() => {
              setEditMode((v) => {
                if (!v) {
                  setAddMode(false);
                  setEditApptMode(false);
                  setMonthView(false);
                }
                return !v;
              });
            }}
          >
            {editMode ? (
              <>
                <Check className="h-4 w-4" />
                Finalizar
              </>
            ) : (
              <>
                <Ban className="h-4 w-4" />
                No disponible
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              agendaToolbarButtonClass(addMode, "add"),
              "shrink-0 whitespace-nowrap text-xs"
            )}
            disabled={monthView}
            onClick={() => {
              setAddMode((v) => {
                if (!v) {
                  setEditMode(false);
                  setEditApptMode(false);
                  setMonthView(false);
                }
                return !v;
              });
            }}
          >
            {addMode ? (
              <>
                <Check className="h-4 w-4" />
                Finalizar
              </>
            ) : (
              <>
                <CalendarPlus className="h-4 w-4" />
                Añadir
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              agendaToolbarButtonClass(editApptMode, "edit"),
              "shrink-0 whitespace-nowrap text-xs"
            )}
            disabled={monthView}
            onClick={() => {
              setEditApptMode((v) => {
                if (!v) {
                  setEditMode(false);
                  setAddMode(false);
                  setMonthView(false);
                }
                return !v;
              });
            }}
          >
            {editApptMode ? (
              <>
                <Check className="h-4 w-4" />
                Finalizar
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4" />
                Editar
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              agendaToolbarButtonClass(monthView, "month"),
              "shrink-0 whitespace-nowrap text-xs"
            )}
            onClick={() => {
              setMonthView((v) => {
                if (!v) {
                  setEditMode(false);
                  setAddMode(false);
                  setEditApptMode(false);
                }
                return !v;
              });
            }}
          >
            {monthView ? (
              <>
                <Check className="h-4 w-4" />
                Semanal
              </>
            ) : (
              <>
                <CalendarRange className="h-4 w-4" />
                Mensual
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {monthView ? (
            <button
              type="button"
              onClick={() => setAgendaMonthKey((k) => nextMonthKey(k))}
              className={cn(navLinkClass, "shrink-0 whitespace-nowrap")}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : onNavigateWeek ? (
            <button
              type="button"
              aria-busy={weekNavPending}
              onClick={() => onNavigateWeek("next")}
              className={cn(
                navLinkClass,
                "shrink-0 whitespace-nowrap",
                weekNavPending && "opacity-70"
              )}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href={`/agenda?semana=${nextWeekKey(weekKey)}`}
              prefetch
              className={cn(navLinkClass, "shrink-0 whitespace-nowrap")}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {editMode && !monthView && (
        <div className="mt-3 rounded-xl border border-iaf-200/80 bg-white/90 p-3 text-xs text-iaf-700 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-iaf-700">
            Grupo de opciones
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-iaf-700">Bloquear por:</span>
            {BLOCK_INTERVALS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setInterval(opt.id)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  interval === opt.id
                    ? "border-iaf-600 bg-iaf-600 text-white shadow-sm"
                    : "border-iaf-200 bg-white/80 text-iaf-700 hover:border-iaf-400 hover:bg-iaf-50"
                )}
                title={opt.hint}
              >
                {opt.label}
              </button>
            ))}
            {interval === "week" && (
              <Button
                type="button"
                variant="secondary"
                className="text-xs"
                disabled={pending || !canToggleWeekBlock}
                onClick={() => handleToggleGroup(weekBlockKeys)}
              >
                <Ban className="h-4 w-4" />
                {weekBlockState === "all"
                  ? "Desbloquear semana visible"
                  : "Bloquear semana visible"}
              </Button>
            )}
            {interval === "month" && (
              <Button
                type="button"
                variant="secondary"
                className="text-xs"
                disabled={pending || !canToggleMonthBlock}
                onClick={() => handleToggleGroup(monthBlockKeys)}
              >
                <Ban className="h-4 w-4" />
                {monthBlockState === "all"
                  ? `Desbloquear ${format(weekStart, "MMMM yyyy", { locale: es })}`
                  : `Bloquear ${format(weekStart, "MMMM yyyy", { locale: es })}`}
              </Button>
            )}
          </div>
          {interval === "half" && (
            <div className="mt-2 rounded-lg border border-violet-200 bg-violet-50/70 p-2">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-700">
                Selección de jornada
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHalfPeriod("morning")}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    halfPeriod === "morning"
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-violet-200 bg-white text-violet-700 hover:border-violet-400 hover:bg-violet-100"
                  )}
                >
                  <Sun className="h-3.5 w-3.5" />
                  Mañana (9:00–14:00)
                </button>
                <button
                  type="button"
                  onClick={() => setHalfPeriod("afternoon")}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    halfPeriod === "afternoon"
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-violet-200 bg-white text-violet-700 hover:border-violet-400 hover:bg-violet-100"
                  )}
                >
                  <Sunset className="h-3.5 w-3.5" />
                  Tarde (14:00–20:00)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          "overflow-x-auto rounded-xl border-2 bg-white shadow-inner",
          editMode
            ? "border-iaf-500/70 ring-2 ring-iaf-200/50"
            : rescheduleMode
              ? "border-violet-500/70 ring-2 ring-violet-200/50"
              : addMode
                ? "border-emerald-500/60 ring-2 ring-emerald-200/50"
                : editApptMode
                  ? "border-blue-500/60 ring-2 ring-blue-200/50"
                  : "border-iaf-300/90"
        )}
      >
        <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm table-fixed">
          <thead>
            <tr>
              <th className="sticky left-0 z-30 w-[3.25rem] border-b border-r border-iaf-200/60 bg-cream-100/95 p-1 text-[10px] font-medium text-iaf-500">
                Hora
              </th>
              {days.map((day, dayIndex) => {
                const kind = getDayKind(day);
                const isToday = isSameDay(day, new Date());
                const holiday = getHolidayName(day);
                const dayKeys = slotKeysForDay(day);
                const dayBlockState = groupEffectiveBlockedState(
                  dayKeys,
                  blockedSet,
                  editMode,
                  unblockedNonSchedulable
                );
                const dayBlockable = keysBlockable(dayKeys, appointments);
                const canToggleDay =
                  dayBlockState !== "none" || dayBlockable.length > 0;
                const dayApptCount =
                  apptsByDay[dayIndex]?.filter(isActiveAppt).length ?? 0;

                const buildHeaderContent = (daySelected: boolean) => (
                  <>
                    <p className="text-xs font-bold uppercase tracking-wide">
                      {format(day, "EEE", { locale: es })}
                    </p>
                    <p className={dayHeaderNumberClass(isToday, daySelected)}>
                      {format(day, "d")}
                    </p>
                    {dayApptCount > 0 && editMode && (
                      <p className="mt-0.5 text-[9px] font-medium text-emerald-700">
                        {dayApptCount} cita{dayApptCount !== 1 ? "s" : ""}
                      </p>
                    )}
                    {holiday && (
                      <p className="mt-0.5 text-[9px] font-semibold uppercase text-gold-700">
                        {holiday}
                      </p>
                    )}
                    {kind === "weekend" && !holiday && (
                      <p className="mt-0.5 text-[9px] font-medium text-iaf-600">Fin de semana</p>
                    )}
                  </>
                );

                if (editMode && interval === "day") {
                  return (
                    <th
                      key={day.toISOString()}
                      style={{ width: "calc((100% - 3.25rem) / 7)" }}
                      className="sticky top-0 z-20 border-b border-iaf-200/60 p-0"
                    >
                      <button
                        type="button"
                        disabled={pending || !canToggleDay}
                        onClick={() => handleToggleGroup(dayKeys)}
                        className={cn(
                          "w-full p-2 text-center transition-colors",
                          dayHeaderStyles[kind],
                          !canToggleDay
                            ? blockBtnDisabled
                            : blockBtnStyles[dayBlockState],
                          pending && "opacity-60"
                        )}
                        title={
                          !canToggleDay ? "Hay citas este día" : undefined
                        }
                      >
                        {buildHeaderContent(false)}
                        {dayBlockState === "all" && (
                          <Ban className="mx-auto mt-1 h-3.5 w-3.5" />
                        )}
                      </button>
                    </th>
                  );
                }

                const dayKey = format(day, "yyyy-MM-dd");
                const isSelected = selectedDayKey === dayKey;

                return (
                  <th
                    key={day.toISOString()}
                    style={{ width: "calc((100% - 3.25rem) / 7)" }}
                    className={cn(
                      "sticky top-0 z-20 border-b border-iaf-200/60 p-0 text-center",
                      dayHeaderStyles[kind]
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className="w-full p-2 transition duration-200 ease-out hover:bg-gold-100/70"
                      title={
                        isSelected
                          ? "Quitar filtro del listado"
                          : "Ver citas de este día en el listado"
                      }
                    >
                      {buildHeaderContent(isSelected)}
                      {!editMode && dayApptCount > 0 && (
                        <p className="mt-0.5 text-[9px] font-medium text-emerald-700">
                          {dayApptCount} cita{dayApptCount !== 1 ? "s" : ""}
                        </p>
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <SectionHeaderRow
              colSpan={colSpan}
              label="Mañana"
              range="9:00 – 14:00"
              icon={Sun}
              variant="morning"
              collapsed={collapsedPeriods.morning}
              onToggleCollapse={() =>
                setCollapsedPeriods((prev) => ({
                  ...prev,
                  morning: !prev.morning,
                }))
              }
            />
            {!collapsedPeriods.morning && (
              <>
                {editMode && interval === "half" && halfPeriod === "morning" && (
                  <HalfDayToggleRow
                    days={days}
                    apptsByDay={apptsByDay}
                    blockedSet={blockedSet}
                    editMode={editMode}
                    unblockedNonSchedulable={unblockedNonSchedulable}
                    period="morning"
                    onToggleGroup={handleToggleGroup}
                    pending={pending}
                    allAppointments={appointments}
                  />
                )}
                {!(editMode && (interval === "day" || (interval === "half" && halfPeriod === "morning"))) &&
                  MORNING_HOURS.map((hour) => (
                    <HourRow
                      key={`m-${hour}`}
                      hour={hour}
                      days={days}
                      apptsByDay={apptsByDay}
                      blockedSet={blockedSet}
                      unblockedNonSchedulable={unblockedNonSchedulable}
                      editMode={editMode}
                      pickSlotMode={pickSlotMode}
                      rescheduleMode={rescheduleMode}
                      editApptMode={editApptMode}
                      highlightAppointmentId={highlightedAppointmentId}
                      interval={interval}
                      onToggleGroup={handleToggleGroup}
                      onPickSlot={handlePickSlot}
                      onPickAppointment={handlePickAppointment}
                      pending={pending}
                      allAppointments={appointments}
                    />
                  ))}
              </>
            )}
            <SectionHeaderRow
              colSpan={colSpan}
              label="Tarde"
              range="14:00 – 20:00"
              icon={Sunset}
              variant="afternoon"
              collapsed={collapsedPeriods.afternoon}
              onToggleCollapse={() =>
                setCollapsedPeriods((prev) => ({
                  ...prev,
                  afternoon: !prev.afternoon,
                }))
              }
            />
            {!collapsedPeriods.afternoon && (
              <>
                {editMode && interval === "half" && halfPeriod === "afternoon" && (
                  <HalfDayToggleRow
                    days={days}
                    apptsByDay={apptsByDay}
                    blockedSet={blockedSet}
                    editMode={editMode}
                    unblockedNonSchedulable={unblockedNonSchedulable}
                    period="afternoon"
                    onToggleGroup={handleToggleGroup}
                    pending={pending}
                    allAppointments={appointments}
                  />
                )}
                {!(editMode && (interval === "day" || (interval === "half" && halfPeriod === "afternoon"))) &&
                  AFTERNOON_HOURS.map((hour) => (
                    <HourRow
                      key={`a-${hour}`}
                      hour={hour}
                      days={days}
                      apptsByDay={apptsByDay}
                      blockedSet={blockedSet}
                      unblockedNonSchedulable={unblockedNonSchedulable}
                      editMode={editMode}
                      pickSlotMode={pickSlotMode}
                      rescheduleMode={rescheduleMode}
                      editApptMode={editApptMode}
                      highlightAppointmentId={highlightedAppointmentId}
                      interval={interval}
                      onToggleGroup={handleToggleGroup}
                      onPickSlot={handlePickSlot}
                      onPickAppointment={handlePickAppointment}
                      pending={pending}
                      allAppointments={appointments}
                    />
                  ))}
              </>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-iaf-700">
        <span className="flex items-center gap-1.5 rounded-full border border-iaf-200/80 bg-white/90 px-2 py-1 shadow-sm">
          <span className="h-3 w-6 rounded border border-iaf-200/80 bg-white/90" />
          Laborable
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-iaf-200/80 bg-iaf-100/90 px-2 py-1 shadow-sm">
          <span className="h-3 w-6 rounded bg-iaf-200/70" />
          Fin de semana
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-iaf-200/80 bg-gold-100/90 px-2 py-1 shadow-sm">
          <span className="h-3 w-6 rounded bg-gold-200/80" />
          Festivo
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-iaf-200/80 bg-iaf-400/10 px-2 py-1 shadow-sm">
          <span className="h-3 w-6 rounded bg-iaf-400/80" />
          No disponible
        </span>
      </div>
            </>
          )}
        </div>
      </section>

      {(appointments.length > 0 || selectedDay) && (
        <section className="rounded-2xl border-2 border-gold-400/45 bg-white p-5 shadow-md shadow-iaf-900/[0.05] ring-1 ring-iaf-200/80">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-lg font-semibold text-iaf-900">
              {selectedDay
                ? format(selectedDay, "EEEE d MMMM", { locale: es })
                : "Listado de la semana"}
            </h3>
            {selectedDay && (
              <button
                type="button"
                onClick={() => setSelectedDayKey(null)}
                className="text-xs font-medium text-iaf-600 hover:text-iaf-900"
              >
                Ver toda la semana
              </button>
            )}
          </div>
          {listAppointments.length === 0 ? (
            <p className="mt-4 text-sm text-iaf-500">No hay citas este día.</p>
          ) : (
          <ul
            className={cn(
              "mt-4",
              selectedDay ? "space-y-2" : "divide-y divide-iaf-100"
            )}
          >
            {listAppointments.map((a) => {
              const h = getClinicDateParts(new Date(a.startAt)).hour;
              const period = h < AFTERNOON_START_HOUR ? "Mañana" : "Tarde";
              const kind = getDayKind(new Date(a.startAt));
              const holiday = getHolidayName(new Date(a.startAt));

              return (
                <li
                  key={a.id}
                  className={cn(
                    selectedDay
                      ? cn(
                          "flex flex-col overflow-hidden rounded-md border-l-[3px]",
                          apptCardStyle(a),
                          highlightedAppointmentId === a.id &&
                            "animate-pulse ring-2 ring-red-400/70",
                          editApptMode &&
                            a.status !== "COMPLETED" &&
                            "cursor-pointer transition-shadow hover:ring-2 hover:ring-blue-400/80"
                        )
                      : cn(
                          "flex flex-wrap items-center justify-between gap-3 py-3",
                          highlightedAppointmentId === a.id &&
                            "animate-pulse rounded-lg border border-red-300 bg-red-50/80 px-2 -mx-2",
                          editApptMode &&
                            a.status !== "COMPLETED" &&
                            "cursor-pointer rounded-lg px-2 -mx-2 transition-colors hover:bg-blue-50/80"
                        )
                  )}
                  onClick={
                    editApptMode && a.status !== "COMPLETED"
                      ? () => handlePickAppointment(a)
                      : undefined
                  }
                  onKeyDown={
                    editApptMode && a.status !== "COMPLETED"
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handlePickAppointment(a);
                          }
                        }
                      : undefined
                  }
                  role={editApptMode && a.status !== "COMPLETED" ? "button" : undefined}
                  tabIndex={editApptMode && a.status !== "COMPLETED" ? 0 : undefined}
                >
                  {selectedDay && (
                    <p
                      className={cn(
                        "border-b px-3 py-1.5 text-center text-xs font-semibold",
                        listApptStatusBannerClass(a)
                      )}
                    >
                      {listApptStatusLabel(a)}
                    </p>
                  )}
                  <div
                    className={cn(
                      "flex w-full flex-wrap items-center justify-between gap-3",
                      selectedDay && "px-3 py-3"
                    )}
                  >
                  <div>
                    <p className="font-medium text-iaf-900">{a.title}</p>
                    <p className="text-sm text-iaf-600">
                      {format(a.startAt, "EEEE d MMM", { locale: es })}
                      {holiday ? ` · ${holiday}` : kind === "weekend" ? " · Fin de semana" : ""} ·{" "}
                      {period} · {formatTime(a.startAt)} ({appointmentDurationLabel(a)}) —{" "}
                      {editApptMode ? (
                        <span>{fullName(a.patient.firstName, a.patient.lastName)}</span>
                      ) : (
                        <Link href={`/pacientes/${a.patient.id}`} className="hover:underline">
                          {fullName(a.patient.firstName, a.patient.lastName)}
                        </Link>
                      )}
                    </p>
                    {!selectedDay && (
                      <span className="text-xs text-iaf-500">{listApptStatusLabel(a)}</span>
                    )}
                    <p className="mt-1 text-xs text-iaf-500">
                      <span className="font-medium text-iaf-600">Cita pedida por el cliente:</span>{" "}
                      {formatDateTime(a.startAt)}
                    </p>
                    <p className="text-xs text-iaf-500">
                      <span className="font-medium text-iaf-600">Confirmación:</span>{" "}
                      {a.confirmedAt
                        ? formatDateTime(a.confirmedAt)
                        : a.status === "PENDING_CONFIRMATION"
                          ? "Pendiente de confirmar"
                          : "—"}
                    </p>
                    {a.performedAt && (
                      <p className="text-xs text-iaf-500">
                        <span className="font-medium text-amber-700">Realización:</span>{" "}
                        {formatDateTime(a.performedAt)}
                      </p>
                    )}
                  </div>
                  <div
                    className="flex flex-wrap gap-2"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    {a.status === "PENDING_CONFIRMATION" && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="text-xs"
                        disabled={pending}
                        onClick={() =>
                          runApptAction(`/api/agenda/appointments/${a.id}/confirm`)
                        }
                      >
                        Confirmar cita
                      </Button>
                    )}
                    {a.status === "CONFIRMED" && (
                      <Button
                        type="button"
                        variant="gold"
                        className="text-xs"
                        disabled={pending}
                        onClick={() =>
                          runApptAction(`/api/agenda/appointments/${a.id}/mark-performed`)
                        }
                      >
                        REALIZADO
                      </Button>
                    )}
                    {a.status === "COMPLETED" && a.invoice && (
                      <LinkButton
                        href={`/facturacion/${a.invoice.id}`}
                        variant="secondary"
                        className="text-xs"
                      >
                        Ver factura
                      </LinkButton>
                    )}
                    {editApptMode && a.status !== "COMPLETED" && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-xs text-red-500"
                        disabled={pending}
                        onClick={() => {
                          if (!window.confirm("¿Eliminar esta cita?")) return;
                          runApptAction(`/api/agenda/appointments/${a.id}/delete`);
                        }}
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                  </div>
                </li>
              );
            })}
          </ul>
          )}
        </section>
      )}

      <AppointmentModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalPayload(null);
          setRescheduleDraft(null);
        }}
        patients={patients}
        therapies={therapies}
        payload={modalPayload}
        onRefresh={onRefresh}
        onChangeDay={
          modalPayload?.mode === "edit" ? handleRequestChangeDay : undefined
        }
      />
    </div>
  );
}
