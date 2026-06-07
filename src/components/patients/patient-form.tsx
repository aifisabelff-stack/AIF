"use client";

import { useState, type ReactNode } from "react";
import type { Patient } from "@/lib/firestore-types";
import { User, ClipboardList, FileText, ChevronDown } from "lucide-react";
import { createPatient, updatePatient } from "@/lib/patient-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGroup, Input, Label, Select, Textarea } from "@/components/ui/input";
import { ConsentFields } from "@/components/patients/consent-fields";
import { cn } from "@/lib/utils";

type TabId = "personal" | "clinical" | "notes";

type Props = {
  patient?: Patient;
  /** Pestañas en edición de ficha */
  tabbed?: boolean;
};

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "personal", label: "Datos personales", icon: User },
  { id: "clinical", label: "Historia clínica", icon: ClipboardList },
  { id: "notes", label: "Notas internas", icon: FileText },
];

function PersonalFields({
  patient,
  birthDate,
}: {
  patient?: Patient;
  birthDate: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FieldGroup>
        <Label htmlFor="firstName">Nombre *</Label>
        <Input id="firstName" name="firstName" required defaultValue={patient?.firstName} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="lastName">Apellidos *</Label>
        <Input id="lastName" name="lastName" required defaultValue={patient?.lastName} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="dni">DNI / NIE</Label>
        <Input id="dni" name="dni" defaultValue={patient?.dni ?? ""} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="birthDate">Fecha de nacimiento</Label>
        <Input id="birthDate" name="birthDate" type="date" defaultValue={birthDate} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={patient?.phone ?? ""} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={patient?.email ?? ""} />
      </FieldGroup>
      <FieldGroup className="sm:col-span-2">
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" name="address" defaultValue={patient?.address ?? ""} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="city">Ciudad</Label>
        <Input id="city" name="city" defaultValue={patient?.city ?? ""} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="postalCode">Código postal</Label>
        <Input id="postalCode" name="postalCode" defaultValue={patient?.postalCode ?? ""} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="referredBy">Derivado por</Label>
        <Input
          id="referredBy"
          name="referredBy"
          placeholder="Recomendación, web..."
          defaultValue={patient?.referredBy ?? ""}
        />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="status">Estado</Label>
        <Select id="status" name="status" defaultValue={patient?.status ?? "ACTIVE"}>
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
          <option value="ARCHIVED">Archivado</option>
        </Select>
      </FieldGroup>
    </div>
  );
}

function hasClinicalText(value?: string | null) {
  return Boolean(value?.trim());
}

function ClinicalCollapsibleSection({
  label,
  defaultOpen,
  preview,
  className,
  children,
}: {
  label: string;
  defaultOpen: boolean;
  preview?: string | null;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const previewText = preview?.trim();

  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className={cn(
        "group rounded-xl border border-iaf-200/70 bg-cream-50/40",
        className
      )}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-iaf-900 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block">{label}</span>
          {!open && previewText && (
            <span className="mt-0.5 block truncate text-xs font-normal text-iaf-500">
              {previewText}
            </span>
          )}
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-iaf-500 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="border-t border-iaf-100 px-4 pb-4 pt-3">{children}</div>
    </details>
  );
}

