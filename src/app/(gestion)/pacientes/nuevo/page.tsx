import Link from "next/link";
import { PatientForm } from "@/components/patients/patient-form";
import { ArrowLeft } from "lucide-react";

export default function NuevoPacientePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/pacientes"
          className="inline-flex items-center gap-1 text-sm text-iaf-600 hover:text-iaf-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a clientes
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-iaf-950">Nuevo cliente</h1>
        <p className="mt-1 text-sm text-iaf-600">
          Complete la ficha con los datos personales e historia clínica estética.
        </p>
      </div>
      <PatientForm />
    </div>
  );
}
