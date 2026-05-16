import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ApiCategory } from "@/types/api";

const FALLBACK_TILES = [
  {
    name: "Perfumes",
    slug: "perfumes",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2070",
  },
  {
    name: "Attars",
    slug: "attars",
    image: "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=2070",
  },
  {
    name: "Gift Sets",
    slug: "gift-sets",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=2070",
  },
];

export function CategoryCards({ categories }: { categories: ApiCategory[] }) {
  const tiles = categories.length >= 3
    ? categories.slice(0, 3).map((c) => ({
        name: c.name,
        slug: c.slug,
        image: c.image ?? "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=2070",
      }))
    : FALLBACK_TILES;

  return (
    <section className="container-tight py-16 md:py-24">
      <div className="grid md:grid-cols-3 gap-4 md:gap-6">
        {tiles.map((t, i) => (
          <Link
            key={t.slug}
            href={`/category/${t.slug}`}
            className="group relative aspect-[4/5] md:aspect-[3/4] overflow-hidden hover-lift block"
          >
            <Image
              src={t.image}
              alt={t.name}
              fill
              sizes="(max-width:768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
              <p className="section-eyebrow text-white/70 mb-3">0{i + 1}</p>
              <h3 className="font-serif text-3xl md:text-4xl flex items-center gap-3">
                {t.name}
                <ArrowUpRight className="h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="mt-1 text-sm text-white/70 uppercase tracking-wider">Shop the edit →</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
