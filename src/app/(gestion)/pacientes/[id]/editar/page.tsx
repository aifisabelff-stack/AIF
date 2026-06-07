import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPatient } from "@/lib/queries";
import { PatientForm } from "@/components/patients/patient-form";
import { fullName } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function EditarPacientePage({ params }: Props) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/pacientes/${id}`}
          className="inline-flex items-center gap-1 text-sm text-iaf-600 hover:text-iaf-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a {fullName(patient.firstName, patient.lastName)}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-iaf-950">Editar ficha</h1>
      </div>
      <PatientForm patient={patient} tabbed />
    </div>
  );
}
