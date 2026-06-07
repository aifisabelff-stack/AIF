"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addMonths,
  format,
  isBefore,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  getDaysInMonth,
  getDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Sun, Sunset } from "lucide-react";
import {
  canGoNextBookingMonth,
  canGoPrevBookingMonth,
  clampBookingViewMonth,
  bookingDateInWindow,
  getBookingWindowBounds,
} from "@/lib/booking-window";
import { isSchedulableDay } from "@/lib/holidays";
import { readResponseJson } from "@/lib/http-json";
import { cn } from "@/lib/utils";
import {
  AFTERNOON_START_HOUR,
  DEFAULT_APPOINTMENT_DURATION_MINUTES,
} from "@/lib/agenda-slots";

const BOOKING_DURATION = String(DEFAULT_APPOINTMENT_DURATION_MINUTES);

type WeekDay = {
  date: string;
  schedulable: boolean;
  slots: string[];
  hasSlots: boolean;
};

type Props = {
  selectedDate: string;
  selectedTime: string;
  onSelect: (date: string, time: string) => void;
};

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

function isDaySelectable(dateKey: string): boolean {
  if (!bookingDateInWindow(dateKey)) return false;
  const day = parseISO(dateKey);
  if (isBefore(startOfDay(day), startOfDay(new Date()))) return false;
  return isSchedulableDay(day);
}

