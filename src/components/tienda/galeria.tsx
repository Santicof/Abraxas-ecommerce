"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function Galeria({ fotos }: { fotos: { src: string; alt: string }[] }) {
  const [actual, setActual] = useState(0);
  const pista = useRef<HTMLDivElement>(null);

  const irA = (i: number) => {
    const el = pista.current;
    if (el) el.scrollTo({ left: el.clientWidth * i, behavior: "smooth" });
  };

  return (
    <div>
      <div
        ref={pista}
        onScroll={(e) => {
          const el = e.currentTarget;
          setActual(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth md:rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Fotos del producto"
      >
        {fotos.map((f, i) => (
          <div key={f.src + i} className="relative aspect-[3/4] w-full shrink-0 snap-center bg-muted">
            <Image
              src={f.src}
              alt={f.alt}
              fill
              priority={i === 0}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      {fotos.length > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {fotos.map((f, i) => (
            <button
              key={f.src + i}
              type="button"
              onClick={() => irA(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === actual}
              className={cn("size-2.5 rounded-full transition", i === actual ? "bg-foreground" : "bg-border")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
