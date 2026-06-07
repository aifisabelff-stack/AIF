import { cn } from "@/lib/utils";

const IMAGE = "/images/ice-glow-facial.png";

type TratamientoVisualProps = {
  className?: string;
};

/** Foto del tratamiento Ice Glow Facial a la derecha, fundida al fondo crema */
export function TratamientoVisual({ className }: TratamientoVisualProps) {
  return (
    <div
      className={cn("landing-side-visual pointer-events-none absolute", className)}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={IMAGE}
        alt=""
        className="landing-side-visual-img tratamiento-visual-img"
      />
      <div className="landing-side-visual-fade" />
    </div>
  );
}
