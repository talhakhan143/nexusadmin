import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-tight py-20 text-center max-w-md mx-auto">
      <p className="font-serif text-7xl md:text-9xl text-accent/40">404</p>
      <h1 className="font-serif text-3xl mt-4">Page not found.</h1>
      <p className="text-muted-foreground mt-3">
        The page you're looking for has moved or doesn't exist.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
