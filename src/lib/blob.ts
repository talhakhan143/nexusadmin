import { put, del, list, type PutBlobResult } from "@vercel/blob";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

const BUCKET_PREFIX = "nexusadmin";
const LOCAL_DIR = path.join(process.cwd(), "public", "uploads");

export interface UploadOptions {
  folder?: string;
  access?: "public";
}

export interface UploadResult {
  url: string;
  pathname: string;
}

const hasBlobToken = () => !!process.env.BLOB_READ_WRITE_TOKEN;

/**
 * Upload a file. Uses Vercel Blob if BLOB_READ_WRITE_TOKEN is set,
 * otherwise falls back to writing to /public/uploads (dev-only).
 */
export async function uploadFile(
  file: File | Blob,
  filename: string,
  opts: UploadOptions = {}
): Promise<UploadResult> {
  const folder = opts.folder ?? "uploads";
  const safeName = filename.replace(/[^\w.\-]/g, "_");
  const key = `${Date.now()}-${safeName}`;

  if (hasBlobToken()) {
    const blobPath = `${BUCKET_PREFIX}/${folder}/${key}`;
    const result: PutBlobResult = await put(blobPath, file, {
      access: opts.access ?? "public",
      addRandomSuffix: false,
    });
    return { url: result.url, pathname: result.pathname };
  }

  // Local fallback for dev (no BLOB token)
  const dir = path.join(LOCAL_DIR, folder);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, key);
  const buffer = Buffer.from(await (file as Blob).arrayBuffer());
  await writeFile(filePath, buffer);
  const url = `/uploads/${folder}/${key}`;
  return { url, pathname: url };
}

export async function deleteFile(url: string): Promise<void> {
  if (url.startsWith("/uploads/")) {
    try {
      await unlink(path.join(process.cwd(), "public", url));
    } catch {
      // ignore missing
    }
    return;
  }
  if (hasBlobToken()) await del(url);
}

export async function listFiles(prefix?: string) {
  if (!hasBlobToken()) return { blobs: [] };
  return list({ prefix: prefix ? `${BUCKET_PREFIX}/${prefix}` : BUCKET_PREFIX });
}
