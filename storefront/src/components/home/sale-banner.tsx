"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

function timeLeft(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

export function SaleBanner({ endsAt }: { endsAt?: Date }) {
  const target = React.useMemo(() => endsAt ?? new Date(Date.now() + 3 * 86400000), [endsAt]);
  const [t, setT] = React.useState(timeLeft(target));

  React.useEffect(() => {
    const id = setInterval(() => setT(timeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <section className="bg-ink text-ivory relative overflow-hidden">
      <div className="absolute inset-0 grain opacity-30" />
      <div className="container-tight py-16 md:py-24 relative grid md:grid-cols-2 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <p className="section-eyebrow text-ivory/70">Limited drop</p>
          <h2 className="font-serif text-4xl md:text-6xl mt-4 leading-tight">
            Eid Edit — up to <span className="text-accent">25% off</span>
          </h2>
          <p className="mt-4 text-ivory/70 max-w-md">
            Curated gift sets, signature attars, and our most-loved florals. While stocks last.
          </p>
          <div className="mt-8">
            <Button asChild variant="gold" size="lg">
              <Link href="/shop?sale=true">Shop the edit</Link>
            </Button>
          </div>
        </motion.div>

        <div className="flex flex-wrap justify-center md:justify-end gap-3 md:gap-5">
          <Counter label="Days" value={t.days} />
          <Counter label="Hours" value={t.hours} />
          <Counter label="Minutes" value={t.minutes} />
          <Counter label="Seconds" value={t.seconds} />
        </div>
      </div>
    </section>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-ivory/5 border border-ivory/10 backdrop-blur p-5 md:p-7 min-w-[88px] text-center">
      <p className="font-serif text-3xl md:text-5xl tabular-nums">{String(value).padStart(2, "0")}</p>
      <p className="text-[10px] uppercase tracking-[0.25em] text-ivory/60 mt-1">{label}</p>
    </div>
  );
}
