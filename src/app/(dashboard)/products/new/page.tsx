import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { can } from "@/lib/rbac";
import { ProductForm } from "@/components/modules/product-form";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const session = await auth();
  if (!can(session?.user?.role, "products:write")) redirect("/products");

  const [categories, tags, store] = await Promise.all([
    db.category.findMany({ select: { id: true, name: true, parentId: true } }),
    db.tag.findMany({ select: { id: true, name: true } }),
    db.store.findFirst({ select: { currency: true } }),
  ]);

  return (
    <ProductForm
      mode="create"
      categories={categories}
      tags={tags}
      currency={store?.currency ?? "USD"}
    />
  );
}
