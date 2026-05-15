import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/modules/page-header";
import { ImportClient } from "./import-client";

export const metadata = { title: "Import products" };

export default async function ImportProductsPage() {
  const session = await auth();
  if (!can(session?.user?.role, "products:write")) redirect("/products");

  return (
    <>
      <PageHeader title="Import products" description="Upload a CSV to bulk create or update products." />
      <ImportClient />
    </>
  );
}
