"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-tight py-20 text-center max-w-md mx-auto">
      <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
      <h1 className="font-serif text-3xl">Something went wrong.</h1>
      <p className="text-muted-foreground mt-3 text-sm break-all">{error.message}</p>
      <Button onClick={reset} className="mt-8">Try again</Button>
    </div>
  );
}
