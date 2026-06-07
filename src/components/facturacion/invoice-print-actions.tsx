"use client";

import { useState, useTransition } from "react";
import { Mail, Printer, X } from "lucide-react";
import { sendInvoiceByEmail } from "@/lib/finance-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  invoiceId: string;
  invoiceNumber: string;
  patientName: string;
  patientEmail: string | null;
};

export function InvoicePrintActions({
  invoiceId,
  invoiceNumber,
  patientName,
  patientEmail,
}: Props) {
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [pending, startTransition] = useTransition();

  const email = patientEmail?.trim() ?? "";
  const canEmail = email.length > 0;

  function handleSendEmail() {
    setFeedback(null);
    startTransition(async () => {
      const result = await sendInvoiceByEmail(invoiceId);
      if ("error" in result) {
        setFeedback({ type: "err", text: result.error });
        return;
      }
      setFeedback({
        type: "ok",
        text: `Factura enviada correctamente a ${result.email}`,
      });
    });
  }

  /** window.close() solo funciona en ventanas abiertas por script; si no, volver a la factura */
  function handleClose() {
    window.close();
    window.setTimeout(() => {
      if (window.history.length > 1) {
        window.history.back();
        return;
      }
      window.location.replace(`/facturacion/${invoiceId}`);
    }, 200);
  }

  return (
    <div className="no-print border-b border-iaf-100 bg-cream-50 px-4 py-5">
      <div className="mx-auto max-w-[720px] space-y-4">
        <div className="text-center">
          <h2 className="font-display text-xl font-semibold text-iaf-900">
            Factura {invoiceNumber}
          </h2>
          <p className="mt-1 text-sm text-iaf-600">
            Paciente: <span className="font-medium text-iaf-800">{patientName}</span>
          </p>
          {canEmail ? (
            <p className="mt-1 text-sm text-iaf-600">
              Email en ficha: <span className="font-medium text-iaf-800">{email}</span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-amber-800">
              Este paciente no tiene email en la base de datos. Edite la ficha en Pacientes para
              poder enviar la factura por correo.
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button type="button" variant="secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Imprimir en impresora
          </Button>
          <Button
            type="button"
            variant="gold"
            disabled={!canEmail || pending}
            onClick={handleSendEmail}
          >
            <Mail className="h-4 w-4" />
            {pending ? "Enviando…" : "Enviar por email"}
          </Button>
          <Button type="button" variant="ghost" onClick={handleClose}>
            <X className="h-4 w-4" />
            Cerrar
          </Button>
        </div>

        {feedback && (
          <p
            className={cn(
              "rounded-lg px-3 py-2 text-center text-sm",
              feedback.type === "ok"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-700"
            )}
            role="status"
          >
            {feedback.text}
          </p>
        )}
      </div>
    </div>
  );
}
