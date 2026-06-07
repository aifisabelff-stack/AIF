import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { getPatient } from "@/lib/queries";
import { deletePatient } from "@/lib/patient-actions";
import { fullName, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/patients/status-badge";
import { PatientAppointmentHistory } from "@/components/patients/patient-appointment-history";
import { PatientConsentActions } from "@/components/patients/patient-consent-actions";

type Props = { params: Promise<{ id: string }> };

export default async function PacienteDetallePage({ params }: Props) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();

  const name = fullName(patient.firstName, patient.lastName);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/pacientes"
            className="inline-flex items-center gap-1 text-sm text-iaf-600 hover:text-iaf-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Clientes
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-iaf-950">{name}</h1>
            <StatusBadge status={patient.status} />
          </div>
          {patient.dni && <p className="text-sm text-iaf-500">DNI: {patient.dni}</p>}
        </div>
        <div className="flex gap-2">
          <LinkButton href={`/pacientes/${id}/editar`} variant="secondary">
            <Pencil className="h-4 w-4" />
            Editar ficha
          </LinkButton>
          <form action={deletePatient.bind(null, id)}>
            <Button type="submit" variant="danger">
              Eliminar
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Contacto" className="lg:col-span-1">
          <dl className="space-y-3 text-sm">
            {patient.phone && (
              <div className="flex gap-2 text-iaf-700">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-iaf-400" />
                <dd>{patient.phone}</dd>
              </div>
            )}
            {patient.email && (
              <div className="flex gap-2 text-iaf-700">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-iaf-400" />
                <dd>{patient.email}</dd>
              </div>
            )}
            {(patient.address || patient.city) && (
              <div className="flex gap-2 text-iaf-700">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-iaf-400" />
                <dd>
                  {[patient.address, patient.city, patient.postalCode].filter(Boolean).join(", ")}
                </dd>
              </div>
            )}
            {patient.birthDate && (
              <div>
                <dt className="text-iaf-500">Nacimiento</dt>
                <dd className="font-medium">{formatDate(patient.birthDate, "long")}</dd>
              </div>
            )}
            {patient.referredBy && (
              <div>
                <dt className="text-iaf-500">Derivado por</dt>
                <dd>{patient.referredBy}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card title="Historia clínica estética" className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            {patient.skinType && (
              <div>
                <dt className="text-iaf-500">Tipo de piel</dt>
                <dd className="font-medium">{patient.skinType}</dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-iaf-500" />
                <span>
                  Consentimiento:{" "}
                  <strong>{patient.consentSigned ? "Firmado" : "Pendiente"}</strong>
                  {patient.consentDate && ` (${formatDate(patient.consentDate)})`}
                </span>
              </div>
              <PatientConsentActions
                patientName={name}
                signed={patient.consentSigned ?? false}
                consentDate={
                  patient.consentDate
                    ? new Date(patient.consentDate).toISOString().slice(0, 10)
                    : ""
                }
              />
            </div>
            {[
              ["Alergias", patient.allergies],
              ["Medicación", patient.medications],
              ["Patologías", patient.medicalConditions],
              ["Contraindicaciones", patient.contraindications],
              ["Tratamientos previos", patient.previousTreatments],
            ].map(([label, value]) =>
              value ? (
                <div key={label as string} className="sm:col-span-2">
                  <dt className="flex items-center gap-1 text-iaf-500">
                    {label === "Contraindicaciones" && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    )}
                    {label}
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-iaf-800">{value}</dd>
                </div>
              ) : null
            )}
          </div>
          {patient.notes && (
            <div className="mt-4 border-t border-iaf-100 pt-4 text-sm">
              <p className="text-iaf-500">Notas internas</p>
              <p className="mt-1 whitespace-pre-wrap text-iaf-800">{patient.notes}</p>
            </div>
          )}
        </Card>
      </div>

      <Card
        title="Historial de citas"
        action={
          <Link
            href="/agenda"
            className="text-sm font-medium text-iaf-600 hover:text-iaf-900"
          >
            Ver agenda
          </Link>
        }
      >
        <PatientAppointmentHistory appointments={patient.appointments} />
      </Card>
    </div>
  );
}
