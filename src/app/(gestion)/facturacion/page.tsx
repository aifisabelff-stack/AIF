import Link from "next/link";
import { Plus } from "lucide-react";
import { getInvoices, getBillingSummary } from "@/lib/queries";
import { fullName, formatDate, formatCurrency, INVOICE_STATUS_LABELS } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { Card, StatCard } from "@/components/ui/card";
import { updateInvoiceStatus } from "@/lib/finance-actions";

type Props = { searchParams: Promise<{ estado?: string }> };

const statusStyles: Record<string, string> = {
  DRAFT: "bg-iaf-100 text-iaf-700",
  ISSUED: "bg-amber-50 text-amber-800",
  PENDING_PAYMENT: "bg-amber-100 text-amber-900",
  PAID: "bg-emerald-50 text-emerald-800",
  CANCELLED: "bg-gray-100 text-gray-600",
};

export default async function FacturacionPage({ searchParams }: Props) {
  const { estado } = await searchParams;
  const [invoices, summary] = await Promise.all([
    getInvoices(estado),
    getBillingSummary(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Finanzas"
        title="Facturación"
        description="Emisión y seguimiento de facturas de la clínica"
        action={
          <LinkButton href="/facturacion/nueva">
            <Plus className="h-4 w-4" />
            Nueva factura
          </LinkButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Cobrado"
          value={formatCurrency(summary.totalPaid)}
          icon={<span className="text-lg">€</span>}
          variant="rose"
        />
        <StatCard
          label="Pendiente de cobro"
          value={formatCurrency(summary.totalPending)}
          sub={`${summary.draftCount} borradores`}
          variant="gold"
        />
        <StatCard
          label="Gastos totales"
          value={formatCurrency(summary.totalExpenses)}
          icon={<span className="text-lg">↓</span>}
          variant="plum"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { href: "/facturacion", label: "Todas" },
          { href: "/facturacion?estado=PENDING_PAYMENT", label: "Pendiente de pago" },
          { href: "/facturacion?estado=ISSUED", label: "Emitidas" },
          { href: "/facturacion?estado=PAID", label: "Pagadas" },
          { href: "/facturacion?estado=DRAFT", label: "Borradores" },
        ].map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              (!estado && f.href === "/facturacion") || estado === f.href.split("=")[1]
                ? "bg-iaf-700 text-white"
                : "bg-white/90 text-iaf-700 border border-iaf-200 hover:bg-iaf-50"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        {invoices.length === 0 ? (
          <p className="p-8 text-center text-sm text-iaf-500">
            No hay facturas.{" "}
            <Link href="/facturacion/nueva" className="font-medium text-iaf-700 underline">
              Crear la primera
            </Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-iaf-100 bg-blush-50/50 text-iaf-600">
                  <th className="px-5 py-3 font-medium">Nº</th>
                  <th className="px-5 py-3 font-medium">Paciente</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iaf-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-iaf-50/30">
                    <td className="px-5 py-4">
                      <Link href={`/facturacion/${inv.id}`} className="font-medium text-iaf-800 hover:underline">
                        {inv.number}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      {fullName(inv.patient.firstName, inv.patient.lastName)}
                    </td>
                    <td className="px-5 py-4 text-iaf-600">{formatDate(inv.date)}</td>
                    <td className="px-5 py-4 font-medium">{formatCurrency(inv.total)}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[inv.status]}`}>
                        {INVOICE_STATUS_LABELS[inv.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {(inv.status === "ISSUED" || inv.status === "PENDING_PAYMENT") && (
                        <form action={updateInvoiceStatus.bind(null, inv.id, "PAID")}>
                          <button type="submit" className="text-xs font-medium text-emerald-700 hover:underline">
                            Marcar pagada
                          </button>
                        </form>
                      )}
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
