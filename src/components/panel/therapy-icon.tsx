"use client";

import type { TherapyIconId } from "@/lib/therapies";
import { TherapyIconDisplay } from "@/components/landing/therapy-icon-display";
import { cn } from "@/lib/utils";

export function TherapyIcon({
  icon,
  className,
  size = "md",
}: {
  icon: TherapyIconId;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const mapped = size === "lg" ? "md" : size === "sm" ? "sm" : "md";
  return (
    <TherapyIconDisplay
      icon={icon}
      size={mapped}
      className={cn(size === "lg" && "h-14 w-14 [&_svg]:h-7 [&_svg]:w-7", className)}
    />
  );
}
