import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/modules/page-header";
import { CustomerForm } from "@/components/modules/customer-form";

export const metadata = { title: "New customer" };

export default async function NewCustomerPage() {
  const session = await auth();
  if (!can(session?.user?.role, "customers:write")) redirect("/customers");

  return (
    <>
      <PageHeader title="New customer" description="Create a customer record. Addresses can be added on the profile." />
      <CustomerForm mode="create" />
    </>
  );
}
