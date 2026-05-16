"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { ApiBanner } from "@/types/api";

const FALLBACK_SLIDES: ApiBanner[] = [
  {
    id: "f1",
    name: "Hero 1",
    placement: "HOMEPAGE_HERO",
    customKey: null,
    title: "An ode to Eastern florals.",
    subtitle: "Discover the new Mehboob collection — handcrafted in Lahore.",
    ctaText: "Discover",
    ctaUrl: "/shop",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=2070",
    imageMobile: null,
    alt: "Perfume bottle",
    bgColor: null,
    textColor: null,
    linkUrl: "/shop",
    targetCategory: null,
    targetProduct: null,
    position: 0,
  },
  {
    id: "f2",
    name: "Hero 2",
    placement: "HOMEPAGE_HERO",
    customKey: null,
    title: "Find your signature scent.",
    subtitle: "Free shipping on orders over Rs 3,500 across Pakistan.",
    ctaText: "Shop now",
    ctaUrl: "/shop",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=2070",
    imageMobile: null,
    alt: "Beauty products",
    bgColor: null,
    textColor: null,
    linkUrl: "/shop",
    targetCategory: null,
    targetProduct: null,
    position: 1,
  },
  {
    id: "f3",
    name: "Hero 3",
    placement: "HOMEPAGE_HERO",
    customKey: null,
    title: "Pure attars. Zero compromises.",
    subtitle: "Aged in oud-wood barrels. Bottled by hand.",
    ctaText: "Explore attars",
    ctaUrl: "/category/attars",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=2070",
    imageMobile: null,
    alt: "Attar bottles",
    bgColor: null,
    textColor: null,
    linkUrl: "/category/attars",
    targetCategory: null,
    targetProduct: null,
    position: 2,
  },
];

export function Hero({ banners }: { banners: ApiBanner[] }) {
  const slides = banners.length > 0 ? banners : FALLBACK_SLIDES;
  const autoplay = React.useRef(Autoplay({ delay: 6000, stopOnInteraction: false }));
  const [emblaRef, embla] = useEmblaCarousel({ loop: true }, [autoplay.current]);
  const [selected, setSelected] = React.useState(0);

  React.useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelected(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    onSelect();
  }, [embla]);

  return (
    <section className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, idx) => (
            <div key={slide.id} className="relative shrink-0 grow-0 basis-full h-[80vh] min-h-[560px] max-h-[800px]">
              <Image
                src={slide.image}
                alt={slide.alt ?? slide.title ?? ""}
                fill
                priority={idx === 0}
                className="object-cover"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

              <div className="absolute inset-0 container-tight flex items-center">
                <motion.div
                  key={`${slide.id}-${selected === idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={selected === idx ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="max-w-xl text-white"
                  style={slide.textColor ? { color: slide.textColor } : undefined}
                >
                  <p className="section-eyebrow text-white/80 mb-5">{slide.name}</p>
                  <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight">
                    {slide.title}
                  </h1>
                  {slide.subtitle && (
                    <p className="mt-5 text-base md:text-lg text-white/85 max-w-md">
                      {slide.subtitle}
                    </p>
                  )}
                  {slide.ctaText && slide.ctaUrl && (
                    <div className="mt-8">
                      <Button asChild variant="gold" size="lg">
                        <Link href={slide.ctaUrl}>{slide.ctaText}</Link>
                      </Button>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nav arrows */}
      <button
        onClick={() => embla?.scrollPrev()}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 p-3 bg-background/80 backdrop-blur hover:bg-background transition-colors"
        aria-label="Previous"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => embla?.scrollNext()}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-10 p-3 bg-background/80 backdrop-blur hover:bg-background transition-colors"
        aria-label="Next"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => embla?.scrollTo(i)}
            className={cn(
              "h-1 rounded-full transition-all duration-500",
              i === selected ? "w-10 bg-white" : "w-4 bg-white/40 hover:bg-white/60"
            )}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
