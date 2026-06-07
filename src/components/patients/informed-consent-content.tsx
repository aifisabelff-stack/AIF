import { INFORMED_CONSENT_SECTIONS } from "@/lib/informed-consent";
import { BRAND } from "@/lib/brand";

type Props = {
  patientName?: string;
};

export function InformedConsentContent({ patientName }: Props) {
  return (
    <article className="space-y-5 text-sm leading-relaxed text-iaf-800">
      <header className="border-b border-iaf-100 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">
          {BRAND.name} {BRAND.aesthetic}
        </p>
        <h3 className="font-display mt-1 text-lg font-semibold text-iaf-900">
          Consentimiento informado
        </h3>
        <p className="mt-1 text-xs text-iaf-500">
          {BRAND.subtitle} · {BRAND.owner}
        </p>
        {patientName && (
          <p className="mt-3 text-sm font-medium text-iaf-900">Paciente: {patientName}</p>
        )}
      </header>

      {INFORMED_CONSENT_SECTIONS.map((section) => (
        <section key={section.title}>
          <h4 className="font-semibold text-iaf-900">{section.title}</h4>
          <div className="mt-2 space-y-2 text-iaf-700">
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
        </section>
      ))}
    </article>
  );
}
