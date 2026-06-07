import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getInvoice } from "@/lib/queries";
import {
  fullName,
  formatDate,
  formatDateTime,
  formatCurrency,
  INVOICE_STATUS_LABELS,
} from "@/lib/utils";
import { updateInvoiceStatus, deleteInvoice } from "@/lib/finance-actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvoicePrintButton } from "@/components/facturacion/invoice-print-button";

type Props = { params: Promise<{ id: string }> };

export default async function FacturaDetallePage({ params }: Props) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const performedAt = invoice.appointment?.performedAt;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/facturacion"
        className="inline-flex items-center gap-1 text-sm text-iaf-600 hover:text-iaf-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Facturación
      </Link>

      <Card accent className="p-8">
        <div id="invoice-print-area">
          <div className="flex flex-wrap justify-between gap-4 border-b border-iaf-100 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-iaf-500">
                IAF Clínica
              </p>
              <h1 className="font-display text-3xl font-semibold text-iaf-950">
                {invoice.number}
              </h1>
              <p className="mt-1 text-iaf-600">
                {INVOICE_STATUS_LABELS[invoice.status]} · {formatDate(invoice.date)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-iaf-500">Paciente</p>
              <p className="font-medium text-iaf-900">
                {fullName(invoice.patient.firstName, invoice.patient.lastName)}
              </p>
              {invoice.patient.dni && (
                <p className="text-sm text-iaf-500">{invoice.patient.dni}</p>
              )}
            </div>
          </div>

          {performedAt && (
            <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
              <p className="font-semibold">Realización de la técnica</p>
              <p className="mt-0.5">{formatDateTime(performedAt)}</p>
              {invoice.appointment?.title && (
                <p className="mt-1 text-amber-800">{invoice.appointment.title}</p>
              )}
            </div>
          )}

          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-b border-iaf-100 text-iaf-500">
                <th className="py-2 text-left">Concepto</th>
                <th className="py-2 text-right">Cant.</th>
                <th className="py-2 text-right">Precio</th>
                <th className="py-2 text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line) => (
                <tr key={line.id} className="border-b border-iaf-50">
                  <td className="py-3">{line.description}</td>
                  <td className="py-3 text-right">{line.quantity}</td>
                  <td className="py-3 text-right">{formatCurrency(line.unitPrice)}</td>
                  <td className="py-3 text-right font-medium">{formatCurrency(line.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 space-y-1 text-right text-sm">
            <p className="text-iaf-600">Subtotal: {formatCurrency(invoice.subtotal)}</p>
            <p className="text-iaf-600">
              IVA ({invoice.taxRate}%): {formatCurrency(invoice.taxAmount)}
            </p>
            <p className="font-display text-2xl font-semibold text-iaf-900">
              Total: {formatCurrency(invoice.total)}
            </p>
          </div>

          {invoice.notes && (
            <p className="mt-6 border-t border-iaf-100 pt-4 text-sm text-iaf-600">
              {invoice.notes}
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <InvoicePrintButton invoiceId={id} />
          {(invoice.status === "ISSUED" || invoice.status === "PENDING_PAYMENT") && (
            <form action={updateInvoiceStatus.bind(null, id, "PAID")}>
              <Button type="submit" variant="gold">
                Marcar como pagada
              </Button>
            </form>
          )}
          {invoice.status === "DRAFT" && (
            <form action={updateInvoiceStatus.bind(null, id, "ISSUED")}>
              <Button type="submit">Emitir factura</Button>
            </form>
          )}
          <form action={deleteInvoice.bind(null, id)}>
            <Button type="submit" variant="danger">
              Eliminar
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
