import { Check } from "lucide-react";
import { ResultadosVisual } from "@/components/brand/resultados-visual";
import { FLAGSHIP_TREATMENT } from "@/lib/brand";

export function ResultadosSection() {
  return (
    <div className="text-left">
      <div className="landing-card landing-feature-card relative overflow-hidden rounded-2xl">
        <ResultadosVisual className="absolute inset-0 z-0 h-full w-full" />

        <div className="relative z-10 box-border max-w-full px-5 py-6 sm:max-w-[56%] sm:px-6 sm:py-7 md:max-w-[52%] md:px-7">
          <h2 className="font-display text-2xl font-semibold text-iaf-900 md:text-4xl">
            Resultados{" "}
            <span className="font-script text-3xl font-normal text-gold-600 md:text-4xl">
              visibles
            </span>
          </h2>
          <ul className="mt-6 space-y-2.5 sm:mt-8">
            {FLAGSHIP_TREATMENT.results.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 rounded-xl border border-gold-400/15 bg-cream-50/90 px-3 py-2.5 text-iaf-900 shadow-sm backdrop-blur-[2px] sm:bg-cream-50/85"
              >
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" strokeWidth={2} />
                <span className="text-sm font-medium sm:text-base">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