export function BookingDatePicker({
  selectedDate,
  selectedTime,
  onSelect,
}: Props) {
  const [viewMonth, setViewMonth] = useState(() =>
    clampBookingViewMonth(startOfMonth(new Date()))
  );
  const [availableDays, setAvailableDays] = useState<Set<string>>(new Set());
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pickedDay, setPickedDay] = useState<string | null>(null);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth() + 1;

  const loadMonth = useCallback(async () => {
    setLoadingMonth(true);
    setLoadError(null);
    try {
      const res = await fetch(
        `/api/booking/month?year=${year}&month=${month}&duration=${BOOKING_DURATION}`,
        { cache: "no-store" }
      );
      const data = await readResponseJson<{
        availableDays?: string[];
        error?: string;
      }>(res);
      if (!res.ok || !data) {
        throw new Error(data?.error ?? "Error al cargar el mes");
      }
      setAvailableDays(new Set(data.availableDays ?? []));
    } catch {
      setLoadError("No se pudo cargar la disponibilidad. Puede elegir un día laborable.");
      setAvailableDays(new Set());
    } finally {
      setLoadingMonth(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  const loadWeek = useCallback(async (dateKey: string) => {
    setLoadingWeek(true);
    setLoadError(null);
    try {
      const weekStart = format(
        startOfWeek(parseISO(dateKey), { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      );
      const res = await fetch(
        `/api/booking/week?weekStart=${weekStart}&duration=${BOOKING_DURATION}`,
        { cache: "no-store" }
      );
      const data = await readResponseJson<{ days?: WeekDay[]; error?: string }>(res);
      if (!res.ok || !data) {
        throw new Error(data?.error ?? "Error al cargar la semana");
      }
      setWeekDays(data.days ?? []);
    } catch {
      setLoadError("No se pudieron cargar los horarios de esa semana.");
      setWeekDays([]);
    } finally {
      setLoadingWeek(false);
    }
  }, []);

  useEffect(() => {
    if (pickedDay) loadWeek(pickedDay);
    else setWeekDays([]);
  }, [pickedDay, loadWeek]);

  useEffect(() => {
    if (selectedDate && !pickedDay) {
      setPickedDay(selectedDate);
      setViewMonth(clampBookingViewMonth(startOfMonth(parseISO(selectedDate))));
    }
  }, [selectedDate, pickedDay]);

  const canPrevMonth = canGoPrevBookingMonth(viewMonth);
  const canNextMonth = canGoNextBookingMonth(viewMonth);
  const { firstMonth, lastMonth } = getBookingWindowBounds();

  function handleDayClick(dateKey: string) {
    if (!isDaySelectable(dateKey)) return;
    setPickedDay(dateKey);
    if (selectedDate === dateKey && selectedTime) return;
    onSelect(dateKey, "");
  }

  function handleSlotClick(dateKey: string, time: string) {
    onSelect(dateKey, time);
  }

  const monthStart = startOfMonth(viewMonth);
  const daysInMonth = getDaysInMonth(viewMonth);
  const startPad = (getDay(monthStart) + 6) % 7;
  const cells: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = format(new Date(year, month - 1, d), "yyyy-MM-dd");
    cells.push(dateKey);
  }

  const activeDay = pickedDay ?? selectedDate;
  const activeWeekDay = weekDays.find((d) => d.date === activeDay);
  const morningSlots =
    activeWeekDay?.slots.filter((t) => {
      const h = parseInt(t.split(":")[0], 10);
      return h < AFTERNOON_START_HOUR;
    }) ?? [];
  const afternoonSlots =
    activeWeekDay?.slots.filter((t) => {
      const h = parseInt(t.split(":")[0], 10);
      return h >= AFTERNOON_START_HOUR;
    }) ?? [];

  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      <div>
        <p className="mb-2 text-sm font-medium text-iaf-800">Fecha y hora *</p>
        <p className="mb-3 text-xs text-iaf-500">
          Los días en verde tienen huecos libres. Elija un día dentro de{" "}
          {format(firstMonth, "MMMM yyyy", { locale: es })}
          {firstMonth.getTime() !== lastMonth.getTime() && (
            <>
              {" "}
              — {format(lastMonth, "MMMM yyyy", { locale: es })}
            </>
          )}
          .
        </p>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={!canPrevMonth}
            onClick={(e) => {
              e.stopPropagation();
              setViewMonth((m) => clampBookingViewMonth(addMonths(m, -1)));
            }}
            className={cn(
              "rounded-lg border border-iaf-200 p-1.5 text-iaf-600 hover:bg-iaf-50",
              !canPrevMonth && "cursor-not-allowed opacity-40"
            )}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-display text-sm font-semibold capitalize text-iaf-900">
            {format(viewMonth, "MMMM yyyy", { locale: es })}
            {loadingMonth && (
              <span className="ml-2 text-xs font-normal text-iaf-400">…</span>
            )}
          </span>
          <button
            type="button"
            disabled={!canNextMonth}
            onClick={(e) => {
              e.stopPropagation();
              setViewMonth((m) => clampBookingViewMonth(addMonths(m, 1)));
            }}
            className={cn(
              "rounded-lg border border-iaf-200 p-1.5 text-iaf-600 hover:bg-iaf-50",
              !canNextMonth && "cursor-not-allowed opacity-40"
            )}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold text-iaf-500">
          {WEEKDAY_LABELS.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>

        {loadError && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {loadError}
          </p>
        )}

        <div
          className={cn("mt-1 grid grid-cols-7 gap-0.5", loadingMonth && "opacity-70")}
          aria-busy={loadingMonth}
        >
          {cells.map((dateKey, i) => {
            if (!dateKey) {
              return <div key={`empty-${i}`} className="aspect-square" />;
            }
            const dayNum = parseInt(dateKey.slice(-2), 10);
            const selectable = isDaySelectable(dateKey);
            const hasSlots = availableDays.has(dateKey);
            const isSelected = activeDay === dateKey;
            const isPicked = pickedDay === dateKey;

            return (
              <button
                key={dateKey}
                type="button"
                disabled={!selectable}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDayClick(dateKey);
                }}
                className={cn(
                  "aspect-square rounded-md text-xs font-medium transition-colors",
                  !selectable && "cursor-not-allowed bg-iaf-50/80 text-iaf-300",
                  selectable &&
                    hasSlots &&
                    "bg-emerald-100 text-emerald-900 hover:bg-emerald-200",
                  selectable &&
                    !hasSlots &&
                    "border border-iaf-200/80 bg-white text-iaf-800 hover:border-gold-400 hover:bg-gold-50/80",
                  isSelected && "ring-2 ring-gold-500 ring-offset-1",
                  isPicked && !isSelected && "ring-1 ring-emerald-500"
                )}
                title={
                  !selectable
                    ? "Sin disponibilidad"
                    : hasSlots
                      ? `${dateKey} — con huecos`
                      : `${dateKey} — pulse para ver horarios`
                }
              >
                {dayNum}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex items-center gap-3 text-[10px] text-iaf-500">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-300" />
            Con huecos
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded border border-iaf-200 bg-white" />
            Elegible
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-iaf-50" />
            No disponible
          </span>
        </div>
      </div>

      {pickedDay && (
        <div className="rounded-xl border border-iaf-200/80 bg-white/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-iaf-600">
            Semana del{" "}
            {format(
              startOfWeek(parseISO(pickedDay), { weekStartsOn: 1 }),
              "d MMM",
              { locale: es }
            )}
          </p>

          <div
            className={cn(
              "mt-2 grid grid-cols-7 gap-1",
              loadingWeek && "opacity-70"
            )}
          >
            {weekDays.map((d) => {
              const dayNum = parseInt(d.date.slice(-2), 10);
              const isActive = activeDay === d.date;
              const weekSelectable = isDaySelectable(d.date);
              return (
                <button
                  key={d.date}
                  type="button"
                  disabled={!weekSelectable}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!weekSelectable) return;
                    setPickedDay(d.date);
                    onSelect(d.date, d.date === selectedDate ? selectedTime : "");
                  }}
                  className={cn(
                    "rounded-lg py-1.5 text-center text-[10px] font-medium",
                    weekSelectable &&
                      d.hasSlots &&
                      "bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
                    weekSelectable &&
                      !d.hasSlots &&
                      "border border-iaf-200/60 bg-white text-iaf-700 hover:bg-gold-50/80",
                    !weekSelectable && "cursor-not-allowed text-iaf-300",
                    !d.schedulable && weekSelectable && "opacity-60",
                    isActive && "ring-2 ring-gold-500"
                  )}
                >
                  <span className="block text-[9px] uppercase text-iaf-500">
                    {format(parseISO(d.date), "EEE", { locale: es })}
                  </span>
                  {dayNum}
                </button>
              );
            })}
          </div>

          {activeWeekDay && (
            <div className="mt-3 space-y-3">
              <p className="text-sm font-medium text-iaf-900">
                {format(parseISO(activeDay), "EEEE d 'de' MMMM", { locale: es })}
              </p>
              {!activeWeekDay.hasSlots ? (
                <p className="text-xs text-iaf-500">No hay huecos este día.</p>
              ) : (
                <>
                  {morningSlots.length > 0 && (
                    <SlotGroup
                      icon={Sun}
                      label="Mañana"
                      slots={morningSlots}
                      dateKey={activeDay}
                      selectedTime={selectedTime}
                      onPick={handleSlotClick}
                    />
                  )}
                  {afternoonSlots.length > 0 && (
                    <SlotGroup
                      icon={Sunset}
                      label="Tarde"
                      slots={afternoonSlots}
                      dateKey={activeDay}
                      selectedTime={selectedTime}
                      onPick={handleSlotClick}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {selectedDate && selectedTime && (
        <p className="rounded-lg bg-gold-50/80 px-3 py-2 text-sm text-iaf-800">
          <span className="font-medium">Cita:</span>{" "}
          {format(parseISO(selectedDate), "EEEE d MMMM", { locale: es })} a las{" "}
          {selectedTime}
        </p>
      )}
    </div>
  );
}

function SlotGroup({
  icon: Icon,
  label,
  slots,
  dateKey,
  selectedTime,
  onPick,
}: {
  icon: typeof Sun;
  label: string;
  slots: string[];
  dateKey: string;
  selectedTime: string;
  onPick: (date: string, time: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-iaf-700">
        <Icon className="h-3.5 w-3.5 text-gold-600" />
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {slots.map((time) => (
          <button
            key={time}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPick(dateKey, time);
            }}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
              selectedTime === time
                ? "border-gold-500 bg-gold-500 text-white"
                : "border-emerald-300/80 bg-emerald-50 text-emerald-900 hover:border-emerald-500"
            )}
          >
            {time}
          </button>
        ))}
      </div>
    </div>
  );
}
