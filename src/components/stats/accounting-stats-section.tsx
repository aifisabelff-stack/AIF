import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Receipt,
  Sparkles,
} from "lucide-react";
import { formatCurrency, EXPENSE_LABELS, INVOICE_STATUS_LABELS } from "@/lib/utils";
import { Card, StatCard } from "@/components/ui/card";
import {
  MonthlyFinanceChart,
  ProceduresChart,
  ExpensePieChart,
  InvoiceStatusChart,
} from "@/components/charts/finance-charts";
import { cn } from "@/lib/utils";
import type { getStatistics } from "@/lib/queries";

type AccountingStats = Awaited<ReturnType<typeof getStatistics>>;

export function AccountingStatsSection({
  stats,
  showTitle = true,
}: {
  stats: AccountingStats;
  showTitle?: boolean;
}) {
  const { kpis, monthlyFinance, topProcedures, expenseByCategory, invoiceStatusBreakdown } =
    stats;

  const expensePie = Object.entries(expenseByCategory).map(([cat, value]) => ({
    name: EXPENSE_LABELS[cat] ?? cat,
    value,
  }));

  const invoiceChart = invoiceStatusBreakdown.map((row) => ({
    status: row.status,
    label: INVOICE_STATUS_LABELS[row.status] ?? row.status,
    count: row._count,
    total: row._sum.total ?? 0,
  }));

  return (
    <section className="space-y-6" aria-labelledby="stats-contabilidad-heading">
      <div>
        {showTitle ? (
          <h2
            id="stats-contabilidad-heading"
            className="font-display text-2xl font-semibold text-iaf-900"
          >
            Contabilidad
          </h2>
        ) : (
          <p id="stats-contabilidad-heading" className="sr-only">
            Contabilidad
          </p>
        )}
        <p className={cn("text-sm text-iaf-600", showTitle && "mt-1")}>
          Actividad contable: ingresos, gastos, facturación y procedimientos (últimos
          6 meses)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ingresos del mes"
          value={formatCurrency(kpis.monthIncome)}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="rose"
        />
        <StatCard
          label="Gastos del mes"
          value={formatCurrency(kpis.monthExpenses)}
          icon={<TrendingDown className="h-5 w-5" />}
          variant="gold"
        />
        <StatCard
          label="Beneficio neto"
          value={formatCurrency(kpis.monthProfit)}
          sub={kpis.monthProfit >= 0 ? "Positivo" : "Negativo"}
          icon={<Sparkles className="h-5 w-5" />}
          variant="plum"
        />
        <StatCard
          label="Tratamientos (mes)"
          value={kpis.monthTreatments}
          icon={<Activity className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Facturas pendientes"
          value={kpis.pendingInvoices}
          icon={<Receipt className="h-5 w-5" />}
          variant="gold"
        />
        <StatCard
          label="Citas próximas"
          value={kpis.upcomingAppts}
          icon={<Calendar className="h-5 w-5" />}
        />
        <StatCard
          label="Ingresos cobrados (6 meses)"
          value={formatCurrency(monthlyFinance.reduce((s, m) => s + m.income, 0))}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="rose"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Ingresos vs gastos" accent>
          <MonthlyFinanceChart data={monthlyFinance} />
        </Card>
        <Card title="Procedimientos más realizados" accent>
          {topProcedures.length === 0 ? (
            <p className="py-12 text-center text-sm text-iaf-500">Sin datos de tratamientos</p>
          ) : (
            <ProceduresChart data={topProcedures} />
          )}
        </Card>
        <Card title="Gastos por categoría">
          <ExpensePieChart data={expensePie} />
        </Card>
        <Card title="Estado de facturas">
          <InvoiceStatusChart data={invoiceChart} />
        </Card>
      </div>

      {topProcedures.length > 0 && (
        <Card title="Detalle de procedimientos">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-iaf-100 text-iaf-500">
                  <th className="py-2 text-left font-medium">Tratamiento</th>
                  <th className="py-2 text-right font-medium">Sesiones</th>
                  <th className="py-2 text-right font-medium">Facturación estimada</th>
                </tr>
              </thead>
              <tbody>
                {topProcedures.map((p) => (
                  <tr key={p.name} className="border-b border-iaf-50">
                    <td className="py-3 font-medium text-iaf-900">{p.name}</td>
                    <td className="py-3 text-right">{p.count}</td>
                    <td className="py-3 text-right">{formatCurrency(p.revenue)}</td>
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
