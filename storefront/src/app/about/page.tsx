import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/home/section-heading";

export const metadata = { title: "About us" };

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px]">
        <Image
          src="https://images.unsplash.com/photo-1615375036519-bdf9bcd3a895?q=80&w=2070"
          alt="Atelier"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 container-tight flex items-center text-white">
          <div className="max-w-xl">
            <p className="section-eyebrow text-white/70">Our story</p>
            <h1 className="font-serif text-5xl md:text-6xl mt-4">A house built on Eastern soul.</h1>
          </div>
        </div>
      </section>

      <section className="container-tight py-20 grid md:grid-cols-2 gap-16">
        <div>
          <SectionHeading eyebrow="Heritage" title="Twelve years of perfumery." />
          <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Noor began in 2014 in a small Lahore workshop, founded by two siblings who grew up watching their grandfather distill oud in copper alembics. What started as a passion project became a quiet movement — Pakistani fragrance reimagined for a new generation.
            </p>
            <p>
              Today, we work directly with attar artisans across Punjab and Sindh, sourcing the same notes used in classical perfumery: rose otto from Kasur, saffron from Gilgit, white musk from Skardu. Every bottle is composed in small batches and aged before release.
            </p>
            <p>
              We believe luxury isn't about labels — it's about how something makes you feel. A signature scent should feel like coming home.
            </p>
          </div>
        </div>
        <div className="relative aspect-square">
          <Image src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=2070" alt="Noor atelier" fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
        </div>
      </section>

      <section className="bg-secondary/40 py-20">
        <div className="container-tight grid md:grid-cols-3 gap-10">
          {[
            { title: "Sourced with care", body: "Direct relationships with artisans. No middlemen. Notes traceable to the field." },
            { title: "Bottled by hand", body: "Each fragrance is filled and labeled by hand in our Lahore atelier — never automated." },
            { title: "Made for Pakistan", body: "Compositions that hold up in our heat, our humidity, our warmth. Built for here." },
          ].map((p) => (
            <div key={p.title} className="space-y-3">
              <h3 className="font-serif text-2xl">{p.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-tight py-20 text-center">
        <SectionHeading eyebrow="Discover" title="Find your signature." align="center" className="mx-auto mb-8" />
        <Button asChild size="lg">
          <Link href="/shop">Shop the collection</Link>
        </Button>
      </section>
    </div>
  );
}
