import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Create your account</h2>
        <p className="text-sm text-muted-foreground mt-1">
          New users start with the Viewer role; an admin can grant additional permissions.
        </p>
      </div>
      <RegisterForm />
      <p className="text-sm text-muted-foreground text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
