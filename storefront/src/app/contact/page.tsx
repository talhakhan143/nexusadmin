import { Mail, Phone, MessageCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SITE } from "@/config/site";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="container-tight py-16 md:py-24 grid md:grid-cols-2 gap-16">
      <div className="space-y-8">
        <div>
          <p className="section-eyebrow">Say hello</p>
          <h1 className="font-serif text-4xl md:text-5xl mt-4">We'd love to hear from you.</h1>
          <p className="text-muted-foreground mt-4 max-w-md">
            Questions about a fragrance? Need help with an order? Reach out — we typically respond within 24 hours.
          </p>
        </div>

        <ul className="space-y-5">
          <Item icon={MessageCircle} label="WhatsApp" value={SITE.whatsapp} href={`https://wa.me/${SITE.whatsapp.replace(/\D/g, "")}`} />
          <Item icon={Phone} label="Phone" value={SITE.phone} href={`tel:${SITE.phone.replace(/\s/g, "")}`} />
          <Item icon={Mail} label="Email" value={SITE.email} href={`mailto:${SITE.email}`} />
          <Item icon={MapPin} label="Locations" value={SITE.address} />
        </ul>
      </div>

      <form className="bg-secondary/40 border p-8 space-y-4">
        <h2 className="font-serif text-2xl">Send a message</h2>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" required placeholder="Your name" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="message">Message</Label>
          <textarea
            id="message"
            required
            rows={5}
            className="flex w-full border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="How can we help?"
          />
        </div>
        <Button type="submit" size="lg" className="w-full">Send message</Button>
        <p className="text-xs text-muted-foreground">Form requires backend wiring — currently a UI placeholder.</p>
      </form>
    </div>
  );
}

function Item({ icon: Icon, label, value, href }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; href?: string }) {
  const content = (
    <>
      <Icon className="h-5 w-5 text-accent mt-0.5 shrink-0" />
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-base mt-0.5">{value}</p>
      </div>
    </>
  );
  if (href) {
    return (
      <li><a href={href} className="flex items-start gap-3 hover:text-accent transition-colors">{content}</a></li>
    );
  }
  return <li className="flex items-start gap-3">{content}</li>;
}
