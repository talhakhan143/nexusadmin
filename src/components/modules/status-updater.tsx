"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrderStatus, updateOrderTracking } from "@/server/actions/orders";

const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function StatusUpdater({
  orderId,
  current,
  trigger,
}: {
  orderId: string;
  current: OrderStatus;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState<OrderStatus>(current);
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => setStatus(current), [current, open]);

  const choices = ALLOWED[current];

  async function submit() {
    setSubmitting(true);
    const res = await updateOrderStatus(orderId, { status, note: note || null });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Status → ${status}`);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => choices.length > 0 && setOpen(true)}>{trigger}</span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update order status</DialogTitle>
          <DialogDescription>
            Current status: <strong>{current}</strong>. Allowed transitions: {choices.join(", ") || "—"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>New status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {choices.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting || status === current || choices.length === 0}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TrackingUpdater({
  orderId,
  current,
  currentUrl,
  trigger,
}: {
  orderId: string;
  current: string | null;
  currentUrl: string | null;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [trackingNumber, setTrackingNumber] = React.useState(current ?? "");
  const [trackingUrl, setTrackingUrl] = React.useState(currentUrl ?? "");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    setTrackingNumber(current ?? "");
    setTrackingUrl(currentUrl ?? "");
  }, [current, currentUrl, open]);

  async function submit() {
    setSubmitting(true);
    const res = await updateOrderTracking(orderId, { trackingNumber, trackingUrl: trackingUrl || null });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Tracking updated");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{current ? "Update tracking" : "Add tracking"}</DialogTitle>
          <DialogDescription>Carrier tracking number and (optional) tracking URL.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trk">Tracking number</Label>
            <input
              id="trk"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trkUrl">Tracking URL (optional)</Label>
            <input
              id="trkUrl"
              type="url"
              placeholder="https://…"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting || !trackingNumber}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
