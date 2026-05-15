"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { processRefund } from "@/server/actions/orders";
import { formatCurrency } from "@/lib/utils";

interface RefundDialogProps {
  orderId: string;
  refundable: number; // cents
  currency?: string;
  trigger: React.ReactNode;
}

export function RefundDialog({ orderId, refundable, currency = "USD", trigger }: RefundDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState((refundable / 100).toFixed(2));
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setAmount((refundable / 100).toFixed(2));
      setReason("");
    }
  }, [open, refundable]);

  async function submit() {
    const cents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    const res = await processRefund(orderId, { amount: cents, reason: reason || null });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Refunded ${formatCurrency(cents, currency)}`);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Process refund</DialogTitle>
          <DialogDescription>
            Refundable: <strong>{formatCurrency(refundable, currency)}</strong>. This records the refund and updates payment status.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({currency})</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              max={(refundable / 100).toFixed(2)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} disabled={submitting || refundable <= 0}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            Refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
