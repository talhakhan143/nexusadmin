"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, FolderOpen, Folder, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { CategoryPicker } from "@/components/forms/category-picker";
import { categorySchema, type CategoryInput } from "@/lib/validations/category";
import { createCategory, updateCategory, deleteCategory } from "@/server/actions/categories";
import { slugify } from "@/lib/utils";

interface FlatCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string | null;
  image: string | null;
  position: number;
  metaTitle: string | null;
  metaDescription: string | null;
  productCount: number;
  childCount: number;
}

interface Props {
  categories: FlatCategory[];
  canWrite: boolean;
  canDelete: boolean;
}

interface TreeNode extends FlatCategory {
  children: TreeNode[];
}

function buildTree(flat: FlatCategory[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  flat.forEach((c) => byId.set(c.id, { ...c, children: [] }));
  const roots: TreeNode[] = [];
  byId.forEach((node) => {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export function CategoriesView({ categories, canWrite, canDelete }: Props) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<FlatCategory | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<FlatCategory | null>(null);

  const tree = React.useMemo(() => buildTree(categories), [categories]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{categories.length} {categories.length === 1 ? "category" : "categories"}</CardTitle>
          </div>
          {canWrite && (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" /> New category
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {tree.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">No categories yet.</div>
          ) : (
            <ul className="divide-y">
              {tree.map((node) => (
                <CategoryRow
                  key={node.id}
                  node={node}
                  depth={0}
                  canWrite={canWrite}
                  canDelete={canDelete}
                  onEdit={setEditing}
                  onDelete={setPendingDelete}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <CategoryDialog
        open={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        category={editing}
        allCategories={categories}
        onSaved={() => router.refresh()}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{pendingDelete?.name}</strong> will be removed. Children become root categories;
              products lose their category link. Cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingDelete) return;
                const res = await deleteCategory(pendingDelete.id);
                setPendingDelete(null);
                if (!res.ok) toast.error(res.error);
                else {
                  toast.success("Category deleted");
                  router.refresh();
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CategoryRow({
  node,
  depth,
  canWrite,
  canDelete,
  onEdit,
  onDelete,
}: {
  node: TreeNode;
  depth: number;
  canWrite: boolean;
  canDelete: boolean;
  onEdit: (c: FlatCategory) => void;
  onDelete: (c: FlatCategory) => void;
}) {
  const Icon = node.children.length > 0 ? FolderOpen : Folder;
  return (
    <>
      <li className="flex items-center justify-between p-3 hover:bg-muted/30">
        <div className="flex items-center gap-3 min-w-0" style={{ paddingLeft: depth * 20 }}>
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="font-medium truncate">{node.name}</p>
            <p className="text-xs text-muted-foreground font-mono truncate">/{node.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary">{node.productCount} products</Badge>
          {canWrite && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(node)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {canDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(node)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </li>
      {node.children.map((child) => (
        <CategoryRow
          key={child.id}
          node={child}
          depth={depth + 1}
          canWrite={canWrite}
          canDelete={canDelete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

function CategoryDialog({
  open,
  onClose,
  category,
  allCategories,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  category: FlatCategory | null;
  allCategories: FlatCategory[];
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const isEdit = !!category;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      image: "",
      parentId: null,
      position: 0,
      metaTitle: "",
      metaDescription: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: category?.name ?? "",
        slug: category?.slug ?? "",
        description: category?.description ?? "",
        image: category?.image ?? "",
        parentId: category?.parentId ?? null,
        position: category?.position ?? 0,
        metaTitle: category?.metaTitle ?? "",
        metaDescription: category?.metaDescription ?? "",
      });
    }
  }, [open, category, reset]);

  const name = watch("name");
  const slugTouched = React.useRef(false);
  React.useEffect(() => {
    if (!isEdit && !slugTouched.current && name) setValue("slug", slugify(name));
  }, [name, isEdit, setValue]);

  // Exclude self when editing (no self-parent)
  const parentOptions = (isEdit ? allCategories.filter((c) => c.id !== category?.id) : allCategories).map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId,
  }));

  async function onSubmit(data: CategoryInput) {
    setSubmitting(true);
    const res = isEdit ? await updateCategory(category!.id, data) : await createCategory(data);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Category updated" : "Category created");
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>Categories support nesting. Pick a parent to make it a child.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...register("slug", { onChange: () => (slugTouched.current = true) })} />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Parent</Label>
            <Controller
              name="parentId"
              control={control}
              render={({ field }) => (
                <CategoryPicker categories={parentOptions} value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...register("description")} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta title</Label>
              <Input id="metaTitle" {...register("metaTitle")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input id="image" type="url" placeholder="https://…" {...register("image")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
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
