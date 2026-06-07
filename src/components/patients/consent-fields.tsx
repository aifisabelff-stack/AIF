"use client";

import { useState, useCallback } from "react";
import type { Patient } from "@/lib/firestore-types";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input, Label } from "@/components/ui/input";
import { fullName } from "@/lib/utils";
import { InformedConsentModal } from "@/components/patients/informed-consent-modal";

type Props = {
  patient?: Patient;
  initialConsentDate: string;
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function resolvePatientName(patient?: Patient): string {
  if (patient) {
    return fullName(patient.firstName, patient.lastName);
  }
  if (typeof document === "undefined") return "";
  const first = (document.getElementById("firstName") as HTMLInputElement | null)?.value?.trim();
  const last = (document.getElementById("lastName") as HTMLInputElement | null)?.value?.trim();
  if (!first && !last) return "";
  return [first, last].filter(Boolean).join(" ");
}

export function ConsentFields({ patient, initialConsentDate }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [signed, setSigned] = useState(patient?.consentSigned ?? false);
  const [consentDate, setConsentDate] = useState(initialConsentDate);

  const [modalPatientName, setModalPatientName] = useState("");

  const handleOpen = useCallback(() => {
    setModalPatientName(resolvePatientName(patient));
    setModalOpen(true);
  }, [patient]);

  function handleConfirm() {
    setSigned(true);
    setConsentDate(todayIsoDate());
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Button type="button" variant="secondary" onClick={handleOpen}>
            <FileText className="h-4 w-4" />
            Abrir consentimiento informado
          </Button>
          <p className="mt-2 text-xs text-iaf-500">
            El cliente puede leer el documento, confirmarlo e imprimirlo antes de guardar la ficha.
          </p>
        </div>

        <FieldGroup className="flex items-end gap-3 sm:col-span-2">
          <input
            type="checkbox"
            id="consentSigned"
            name="consentSigned"
            checked={signed}
            onChange={(e) => setSigned(e.target.checked)}
            className="h-4 w-4 rounded border-iaf-300"
          />
          <Label htmlFor="consentSigned">Consentimiento informado firmado</Label>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="consentDate">Fecha del consentimiento</Label>
          <Input
            id="consentDate"
            name="consentDate"
            type="date"
            value={consentDate}
            onChange={(e) => setConsentDate(e.target.value)}
          />
        </FieldGroup>
      </div>

      <InformedConsentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        patientName={modalPatientName}
        signed={signed}
        consentDate={consentDate}
        onConfirm={handleConfirm}
      />
    </>
  );
}
