import { cn } from "@/lib/utils";

const IMAGE = "/images/resultados-visibles.png";

type ResultadosVisualProps = {
  className?: string;
};

/** Fondo del bloque Resultados visibles (cabina / spa a la derecha, crema a la izquierda) */
export function ResultadosVisual({ className }: ResultadosVisualProps) {
  return (
    <div
      className={cn("landing-side-visual pointer-events-none absolute", className)}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={IMAGE}
        alt=""
        className="landing-side-visual-img resultados-visual-img h-full w-full object-cover"
      />
      <div className="landing-side-visual-fade resultados-visual-fade" />
    </div>
  );
}
