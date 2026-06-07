import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPatientsForSelect } from "@/lib/queries";
import { InvoiceForm } from "@/components/finance/invoice-form";

export default async function NuevaFacturaPage() {
  const patients = await getPatientsForSelect();

  return (
    <div className="space-y-6">
      <Link
        href="/facturacion"
        className="inline-flex items-center gap-1 text-sm text-iaf-600 hover:text-iaf-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a facturación
      </Link>
      <InvoiceForm patients={patients} />
    </div>
  );
}
