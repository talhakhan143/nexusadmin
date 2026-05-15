"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Power, Tag, Zap, Loader2, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import type { Coupon, FlashSale, CouponType, CouponScope } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CouponForm } from "@/components/modules/coupon-form";
import { FlashSaleForm } from "@/components/modules/flash-sale-form";
import type { MultiSelectOption } from "@/components/forms/multi-select";
import {
  toggleCouponActive,
  deleteCoupon,
  toggleFlashSaleActive,
  deleteFlashSale,
  validateCoupon,
} from "@/server/actions/promotions";
import { formatCurrency, formatDate } from "@/lib/utils";

type CouponWithTargets = Coupon & {
  productIds: string[];
  categoryIds: string[];
  _count: { products: number; categories: number; orders: number };
};

type FlashSaleWithProducts = FlashSale & {
  productIds: string[];
  _count: { products: number };
};

interface Props {
  coupons: CouponWithTargets[];
  flashSales: FlashSaleWithProducts[];
  productOptions: MultiSelectOption[];
  categoryOptions: MultiSelectOption[];
  canWrite: boolean;
}

export function PromotionsView({ coupons, flashSales, productOptions, categoryOptions, canWrite }: Props) {
  return (
    <Tabs defaultValue="coupons">
      <TabsList>
        <TabsTrigger value="coupons">
          <Tag className="mr-2 h-4 w-4" /> Coupons ({coupons.length})
        </TabsTrigger>
        <TabsTrigger value="flash">
          <Zap className="mr-2 h-4 w-4" /> Flash sales ({flashSales.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="coupons">
        <CouponList coupons={coupons} productOptions={productOptions} categoryOptions={categoryOptions} canWrite={canWrite} />
      </TabsContent>
      <TabsContent value="flash">
        <FlashSaleList flashSales={flashSales} productOptions={productOptions} canWrite={canWrite} />
      </TabsContent>
    </Tabs>
  );
}

function CouponList({
  coupons,
  productOptions,
  categoryOptions,
  canWrite,
}: {
  coupons: CouponWithTargets[];
  productOptions: MultiSelectOption[];
  categoryOptions: MultiSelectOption[];
  canWrite: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Coupon codes</CardTitle>
          <CardDescription>Percentage, fixed-amount or free-shipping discounts.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {canWrite && <CouponTester />}
          {canWrite && (
            <CouponForm
              productOptions={productOptions}
              categoryOptions={categoryOptions}
              trigger={
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" /> New coupon
                </Button>
              }
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {coupons.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No coupons yet.</p>
        ) : (
          <div className="divide-y">
            {coupons.map((c) => (
              <CouponRow
                key={c.id}
                coupon={c}
                productOptions={productOptions}
                categoryOptions={categoryOptions}
                canWrite={canWrite}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CouponRow({
  coupon,
  productOptions,
  categoryOptions,
  canWrite,
}: {
  coupon: CouponWithTargets;
  productOptions: MultiSelectOption[];
  categoryOptions: MultiSelectOption[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = React.useState(false);
  const [toggling, setToggling] = React.useState(false);
  const expired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
  const exhausted = coupon.usageLimit && coupon.usageCount >= coupon.usageLimit;

  async function onToggle() {
    setToggling(true);
    const res = await toggleCouponActive(coupon.id);
    setToggling(false);
    if (!res.ok) toast.error(res.error);
    else {
      toast.success(`Coupon ${res.data?.isActive ? "activated" : "deactivated"}`);
      router.refresh();
    }
  }

  async function onDelete() {
    const res = await deleteCoupon(coupon.id);
    setPendingDelete(false);
    if (!res.ok) toast.error(res.error);
    else {
      toast.success("Coupon deleted");
      router.refresh();
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-muted/30">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-mono font-medium">{coupon.code}</p>
            <CouponTypeBadge type={coupon.type} value={coupon.value} />
            <ScopeBadge scope={coupon.scope} count={coupon.scope === "PRODUCTS" ? coupon._count.products : coupon._count.categories} />
            {!coupon.isActive && <Badge variant="secondary">Inactive</Badge>}
            {expired && <Badge variant="destructive">Expired</Badge>}
            {exhausted && <Badge variant="destructive">Exhausted</Badge>}
          </div>
          {coupon.description && <p className="text-xs text-muted-foreground mt-1">{coupon.description}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            {coupon.minPurchase ? `Min ${formatCurrency(coupon.minPurchase)} · ` : ""}
            {coupon.maxDiscount ? `Max ${formatCurrency(coupon.maxDiscount)} off · ` : ""}
            Used {coupon.usageCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""} ·
            {coupon.expiresAt ? ` expires ${formatDate(coupon.expiresAt)}` : " no expiry"}
          </p>
        </div>
        {canWrite && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggle} disabled={toggling}>
              {toggling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
            </Button>
            <CouponForm
              initial={{
                id: coupon.id,
                code: coupon.code,
                description: coupon.description ?? "",
                type: coupon.type,
                value: coupon.value,
                minPurchase: coupon.minPurchase,
                maxDiscount: coupon.maxDiscount,
                usageLimit: coupon.usageLimit,
                perCustomerLimit: coupon.perCustomerLimit,
                scope: coupon.scope,
                productIds: coupon.productIds,
                categoryIds: coupon.categoryIds,
                startsAt: coupon.startsAt ? coupon.startsAt.toISOString() : null,
                expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
                isActive: coupon.isActive,
              }}
              productOptions={productOptions}
              categoryOptions={categoryOptions}
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setPendingDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={pendingDelete} onOpenChange={setPendingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete coupon {coupon.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              {coupon._count.orders > 0 ? (
                <>This coupon has been used on <strong>{coupon._count.orders}</strong> order(s) — deletion will be refused. Deactivate instead.</>
              ) : (
                "This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CouponTypeBadge({ type, value }: { type: CouponType; value: number }) {
  if (type === "PERCENTAGE") return <Badge>{value}% off</Badge>;
  if (type === "FIXED") return <Badge>{formatCurrency(value)} off</Badge>;
  return <Badge>Free shipping</Badge>;
}

function ScopeBadge({ scope, count }: { scope: CouponScope; count: number }) {
  if (scope === "ALL") return <Badge variant="outline">All products</Badge>;
  if (scope === "PRODUCTS") return <Badge variant="outline">{count} product(s)</Badge>;
  return <Badge variant="outline">{count} category(s)</Badge>;
}

function CouponTester() {
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [subtotal, setSubtotal] = React.useState("100");
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(null);
  const [running, setRunning] = React.useState(false);

  async function run() {
    setRunning(true);
    const cents = Math.round(Number(subtotal) * 100);
    const res = await validateCoupon(code, cents);
    setRunning(false);
    if (!res.ok) {
      setResult({ ok: false, message: res.error });
    } else {
      const d = res.data!;
      const parts: string[] = [];
      if (d.discount > 0) parts.push(`Discount: ${formatCurrency(d.discount)}`);
      if (d.freeShipping) parts.push("Free shipping applied");
      if (d.description) parts.push(`(${d.description})`);
      setResult({ ok: true, message: parts.join(" · ") || "Coupon valid" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setResult(null); }}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FlaskConical className="mr-2 h-4 w-4" /> Test
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Test a coupon</DialogTitle>
          <DialogDescription>Simulate a cart subtotal to preview the discount.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="testCode">Code</Label>
            <Input id="testCode" value={code} onChange={(e) => setCode(e.target.value)} className="font-mono uppercase" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="testSubtotal">Cart subtotal ($)</Label>
            <Input id="testSubtotal" type="number" step="0.01" min="0" value={subtotal} onChange={(e) => setSubtotal(e.target.value)} />
          </div>
          {result && (
            <div className={`rounded-md border p-3 text-sm ${result.ok ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400" : "border-destructive/40 text-destructive"}`}>
              {result.message}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          <Button onClick={run} disabled={running || !code}>
            {running && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FlashSaleList({
  flashSales,
  productOptions,
  canWrite,
}: {
  flashSales: FlashSaleWithProducts[];
  productOptions: MultiSelectOption[];
  canWrite: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Flash sales</CardTitle>
          <CardDescription>Time-boxed campaigns on selected products.</CardDescription>
        </div>
        {canWrite && (
          <FlashSaleForm
            productOptions={productOptions}
            trigger={
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> New flash sale
              </Button>
            }
          />
        )}
      </CardHeader>
      <CardContent className="p-0">
        {flashSales.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No flash sales yet.</p>
        ) : (
          <div className="divide-y">
            {flashSales.map((fs) => (
              <FlashSaleRow key={fs.id} fs={fs} productOptions={productOptions} canWrite={canWrite} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FlashSaleRow({
  fs,
  productOptions,
  canWrite,
}: {
  fs: FlashSaleWithProducts;
  productOptions: MultiSelectOption[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = React.useState(false);
  const now = new Date();
  const upcoming = new Date(fs.startsAt) > now;
  const live = !upcoming && new Date(fs.endsAt) > now;
  const ended = new Date(fs.endsAt) < now;

  async function onToggle() {
    const res = await toggleFlashSaleActive(fs.id);
    if (!res.ok) toast.error(res.error);
    else {
      toast.success("Updated");
      router.refresh();
    }
  }

  async function onDelete() {
    const res = await deleteFlashSale(fs.id);
    setPendingDelete(false);
    if (!res.ok) toast.error(res.error);
    else {
      toast.success("Flash sale deleted");
      router.refresh();
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-muted/30">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium">{fs.name}</p>
            <Badge variant={fs.discountType === "PERCENTAGE" ? "default" : "secondary"}>
              {fs.discountType === "PERCENTAGE" ? `${fs.discountValue}% off` : `${formatCurrency(fs.discountValue)} off`}
            </Badge>
            {!fs.isActive && <Badge variant="secondary">Paused</Badge>}
            {live && fs.isActive && <Badge variant="success">Live now</Badge>}
            {upcoming && <Badge variant="warning">Upcoming</Badge>}
            {ended && <Badge variant="destructive">Ended</Badge>}
            <Badge variant="outline">{fs._count.products} product(s)</Badge>
          </div>
          {fs.description && <p className="text-xs text-muted-foreground mt-1">{fs.description}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(fs.startsAt)} → {formatDate(fs.endsAt)}
          </p>
        </div>
        {canWrite && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggle}>
              <Power className="h-3.5 w-3.5" />
            </Button>
            <FlashSaleForm
              productOptions={productOptions}
              initial={{
                id: fs.id,
                name: fs.name,
                description: fs.description ?? "",
                startsAt: fs.startsAt.toISOString(),
                endsAt: fs.endsAt.toISOString(),
                discountType: fs.discountType as "PERCENTAGE" | "FIXED",
                discountValue: fs.discountValue,
                isActive: fs.isActive,
                productIds: fs.productIds,
              }}
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setPendingDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={pendingDelete} onOpenChange={setPendingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete flash sale?</AlertDialogTitle>
            <AlertDialogDescription>
              "{fs.name}" will be removed. Products keep their base prices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
