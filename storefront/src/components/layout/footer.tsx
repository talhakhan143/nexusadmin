import Link from "next/link";
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SITE, FOOTER_LINKS } from "@/config/site";
import { getStore } from "@/lib/api-client";

export async function Footer() {
  const store = await getStore().catch(() => null);
  const phone = store?.phone || SITE.phone;
  const email = store?.email || SITE.email;
  const address = store
    ? [store.city, store.state, store.country].filter(Boolean).join(", ")
    : SITE.address;
  const instagram = store?.socialInstagram || SITE.social.instagram;
  const facebook = store?.socialFacebook || SITE.social.facebook;
  const shortName = store?.name?.split(/[—-]/)[0].trim() || SITE.shortName;

  return (
    <footer className="bg-primary text-primary-foreground mt-20">
      {/* Newsletter */}
      <div className="border-b border-primary-foreground/10">
        <div className="container-tight py-14 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h3 className="font-serif text-3xl md:text-4xl">Join the inner circle.</h3>
            <p className="mt-3 text-primary-foreground/70 text-sm max-w-md">
              Be first to know about new arrivals, limited releases, and members-only offers. 10% off your first order.
            </p>
          </div>
          <form className="flex gap-2">
            <Input
              type="email"
              required
              placeholder="Your email address"
              className="bg-transparent border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/50"
            />
            <Button variant="gold" type="submit">Subscribe</Button>
          </form>
        </div>
      </div>

      {/* Main */}
      <div className="container-tight py-14 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2 space-y-5">
          <Link href="/" className="font-serif text-3xl">{shortName}</Link>
          <p className="text-sm text-primary-foreground/70 max-w-xs">
            {SITE.tagline}
          </p>
          <div className="space-y-2.5 text-sm text-primary-foreground/70">
            <div className="flex items-center gap-2.5">
              <MapPin className="h-3.5 w-3.5 text-accent" /> {address}
            </div>
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-2.5 hover:text-primary-foreground transition-colors">
              <Phone className="h-3.5 w-3.5 text-accent" /> {phone}
            </a>
            <a href={`mailto:${email}`} className="flex items-center gap-2.5 hover:text-primary-foreground transition-colors">
              <Mail className="h-3.5 w-3.5 text-accent" /> {email}
            </a>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <a href={instagram} aria-label="Instagram" className="p-2 border border-primary-foreground/30 hover:bg-accent hover:border-accent transition-colors">
              <Instagram className="h-4 w-4" />
            </a>
            <a href={facebook} aria-label="Facebook" className="p-2 border border-primary-foreground/30 hover:bg-accent hover:border-accent transition-colors">
              <Facebook className="h-4 w-4" />
            </a>
            <a href={SITE.social.youtube} aria-label="YouTube" className="p-2 border border-primary-foreground/30 hover:bg-accent hover:border-accent transition-colors">
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>

        <FooterCol title="Shop" links={FOOTER_LINKS.shop} />
        <FooterCol title="Help" links={FOOTER_LINKS.help} />
        <FooterCol title="Company" links={FOOTER_LINKS.company} />
      </div>

      {/* Bottom */}
      <div className="border-t border-primary-foreground/10">
        <div className="container-tight py-6 flex flex-col md:flex-row gap-4 items-center justify-between text-xs text-primary-foreground/60">
          <p>© {new Date().getFullYear()} {SITE.shortName}. All rights reserved.</p>
          <div className="flex gap-2.5 items-center">
            <span className="opacity-50">We accept:</span>
            <span className="bg-primary-foreground/10 px-2 py-1 text-[10px] uppercase tracking-wider">COD</span>
            <span className="bg-primary-foreground/10 px-2 py-1 text-[10px] uppercase tracking-wider">JazzCash</span>
            <span className="bg-primary-foreground/10 px-2 py-1 text-[10px] uppercase tracking-wider">Easypaisa</span>
            <span className="bg-primary-foreground/10 px-2 py-1 text-[10px] uppercase tracking-wider">Card</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="space-y-4">
      <h4 className="font-serif text-base tracking-wide text-accent">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
