"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Slide } from "@/lib/types";

export function SlideCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      5000
    );
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const go = (d: number) =>
    setIndex((i) => (i + d + slides.length) % slides.length);
  const slide = slides[Math.min(index, slides.length - 1)];

  return (
    <section className="relative h-[340px] md:h-[440px] w-full overflow-hidden">
      {slide.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slide.imageUrl}
          alt={slide.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-secondary" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

      <div className="absolute bottom-0 left-0 p-6 md:p-12 max-w-2xl">
        <span className="text-xs uppercase tracking-wide text-primary font-semibold">
          Destaques da Semana
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
          {slide.title}
        </h2>
        {slide.description && (
          <p className="text-muted-foreground mt-2 line-clamp-3">
            {slide.description}
          </p>
        )}
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/60 p-2 hover:bg-background transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Próximo"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/60 p-2 hover:bg-background transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Ir para o slide ${i + 1}`}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === index ? "bg-primary" : "bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
