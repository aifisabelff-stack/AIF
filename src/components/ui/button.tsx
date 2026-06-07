import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

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

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
