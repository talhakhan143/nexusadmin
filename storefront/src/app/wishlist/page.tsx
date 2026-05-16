import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <div className="container-tight py-20 text-center max-w-md mx-auto">
      <Heart className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
      <h1 className="font-serif text-3xl md:text-4xl">Your wishlist</h1>
      <p className="text-muted-foreground mt-3">
        Save your favourite scents for later. Wishlist sync coming soon — for now, your saved items are stored on this device.
      </p>
      <Button asChild className="mt-8">
        <Link href="/shop">Browse the collection</Link>
      </Button>
    </div>
  );
}
