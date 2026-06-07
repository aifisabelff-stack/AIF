import { cn } from "@/lib/utils";

const IMAGE = "/images/maquina-terapias.png";

type TerapiasMaquinaVisualProps = {
  className?: string;
};

/** Fondo del bloque Terapias disponibles (equipo con fundido a la izquierda) */
export function TerapiasMaquinaVisual({ className }: TerapiasMaquinaVisualProps) {
  return (
    <div
      className={cn("landing-side-visual pointer-events-none absolute", className)}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={IMAGE}
        alt=""
        className="landing-side-visual-img terapias-maquina-img h-full w-full object-cover"
      />
      <div className="landing-side-visual-fade terapias-maquina-fade" />
    </div>
  );
}
