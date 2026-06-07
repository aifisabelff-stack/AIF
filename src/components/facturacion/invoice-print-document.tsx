import { BRAND } from "@/lib/brand";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  fullName,
  INVOICE_STATUS_LABELS,
} from "@/lib/utils";

type InvoiceLine = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

type InvoiceForPrint = {
  number: string;
  status: string;
  date: Date;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  patient: {
    firstName: string;
    lastName: string;
    dni: string | null;
  };
  lines: InvoiceLine[];
  appointment: {
    title: string;
    performedAt: Date | null;
  } | null;
};

export function InvoicePrintDocument({ invoice }: { invoice: InvoiceForPrint }) {
  const performedAt = invoice.appointment?.performedAt;

  return (
    <article className="mx-auto max-w-[720px] px-6 py-8 text-[#2a241c] print:px-0 print:py-0">
      <header className="flex flex-wrap justify-between gap-6 border-b border-[#e8e4de] pb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b6156]">
            {BRAND.name} {BRAND.aesthetic}
          </p>
          <h1 className="mt-0.5 text-[26px] font-bold text-[#1a1612]">{invoice.number}</h1>
          <p className="mt-1 text-[13px] text-[#6b6156]">
            {INVOICE_STATUS_LABELS[invoice.status]} · {formatDate(invoice.date)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#6b6156]">Paciente</p>
          <p className="text-[15px] font-semibold">
            {fullName(invoice.patient.firstName, invoice.patient.lastName)}
          </p>
          {invoice.patient.dni && (
            <p className="text-xs text-[#6b6156]">{invoice.patient.dni}</p>
          )}
        </div>
      </header>

      {performedAt && (
        <div className="mt-4 rounded-lg border border-[#f0e0b8] bg-[#fef9e8] px-3.5 py-3 text-[13px] text-[#5c4a12]">
          <p className="font-semibold">Realización de la técnica</p>
          <p className="mt-0.5">{formatDateTime(performedAt)}</p>
          {invoice.appointment?.title && (
            <p className="mt-1 text-[#7a6520]">{invoice.appointment.title}</p>
          )}
        </div>
      )}

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-[#e8e4de] text-left text-xs font-semibold uppercase tracking-wide text-[#6b6156]">
            <th className="py-2 pr-2">Concepto</th>
            <th className="py-2 text-right">Cant.</th>
            <th className="py-2 text-right">Precio</th>
            <th className="py-2 text-right">Importe</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line) => (
            <tr key={line.id} className="border-b border-[#f0ebe4]">
              <td className="py-2.5 pr-2 align-top">{line.description}</td>
              <td className="py-2.5 text-right align-top">{line.quantity}</td>
              <td className="py-2.5 text-right align-top">
                {formatCurrency(line.unitPrice)}
              </td>
              <td className="py-2.5 text-right align-top font-semibold">
                {formatCurrency(line.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-5 space-y-0.5 text-right text-sm text-[#4a4238]">
        <p>Subtotal: {formatCurrency(invoice.subtotal)}</p>
        <p>
          IVA ({invoice.taxRate}%): {formatCurrency(invoice.taxAmount)}
        </p>
        <p className="text-[22px] font-bold text-[#1a1612]">
          Total: {formatCurrency(invoice.total)}
        </p>
      </div>

      {invoice.notes && (
        <p className="mt-6 whitespace-pre-wrap border-t border-[#e8e4de] pt-4 text-sm text-[#4a4238]">
          {invoice.notes}
        </p>
      )}

      <p className="mt-8 text-center text-[11px] text-[#8a8076]">
        {BRAND.name} · {BRAND.address}, {BRAND.city} · {BRAND.phone}
      </p>
    </article>
  );
}
