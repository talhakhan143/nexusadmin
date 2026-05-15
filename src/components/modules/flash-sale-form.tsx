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
import { flashSaleSchema, type FlashSaleInput } from "@/lib/validations/promotion";
import { createFlashSale, updateFlashSale } from "@/server/actions/promotions";

const DEFAULT: FlashSaleInput = {
  name: "",
  description: "",
  startsAt: "",
  endsAt: "",
  discountType: "PERCENTAGE",
  discountValue: 20,
  isActive: true,
  productIds: [],
};

function toLocalDateTimeInput(d?: string | Date | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

interface FlashSaleFormProps {
  initial?: (FlashSaleInput & { id?: string }) | null;
  productOptions: MultiSelectOption[];
  trigger: React.ReactNode;
}

export function FlashSaleForm({ initial, productOptions, trigger }: FlashSaleFormProps) {
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
  } = useForm<FlashSaleInput>({
    resolver: zodResolver(flashSaleSchema),
    defaultValues: {
      ...DEFAULT,
      ...initial,
      startsAt: toLocalDateTimeInput(initial?.startsAt),
      endsAt: toLocalDateTimeInput(initial?.endsAt),
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        ...DEFAULT,
        ...initial,
        startsAt: toLocalDateTimeInput(initial?.startsAt),
        endsAt: toLocalDateTimeInput(initial?.endsAt),
      });
    }
  }, [open, initial, reset]);

  const discountType = watch("discountType");
  const discountValue = watch("discountValue");
  const productIds = watch("productIds");

  async function onSubmit(data: FlashSaleInput) {
    setSubmitting(true);
    const res = isEdit ? await updateFlashSale(initial!.id!, data) : await createFlashSale(data);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Flash sale updated" : "Flash sale created");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit flash sale" : "New flash sale"}</DialogTitle>
          <DialogDescription>Time-boxed campaign on selected products.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register("name")} placeholder="Weekend Mega Sale" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} {...register("description")} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startsAt">Starts at *</Label>
              <Input id="startsAt" type="datetime-local" {...register("startsAt")} />
              {errors.startsAt && <p className="text-xs text-destructive">{errors.startsAt.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endsAt">Ends at *</Label>
              <Input id="endsAt" type="datetime-local" {...register("endsAt")} />
              {errors.endsAt && <p className="text-xs text-destructive">{errors.endsAt.message}</p>}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Discount type</Label>
              <Controller
                name="discountType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage off</SelectItem>
                      <SelectItem value="FIXED">Fixed amount off</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discountValue">Value {discountType === "PERCENTAGE" ? "(%)" : "($)"}</Label>
              {discountType === "FIXED" ? (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={(discountValue / 100 || 0).toString()}
                  onChange={(e) => setValue("discountValue", Math.round(Number(e.target.value || 0) * 100))}
                />
              ) : (
                <Input
                  type="number"
                  min="0"
                  max={100}
                  value={discountValue.toString()}
                  onChange={(e) => setValue("discountValue", Number(e.target.value || 0))}
                />
              )}
              {errors.discountValue && <p className="text-xs text-destructive">{errors.discountValue.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Products *</Label>
            <MultiSelect
              options={productOptions}
              value={productIds}
              onChange={(ids) => setValue("productIds", ids, { shouldDirty: true })}
              placeholder="Select products…"
            />
            {errors.productIds && <p className="text-xs text-destructive">{errors.productIds.message}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
            <Label>Active</Label>
          </div>
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
