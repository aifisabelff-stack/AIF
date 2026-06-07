import { TratamientoVisual } from "@/components/brand/tratamiento-visual";
import { FlagshipStepIcon } from "@/components/landing/flagship-step-icon";
import { FLAGSHIP_TREATMENT } from "@/lib/brand";

export function TratamientoFacialSection() {
  return (
    <div className="text-left">
      <div className="landing-card landing-feature-card relative overflow-hidden rounded-2xl">
        <TratamientoVisual className="absolute bottom-0 right-0 z-0 h-[48%] w-full sm:inset-y-0 sm:h-full sm:w-[58%]" />

        <div className="relative z-10 box-border max-w-[94%] py-6 pl-0 pr-3 sm:max-w-[58%] sm:py-7 sm:pl-1 sm:pr-2 md:max-w-[54%] md:pl-0 md:pr-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-600 sm:text-xs">
            {FLAGSHIP_TREATMENT.badge}
          </p>
          <h2 className="font-script mt-1.5 text-2xl leading-snug text-iaf-700 sm:text-3xl">
            {FLAGSHIP_TREATMENT.name}
          </h2>
          <div className="landing-gold-line mt-3 max-w-[6rem]" />

          <div className="mt-4 grid gap-1.5 sm:mt-5">
            {FLAGSHIP_TREATMENT.steps.map((step) => (
              <article
                key={step.id}
                className="rounded-xl border border-gold-400/15 bg-cream-50/92 px-2.5 py-2 shadow-sm backdrop-blur-[2px] sm:px-3 sm:py-2"
              >
                <div className="flex items-start gap-2.5">
                  <div className="landing-step-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9">
                    <FlagshipStepIcon
                      icon={step.icon}
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-gold-600">{step.id}.</span>
                    <h3 className="font-display text-sm font-semibold leading-snug text-iaf-900">
                      {step.title}
                    </h3>
                    <p className="text-[11px] leading-snug text-iaf-700 sm:text-xs">
                      {step.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
