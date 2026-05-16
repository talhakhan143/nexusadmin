import Image from "next/image";
import Link from "next/link";
import { Instagram } from "lucide-react";

const IMAGES = [
  "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=400",
  "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=400",
  "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=400",
  "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=400",
  "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=400",
  "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=400",
];

export function InstagramStrip() {
  return (
    <section className="border-t">
      <div className="container-tight py-10 text-center">
        <Link
          href="https://instagram.com"
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 link-underline text-sm uppercase tracking-wider"
        >
          <Instagram className="h-4 w-4 text-accent" /> @noorperfumes — follow for fragrance stories
        </Link>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6">
        {IMAGES.map((src, i) => (
          <a key={i} href="https://instagram.com" target="_blank" rel="noopener" className="relative aspect-square group overflow-hidden">
            <Image src={src} alt="Instagram post" fill sizes="(max-width:768px) 33vw, 16vw" className="object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <Instagram className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
