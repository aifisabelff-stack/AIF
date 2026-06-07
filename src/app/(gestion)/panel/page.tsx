import Link from "next/link";
import { Suspense } from "react";
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Receipt,
} from "lucide-react";
import { getDashboardStats } from "@/lib/queries";
import { getPanelAccessSettingsForAdmin } from "@/lib/panel-access-actions";
import { clearStalePanelLockCookie } from "@/lib/panel-lock-cookie";
import { PanelTherapiesSection } from "@/components/panel/panel-therapies-section";
import { PanelTherapiesSkeleton } from "@/components/panel/panel-therapies-skeleton";
import { PanelAccessSettings } from "@/components/panel/panel-access-settings";
import { StatCard, Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { PageHeader } from "@/components/layout/page-header";
import { fullName, formatDate, formatTime, formatCurrency } from "@/lib/utils";

export default async function PanelPage() {
  await clearStalePanelLockCookie();
  const [{ total, active, recent, upcomingAppts, monthRevenue, monthExpenses }, accessSettings] =
    await Promise.all([getDashboardStats(), getPanelAccessSettingsForAdmin()]);
  const profit = monthRevenue - monthExpenses;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Gestión"
        title="Panel de control"
        description="Resumen de pacientes, citas y finanzas del mes"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pacientes" value={total} icon={<Users className="h-5 w-5" />} variant="rose" />
        <StatCard label="Activos" value={active} icon={<UserCheck className="h-5 w-5" />} variant="lavender" />
        <StatCard
          label="Ingresos (mes)"
          value={formatCurrency(monthRevenue)}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="gold"
        />
        <StatCard
          label="Beneficio (mes)"
          value={formatCurrency(profit)}
          sub={`Gastos: ${formatCurrency(monthExpenses)}`}
          icon={<TrendingDown className="h-5 w-5" />}
          variant="plum"
        />
      </div>

      <Suspense fallback={<PanelTherapiesSkeleton />}>
        <PanelTherapiesSection />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Próximas citas"
          accent
          action={
            <Link href="/agenda" className="text-sm font-medium text-iaf-600 hover:text-iaf-900">
              Ver agenda
            </Link>
          }
        >
          {upcomingAppts.length === 0 ? (
            <p className="text-sm text-iaf-500">No hay citas programadas.</p>
          ) : (
            <ul className="divide-y divide-iaf-100">
              {upcomingAppts.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/pacientes/${a.patient.id}`}
                    className="-mx-2 flex items-center justify-between rounded-lg px-2 py-3 transition-colors hover:bg-iaf-50/50"
                  >
                    <div>
                      <p className="font-medium text-iaf-900">{a.title}</p>
                      <p className="text-sm text-iaf-600">
                        {fullName(a.patient.firstName, a.patient.lastName)}
                      </p>
                    </div>
                    <div className="text-right text-sm text-iaf-500">
                      <p>{formatDate(a.startAt)}</p>
                      <p>{formatTime(a.startAt)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Pacientes recientes"
          action={
            <Link href="/pacientes" className="text-sm font-medium text-iaf-600 hover:text-iaf-900">
              Ver todos
            </Link>
          }
        >
          {recent.length === 0 ? (
            <p className="text-sm text-iaf-500">Sin pacientes registrados.</p>
          ) : (
            <ul className="divide-y divide-iaf-100">
              {recent.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/pacientes/${p.id}`}
                    className="flex justify-between py-3 hover:text-iaf-800"
                  >
                    <span className="font-medium">{fullName(p.firstName, p.lastName)}</span>
                    <span className="text-xs text-iaf-400">{formatDate(p.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <LinkButton href="/agenda">
          <Calendar className="h-4 w-4" />
          Agenda
        </LinkButton>
        <LinkButton href="/facturacion/nueva" variant="gold">
          <Receipt className="h-4 w-4" />
          Nueva factura
        </LinkButton>
        <LinkButton href="/pacientes/nuevo" variant="secondary">
          Nuevo Cliente
          <ArrowRight className="h-4 w-4" />
        </LinkButton>
        <LinkButton href="/estadisticas" variant="secondary">
          Estadísticas
        </LinkButton>
      </div>

      {accessSettings && !("error" in accessSettings) && (
        <div className="w-full lg:max-w-[50%]">
          <PanelAccessSettings protectionActive={accessSettings.protectionActive} />
        </div>
      )}
    </div>
  );
}
