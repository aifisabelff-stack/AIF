import {
  Droplets,
  Waves,
  Zap,
  Wind,
  Thermometer,
  SprayCan,
  type LucideIcon,
} from "lucide-react";
import type { FlagshipStepIconId } from "@/lib/brand";
import { cn } from "@/lib/utils";

const ICONS: Record<FlagshipStepIconId, LucideIcon> = {
  droplets: Droplets,
  waves: Waves,
  zap: Zap,
  wind: Wind,
  thermometer: Thermometer,
  spray: SprayCan,
};

export function FlagshipStepIcon({
  icon,
  className,
}: {
  icon: FlagshipStepIconId;
  className?: string;
}) {
  const Icon = ICONS[icon];
  if (!Icon) return null;
  return <Icon className={cn(className)} strokeWidth={1.5} aria-hidden />;
}
