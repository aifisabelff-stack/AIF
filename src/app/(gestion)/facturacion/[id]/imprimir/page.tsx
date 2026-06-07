import { notFound } from "next/navigation";
import { getInvoice } from "@/lib/queries";
import { fullName } from "@/lib/utils";
import { InvoicePrintActions } from "@/components/facturacion/invoice-print-actions";
import { InvoicePrintDocument } from "@/components/facturacion/invoice-print-document";

type Props = { params: Promise<{ id: string }> };

export default async function FacturaImprimirPage({ params }: Props) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  return (
    <div className="min-h-screen bg-white">
      <InvoicePrintActions
        invoiceId={id}
        invoiceNumber={invoice.number}
        patientName={fullName(invoice.patient.firstName, invoice.patient.lastName)}
        patientEmail={invoice.patient.email ?? null}
      />
      <InvoicePrintDocument invoice={invoice} />
    </div>
  );
}
