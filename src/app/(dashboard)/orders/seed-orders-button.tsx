"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { seedDemoOrders } from "@/server/actions/orders";

export function SeedOrdersButton() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function run() {
    setLoading(true);
    const res = await seedDemoOrders();
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Seeded ${res.data?.created ?? 0} demo orders`);
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={run} disabled={loading}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
      Seed demo orders
    </Button>
  );
}
