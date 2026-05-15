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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { customerSchema, type CustomerInput } from "@/lib/validations/customer";
import { createCustomer, updateCustomer } from "@/server/actions/customers";

interface Props {
  initial?: CustomerInput & { id?: string };
  mode: "create" | "edit";
  customerId?: string;
}

const DEFAULT: CustomerInput = {
  email: "",
  name: "",
  phone: "",
  acceptsMarketing: false,
  notes: "",
};

export function CustomerForm({ initial, mode, customerId }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: { ...DEFAULT, ...initial },
  });

  async function onSubmit(data: CustomerInput) {
    setSubmitting(true);
    const res = mode === "create" ? await createCustomer(data) : await updateCustomer(customerId!, data);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(mode === "create" ? "Customer created" : "Customer saved");
    if (mode === "create" && "data" in res && res.data?.id) {
      router.push(`/customers/${res.data.id}`);
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
          <CardDescription>Email and basic identifiers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" {...register("name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" {...register("phone")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Marketing</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <Label>Accepts marketing emails</Label>
            <p className="text-xs text-muted-foreground mt-1">Customer has opted in to promotional communications.</p>
          </div>
          <Controller
            name="acceptsMarketing"
            control={control}
            render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Internal notes</CardTitle>
          <CardDescription>Visible only to admin staff.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea rows={4} {...register("notes")} />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {mode === "create" ? "Create" : "Save"}
        </Button>
      </div>
    </form>
  );
}
