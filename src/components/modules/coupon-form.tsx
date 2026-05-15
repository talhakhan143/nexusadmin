"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
import { MultiSelect, type MultiSelectOption } from "@/components/forms/multi-select";
import { couponSchema, type CouponInput } from "@/lib/validations/promotion";
import { createCoupon, updateCoupon } from "@/server/actions/promotions";

const DEFAULT: CouponInput = {
  code: "",
  description: "",
  type: "PERCENTAGE",
  value: 10,
  minPurchase: null,
  maxDiscount: null,
  usageLimit: null,
  perCustomerLimit: null,
  scope: "ALL",
  productIds: [],
  categoryIds: [],
  startsAt: null,
  expiresAt: null,
  isActive: true,
};

interface CouponFormProps {
  initial?: (CouponInput & { id?: string }) | null;
  productOptions: MultiSelectOption[];
  categoryOptions: MultiSelectOption[];
  trigger: React.ReactNode;
}

function toLocalDateTimeInput(d?: string | Date | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function CouponForm({ initial, productOptions, categoryOptions, trigger }: CouponFormProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const isEdit = !!initial?.id;

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CouponInput>({
    resolver: zodResolver(couponSchema),
    defaultValues: { ...DEFAULT, ...initial, startsAt: toLocalDateTimeInput(initial?.startsAt), expiresAt: toLocalDateTimeInput(initial?.expiresAt) },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        ...DEFAULT,
        ...initial,
        startsAt: toLocalDateTimeInput(initial?.startsAt),
        expiresAt: toLocalDateTimeInput(initial?.expiresAt),
      });
    }
  }, [open, initial, reset]);

  const type = watch("type");
  const scope = watch("scope");
  const productIds = watch("productIds");
  const categoryIds = watch("categoryIds");

  // Value display: percentage as int, fixed as dollars
  const value = watch("value");

  async function onSubmit(data: CouponInput) {
    setSubmitting(true);
    const payload: CouponInput = {
      ...data,
      code: data.code.toUpperCase(),
      startsAt: data.startsAt || null,
      expiresAt: data.expiresAt || null,
    };
    const res = isEdit ? await updateCoupon(initial!.id!, payload) : await createCoupon(payload);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Coupon updated" : "Coupon created");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit coupon" : "New coupon"}</DialogTitle>
          <DialogDescription>Rules, limits, targeting and schedule.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code">Code *</Label>
              <Input id="code" {...register("code")} className="font-mono uppercase" placeholder="SUMMER10" />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>
            <div className="space-y-1.5 flex flex-col">
              <Label>Active</Label>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2 h-10">
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                    <span className="text-sm text-muted-foreground">{field.value ? "Active" : "Inactive"}</span>
                  </div>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register("description")} placeholder="10% off summer collection" />
          </div>

          <Separator />

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      if (v === "FREE_SHIPPING") setValue("value", 0);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage off</SelectItem>
                      <SelectItem value="FIXED">Fixed amount off</SelectItem>
                      <SelectItem value="FREE_SHIPPING">Free shipping</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="value">
                Value {type === "PERCENTAGE" ? "(%)" : type === "FIXED" ? "($)" : "(n/a)"}
              </Label>
              {type === "FIXED" ? (
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={(value / 100 || 0).toString()}
                  onChange={(e) => setValue("value", Math.round(Number(e.target.value || 0) * 100))}
                />
              ) : (
                <Input
                  id="value"
                  type="number"
                  min="0"
                  max={type === "PERCENTAGE" ? 100 : undefined}
                  value={value.toString()}
                  onChange={(e) => setValue("value", Number(e.target.value || 0))}
                  disabled={type === "FREE_SHIPPING"}
                />
              )}
              {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="minPurchase">Min purchase ($)</Label>
              <Input
                id="minPurchase"
                type="number"
                step="0.01"
                min="0"
                placeholder="Optional"
                value={watch("minPurchase") ? (watch("minPurchase")! / 100).toFixed(2) : ""}
                onChange={(e) =>
                  setValue("minPurchase", e.target.value ? Math.round(Number(e.target.value) * 100) : null)
                }
              />
            </div>
          </div>

          {type === "PERCENTAGE" && (
            <div className="space-y-1.5">
              <Label htmlFor="maxDiscount">Max discount cap ($)</Label>
              <Input
                id="maxDiscount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Optional"
                value={watch("maxDiscount") ? (watch("maxDiscount")! / 100).toFixed(2) : ""}
                onChange={(e) =>
                  setValue("maxDiscount", e.target.value ? Math.round(Number(e.target.value) * 100) : null)
                }
              />
            </div>
          )}

          <Separator />

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="usageLimit">Total usage limit</Label>
              <Input
                id="usageLimit"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={watch("usageLimit") ?? ""}
                onChange={(e) => setValue("usageLimit", e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="perCustomerLimit">Per-customer limit</Label>
              <Input
                id="perCustomerLimit"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={watch("perCustomerLimit") ?? ""}
                onChange={(e) => setValue("perCustomerLimit", e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startsAt">Starts at</Label>
              <Input id="startsAt" type="datetime-local" {...register("startsAt")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiresAt">Expires at</Label>
              <Input id="expiresAt" type="datetime-local" {...register("expiresAt")} />
              {errors.expiresAt && <p className="text-xs text-destructive">{errors.expiresAt.message}</p>}
            </div>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label>Applies to</Label>
            <Controller
              name="scope"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All products</SelectItem>
                    <SelectItem value="PRODUCTS">Specific products</SelectItem>
                    <SelectItem value="CATEGORIES">Specific categories</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {scope === "PRODUCTS" && (
            <div className="space-y-1.5">
              <Label>Eligible products</Label>
              <MultiSelect
                options={productOptions}
                value={productIds}
                onChange={(ids) => setValue("productIds", ids, { shouldDirty: true })}
                placeholder="Select products…"
              />
              {errors.productIds && <p className="text-xs text-destructive">{errors.productIds.message}</p>}
            </div>
          )}
          {scope === "CATEGORIES" && (
            <div className="space-y-1.5">
              <Label>Eligible categories</Label>
              <MultiSelect
                options={categoryOptions}
                value={categoryIds}
                onChange={(ids) => setValue("categoryIds", ids, { shouldDirty: true })}
                placeholder="Select categories…"
              />
              {errors.categoryIds && <p className="text-xs text-destructive">{errors.categoryIds.message}</p>}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
