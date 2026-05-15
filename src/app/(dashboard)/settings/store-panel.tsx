"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { storeSchema, type StoreInput } from "@/lib/validations/settings";
import { updateStore } from "@/server/actions/settings";

export function StorePanel({ initial }: { initial: StoreInput }) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<StoreInput>({
    resolver: zodResolver(storeSchema),
    defaultValues: initial,
  });

  async function onSubmit(data: StoreInput) {
    setSubmitting(true);
    const res = await updateStore(data);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Store updated");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>How your store appears to customers and on invoices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Store name *" error={errors.name?.message}>
              <Input {...register("name")} />
            </Field>
            <Field label="Legal entity">
              <Input {...register("legalName")} />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Email *" error={errors.email?.message}>
              <Input type="email" {...register("email")} />
            </Field>
            <Field label="Phone">
              <Input type="tel" {...register("phone")} />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Logo URL">
              <Input type="url" placeholder="https://…" {...register("logo")} />
            </Field>
            <Field label="Favicon URL">
              <Input type="url" placeholder="https://…" {...register("favicon")} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Localization</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3">
          <Field label="Currency (3-letter)" error={errors.currency?.message}>
            <Input maxLength={3} className="uppercase" {...register("currency")} />
          </Field>
          <Field label="Locale">
            <Input {...register("locale")} placeholder="en-US" />
          </Field>
          <Field label="Timezone">
            <Input {...register("timezone")} placeholder="America/New_York" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Default tax rate (%)" error={errors.taxRate?.message}>
              <Input type="number" step="0.01" min="0" max="100" {...register("taxRate", { valueAsNumber: true })} />
            </Field>
            <div className="flex items-end gap-3 pb-2">
              <Controller
                name="taxIncluded"
                control={control}
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
              <Label>Prices include tax</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Address line 1">
            <Input {...register("addressLine1")} />
          </Field>
          <Field label="Address line 2">
            <Input {...register("addressLine2")} />
          </Field>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="City"><Input {...register("city")} /></Field>
            <Field label="State / Region"><Input {...register("state")} /></Field>
            <Field label="Postal code"><Input {...register("postalCode")} /></Field>
          </div>
          <Field label="Country"><Input {...register("country")} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3">
          <Field label="Facebook"><Input type="url" placeholder="https://…" {...register("socialFacebook")} /></Field>
          <Field label="Instagram"><Input type="url" placeholder="https://…" {...register("socialInstagram")} /></Field>
          <Field label="X / Twitter"><Input type="url" placeholder="https://…" {...register("socialTwitter")} /></Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
