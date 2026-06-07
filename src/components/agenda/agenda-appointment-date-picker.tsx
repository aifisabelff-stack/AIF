"use client";

import { useEffect, useState } from "react";
import {
  addMonths,
  format,
  getDay,
  getDaysInMonth,
  isSameDay,
  parseISO,
  startOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getDayKind, getHolidayName } from "@/lib/holidays";
import { cn } from "@/lib/utils";

/** Semana empieza en lunes (España) */
const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const dayButtonStyles = {
  weekday: "bg-white text-iaf-800 hover:bg-gold-50",
  weekend: "bg-iaf-100/80 text-iaf-700 hover:bg-iaf-200/80",
  holiday: "bg-gold-100/90 text-iaf-900 hover:bg-gold-200/80",
} as const;

type Props = {
  value: string;
  onChange: (dateKey: string) => void;
};

export function AgendaAppointmentDatePicker({ value, onChange }: Props) {
  const selectedDate = parseISO(value);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selectedDate));

  useEffect(() => {
    setViewMonth(startOfMonth(parseISO(value)));
  }, [value]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth() + 1;
  const monthStart = startOfMonth(viewMonth);
  const daysInMonth = getDaysInMonth(viewMonth);
  const startPad = (getDay(monthStart) + 6) % 7;
  const cells: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(format(new Date(year, month - 1, d), "yyyy-MM-dd"));
  }

  const today = new Date();

  return (
    <div className="rounded-xl border border-iaf-200/80 bg-white/80 p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
          className="rounded-lg border border-iaf-200 p-1.5 text-iaf-600 hover:bg-iaf-50"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-display text-sm font-semibold capitalize text-iaf-900">
          {format(viewMonth, "MMMM yyyy", { locale: es })}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="rounded-lg border border-iaf-200 p-1.5 text-iaf-600 hover:bg-iaf-50"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold text-iaf-500">
        {WEEKDAY_LABELS.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-0.5">
        {cells.map((dateKey, i) => {
          if (!dateKey) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }
          const day = parseISO(dateKey);
          const kind = getDayKind(day);
          const holiday = getHolidayName(day);
          const isSelected = value === dateKey;
          const isToday = isSameDay(day, today);

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onChange(dateKey)}
              className={cn(
                "flex aspect-square items-center justify-center text-xs font-medium transition-colors",
                !isSelected && "rounded-md",
                dayButtonStyles[kind],
                isSelected &&
                  "rounded-full ring-2 ring-yellow-400 ring-offset-1 bg-yellow-50/90",
                isToday && !isSelected && "border-2 border-gold-700"
              )}
              title={holiday ?? undefined}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-center text-xs text-iaf-600">
        Seleccionado:{" "}
        <span className="font-medium text-iaf-900">
          {format(selectedDate, "EEEE d 'de' MMMM yyyy", { locale: es })}
        </span>
      </p>

      <div className="mt-2 flex flex-wrap justify-center gap-3 text-[10px] text-iaf-500">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded border border-iaf-200 bg-white" />
          Laborable
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-iaf-100" />
          Fin de semana
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-gold-100" />
          Festivo
        </span>
      </div>
    </div>
  );
}
