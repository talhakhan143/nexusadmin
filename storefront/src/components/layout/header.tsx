"use client";

import * as React from "react";
import Link from "next/link";
import { Search, User, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SITE, NAV_LINKS } from "@/config/site";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/cn";

export function Header() {
  const [scrolled, setScrolled] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const openCart = useCart((s) => s.open);
  const count = useCart((s) => s.count());

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-all duration-300",
        scrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-background"
      )}
    >
      <div className="container-tight">
        <div className="flex h-16 md:h-20 items-center justify-between gap-6">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="md:hidden -ml-2 p-2" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 max-w-xs">
              <MobileMenu />
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex flex-col items-center group">
            <span className="font-serif text-2xl md:text-3xl font-medium tracking-tight">
              {SITE.shortName}
            </span>
            <span className="hidden md:block text-[9px] uppercase tracking-[0.3em] text-muted-foreground -mt-1">
              perfumes & beauty
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="link-underline tracking-wide hover:text-accent transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2.5 hover:bg-secondary rounded-sm transition-colors"
              aria-label="Search"
            >
              <Search className="h-4.5 w-4.5" />
            </button>
            <Link
              href="/account"
              className="hidden sm:flex p-2.5 hover:bg-secondary rounded-sm transition-colors"
              aria-label="Account"
            >
              <User className="h-4.5 w-4.5" />
            </Link>
            <Link
              href="/wishlist"
              className="hidden sm:flex p-2.5 hover:bg-secondary rounded-sm transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="h-4.5 w-4.5" />
            </Link>
            <button
              onClick={openCart}
              className="relative p-2.5 hover:bg-secondary rounded-sm transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              {count > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-medium flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </header>
  );
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    window.location.href = `/shop?q=${encodeURIComponent(q)}`;
  }

  return (
    <div className="absolute inset-x-0 top-full bg-background border-b shadow-lg animate-fade-in">
      <div className="container-tight py-6">
        <form onSubmit={submit} className="flex items-center gap-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search perfumes, attars, beauty…"
            className="border-0 text-lg h-12 px-0 focus-visible:ring-0"
          />
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-sm">
            <X className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
          Popular: <Link href="/category/perfumes" className="link-underline">Perfumes</Link>,{" "}
          <Link href="/category/attars" className="link-underline">Attars</Link>,{" "}
          <Link href="/category/gift-sets" className="link-underline">Gift sets</Link>
        </p>
      </div>
    </div>
  );
}

function MobileMenu() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <Link href="/" className="font-serif text-2xl font-medium">{SITE.shortName}</Link>
      </div>
      <nav className="flex-1 p-6 space-y-1">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="block py-3 text-base border-b border-border/40 hover:text-accent transition-colors"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="p-6 border-t bg-secondary/40 space-y-3">
        <Link href="/account" className="flex items-center gap-3 text-sm">
          <User className="h-4 w-4" /> My Account
        </Link>
        <Link href="/order" className="flex items-center gap-3 text-sm">
          <ShoppingBag className="h-4 w-4" /> Track order
        </Link>
        <p className="text-xs text-muted-foreground pt-2">WhatsApp: {SITE.whatsapp}</p>
      </div>
    </div>
  );
}
