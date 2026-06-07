"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  THERAPY_CATALOG,
  catalogDbNamesForGroup,
  type TherapyCatalogGroup,
} from "@/lib/therapies";
import { TherapyIcon } from "@/components/panel/therapy-icon";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readResponseJson } from "@/lib/http-json";
import { cn, formatCurrency } from "@/lib/utils";

type Therapy = {
  id: string;
  name: string;
  active: boolean;
  price: number | null;
};

function priceToInputValue(price: number | null): string {
  if (price == null) return "";
  return String(price);
}

function resolveGroupRows(group: TherapyCatalogGroup, therapies: Therapy[]) {
  const names = catalogDbNamesForGroup(group);
  const rows = therapies.filter((t) => names.includes(t.name));
  const session = rows.find((t) => t.name.includes("— Sesión"));
  const bono = rows.find((t) => t.name.includes("Bono"));
  const pack = rows.find((t) => t.name === group.title);
  const valuation = rows.find((t) => t.name.includes("valoración"));
  return { session, bono, pack, valuation, rows };
}

const FEATURED_GROUP_KEYS = new Set(["pack-glow", "pack-regeneracion"]);

function PriceField({
  label,
  dbName,
  value,
  disabled,
  saving,
  onChange,
  onBlur,
}: {
  label: string;
  dbName: string;
  value: string;
  disabled: boolean;
  saving: boolean;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <div className="rounded-xl border border-iaf-200/70 bg-white/90 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-iaf-500">
        {label}
      </p>
      <div className="relative mt-1.5">
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step={0.01}
          placeholder="—"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="pr-8 text-base font-semibold"
          aria-label={`${label} ${dbName}`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-iaf-500">
          €
        </span>
      </div>
      {saving && <p className="mt-1 text-[10px] text-iaf-400">Guardando…</p>}
    </div>
  );
}

export function AvailableTherapies({ therapies }: { therapies: Therapy[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [savingName, setSavingName] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  useEffect(() => {
    setPrices(
      Object.fromEntries(therapies.map((t) => [t.name, priceToInputValue(t.price)]))
    );
  }, [therapies]);

  const activeCount = useMemo(
    () => therapies.filter((t) => t.active).length,
    [therapies]
  );

  function handleToggleGroup(groupKey: string) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/panel/therapies/toggle-group", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupKey }),
        });
        if (res.ok) router.refresh();
      } catch {
        /* ignore */
      }
    });
  }

  async function handlePriceBlur(dbName: string) {
    const therapy = therapies.find((t) => t.name === dbName);
    if (!therapy) return;

    const raw = (prices[dbName] ?? "").trim().replace(",", ".");
    const parsed = raw === "" ? 0 : parseFloat(raw);

    if (raw !== "" && (!Number.isFinite(parsed) || parsed < 0)) {
      setPriceError("Precio no válido");
      setPrices((p) => ({ ...p, [dbName]: priceToInputValue(therapy.price) }));
      return;
    }

    const saved = therapy.price ?? 0;
    if (parsed === saved) return;

    setSavingName(dbName);
    setPriceError(null);
    try {
      const res = await fetch("/api/panel/therapies/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: dbName, price: parsed }),
      });
      const result = await readResponseJson<{ error?: string }>(res);
      if (result?.error) {
        setPriceError(result.error);
        setPrices((p) => ({ ...p, [dbName]: priceToInputValue(therapy.price) }));
        return;
      }
      router.refresh();
    } catch {
      setPriceError("No se pudo guardar el precio");
      setPrices((p) => ({ ...p, [dbName]: priceToInputValue(therapy.price) }));
    } finally {
      setSavingName(null);
    }
  }

  return (
    <Card title="Terapias disponibles" accent>
      <p className="mb-5 text-sm text-iaf-600">
        Active cada tratamiento para la reserva online. Sesión y bono se gestionan en la misma
        tarjeta.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {THERAPY_CATALOG.map((group) => {
          const { session, bono, pack, valuation, rows } = resolveGroupRows(
            group,
            therapies
          );
          const groupActive =
            rows.length > 0 && rows.every((r) => r.active);
          const groupPartial =
            rows.length > 0 && rows.some((r) => r.active) && !groupActive;
          const isFeatured = FEATURED_GROUP_KEYS.has(group.key);

          return (
            <article
              key={group.key}
              className={cn(
                "flex flex-col rounded-2xl border p-4 transition-shadow",
                isFeatured
                  ? "border-gold-500/55 bg-gradient-to-br from-gold-100/95 via-rose-50/50 to-white shadow-md ring-2 ring-gold-400/45"
                  : groupActive
                    ? "border-gold-400/50 bg-gradient-to-br from-gold-50/80 to-white shadow-sm ring-1 ring-gold-300/30"
                    : "border-iaf-200/80 bg-white/80",
                !isFeatured && groupPartial && "border-amber-300/60 bg-amber-50/30"
              )}
            >
              <div className="flex gap-3">
                <TherapyIcon icon={group.icon} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      {isFeatured && (
                        <span className="mb-1.5 inline-block rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-700">
                          Destacado
                        </span>
                      )}
                      <h3
                        className={cn(
                          "font-display font-semibold leading-snug text-iaf-900",
                          isFeatured ? "text-lg" : "text-base"
                        )}
                      >
                        {group.title}
                      </h3>
                      {group.subtitle && (
                        <p className="mt-0.5 text-xs leading-relaxed text-iaf-600">
                          {group.subtitle}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={pending || rows.length === 0}
                      onClick={() => handleToggleGroup(group.key)}
                      aria-label={
                        groupActive
                          ? `Desactivar ${group.title}`
                          : `Activar ${group.title}`
                      }
                      className={cn(
                        "shrink-0 rounded-lg transition-colors",
                        groupActive
                          ? "h-8 w-8 hover:bg-gold-100/60"
                          : "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-iaf-100 text-iaf-600 hover:bg-iaf-200",
                        pending && "opacity-60"
                      )}
                    >
                      {!groupActive &&
                        (groupPartial ? "Parcial" : "Inactiva")}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {group.singleOption && rows.length > 0 && (
                  <p className="rounded-xl border border-gold-200/80 bg-gold-50/50 px-3 py-2.5 text-sm text-iaf-800">
                    Consulta inicial sin precio fijo en la reserva online.
                  </p>
                )}

                {group.valuationOnly && valuation && (
                  <p className="rounded-xl border border-amber-200/80 bg-amber-50/60 px-3 py-2.5 text-sm text-amber-900">
                    Precio según zona y valoración previa en consulta.
                  </p>
                )}

                {group.packPrice != null && pack && (
                  <PriceField
                    label="Precio pack"
                    dbName={pack.name}
                    value={prices[pack.name] ?? ""}
                    disabled={pending || savingName === pack.name}
                    saving={savingName === pack.name}
                    onChange={(v) => setPrices((p) => ({ ...p, [pack.name]: v }))}
                    onBlur={() => handlePriceBlur(pack.name)}
                  />
                )}

                {group.sessionPrice != null && session && (
                  <div className="grid grid-cols-2 gap-2">
                    <PriceField
                      label="Sesión"
                      dbName={session.name}
                      value={prices[session.name] ?? ""}
                      disabled={pending || savingName === session.name}
                      saving={savingName === session.name}
                      onChange={(v) =>
                        setPrices((p) => ({ ...p, [session.name]: v }))
                      }
                      onBlur={() => handlePriceBlur(session.name)}
                    />
                    {bono && (
                      <PriceField
                        label={
                          group.bonoPerSessionNote
                            ? `Bono 3 ses. (${group.bonoPerSessionNote})`
                            : "Bono 3 sesiones"
                        }
                        dbName={bono.name}
                        value={prices[bono.name] ?? ""}
                        disabled={pending || savingName === bono.name}
                        saving={savingName === bono.name}
                        onChange={(v) =>
                          setPrices((p) => ({ ...p, [bono.name]: v }))
                        }
                        onBlur={() => handlePriceBlur(bono.name)}
                      />
                    )}
                  </div>
                )}

                {group.sessionPrice != null && session && bono && (
                  <p className="text-center text-[11px] text-iaf-500">
                    Reserva: {formatCurrency(session.price ?? group.sessionPrice)} / sesión
                    {" · "}
                    {formatCurrency(bono.price ?? group.bonoPrice)} bono
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {priceError && <p className="mt-3 text-sm text-red-600">{priceError}</p>}
      {activeCount === 0 && (
        <p className="mt-4 text-sm font-medium text-amber-800">
          No hay terapias activas. Active al menos una para permitir reservas.
        </p>
      )}
    </Card>
  );
}
