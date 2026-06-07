import { BRAND } from "@/lib/brand";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  fullName,
  INVOICE_STATUS_LABELS,
} from "@/lib/utils";

type InvoiceForEmail = {
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
  lines: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  appointment: {
    title: string;
    performedAt: Date | null;
  } | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildInvoiceEmailHtml(invoice: InvoiceForEmail, patientName: string) {
  const performedAt = invoice.appointment?.performedAt;
  const linesHtml = invoice.lines
    .map(
      (line) => `<tr>
        <td style="padding:8px 4px;border-bottom:1px solid #f0ebe4;">${escapeHtml(line.description)}</td>
        <td style="padding:8px 4px;border-bottom:1px solid #f0ebe4;text-align:right;">${line.quantity}</td>
        <td style="padding:8px 4px;border-bottom:1px solid #f0ebe4;text-align:right;">${escapeHtml(formatCurrency(line.unitPrice))}</td>
        <td style="padding:8px 4px;border-bottom:1px solid #f0ebe4;text-align:right;font-weight:600;">${escapeHtml(formatCurrency(line.amount))}</td>
      </tr>`
    )
    .join("");

  const performedHtml = performedAt
    ? `<div style="margin-top:16px;padding:12px 14px;background:#fef9e8;border:1px solid #f0e0b8;border-radius:8px;font-size:13px;color:#5c4a12;">
        <p style="margin:0 0 4px;font-weight:600;">Realización de la técnica</p>
        <p style="margin:0;">${escapeHtml(formatDateTime(performedAt))}</p>
        ${
          invoice.appointment?.title
            ? `<p style="margin:6px 0 0;color:#7a6520;">${escapeHtml(invoice.appointment.title)}</p>`
            : ""
        }
      </div>`
    : "";

  const notesHtml = invoice.notes
    ? `<p style="margin-top:20px;padding-top:14px;border-top:1px solid #e8e4de;font-size:13px;color:#4a4238;white-space:pre-wrap;">${escapeHtml(invoice.notes)}</p>`
    : "";

  const dniHtml = invoice.patient.dni
    ? `<p style="margin:4px 0 0;font-size:12px;color:#6b6156;">${escapeHtml(invoice.patient.dni)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:24px;font-family:system-ui,sans-serif;color:#2a241c;background:#faf9f6;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e8e4de;border-radius:12px;padding:24px;">
    <p style="margin:0 0 16px;font-size:14px;color:#4a4238;">Estimado/a ${escapeHtml(patientName)},</p>
    <p style="margin:0 0 20px;font-size:14px;color:#4a4238;">Le adjuntamos el detalle de su factura:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #e8e4de;padding-bottom:16px;">
      <tr>
        <td style="vertical-align:top;">
          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#6b6156;">${escapeHtml(BRAND.name)} ${escapeHtml(BRAND.aesthetic)}</p>
          <h1 style="margin:4px 0 0;font-size:24px;color:#1a1612;">${escapeHtml(invoice.number)}</h1>
          <p style="margin:6px 0 0;font-size:13px;color:#6b6156;">${escapeHtml(INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status)} · ${escapeHtml(formatDate(invoice.date))}</p>
        </td>
        <td style="vertical-align:top;text-align:right;">
          <p style="margin:0;font-size:12px;color:#6b6156;">Paciente</p>
          <p style="margin:4px 0 0;font-size:15px;font-weight:600;">${escapeHtml(patientName)}</p>
          ${dniHtml}
        </td>
      </tr>
    </table>
    ${performedHtml}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;font-size:14px;border-collapse:collapse;">
      <thead>
        <tr>
          <th style="padding:8px 4px;border-bottom:2px solid #e8e4de;text-align:left;font-size:11px;color:#6b6156;text-transform:uppercase;">Concepto</th>
          <th style="padding:8px 4px;border-bottom:2px solid #e8e4de;text-align:right;font-size:11px;color:#6b6156;">Cant.</th>
          <th style="padding:8px 4px;border-bottom:2px solid #e8e4de;text-align:right;font-size:11px;color:#6b6156;">Precio</th>
          <th style="padding:8px 4px;border-bottom:2px solid #e8e4de;text-align:right;font-size:11px;color:#6b6156;">Importe</th>
        </tr>
      </thead>
      <tbody>${linesHtml}</tbody>
    </table>
    <div style="margin-top:18px;text-align:right;font-size:14px;color:#4a4238;">
      <p style="margin:4px 0;">Subtotal: ${escapeHtml(formatCurrency(invoice.subtotal))}</p>
      <p style="margin:4px 0;">IVA (${invoice.taxRate}%): ${escapeHtml(formatCurrency(invoice.taxAmount))}</p>
      <p style="margin:8px 0 0;font-size:22px;font-weight:700;color:#1a1612;">Total: ${escapeHtml(formatCurrency(invoice.total))}</p>
    </div>
    ${notesHtml}
    <p style="margin-top:28px;font-size:12px;color:#8a8076;text-align:center;">
      ${escapeHtml(BRAND.name)} · ${escapeHtml(BRAND.address)}, ${escapeHtml(BRAND.city)} · ${escapeHtml(BRAND.phone)}
    </p>
  </div>
</body>
</html>`;
}
