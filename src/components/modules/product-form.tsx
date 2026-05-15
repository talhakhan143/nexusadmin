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

interface ProductFormProps {
  initial?: ProductInput & { id?: string };
  categories: CategoryNode[];
  tags: TagOption[];
  mode: "create" | "edit";
  productId?: string;
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

export function ProductForm({ initial, categories, tags, mode, productId }: ProductFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [availableTags, setAvailableTags] = React.useState<TagOption[]>(tags);

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
              <CardDescription>Stored as integer cents. Display in dollars.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Base price ($) *</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={(basePriceCents / 100 || 0).toString()}
                    onChange={(e) => setValue("basePrice", Math.round(Number(e.target.value || 0) * 100))}
                  />
                  {errors.basePrice && <p className="text-xs text-destructive">{errors.basePrice.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compareAt">Compare-at ($)</Label>
                  <Input
                    id="compareAt"
                    type="number"
                    step="0.01"
                    min="0"
                    value={compareAtCents ? (compareAtCents / 100).toString() : ""}
                    onChange={(e) =>
                      setValue("compareAtPrice", e.target.value ? Math.round(Number(e.target.value) * 100) : null)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost ($)</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPriceCents ? (costPriceCents / 100).toString() : ""}
                    onChange={(e) =>
                      setValue("costPrice", e.target.value ? Math.round(Number(e.target.value) * 100) : null)
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Controller
                  name="taxable"
                  control={control}
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                />
                <Label>Taxable</Label>
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
                basePrice={basePriceCents / 100}
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
