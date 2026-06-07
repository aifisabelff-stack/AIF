"use client";

import { Children, useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const AUTO_MS = 5000;

const SLIDE_LABELS = ["Ice Glow facial", "Resultados", "Tratamientos"] as const;

type Props = {
  children: React.ReactNode;
};

export function LandingFeatureCarousel({ children }: Props) {
  const slides = Children.toArray(children).filter(Boolean);
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (count <= 1 || paused) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTO_MS);

    return () => window.clearInterval(id);
  }, [count, paused]);

  if (count === 0) return null;

  return (
    <section
      className="mt-16 text-left"
      aria-roledescription="carrusel"
      aria-label="Tratamientos y resultados"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="relative overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-700 ease-in-out motion-reduce:transition-none"
          style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              className="w-full shrink-0"
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${count}`}
              aria-hidden={i !== index}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      {count > 1 && (
        <div
          className="mt-5 flex flex-wrap items-center justify-center gap-x-1 gap-y-2 sm:gap-x-3"
          role="tablist"
          aria-label="Seleccionar sección"
        >
          {slides.map((_, i) => {
            const label = SLIDE_LABELS[i] ?? `Sección ${i + 1}`;
            const active = i === index;
            return (
              <button
                key={i}
                type="button"
                role="tab"
                onClick={() => goTo(i)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm",
                  active
                    ? "bg-gold-500/15 text-gold-800 ring-1 ring-gold-400/50"
                    : "text-iaf-600 hover:bg-cream-100 hover:text-gold-700"
                )}
                aria-selected={active}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
