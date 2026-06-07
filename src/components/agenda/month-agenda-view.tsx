"use client";

import { useCallback, useEffect, useState } from "react";
import {
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
import { readResponseJson } from "@/lib/http-json";
import { cn, nextMonthKey, prevMonthKey } from "@/lib/utils";

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

type Props = {
  monthKey: string;
  initialCounts: Record<string, number>;
  /** Mes cargado en servidor (para reutilizar `initialCounts` sin nueva petición) */
  serverMonthKey?: string;
  /** Sin marco exterior (dentro del panel de agenda) */
  embedded?: boolean;
  /** Oculta navegación interna (la lleva la cabecera de agenda) */
  hideHeaderNav?: boolean;
  refreshSignal?: number;
};

export function MonthAgendaView({
  monthKey,
  initialCounts,
  serverMonthKey,
  embedded = false,
  hideHeaderNav = false,
  refreshSignal,
}: Props) {
  const [internalMonthKey, setInternalMonthKey] = useState(monthKey);
  const [lastRefreshSignal, setLastRefreshSignal] = useState(refreshSignal);
  const activeMonthKey = hideHeaderNav ? monthKey : internalMonthKey;
  const countsMonthKey = serverMonthKey ?? monthKey;
  const [counts, setCounts] = useState(initialCounts);
  const [loading, setLoading] = useState(false);

  const loadMonth = useCallback(async (key: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/agenda/month-counts?monthKey=${encodeURIComponent(key)}`,
        { cache: "no-store" }
      );
      const data = await readResponseJson<{ counts?: Record<string, number> }>(res);
      setCounts(data?.counts ?? {});
    } catch {
      setCounts({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hideHeaderNav) setInternalMonthKey(monthKey);
  }, [monthKey, hideHeaderNav]);

  useEffect(() => {
    if (
      refreshSignal === undefined ||
      refreshSignal === lastRefreshSignal
    ) {
      return;
    }
    setLastRefreshSignal(refreshSignal);
    loadMonth(activeMonthKey);
  }, [refreshSignal, lastRefreshSignal, activeMonthKey, loadMonth]);

  const viewMonth = parseISO(`${activeMonthKey}-01`);
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth() + 1;

  useEffect(() => {
    if (activeMonthKey === countsMonthKey) {
      setCounts(initialCounts);
      return;
    }
    loadMonth(activeMonthKey);
  }, [activeMonthKey, countsMonthKey, initialCounts, loadMonth]);

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
    <div
      className={cn(
        embedded
          ? "rounded-xl border-2 border-iaf-300/90 bg-white p-4 shadow-inner sm:p-5"
          : "rounded-2xl border-2 border-gold-400/45 bg-white p-4 shadow-md sm:p-6",
        loading && "opacity-70"
      )}
    >
      {!hideHeaderNav && (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setInternalMonthKey((k) => prevMonthKey(k))}
            className="rounded-lg border border-iaf-200 p-2 text-iaf-600 hover:bg-iaf-50"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-display text-lg font-semibold capitalize text-iaf-900 sm:text-xl">
            {format(viewMonth, "MMMM yyyy", { locale: es })}
          </span>
          <button
            type="button"
            onClick={() => setInternalMonthKey((k) => nextMonthKey(k))}
            className="rounded-lg border border-iaf-200 p-2 text-iaf-600 hover:bg-iaf-50"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <p
        className={cn(
          "text-center text-xs text-iaf-500",
          hideHeaderNav ? "mt-0" : "mt-2"
        )}
      >
        Número de citas por día (sin contar anuladas)
      </p>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-iaf-500 sm:gap-2">
        {WEEKDAY_LABELS.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((dateKey, i) => {
          if (!dateKey) {
            return <div key={`empty-${i}`} className="aspect-square min-h-[3.5rem]" />;
          }

          const day = parseISO(dateKey);
          const dayNum = day.getDate();
          const count = counts[dateKey] ?? 0;
          const kind = getDayKind(day);
          const holiday = getHolidayName(day);
          const isToday = isSameDay(day, today);

          return (
            <div
              key={dateKey}
              className={cn(
                "flex aspect-square min-h-[3.5rem] flex-col items-center justify-center rounded-xl border p-1 text-center sm:min-h-[4.5rem]",
                kind === "weekend" && "border-iaf-200/80 bg-iaf-100/60",
                kind === "holiday" && "border-gold-300/50 bg-gold-100/50",
                kind === "weekday" && "border-iaf-200/60 bg-white/90",
                isToday && "ring-2 ring-gold-500 ring-offset-1"
              )}
              title={
                holiday
                  ? `${holiday} · ${count} cita${count !== 1 ? "s" : ""}`
                  : `${count} cita${count !== 1 ? "s" : ""}`
              }
            >
              <span className="text-sm font-semibold text-iaf-800">{dayNum}</span>
              <span
                className={cn(
                  "mt-0.5 font-display text-lg font-bold leading-none sm:text-xl",
                  count > 0 ? "text-gold-600" : "text-iaf-300"
                )}
              >
                {count}
              </span>
              {holiday && (
                <span className="mt-0.5 line-clamp-1 text-[8px] font-medium text-gold-700 sm:text-[9px]">
                  {holiday}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
