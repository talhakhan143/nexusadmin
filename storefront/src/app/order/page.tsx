"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TrackOrderPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = React.useState("");
  const [email, setEmail] = React.useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber || !email) return;
    router.push(`/order/${encodeURIComponent(orderNumber)}?email=${encodeURIComponent(email)}`);
  }

  return (
    <div className="container-tight py-20">
      <div className="max-w-md mx-auto">
        <h1 className="font-serif text-4xl text-center">Track your order</h1>
        <p className="text-center text-muted-foreground mt-3">
          Enter your order number and email to view status.
        </p>
        <form onSubmit={submit} className="mt-10 space-y-4">
          <div>
            <Label htmlFor="orderNumber">Order number</Label>
            <Input id="orderNumber" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="NX-2026-XXXXX" required />
          </div>
          <div>
            <Label htmlFor="email">Email used at checkout</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <Button type="submit" size="lg" className="w-full">
            <Search className="h-4 w-4" />
            Track order
          </Button>
        </form>
      </div>
    </div>
  );
}
