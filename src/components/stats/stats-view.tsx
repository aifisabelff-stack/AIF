"use client";

import { useState } from "react";
import { Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientStatsSection } from "@/components/stats/client-stats-section";
import { AccountingStatsSection } from "@/components/stats/accounting-stats-section";
import type { getClientStatistics, getStatistics } from "@/lib/queries";

type TabId = "clientes" | "contabilidad";

type Props = {
  clientStats: Awaited<ReturnType<typeof getClientStatistics>>;
  accountingStats: Awaited<ReturnType<typeof getStatistics>>;
};

const TABS: { id: TabId; label: string; icon: typeof Users }[] = [
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "contabilidad", label: "Contabilidad", icon: Wallet },
];

export function StatsView({ clientStats, accountingStats }: Props) {
  const [tab, setTab] = useState<TabId>("clientes");

  return (
    <div className="space-y-6">
      <div
        className="flex flex-wrap gap-2 rounded-2xl border border-gold-400/25 bg-cream-50/90 p-1.5 sm:p-2"
        role="tablist"
        aria-label="Secciones de estadísticas"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`stats-panel-${id}`}
              id={`stats-tab-${id}`}
              onClick={() => setTab(id)}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors sm:flex-none sm:min-w-[10rem]",
                active
                  ? "bg-gold-500 text-white shadow-sm"
                  : "text-iaf-700 hover:bg-white/80"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              {label}
            </button>
          );
        })}
      </div>

      <div
        id="stats-panel-clientes"
        role="tabpanel"
        aria-labelledby="stats-tab-clientes"
        hidden={tab !== "clientes"}
        className={tab !== "clientes" ? "hidden" : undefined}
      >
        <ClientStatsSection stats={clientStats} showTitle={false} />
      </div>

      <div
        id="stats-panel-contabilidad"
        role="tabpanel"
        aria-labelledby="stats-tab-contabilidad"
        hidden={tab !== "contabilidad"}
        className={tab !== "contabilidad" ? "hidden" : undefined}
      >
        <AccountingStatsSection stats={accountingStats} showTitle={false} />
      </div>
    </div>
  );
}
