import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "gold" | "rose";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 shadow-md shadow-gold-400/25",
  rose:
    "bg-rose-btn text-white hover:bg-rose-btn-hover shadow-md shadow-iaf-400/20 uppercase tracking-wider text-xs font-semibold",
  secondary:
    "bg-white/90 text-iaf-800 border border-gold-400/30 hover:bg-cream-100 hover:border-gold-400/50",
  ghost: "text-iaf-700 hover:bg-cream-200/80",
  danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
  gold: "bg-gradient-to-r from-gold-400 to-gold-500 text-white hover:opacity-95 shadow-sm",
};

const base =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all";

/** Enlace con aspecto de botón (evita <a><button>, que rompe clics en el navegador) */
export function LinkButton({
  variant = "primary",
  className,
  href,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return (
    <Link href={href} prefetch className={cn(base, variants[variant], className)} {...props} />
  );
}
