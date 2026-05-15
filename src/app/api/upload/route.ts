import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { uploadFile } from "@/lib/blob";
import { can } from "@/lib/rbac";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "products:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const folder = (form.get("folder") as string) ?? "uploads";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Basic guards
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Max 8MB" }, { status: 413 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Image files only" }, { status: 415 });
  }

  const result = await uploadFile(file, file.name, { folder });
  return NextResponse.json({ url: result.url, pathname: result.pathname });
}
