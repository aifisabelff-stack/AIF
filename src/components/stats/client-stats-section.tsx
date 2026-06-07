import {
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Sparkles,
  UserPlus,
  Repeat,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Card, StatCard } from "@/components/ui/card";
import {
  AppointmentStatusPieChart,
  TherapyDemandChart,
  MonthlyAppointmentsChart,
} from "@/components/charts/client-stats-charts";
import { cn } from "@/lib/utils";
import type { getClientStatistics } from "@/lib/queries";

type ClientStats = Awaited<ReturnType<typeof getClientStatistics>>;

export function ClientStatsSection({
  stats,
  showTitle = true,
}: {
  stats: ClientStats;
  showTitle?: boolean;
}) {
  const { kpis, statusBreakdown, therapyBreakdown, monthlyAppointments, topClients } =
    stats;
  const monthLabel = format(parseISO(`${stats.monthKey}-01`), "MMMM yyyy", {
    locale: es,
  });

  return (
    <section className="space-y-6" aria-labelledby="stats-clientes-heading">
      <div>
        {showTitle ? (
          <h2
            id="stats-clientes-heading"
            className="font-display text-2xl font-semibold text-iaf-900"
          >
            Clientes
          </h2>
        ) : (
          <p id="stats-clientes-heading" className="sr-only">
            Clientes
          </p>
        )}
        <p className={cn("text-sm text-iaf-600", showTitle && "mt-1")}>
          Estudio de citas, terapias y actividad de clientes — mes en curso:{" "}
          <span className="font-medium capitalize text-iaf-800">{monthLabel}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Citas del mes"
          value={kpis.totalAppointments}
          icon={<Calendar className="h-5 w-5" />}
          variant="rose"
        />
        <StatCard
          label="Clientes con cita"
          value={kpis.uniqueClients}
          sub={`${kpis.recurringClients} recurrentes`}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Confirmadas"
          value={kpis.confirmed}
          sub={`${kpis.confirmationRate}% del total`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="gold"
        />
        <StatCard
          label="Pendientes de confirmar"
          value={kpis.pending}
          icon={<Clock className="h-5 w-5" />}
          variant="coral"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Anuladas"
          value={kpis.cancelled}
          sub={`${kpis.cancellationRate}% del total`}
          icon={<XCircle className="h-5 w-5" />}
        />
        <StatCard
          label="Completadas"
          value={kpis.completed}
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="plum"
        />
        <StatCard
          label="Terapia más demandada"
          value={kpis.topTherapy ?? "—"}
          sub={
            kpis.topTherapy
              ? `${kpis.topTherapyCount} cita${kpis.topTherapyCount !== 1 ? "s" : ""}`
              : undefined
          }
          icon={<Sparkles className="h-5 w-5" />}
          variant="lavender"
        />
        <StatCard
          label="Reservas web"
          value={kpis.webBookings}
          icon={<Globe className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Programadas"
          value={kpis.scheduled}
          icon={<Calendar className="h-5 w-5" />}
        />
        <StatCard
          label="No presentados"
          value={kpis.noShow}
          icon={<XCircle className="h-5 w-5" />}
          variant="gold"
        />
        <StatCard
          label="Clientes activos (ficha)"
          value={kpis.activePatients}
          sub={`${kpis.newPatientsMonth} altas nuevas este mes`}
          icon={<UserPlus className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Citas por estado (mes actual)" accent>
          <AppointmentStatusPieChart data={statusBreakdown} />
        </Card>
        <Card title="Terapias más solicitadas (mes actual)" accent>
          <TherapyDemandChart data={therapyBreakdown} />
        </Card>
        <Card title="Evolución de citas (últimos 6 meses)" className="lg:col-span-2">
          <MonthlyAppointmentsChart data={monthlyAppointments} />
        </Card>
      </div>

      {therapyBreakdown.length > 0 && (
        <Card title="Detalle por terapia — mes en curso">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-iaf-100 text-iaf-500">
                  <th className="py-2 text-left font-medium">Terapia</th>
                  <th className="py-2 text-right font-medium">Citas</th>
                  <th className="py-2 text-right font-medium">% del total</th>
                </tr>
              </thead>
              <tbody>
                {therapyBreakdown.map((t) => (
                  <tr key={t.name} className="border-b border-iaf-50">
                    <td className="py-3 font-medium text-iaf-900">{t.name}</td>
                    <td className="py-3 text-right">{t.count}</td>
                    <td className="py-3 text-right text-iaf-600">
                      {kpis.totalAppointments > 0
                        ? `${Math.round((t.count / kpis.totalAppointments) * 100)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {topClients.length > 0 && (
        <Card title="Clientes con más citas este mes">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-iaf-100 text-iaf-500">
                  <th className="py-2 text-left font-medium">Cliente</th>
                  <th className="py-2 text-right font-medium">Citas</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((c) => (
                  <tr key={c.id} className="border-b border-iaf-50">
                    <td className="py-3 font-medium text-iaf-900">{c.name}</td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center gap-1">
                        {c.count}
                        {c.count > 1 && (
                          <Repeat className="h-3.5 w-3.5 text-gold-600" aria-hidden />
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </section>
  );
}
