"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import type { AgendaAppointment } from "@/lib/firestore-types";
import { WeekCalendar } from "@/components/agenda/week-calendar";
import type { TherapyOption } from "@/components/agenda/therapy-select";
import { readResponseJson } from "@/lib/http-json";
import { getWeekRange, prevWeekKey, nextWeekKey } from "@/lib/utils";

type Appt = AgendaAppointment;

type PatientOption = { id: string; firstName: string; lastName: string };

function parseAppointments(raw: Appt[]): Appt[] {
  return raw.map((a) => ({
    ...a,
    startAt: new Date(a.startAt),
    endAt: new Date(a.endAt),
    createdAt: new Date(a.createdAt),
    updatedAt: new Date(a.updatedAt),
    confirmedAt: a.confirmedAt ? new Date(a.confirmedAt) : undefined,
    performedAt: a.performedAt ? new Date(a.performedAt) : undefined,
  }));
}

function syncWeekInUrl(weekKey: string) {
  const path = `/agenda?semana=${encodeURIComponent(weekKey)}`;
  window.history.replaceState(window.history.state, "", path);
}

type Props = {
  patients: PatientOption[];
  therapies: TherapyOption[];
  monthKey: string;
  monthCounts: Record<string, number>;
};

export function AgendaCalendar({ patients, therapies, monthKey, monthCounts }: Props) {
  const searchParams = useSearchParams();
  const initialKey = getWeekRange(searchParams.get("semana") ?? undefined).key;

  const [weekKey, setWeekKey] = useState(initialKey);
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [blockedSlotTimes, setBlockedSlotTimes] = useState<number[]>([]);
  const [weekLabel, setWeekLabel] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [pending, startTransition] = useTransition();

  const loadWeek = useCallback(async (targetKey: string) => {
    const res = await fetch(
      `/api/agenda/week-data?semana=${encodeURIComponent(targetKey)}`,
      { cache: "no-store" }
    );
    const data = await readResponseJson<{
      weekKey?: string;
      weekLabel?: string;
      appointments?: Appt[];
      blockedSlotTimes?: number[];
      error?: string;
    }>(res);
    if (!res.ok || !data || data.error) {
      throw new Error(data?.error ?? "No se pudo cargar la semana");
    }
    const key = data.weekKey ?? targetKey;
    setWeekKey(key);
    setWeekLabel(data.weekLabel ?? "");
    setAppointments(parseAppointments(data.appointments ?? []));
    setBlockedSlotTimes(data.blockedSlotTimes ?? []);
    return key;
  }, []);

  const refreshWeek = useCallback(async () => {
    setLoadError(null);
    setRefreshSignal((value) => value + 1);
    await loadWeek(weekKey);
  }, [loadWeek, weekKey]);

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      setLoadError(null);
      try {
        await loadWeek(initialKey);
        if (!cancelled && !searchParams.get("semana")) {
          syncWeekInUrl(initialKey);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Error al cargar la agenda");
        }
      }
    });
    return () => {
      cancelled = true;
    };
    // Solo carga inicial al montar (no reaccionar a router.replace de Next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const key = getWeekRange(params.get("semana") ?? undefined).key;
      startTransition(async () => {
        setLoadError(null);
        try {
          await loadWeek(key);
        } catch (e) {
          setLoadError(e instanceof Error ? e.message : "Error al cargar la agenda");
        }
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [loadWeek]);

  const navigateWeek = useCallback(
    (direction: "prev" | "next") => {
      const fromKey = weekKey;
      const target =
        direction === "prev" ? prevWeekKey(fromKey) : nextWeekKey(fromKey);
      setWeekKey(target);
      startTransition(async () => {
        setLoadError(null);
        try {
          const key = await loadWeek(target);
          syncWeekInUrl(key);
        } catch (e) {
          setLoadError(e instanceof Error ? e.message : "Error al cambiar de semana");
          setWeekKey(fromKey);
          try {
            await loadWeek(fromKey);
          } catch {
            /* sin datos previos */
          }
        }
      });
    },
    [weekKey, loadWeek]
  );

  if (loadError && appointments.length === 0 && !pending) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {loadError}
      </p>
    );
  }

  return (
    <>
      {loadError ? (
        <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {loadError}
        </p>
      ) : null}
      <WeekCalendar
        weekKey={weekKey}
        weekLabel={weekLabel}
        appointments={appointments}
        blockedSlotTimes={blockedSlotTimes}
        patients={patients}
        therapies={therapies}
        monthKey={monthKey}
        monthCounts={monthCounts}
        weekNavPending={pending}
        onNavigateWeek={navigateWeek}
        onRefresh={refreshWeek}
        refreshSignal={refreshSignal}
      />
    </>
  );
}
