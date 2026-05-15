"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { emailSettingsSchema, type EmailSettingsInput } from "@/lib/validations/settings";
import { updateEmailSettings } from "@/server/actions/settings";

export function EmailPanel({
  initial,
  resendConfigured,
}: {
  initial: EmailSettingsInput;
  resendConfigured: boolean;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailSettingsInput>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: initial,
  });

  async function onSubmit(data: EmailSettingsInput) {
    setSubmitting(true);
    const res = await updateEmailSettings(data);
    setSubmitting(false);
    if (!res.ok) toast.error(res.error);
    else toast.success("Email settings saved");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transactional email</CardTitle>
              <CardDescription>Sender identity for password resets, order updates and invoices.</CardDescription>
            </div>
            {resendConfigured ? (
              <Badge variant="success">Resend connected</Badge>
            ) : (
              <Badge variant="secondary">Console fallback (dev)</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fromName">From name</Label>
              <Input id="fromName" {...register("fromName")} />
              {errors.fromName && <p className="text-xs text-destructive">{errors.fromName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fromAddress">From address</Label>
              <Input id="fromAddress" type="email" {...register("fromAddress")} />
              {errors.fromAddress && <p className="text-xs text-destructive">{errors.fromAddress.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="replyTo">Reply-to (optional)</Label>
            <Input id="replyTo" type="email" {...register("replyTo")} />
          </div>
          {!resendConfigured && (
            <p className="text-xs text-muted-foreground">
              Set <code className="text-xs">RESEND_API_KEY</code> in your environment to send real emails.
              Otherwise, dev mode prints to the server console.
            </p>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-end mt-4">
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save
        </Button>
      </div>
    </form>
  );
}
