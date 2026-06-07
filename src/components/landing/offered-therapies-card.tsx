import { getActiveCatalogGroups, type TherapyCatalogGroup } from "@/lib/therapies";
import { TerapiasMaquinaVisual } from "@/components/landing/terapias-maquina-visual";
import { TherapyIconDisplay } from "@/components/landing/therapy-icon-display";

type Props = {
  therapies: { name: string; price: number | null }[];
};

export function OfferedTherapiesCard({ therapies }: Props) {
  const groups: TherapyCatalogGroup[] = getActiveCatalogGroups(therapies);

  if (groups.length === 0) return null;

  return (
    <div className="text-left">
      <div className="landing-card landing-feature-card relative overflow-hidden rounded-2xl">
        <TerapiasMaquinaVisual className="absolute inset-0 z-0 h-full w-full" />

        <div className="relative z-10 box-border max-w-full px-5 py-6 sm:max-w-[62%] sm:px-6 sm:py-7 md:max-w-[58%]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-600">
          Tratamientos
        </p>
        <h2 className="font-display mt-1 text-xl font-semibold text-iaf-900 sm:text-2xl">
          Terapias disponibles
        </h2>
        <div className="landing-gold-line mt-3 max-w-[5rem]" />

        <ul className="mt-4 grid gap-2 sm:grid-cols-1">
          {groups.map((group) => (
            <li
              key={group.key}
              className="flex items-center gap-2.5 rounded-xl border border-gold-400/15 bg-cream-50/90 px-2.5 py-2 shadow-sm backdrop-blur-[2px] sm:gap-3 sm:px-3 sm:py-2.5"
            >
              <TherapyIconDisplay icon={group.icon} size="sm" />
              <span className="min-w-0 text-sm font-medium leading-snug text-iaf-900">
                {group.title}
              </span>
            </li>
          ))}
        </ul>
        </div>
      </div>
    </div>
  );
}
