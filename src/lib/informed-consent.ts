import { BRAND } from "@/lib/brand";

export type InformedConsentSection = {
  title: string;
  paragraphs: string[];
};

export const INFORMED_CONSENT_SECTIONS: InformedConsentSection[] = [
  {
    title: "Identificación del centro",
    paragraphs: [
      `${BRAND.name} ${BRAND.aesthetic} — ${BRAND.subtitle}, a cargo de ${BRAND.owner}.`,
      `Domicilio: ${BRAND.address}, ${BRAND.city}. Teléfono: ${BRAND.phone}.`,
    ],
  },
  {
    title: "Objeto de este documento",
    paragraphs: [
      "El presente consentimiento informado tiene por objeto que el paciente conozca, de forma comprensible, la naturaleza de los tratamientos de enfermería dermoestética que podrá recibir, sus beneficios esperados, riesgos habituales, alternativas razonables y las medidas de seguridad aplicadas en el centro.",
      "La firma o confirmación de este documento no sustituye la información verbal que el profesional sanitario proporcionará en cada visita.",
    ],
  },
  {
    title: "Naturaleza de los tratamientos",
    paragraphs: [
      "Los tratamientos son de carácter ambulatorio y están orientados al cuidado, mejora y mantenimiento de la piel (higiene, hidratación, protocolos con aparatología de uso estético, etc.).",
      "Los resultados pueden variar según el tipo de piel, hábitos de vida, medicación, patologías previas y cumplimiento de las indicaciones post-tratamiento.",
      "No se garantizan resultados específicos; se actuará conforme a buenas prácticas y al protocolo acordado para cada sesión.",
    ],
  },
  {
    title: "Riesgos y efectos adversos habituales",
    paragraphs: [
      "En muchos procedimientos pueden aparecer de forma transitoria enrojecimiento, sensación de calor o tirantez, sequedad, descamación leve, hematomas mínimos o sensibilidad cutánea.",
      "Existe un riesgo bajo de reacción alérgica a cosméticos o activos aplicados, infección si no se respetan las indicaciones de cuidado, o respuesta cutánea inesperada en pieles sensibles.",
      "Debe comunicar de inmediato cualquier reacción que considere anormal o persistente.",
    ],
  },
  {
    title: "Información clínica veraz y contraindicaciones",
    paragraphs: [
      "El paciente declara que la información facilitada en su historia clínica (alergias, medicación, embarazo o lactancia, patologías, tratamientos previos, marcapasos u otros dispositivos, antecedentes de herpes, quemaduras solares recientes, etc.) es veraz y estará actualizada.",
      "El centro podrá posponer o no realizar un tratamiento si existen contraindicaciones, dudas clínicas o falta de información relevante.",
    ],
  },
  {
    title: "Obligaciones del paciente",
    paragraphs: [
      "Seguir las indicaciones antes y después del tratamiento, acudir a las revisiones acordadas y comunicar cambios en su estado de salud o medicación.",
      "Evitar la exposición solar intensa o procedimientos no autorizados en la zona tratada cuando el profesional lo indique.",
    ],
  },
  {
    title: "Protección de datos personales",
    paragraphs: [
      "Los datos se tratarán para la gestión asistencial, citas, facturación y cumplimiento de obligaciones legales, con las medidas de seguridad adecuadas.",
      "Puede ejercer sus derechos de acceso, rectificación, supresión, limitación, oposición y portabilidad contactando con el centro, así como presentar reclamación ante la autoridad de control.",
    ],
  },
  {
    title: "Derecho a retirar el consentimiento",
    paragraphs: [
      "Puede retirar su consentimiento en cualquier momento sin que ello afecte a la licitud del tratamiento basado en el consentimiento previo a su retirada.",
      "La retirada no obligará a borrar los datos necesarios por obligación legal o para la defensa de reclamaciones.",
    ],
  },
  {
    title: "Declaración del paciente",
    paragraphs: [
      "Declaro haber leído y comprendido la información anterior, haber podido formular preguntas y otorgar mi consentimiento para los tratamientos de enfermería dermoestética indicados por el profesional en este centro.",
    ],
  },
];

export function buildInformedConsentPrintHtml(options: {
  patientName: string;
  signed: boolean;
  consentDate?: string;
}) {
  const { patientName, signed, consentDate } = options;
  const today = new Date().toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const sectionsHtml = INFORMED_CONSENT_SECTIONS.map(
    (s) =>
      `<section style="margin-bottom:1.25rem;">
        <h2 style="font-size:14px;margin:0 0 0.5rem;color:#3d3429;">${s.title}</h2>
        ${s.paragraphs.map((p) => `<p style="margin:0 0 0.5rem;font-size:12px;line-height:1.5;color:#4a4238;">${p}</p>`).join("")}
      </section>`
  ).join("");

  const signatureBlock = signed
    ? `<p style="margin-top:2rem;font-size:12px;"><strong>Paciente:</strong> ${patientName}<br/>
       <strong>Fecha de consentimiento:</strong> ${consentDate ?? today}<br/>
       <strong>Estado:</strong> Consentimiento confirmado</p>`
    : `<p style="margin-top:2rem;font-size:12px;color:#6b6156;">Documento informativo — pendiente de confirmación del paciente.</p>
       <p style="margin-top:2.5rem;border-top:1px solid #ccc;padding-top:0.75rem;font-size:12px;">
         Firma del paciente: _________________________ &nbsp;&nbsp; Fecha: ___ / ___ / ______
       </p>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>Consentimiento informado — ${patientName}</title>
  <style>
    @page { margin: 18mm; }
    body { font-family: Georgia, "Times New Roman", serif; max-width: 700px; margin: 0 auto; padding: 24px; color: #2a241c; }
    h1 { font-size: 18px; margin: 0 0 0.25rem; }
    .sub { font-size: 12px; color: #6b6156; margin-bottom: 1.5rem; }
  </style>
</head>
<body>
  <h1>Consentimiento informado</h1>
  <p class="sub">${BRAND.name} ${BRAND.aesthetic} · ${BRAND.subtitle}</p>
  <p style="font-size:12px;margin-bottom:1.5rem;"><strong>Paciente:</strong> ${patientName || "—"}</p>
  ${sectionsHtml}
  ${signatureBlock}
  <p style="margin-top:2rem;font-size:10px;color:#8a8076;">Impreso el ${today}</p>
</body>
</html>`;
}

export function printInformedConsent(options: {
  patientName: string;
  signed: boolean;
  consentDate?: string;
}) {
  const html = buildInformedConsentPrintHtml(options);
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  return true;
}