function ClinicalFields({
  patient,
  consentDate,
}: {
  patient?: Patient;
  consentDate: string;
}) {
  const consentDefaultOpen = Boolean(patient?.consentSigned || consentDate);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ClinicalCollapsibleSection
        label="Tipo de piel"
        defaultOpen={hasClinicalText(patient?.skinType)}
        preview={patient?.skinType}
        className="sm:col-span-2"
      >
        <FieldGroup>
          <Label htmlFor="skinType">Tipo de piel</Label>
          <Input
            id="skinType"
            name="skinType"
            placeholder="Seca, grasa, mixta..."
            defaultValue={patient?.skinType ?? ""}
          />
        </FieldGroup>
      </ClinicalCollapsibleSection>

      <ClinicalCollapsibleSection
        label="Alergias"
        defaultOpen={hasClinicalText(patient?.allergies)}
        preview={patient?.allergies}
        className="sm:col-span-2"
      >
        <FieldGroup>
          <Label htmlFor="allergies">Alergias</Label>
          <Textarea id="allergies" name="allergies" defaultValue={patient?.allergies ?? ""} />
        </FieldGroup>
      </ClinicalCollapsibleSection>

      <ClinicalCollapsibleSection
        label="Medicación actual"
        defaultOpen={hasClinicalText(patient?.medications)}
        preview={patient?.medications}
        className="sm:col-span-2"
      >
        <FieldGroup>
          <Label htmlFor="medications">Medicación actual</Label>
          <Textarea
            id="medications"
            name="medications"
            defaultValue={patient?.medications ?? ""}
          />
        </FieldGroup>
      </ClinicalCollapsibleSection>

      <ClinicalCollapsibleSection
        label="Patologías / condiciones"
        defaultOpen={hasClinicalText(patient?.medicalConditions)}
        preview={patient?.medicalConditions}
        className="sm:col-span-2"
      >
        <FieldGroup>
          <Label htmlFor="medicalConditions">Patologías / condiciones</Label>
          <Textarea
            id="medicalConditions"
            name="medicalConditions"
            defaultValue={patient?.medicalConditions ?? ""}
          />
        </FieldGroup>
      </ClinicalCollapsibleSection>

      <ClinicalCollapsibleSection
        label="Contraindicaciones"
        defaultOpen={hasClinicalText(patient?.contraindications)}
        preview={patient?.contraindications}
        className="sm:col-span-2"
      >
        <FieldGroup>
          <Label htmlFor="contraindications">Contraindicaciones</Label>
          <Textarea
            id="contraindications"
            name="contraindications"
            defaultValue={patient?.contraindications ?? ""}
          />
        </FieldGroup>
      </ClinicalCollapsibleSection>

      <ClinicalCollapsibleSection
        label="Tratamientos previos"
        defaultOpen={hasClinicalText(patient?.previousTreatments)}
        preview={patient?.previousTreatments}
        className="sm:col-span-2"
      >
        <FieldGroup>
          <Label htmlFor="previousTreatments">Tratamientos previos</Label>
          <Textarea
            id="previousTreatments"
            name="previousTreatments"
            defaultValue={patient?.previousTreatments ?? ""}
          />
        </FieldGroup>
      </ClinicalCollapsibleSection>

      <ClinicalCollapsibleSection
        label="Consentimiento informado"
        defaultOpen={consentDefaultOpen}
        preview={
          consentDefaultOpen
            ? patient?.consentSigned
              ? consentDate
                ? `Firmado · ${consentDate}`
                : "Firmado"
              : consentDate
                ? `Pendiente · fecha ${consentDate}`
                : undefined
            : undefined
        }
        className="sm:col-span-2"
      >
        <ConsentFields patient={patient} initialConsentDate={consentDate} />
      </ClinicalCollapsibleSection>
    </div>
  );
}

function NotesFields({ patient }: { patient?: Patient }) {
  return (
    <FieldGroup>
      <Label htmlFor="notes">Observaciones</Label>
      <Textarea id="notes" name="notes" rows={6} defaultValue={patient?.notes ?? ""} />
    </FieldGroup>
  );
}

export function PatientForm({ patient, tabbed = false }: Props) {
  const [tab, setTab] = useState<TabId>("personal");

  const action = patient
    ? updatePatient.bind(null, patient.id)
    : createPatient;

  const birthDate = patient?.birthDate
    ? new Date(patient.birthDate).toISOString().slice(0, 10)
    : "";
  const consentDate = patient?.consentDate
    ? new Date(patient.consentDate).toISOString().slice(0, 10)
    : "";

  const submitLabel = patient ? "Guardar cambios" : "Registrar cliente";

  if (tabbed) {
    return (
      <form action={action} className="space-y-6">
        <div
          className="flex flex-wrap gap-2 rounded-2xl border border-gold-400/25 bg-cream-50/90 p-1.5 sm:p-2"
          role="tablist"
          aria-label="Secciones de la ficha"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`patient-form-panel-${id}`}
                id={`patient-form-tab-${id}`}
                onClick={() => setTab(id)}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors sm:flex-none sm:min-w-[9rem]",
                  active
                    ? "bg-gold-500 text-white shadow-sm"
                    : "text-iaf-700 hover:bg-white/80"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                {label}
              </button>
            );
          })}
        </div>

        <Card>
          <div
            id="patient-form-panel-personal"
            role="tabpanel"
            aria-labelledby="patient-form-tab-personal"
            hidden={tab !== "personal"}
            className={tab !== "personal" ? "hidden" : undefined}
          >
            <PersonalFields patient={patient} birthDate={birthDate} />
          </div>
          <div
            id="patient-form-panel-clinical"
            role="tabpanel"
            aria-labelledby="patient-form-tab-clinical"
            hidden={tab !== "clinical"}
            className={tab !== "clinical" ? "hidden" : undefined}
          >
            <ClinicalFields patient={patient} consentDate={consentDate} />
          </div>
          <div
            id="patient-form-panel-notes"
            role="tabpanel"
            aria-labelledby="patient-form-tab-notes"
            hidden={tab !== "notes"}
            className={tab !== "notes" ? "hidden" : undefined}
          >
            <NotesFields patient={patient} />
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <Card title="Datos personales">
        <PersonalFields patient={patient} birthDate={birthDate} />
      </Card>

      <Card title="Historia clínica estética">
        <ClinicalFields patient={patient} consentDate={consentDate} />
      </Card>

      <Card title="Notas internas">
        <NotesFields patient={patient} />
      </Card>

      <div className="flex gap-3">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
