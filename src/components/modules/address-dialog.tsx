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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addressSchema, type AddressInput } from "@/lib/validations/customer";
import { addAddress, updateAddress } from "@/server/actions/customers";

const DEFAULT: AddressInput = {
  type: "BOTH",
  firstName: "",
  lastName: "",
  company: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  country: "US",
  postalCode: "",
  phone: "",
  isDefault: false,
};

interface AddressDialogProps {
  customerId: string;
  initial?: (AddressInput & { id?: string }) | null;
  trigger: React.ReactNode;
}

export function AddressDialog({ customerId, initial, trigger }: AddressDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const isEdit = !!initial?.id;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: { ...DEFAULT, ...initial },
  });

  React.useEffect(() => {
    if (open) reset({ ...DEFAULT, ...initial });
  }, [open, initial, reset]);

  async function onSubmit(data: AddressInput) {
    setSubmitting(true);
    const res = isEdit ? await updateAddress(initial!.id!, data) : await addAddress(customerId, data);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Address updated" : "Address added");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit address" : "Add address"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...register("firstName")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...register("lastName")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company">Company</Label>
            <Input id="company" {...register("company")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="line1">Address line 1 *</Label>
            <Input id="line1" {...register("line1")} />
            {errors.line1 && <p className="text-xs text-destructive">{errors.line1.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="line2">Address line 2</Label>
            <Input id="line2" {...register("line2")} />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city">City *</Label>
              <Input id="city" {...register("city")} />
              {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State / Region</Label>
              <Input id="state" {...register("state")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="postalCode">Postal code *</Label>
              <Input id="postalCode" {...register("postalCode")} />
              {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode.message}</p>}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Input id="country" maxLength={2} {...register("country")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" {...register("phone")} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BOTH">Both billing & shipping</SelectItem>
                      <SelectItem value="BILLING">Billing only</SelectItem>
                      <SelectItem value="SHIPPING">Shipping only</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex items-end gap-3 pb-2">
              <Controller
                name="isDefault"
                control={control}
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
              <Label>Default address</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
