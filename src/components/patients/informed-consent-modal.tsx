"use client";

import { useEffect } from "react";
import { X, Printer, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InformedConsentContent } from "@/components/patients/informed-consent-content";
import { printInformedConsent } from "@/lib/informed-consent";

type Props = {
  open: boolean;
  onClose: () => void;
  patientName: string;
  signed: boolean;
  consentDate: string;
  onConfirm?: () => void;
  /** Solo lectura: oculta confirmación (p. ej. ficha de consulta) */
  readOnly?: boolean;
};

export function InformedConsentModal({
  open,
  onClose,
  patientName,
  signed,
  consentDate,
  onConfirm,
  readOnly = false,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  function handlePrint() {
    const ok = printInformedConsent({
      patientName,
      signed,
      consentDate: consentDate || undefined,
    });
    if (!ok) {
      window.alert(
        "No se pudo abrir la ventana de impresión. Compruebe que el navegador no bloquea ventanas emergentes."
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="informed-consent-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-iaf-950/45 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="relative z-10 flex max-h-[min(90vh,52rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gold-400/30 bg-cream-50 shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-iaf-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gold-600" />
            <h2
              id="informed-consent-title"
              className="font-display text-lg font-semibold text-iaf-900"
            >
              Consentimiento informado
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-iaf-500 hover:bg-cream-200"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <InformedConsentContent patientName={patientName || undefined} />

          <div className="mt-8 border-t border-iaf-200 pt-6">
            <p className="mb-4 text-xs text-iaf-600">
              {readOnly
                ? "Documento informativo. Puede imprimirlo para entregar al paciente."
                : "Al confirmar, quedará registrado en la ficha. Recuerde guardar la ficha para conservar los cambios."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              {!readOnly && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    onConfirm?.();
                    onClose();
                  }}
                  disabled={signed}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {signed ? "Consentimiento confirmado" : "Confirmar consentimiento"}
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
