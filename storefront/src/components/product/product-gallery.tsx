"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ApiImage } from "@/types/api";

export function ProductGallery({ images, name }: { images: ApiImage[]; name: string }) {
  const [active, setActive] = React.useState(0);
  const display = images.length > 0
    ? images
    : [{ id: "ph", url: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1200", alt: name, position: 0 }];

  const next = () => setActive((i) => (i + 1) % display.length);
  const prev = () => setActive((i) => (i - 1 + display.length) % display.length);

  return (
    <div className="grid md:grid-cols-[80px_1fr] gap-4">
      {/* Thumbs */}
      <div className="hidden md:flex flex-col gap-2">
        {display.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setActive(i)}
            className={cn(
              "relative w-20 h-24 bg-secondary overflow-hidden border-2 transition-colors",
              i === active ? "border-accent" : "border-transparent hover:border-border"
            )}
          >
            <Image src={img.url} alt={img.alt ?? name} fill className="object-cover" sizes="80px" />
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="relative bg-secondary aspect-[4/5] group">
        <Image
          src={display[active].url}
          alt={display[active].alt ?? name}
          fill
          priority
          sizes="(max-width:768px) 100vw, 50vw"
          className="object-cover"
        />
        <button
          aria-label="Zoom"
          className="absolute top-4 right-4 p-2 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        {display.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous"
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              aria-label="Next"
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Mobile dots */}
        {display.length > 1 && (
          <div className="md:hidden absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
            {display.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={cn("h-1 rounded-full transition-all", i === active ? "w-6 bg-foreground" : "w-3 bg-foreground/30")}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
