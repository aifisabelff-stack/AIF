import { cn } from "@/lib/utils";

const FLYER = "/images/iaf-flyer.png";

/** Parte superior del flyer: logo, Ice Glow Facial y cabina */
export function FlyerHeroTop({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-gold-400/30 shadow-xl shadow-gold-400/10",
        "h-[280px] sm:h-[340px] md:h-[400px]",
        className
      )}
      role="img"
      aria-label="IAF Aesthetic — cabina y tratamiento Ice Glow Facial"
    >
      <div
        className="absolute left-0 top-0 w-full bg-no-repeat"
        style={{
          backgroundImage: `url(${FLYER})`,
          backgroundSize: "100% auto",
          backgroundPosition: "top center",
          height: "240%",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-cream-50/90 to-transparent" />
    </div>
  );
}

/** Parte central inferior del flyer: tratamiento facial (fondo Resultados visibles) */
export function FlyerResultsBackdrop({ className }: { className?: string }) {
  return (
    <div
      className={cn("absolute inset-0 bg-no-repeat", className)}
      style={{
        backgroundImage: `url(${FLYER})`,
        backgroundSize: "185% auto",
        backgroundPosition: "52% 78%",
      }}
      aria-hidden
    />
  );
}
