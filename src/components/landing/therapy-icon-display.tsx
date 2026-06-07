import {
  Droplets,
  Syringe,
  FlaskConical,
  Zap,
  Package,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { TherapyIconId } from "@/lib/therapies";
import { cn } from "@/lib/utils";

const ICONS: Record<TherapyIconId, LucideIcon> = {
  droplets: Droplets,
  syringe: Syringe,
  flask: FlaskConical,
  zap: Zap,
  package: Package,
  sparkles: Sparkles,
};

/** Icono de terapia (servidor o cliente, sin estado) */
export function TherapyIconDisplay({
  icon,
  className,
  size = "sm",
}: {
  icon: TherapyIconId;
  className?: string;
  size?: "sm" | "md";
}) {
  const Icon = ICONS[icon];
  if (!Icon) return null;
  const box = size === "md" ? "h-10 w-10" : "h-8 w-8";
  const iconSize = size === "md" ? "h-5 w-5" : "h-4 w-4";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold-200/90 to-gold-400/40 text-gold-700 shadow-sm ring-1 ring-gold-400/30",
        box,
        className
      )}
    >
      <Icon className={iconSize} strokeWidth={1.75} aria-hidden />
    </span>
  );
}
