"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface RouteErrorProps {
  module: string;
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Reusable error fallback for module-scoped error.tsx files.
 * Logs to console (swap for Sentry) and offers a one-click retry.
 */
export function RouteError({ module, error, reset }: RouteErrorProps) {
  useEffect(() => {
    // TODO: report to Sentry / similar
    console.error(`[${module}]`, error);
  }, [module, error]);

  return (
    <Card className="border-destructive/40">
      <CardContent className="py-12 flex flex-col items-center text-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-5 w-5" />
        </span>
        <h3 className="text-lg font-semibold">Something went wrong in {module}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{error.message}</p>
        {error.digest && (
          <p className="text-[10px] font-mono text-muted-foreground">digest: {error.digest}</p>
        )}
        <Button onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" /> Try again
        </Button>
      </CardContent>
    </Card>
  );
}
