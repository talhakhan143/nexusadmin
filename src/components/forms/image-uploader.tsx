"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus, Loader2, X, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface UploadedImage {
  url: string;
  alt?: string | null;
  position?: number;
}

interface ImageUploaderProps {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  folder?: string;
  max?: number;
  className?: string;
}

export function ImageUploader({ value, onChange, folder = "products", max = 8, className }: ImageUploaderProps) {
  const [uploading, setUploading] = React.useState(false);

  const upload = React.useCallback(
    async (files: File[]) => {
      const remaining = max - value.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${max} images`);
        return;
      }
      const toUpload = files.slice(0, remaining);
      setUploading(true);
      try {
        const uploaded: UploadedImage[] = [];
        for (const file of toUpload) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("folder", folder);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok) {
            toast.error(data.error ?? "Upload failed");
            continue;
          }
          uploaded.push({ url: data.url, alt: file.name, position: value.length + uploaded.length });
        }
        onChange([...value, ...uploaded]);
        if (uploaded.length) toast.success(`Uploaded ${uploaded.length} image(s)`);
      } finally {
        setUploading(false);
      }
    },
    [value, onChange, folder, max]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    onDrop: upload,
    multiple: true,
  });

  function remove(idx: number) {
    const next = value.filter((_, i) => i !== idx).map((img, i) => ({ ...img, position: i }));
    onChange(next);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next.map((img, i) => ({ ...img, position: i })));
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "hover:bg-muted/40"
        )}
      >
        <input {...getInputProps()} />
        <ImagePlus className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">
          {isDragActive ? "Drop images here…" : "Drag & drop or click to upload"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PNG, JPG, WebP up to 8MB · {value.length}/{max}
        </p>
        {uploading && (
          <div className="flex items-center justify-center mt-2 text-xs text-muted-foreground">
            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Uploading…
          </div>
        )}
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {value.map((img, idx) => (
            <div key={img.url} className="group relative aspect-square rounded-md border overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt ?? ""} className="h-full w-full object-cover" />
              {idx === 0 && (
                <span className="absolute top-1 left-1 rounded bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5">
                  Cover
                </span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                <Button type="button" size="icon" variant="secondary" className="h-7 w-7" onClick={() => move(idx, idx - 1)}>
                  <GripVertical className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7"
                  onClick={() => remove(idx)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
