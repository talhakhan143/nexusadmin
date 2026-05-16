import { Truck, Sparkles, ShieldCheck } from "lucide-react";

const items = [
  { icon: Truck, label: "Free delivery on orders over Rs 3,500" },
  { icon: Sparkles, label: "Sign up & save 10% on your first order" },
  { icon: ShieldCheck, label: "100% authentic. Sourced in-house." },
  { icon: Truck, label: "Cash on Delivery available across Pakistan" },
];

export function PromoStrip() {
  return (
    <div className="bg-primary text-primary-foreground text-[11px] tracking-wider uppercase overflow-hidden">
      <div className="marquee-track py-2.5">
        {[...items, ...items, ...items].map((it, i) => (
          <span key={i} className="flex items-center gap-2 px-8 whitespace-nowrap">
            <it.icon className="h-3.5 w-3.5 text-accent" />
            {it.label}
          </span>
        ))}
      </div>
    </div>
  );
}
