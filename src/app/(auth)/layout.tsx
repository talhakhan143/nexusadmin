import Link from "next/link";
import { Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-10">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary-foreground/15 backdrop-blur">
            <Sparkles className="h-5 w-5" />
          </span>
          {siteConfig.name}
        </Link>
        <div className="space-y-3 max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">
            The complete commerce control center.
          </h1>
          <p className="text-primary-foreground/80">
            Manage products, orders, customers and growth — all from one premium admin built on
            Next.js 16, Prisma and shadcn/ui.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">© {new Date().getFullYear()} {siteConfig.name}</p>
      </div>

      {/* Form area */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
