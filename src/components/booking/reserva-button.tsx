import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "rose" | "gold";
  className?: string;
  showIcon?: boolean;
};

const variants = {
  rose:
    "bg-rose-btn text-white hover:bg-rose-btn-hover shadow-md shadow-iaf-400/20 uppercase tracking-wider text-xs font-semibold",
  gold: "bg-gradient-to-r from-gold-400 to-gold-500 text-white hover:opacity-95 shadow-sm",
};

/** Enlace HTML nativo: funciona sin hidratación de React ni prefetch pesado */
export function ReservaButton({
  variant = "rose",
  className,
  showIcon = true,
}: Props) {
  return (
    <a
      href="/reserva"
      className={cn(
        "relative z-10 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
        variants[variant],
        className
      )}
    >
      RESERVAR Y GESTIONAR TU CITA
      {showIcon && <CalendarDays className="h-4 w-4" aria-hidden />}
    </a>
  );
}
