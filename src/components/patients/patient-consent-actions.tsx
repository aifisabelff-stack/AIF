"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InformedConsentModal } from "@/components/patients/informed-consent-modal";

type Props = {
  patientName: string;
  signed: boolean;
  consentDate: string;
};

export function PatientConsentActions({ patientName, signed, consentDate }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="secondary" className="mt-2 text-xs" onClick={() => setOpen(true)}>
        <FileText className="h-3.5 w-3.5" />
        Ver consentimiento informado
      </Button>
      <InformedConsentModal
        open={open}
        onClose={() => setOpen(false)}
        patientName={patientName}
        signed={signed}
        consentDate={consentDate}
        readOnly
      />
    </>
  );
}
