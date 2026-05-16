import Link from "next/link";
import { Search, Package, MapPin, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "My Account" };

export default function AccountPage() {
  return (
    <div className="container-tight py-16 md:py-24 max-w-2xl mx-auto text-center">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-secondary mb-6">
        <Package className="h-7 w-7 text-accent" />
      </div>
      <h1 className="font-serif text-4xl md:text-5xl">Hello, beautiful.</h1>
      <p className="mt-4 text-muted-foreground max-w-md mx-auto">
        Customer accounts are coming soon. For now, you can track any order using your order number and email.
      </p>

      <div className="mt-10 grid sm:grid-cols-2 gap-4 max-w-md mx-auto">
        <Link href="/order" className="group border p-6 hover:border-accent transition-colors">
          <Search className="h-6 w-6 text-accent mx-auto mb-3" />
          <p className="font-serif text-lg">Track an order</p>
          <p className="text-xs text-muted-foreground mt-1">Enter order number + email</p>
        </Link>
        <Link href="/shop" className="group border p-6 hover:border-accent transition-colors">
          <Heart className="h-6 w-6 text-accent mx-auto mb-3" />
          <p className="font-serif text-lg">Continue shopping</p>
          <p className="text-xs text-muted-foreground mt-1">Discover the collection</p>
        </Link>
      </div>

      <p className="mt-12 text-sm text-muted-foreground">
        Want to be notified when accounts launch?{" "}
        <Link href="/contact" className="link-underline">Drop us a note</Link>.
      </p>
    </div>
  );
}
