import { getExpenses } from "@/lib/queries";
import { formatDate, formatCurrency, EXPENSE_LABELS } from "@/lib/utils";
import { deleteExpense } from "@/lib/finance-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ExpenseFormModal } from "@/components/finance/expense-form-modal";
import { Button } from "@/components/ui/button";

export default async function GastosPage() {
  const expenses = await getExpenses();
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Finanzas"
        title="Gastos"
        description={`Total registrado: ${formatCurrency(total)}`}
      />

      <Card title="Historial de gastos" action={<ExpenseFormModal />}>
        {expenses.length === 0 ? (
          <p className="text-sm text-iaf-500">Aún no hay gastos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-iaf-100 bg-blush-50/50 text-iaf-600">
                  <th className="px-5 py-3 font-medium">Texto</th>
                  <th className="px-5 py-3 font-medium">Concepto</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 text-right font-medium">Cantidad</th>
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iaf-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-iaf-50/30">
                    <td className="px-5 py-4 text-iaf-800">
                      {EXPENSE_LABELS[e.category] ?? e.category}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-iaf-900">{e.description}</p>
                      {e.notes && (
                        <p className="mt-0.5 text-xs text-iaf-500">{e.notes}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-iaf-600">{formatDate(e.date)}</td>
                    <td className="px-5 py-4 text-right font-display font-semibold text-iaf-800">
                      −{formatCurrency(e.amount)}
                    </td>
                    <td className="px-5 py-4">
                      <form action={deleteExpense.bind(null, e.id)}>
                        <Button type="submit" variant="ghost" className="text-xs text-red-500">
                          Eliminar
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
