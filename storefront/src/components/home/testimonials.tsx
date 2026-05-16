"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { SectionHeading } from "./section-heading";

const REVIEWS = [
  {
    name: "Sana Tariq",
    location: "Karachi",
    rating: 5,
    text: "Mehboob attar smells exactly like my grandmother's house. Bottled nostalgia. Lasts the entire day.",
  },
  {
    name: "Ahmed Raza",
    location: "Lahore",
    rating: 5,
    text: "Ordered the gift set for my wife — packaging was stunning. Delivered next day via courier. Worth every rupee.",
  },
  {
    name: "Hira Sheikh",
    location: "Islamabad",
    rating: 5,
    text: "Switched to Noor's Rose Otto last month and the compliments haven't stopped. Premium without being pretentious.",
  },
];

export function Testimonials() {
  return (
    <section className="container-tight py-16 md:py-24">
      <SectionHeading
        eyebrow="Loved across Pakistan"
        title="What our community says."
        align="center"
        className="mb-12 mx-auto"
      />
      <div className="grid md:grid-cols-3 gap-6">
        {REVIEWS.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="bg-secondary/40 border border-border p-8 relative"
          >
            <Quote className="absolute -top-3 left-6 h-6 w-6 text-accent bg-background p-1" />
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: r.rating }).map((_, j) => (
                <Star key={j} className="h-3.5 w-3.5 fill-accent text-accent" />
              ))}
            </div>
            <p className="font-serif text-lg leading-relaxed">{r.text}</p>
            <div className="mt-6 pt-6 border-t border-border/50">
              <p className="font-medium text-sm">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.location}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
