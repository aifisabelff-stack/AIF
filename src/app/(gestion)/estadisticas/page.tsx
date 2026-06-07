import { getStatistics, getClientStatistics } from "@/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { StatsView } from "@/components/stats/stats-view";

export default async function EstadisticasPage() {
  const [clientStats, accountingStats] = await Promise.all([
    getClientStatistics(6),
    getStatistics(6),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Análisis"
        title="Estadísticas"
        description="Elija Clientes o Contabilidad para ver el estudio correspondiente"
      />

      <StatsView clientStats={clientStats} accountingStats={accountingStats} />
    </div>
  );
}
