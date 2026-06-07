"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  invoiceId: string;
};

export function InvoicePrintButton({ invoiceId }: Props) {
  function handlePrint() {
    const url = `/facturacion/${invoiceId}/imprimir`;
    const win = window.open(url, "_blank");
    if (!win) {
      window.alert(
        "No se pudo abrir la vista de impresión. Compruebe que el navegador no bloquea ventanas emergentes."
      );
    }
  }

  return (
    <Button type="button" variant="secondary" onClick={handlePrint}>
      <Printer className="h-4 w-4" />
      Imprimir
    </Button>
  );
}
