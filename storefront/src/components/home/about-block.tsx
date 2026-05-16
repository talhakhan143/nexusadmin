import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "./section-heading";

export function AboutBlock() {
  return (
    <section className="container-tight py-16 md:py-24 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
      <div className="relative aspect-[4/5] md:aspect-square">
        <Image
          src="https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=2070"
          alt="Atelier"
          fill
          sizes="(max-width:768px) 100vw, 50vw"
          className="object-cover"
        />
        <div className="absolute -bottom-6 -right-6 hidden md:block bg-accent text-accent-foreground p-6 max-w-[180px]">
          <p className="font-serif text-4xl">12+</p>
          <p className="text-xs uppercase tracking-wider mt-1">Years of perfumery</p>
        </div>
      </div>
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Our story"
          title="A house built on Eastern soul."
          subtitle="From the courtyards of Lahore to the souks of Karachi, we have spent over a decade studying what makes a fragrance unforgettable. Every Noor scent is composed in small batches, with notes sourced from artisans we've known for years."
        />
        <div className="grid grid-cols-3 gap-4 pt-2">
          <Stat label="Fragrances crafted" value="240+" />
          <Stat label="Cities delivered" value="60+" />
          <Stat label="Happy customers" value="18K+" />
        </div>
        <Button asChild variant="outline" size="lg">
          <Link href="/about">Read our story</Link>
        </Button>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-accent pl-4">
      <p className="font-serif text-2xl md:text-3xl">{value}</p>
      <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
