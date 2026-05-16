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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/forms/image-uploader";
import { VariantsEditor } from "@/components/forms/variants-editor";
import { CategoryPicker, type CategoryNode } from "@/components/forms/category-picker";
import { TagsInput, type TagOption } from "@/components/forms/tags-input";
import { productSchema, type ProductInput } from "@/lib/validations/product";
import { createProduct, updateProduct } from "@/server/actions/products";
import { createTag } from "@/server/actions/categories";
import { slugify } from "@/lib/utils";
import {
  currencyConfig,
  toMinor,
  toMajor,
  formatMinor,
  compareAtFromDiscount,
  discountFromCompareAt,
} from "@/lib/admin-currency";

interface ProductFormProps {
  initial?: ProductInput & { id?: string };
  categories: CategoryNode[];
  tags: TagOption[];
  mode: "create" | "edit";
  productId?: string;
  /** Store currency code (e.g. "PKR", "USD"). Drives all price labels + decimals. */
  currency?: string;
}

const DEFAULT: ProductInput = {
  name: "",
  slug: "",
  description: "",
  shortDescription: "",
  sku: "",
  status: "DRAFT",
  basePrice: 0,
  compareAtPrice: null,
  costPrice: null,
  taxable: true,
  weight: null,
  trackInventory: true,
  featured: false,
  categoryId: null,
  metaTitle: "",
  metaDescription: "",
  ogImage: "",
  images: [],
  variants: [],
  tagIds: [],
};

