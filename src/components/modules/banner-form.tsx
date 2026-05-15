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
import { ImageUploader, type UploadedImage } from "@/components/forms/image-uploader";
import { CategoryPicker, type CategoryNode } from "@/components/forms/category-picker";
import {
  bannerSchema,
  PLACEMENT_LABEL,
  type BannerInput,
  type BannerPlacementValue,
} from "@/lib/validations/banner";
import { createBanner, updateBanner } from "@/server/actions/banners";

interface ProductOption { id: string; name: string }

const DEFAULT: BannerInput = {
  name: "",
  placement: "HOMEPAGE_HERO",
  customKey: "",
  title: "",
  subtitle: "",
  ctaText: "",
  ctaUrl: "",
  image: "",
  imageMobile: "",
  alt: "",
  bgColor: "",
  textColor: "",
  linkUrl: "",
  targetCategoryId: null,
  targetProductId: null,
  startsAt: null,
  endsAt: null,
  position: 0,
  isActive: true,
};

function toLocalDateTimeInput(d?: string | Date | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

interface BannerFormProps {
  initial?: (BannerInput & { id?: string }) | null;
  categories: CategoryNode[];
  products: ProductOption[];
  trigger: React.ReactNode;
}

export function BannerForm({ initial, categories, products, trigger }: BannerFormProps) {
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
  } = useForm<BannerInput>({
    resolver: zodResolver(bannerSchema),
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

  const placement = watch("placement") as BannerPlacementValue;
  const image = watch("image");
  const imageMobile = watch("imageMobile");
  const targetProductId = watch("targetProductId");

  // ImageUploader works with arrays; we adapt single-image fields
  function setSingle(field: "image" | "imageMobile", imgs: UploadedImage[]) {
    setValue(field, imgs[0]?.url ?? "", { shouldDirty: true, shouldValidate: true });
  }

  async function onSubmit(data: BannerInput) {
    setSubmitting(true);
    const res = isEdit ? await updateBanner(initial!.id!, data) : await createBanner(data);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Banner updated" : "Banner created");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit banner" : "New banner"}</DialogTitle>
          <DialogDescription>
            Storefronts fetch by <code className="text-xs">placement</code>. Layout is the storefront&apos;s job — this admin owns content + scheduling.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Internal name *" error={errors.name?.message}>
              <Input {...register("name")} placeholder="Summer sale hero" />
            </Field>
            <Field label="Active">
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
            </Field>
          </div>

          <Separator />

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Placement *">
              <Controller
                name="placement"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PLACEMENT_LABEL) as BannerPlacementValue[]).map((p) => (
                        <SelectItem key={p} value={p}>{PLACEMENT_LABEL[p]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Position (sort order)">
              <Input type="number" min="0" {...register("position", { valueAsNumber: true })} />
            </Field>
          </div>

          {placement === "CUSTOM" && (
            <Field label="Custom key *" error={errors.customKey?.message}>
              <Input {...register("customKey")} placeholder="black-friday-strip" className="font-mono" />
            </Field>
          )}

          <Separator />

          <Field label="Desktop image URL *" error={errors.image?.message}>
            <ImageUploader
              value={image ? [{ url: image, alt: "" }] : []}
              onChange={(imgs) => setSingle("image", imgs)}
              folder="banners"
              max={1}
            />
          </Field>
          <Field label="Mobile image URL (optional)">
            <ImageUploader
              value={imageMobile ? [{ url: imageMobile, alt: "" }] : []}
              onChange={(imgs) => setSingle("imageMobile", imgs)}
              folder="banners"
              max={1}
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Title">
              <Input {...register("title")} placeholder="Summer sale" />
            </Field>
            <Field label="Subtitle">
              <Input {...register("subtitle")} placeholder="Up to 40% off everything" />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="CTA text">
              <Input {...register("ctaText")} placeholder="Shop now" />
            </Field>
            <Field label="CTA URL">
              <Input type="url" placeholder="https://…" {...register("ctaUrl")} />
            </Field>
          </div>

          <Field label="Whole-banner click target">
            <Input type="url" placeholder="https://…" {...register("linkUrl")} />
          </Field>

          <Separator />

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Target category (optional)">
              <Controller
                name="targetCategoryId"
                control={control}
                render={({ field }) => (
                  <CategoryPicker categories={categories} value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>
            <Field label="Target product (optional)">
              <Select value={targetProductId ?? "__none__"} onValueChange={(v) => setValue("targetProductId", v === "__none__" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Select product…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— No product —</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Background color (hex)">
              <Input {...register("bgColor")} placeholder="#0f172a" className="font-mono" />
            </Field>
            <Field label="Text color (hex)">
              <Input {...register("textColor")} placeholder="#ffffff" className="font-mono" />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Starts at">
              <Input type="datetime-local" {...register("startsAt")} />
            </Field>
            <Field label="Ends at" error={errors.endsAt?.message}>
              <Input type="datetime-local" {...register("endsAt")} />
            </Field>
          </div>

          <Field label="Alt text (accessibility)">
            <Input {...register("alt")} placeholder="Models wearing summer collection" />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !image}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
