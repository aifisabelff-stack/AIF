import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

/** SVG en repo; si existe logo-iaf.png se usa en su lugar (retina) */
const LOGO_SRC = "/images/logo-iaf.svg";
const LOGO_INTRINSIC_W = 400;
const LOGO_INTRINSIC_H = 120;
const LOGO_ASPECT = LOGO_INTRINSIC_W / LOGO_INTRINSIC_H;

const LOGO_BG = "#f9f6f2";

type Presentation = "hero" | "compact" | "sidebar" | "inline" | "transparent";

type LogoProps = {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  presentation?: Presentation;
  className?: string;
  priority?: boolean;
};

const widths: Record<string, number> = {
  sm: 88,
  md: 120,
  lg: 200,
  xl: 260,
  transparent_xl: 420,
};

const frameStyles: Record<Exclude<Presentation, "transparent">, string> = {
  hero: [
    "rounded-[1.75rem] px-10 py-8 md:px-14 md:py-11",
    "shadow-[0_4px_24px_-4px_rgba(139,94,60,0.12),0_20px_50px_-12px_rgba(154,123,79,0.18)]",
    "border border-gold-400/25",
    "ring-1 ring-inset ring-white/60",
  ].join(" "),
  compact: [
    "rounded-2xl px-4 py-3",
    "shadow-[0_2px_12px_-2px_rgba(154,123,79,0.15),0_8px_24px_-8px_rgba(139,94,60,0.12)]",
    "border border-gold-400/20",
  ].join(" "),
  sidebar: [
    "w-full rounded-2xl px-5 py-5",
    "shadow-[0_2px_16px_-4px_rgba(154,123,79,0.12)]",
    "border border-gold-400/15",
  ].join(" "),
  inline: "rounded-xl px-3 py-2 shadow-sm border border-gold-400/10",
};

function LogoImage({
  width,
  src,
  priority,
  className,
}: {
  width: number;
  src: string;
  priority?: boolean;
  className?: string;
}) {
  const displayH = Math.round(width / LOGO_ASPECT);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="IAF Aesthetic"
      width={LOGO_INTRINSIC_W}
      height={LOGO_INTRINSIC_H}
      style={{ width, height: displayH, background: "transparent" }}
      className={cn("max-w-full object-contain", className)}
      fetchPriority={priority ? "high" : undefined}
    />
  );
}

function LogoFrame({
  children,
  presentation,
  className,
}: {
  children: React.ReactNode;
  presentation: Exclude<Presentation, "transparent">;
  className?: string;
}) {
  const isHero = presentation === "hero";

  return (
    <div
      className={cn(
        "logo-frame relative inline-flex items-center justify-center",
        frameStyles[presentation],
        className
      )}
      style={{ backgroundColor: LOGO_BG }}
    >
      {isHero && (
        <>
          <div
            className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-gold-300/15 via-transparent to-gold-500/10"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -top-px left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-gold-400/50 to-transparent"
            aria-hidden
          />
        </>
      )}
      <div className="relative flex items-center justify-center">{children}</div>
    </div>
  );
}

export function Logo({
  size = "md",
  showText = true,
  presentation = "hero",
  className,
  priority = false,
}: LogoProps) {
  const isTransparent = presentation === "transparent";
  const w = isTransparent ? widths.transparent_xl : widths[size];

  return (
    <div className={cn("flex flex-col items-center gap-5", isTransparent && "gap-0", className)}>
      {isTransparent ? (
        <LogoImage width={w} src={LOGO_SRC} priority={priority} />
      ) : (
        <LogoFrame
          presentation={presentation}
          className={presentation === "sidebar" ? "w-full" : undefined}
        >
          <LogoImage width={w} src={LOGO_SRC} priority={priority} className="relative z-[1]" />
        </LogoFrame>
      )}
      {showText && (
        <p className="text-center text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">
          {BRAND.tagline}
        </p>
      )}
    </div>
  );
}

export function LogoMark({
  className,
  width = 72,
  priority = false,
  presentation = "compact",
}: {
  className?: string;
  width?: number;
  priority?: boolean;
  presentation?: Presentation;
}) {
  if (presentation === "transparent") {
    return (
      <LogoImage
        width={width}
        src={LOGO_SRC}
        priority={priority}
        className={className}
      />
    );
  }

  return (
    <LogoFrame presentation={presentation} className={className}>
      <LogoImage width={width} src={LOGO_SRC} priority={priority} className="relative z-[1]" />
    </LogoFrame>
  );
}