export function ProductForm({ initial, categories, tags, mode, productId, currency = "USD" }: ProductFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [availableTags, setAvailableTags] = React.useState<TagOption[]>(tags);
  const cfg = currencyConfig(currency);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: { ...DEFAULT, ...initial },
  });

  const name = watch("name");
  const slugTouched = React.useRef(false);

  React.useEffect(() => {
    if (mode === "create" && !slugTouched.current && name) {
      setValue("slug", slugify(name));
    }
  }, [name, mode, setValue]);

  // Display dollars in basePrice field, store cents
  const basePriceCents = watch("basePrice");
  const compareAtCents = watch("compareAtPrice");
  const costPriceCents = watch("costPrice");
  const variants = watch("variants");
  const images = watch("images");
  const tagIds = watch("tagIds");
  const status = watch("status");

  async function handleCreateTag(tagName: string) {
    const slug = slugify(tagName);
    const res = await createTag({ name: tagName, slug });
    if (res.ok && res.data) {
      const created = { id: res.data.id, name: tagName };
      setAvailableTags([...availableTags, created]);
      return created;
    }
    return null;
  }

  const onSubmit = async (data: ProductInput) => {
    setSubmitting(true);
    const res = mode === "create" ? await createProduct(data) : await updateProduct(productId!, data);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(mode === "create" ? "Product created" : "Product saved");
    if (mode === "create" && "data" in res && res.data?.id) {
      router.push(`/products/${res.data.id}`);
    } else {
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between gap-3 sticky top-16 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-background/80 backdrop-blur border-b">
        <div>
          <p className="text-xs text-muted-foreground">{mode === "create" ? "New product" : "Edit product"}</p>
          <p className="font-medium">{name || "Untitled"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-9 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic info</CardTitle>
              <CardDescription>Name, description, identifiers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input id="slug" {...register("slug", { onChange: () => (slugTouched.current = true) })} />
                  {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" {...register("sku")} className="font-mono" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short description</Label>
                <Input id="shortDescription" maxLength={500} {...register("shortDescription")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={6} {...register("description")} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>
                Currency: <strong>{currency}</strong> · {cfg.decimals === 0 ? "Whole units only (no paise)" : "Two-decimal precision"}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Selling price ({cfg.symbol}) *</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step={cfg.decimals === 0 ? "1" : "0.01"}
                    min="0"
                    value={(toMajor(basePriceCents, currency) || 0).toString()}
                    onChange={(e) => setValue("basePrice", toMinor(Number(e.target.value || 0), currency))}
                  />
                  <p className="text-[11px] text-muted-foreground">What customers pay.</p>
                  {errors.basePrice && <p className="text-xs text-destructive">{errors.basePrice.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountPct">Discount %</Label>
                  <Input
                    id="discountPct"
                    type="number"
                    min="0"
                    max="99"
                    step="1"
                    placeholder="0"
                    value={discountFromCompareAt(basePriceCents, compareAtCents ?? 0) || ""}
                    onChange={(e) => {
                      const pct = Number(e.target.value || 0);
                      if (pct <= 0 || !basePriceCents) {
                        setValue("compareAtPrice", null, { shouldDirty: true });
                      } else {
                        setValue("compareAtPrice", compareAtFromDiscount(basePriceCents, pct), { shouldDirty: true });
                      }
                    }}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Sale badge on storefront. Auto-fills the original price.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compareAt">Original price ({cfg.symbol})</Label>
                  <Input
                    id="compareAt"
                    type="number"
                    step={cfg.decimals === 0 ? "1" : "0.01"}
                    min="0"
                    placeholder="0"
                    value={compareAtCents ? toMajor(compareAtCents, currency).toString() : ""}
                    onChange={(e) =>
                      setValue("compareAtPrice", e.target.value ? toMinor(Number(e.target.value), currency) : null, { shouldDirty: true })
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">Shown crossed-out next to the sale price.</p>
                </div>
              </div>

              {compareAtCents && compareAtCents > basePriceCents && (
                <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-900 flex items-center gap-2">
                  <span className="font-medium">Sale preview:</span>
                  <span className="line-through opacity-70">{formatMinor(compareAtCents, currency)}</span>
                  <span className="font-semibold">{formatMinor(basePriceCents, currency)}</span>
                  <span className="ml-auto bg-emerald-700 text-white text-xs px-2 py-0.5 rounded">
                    −{discountFromCompareAt(basePriceCents, compareAtCents)}% off
                  </span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost per unit ({cfg.symbol})</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step={cfg.decimals === 0 ? "1" : "0.01"}
                    min="0"
                    value={costPriceCents ? toMajor(costPriceCents, currency).toString() : ""}
                    onChange={(e) =>
                      setValue("costPrice", e.target.value ? toMinor(Number(e.target.value), currency) : null)
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">Internal — never shown to customers. Used for profit reports.</p>
                </div>
                <div className="space-y-2">
                  <Label>Margin</Label>
                  {basePriceCents && costPriceCents ? (
                    <div className="h-10 flex items-center px-3 border rounded-md bg-muted/40 text-sm">
                      <strong>{formatMinor(basePriceCents - costPriceCents, currency)}</strong>
                      <span className="ml-2 text-muted-foreground">
                        ({Math.round(((basePriceCents - costPriceCents) / basePriceCents) * 100)}%)
                      </span>
                    </div>
                  ) : (
                    <div className="h-10 flex items-center px-3 border rounded-md bg-muted/20 text-sm text-muted-foreground">
                      Set selling price + cost to see margin
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Controller
                  name="taxable"
                  control={control}
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                />
                <Label>Charge tax on this product</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variants */}
        <TabsContent value="variants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Variants & inventory</CardTitle>
              <CardDescription>
                Add options like Color or Size. A variant matrix is generated automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VariantsEditor
                basePrice={toMajor(basePriceCents, currency)}
                currency={currency}
                variants={variants}
                onChange={(v) => setValue("variants", v, { shouldDirty: true })}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Inventory tracking</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Controller
                name="trackInventory"
                control={control}
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
              <Label>Track stock per variant</Label>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media */}
        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>First image is used as the cover. Drag to reorder.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader
                value={images}
                onChange={(imgs) => setValue("images", imgs, { shouldDirty: true })}
                folder="products"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization */}
        <TabsContent value="organization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Category, tags, visibility.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <CategoryPicker categories={categories} value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <TagsInput
                  available={availableTags}
                  value={tagIds}
                  onChange={(ids) => setValue("tagIds", ids, { shouldDirty: true })}
                  onCreate={handleCreateTag}
                />
              </div>
              <div className="flex items-center gap-2">
                <Controller
                  name="featured"
                  control={control}
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                />
                <Label>Feature on home page</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
              <CardDescription>Search engine and Open Graph metadata.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta title</Label>
                <Input id="metaTitle" maxLength={100} {...register("metaTitle")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta description</Label>
                <Textarea id="metaDescription" rows={3} maxLength={300} {...register("metaDescription")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ogImage">Open Graph image URL</Label>
                <Input id="ogImage" type="url" placeholder="https://…" {...register("ogImage")} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}
