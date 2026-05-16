import { Truck, ShieldCheck, RefreshCcw, Sparkles } from "lucide-react";

const FEATURES = [
  { icon: Truck, title: "Free delivery", body: "On orders over Rs 3,500 across Pakistan." },
  { icon: ShieldCheck, title: "100% authentic", body: "Sourced and bottled in-house." },
  { icon: RefreshCcw, title: "7-day returns", body: "Unopened items. No questions asked." },
  { icon: Sparkles, title: "Premium gift wrap", body: "Add a handwritten note at checkout." },
];

export function FeaturesStrip() {
  return (
    <section className="bg-secondary/40 border-y">
      <div className="container-tight py-10 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
        {FEATURES.map((f, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="p-2.5 bg-background border border-border">
              <f.icon className="h-5 w-5 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-base">{f.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
