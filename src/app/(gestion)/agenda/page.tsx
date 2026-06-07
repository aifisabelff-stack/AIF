import { Suspense } from "react";
import { getPatientsForSelect, getActiveOfferedTherapies } from "@/lib/queries";
import { formatMonthKey } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { AgendaCalendar } from "@/components/agenda/agenda-calendar";

export default async function AgendaPage() {
  const monthKey = formatMonthKey(new Date());
  const [patients, therapies] = await Promise.all([
    getPatientsForSelect(),
    getActiveOfferedTherapies(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Planificación"
        title="Agenda de citas"
        description="Calendario semanal — use Anterior / Siguiente para cambiar de semana"
      />
      <Suspense
        fallback={
          <p className="text-sm text-iaf-600">Cargando calendario...</p>
        }
      >
        <AgendaCalendar
          patients={patients}
          therapies={therapies}
          monthKey={monthKey}
          monthCounts={{}}
        />
      </Suspense>
    </div>
  );
}
