"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { importProductsCsv } from "@/server/actions/products";

const SAMPLE_CSV = `name,slug,sku,status,basePrice,compareAtPrice,stock,category,description
Sample Tee,sample-tee,TEE-01,ACTIVE,24.99,29.99,50,apparel,A nice cotton t-shirt
Sample Lamp,sample-lamp,LAMP-01,DRAFT,79.00,,15,home-living,LED desk lamp`;

interface Result {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}

export function ImportClient() {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [csvText, setCsvText] = React.useState<string>("");
  const [dryRun, setDryRun] = React.useState<Result | null>(null);
  const [result, setResult] = React.useState<Result | null>(null);
  const [running, setRunning] = React.useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "text/csv": [".csv"], "application/vnd.ms-excel": [".csv"] },
    multiple: false,
    onDrop: async (files) => {
      const f = files[0];
      if (!f) return;
      setFile(f);
      setCsvText(await f.text());
      setDryRun(null);
      setResult(null);
    },
  });

  async function runDry() {
    if (!csvText) return;
    setRunning(true);
    const res = await importProductsCsv(csvText, { dryRun: true });
    setRunning(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setDryRun(res.data!);
  }

  async function runImport() {
    if (!csvText) return;
    setRunning(true);
    const res = await importProductsCsv(csvText, { dryRun: false });
    setRunning(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setResult(res.data!);
    toast.success(`Imported: ${res.data!.created} new + ${res.data!.updated} updated`);
    router.refresh();
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>1. Upload CSV</CardTitle>
              <CardDescription>
                Required columns: <code className="text-xs">name, basePrice</code>. Optional: slug, sku,
                status, compareAtPrice, stock, category (slug), description.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={downloadSample}>
              <Download className="mr-2 h-4 w-4" /> Sample
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "hover:bg-muted/40"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">
              {file ? file.name : isDragActive ? "Drop CSV here…" : "Drag & drop or click to select CSV"}
            </p>
            {file && (
              <p className="text-xs text-muted-foreground mt-1">
                {(file.size / 1024).toFixed(1)} KB · {csvText.split("\n").length - 1} rows
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {csvText && (
        <Card>
          <CardHeader>
            <CardTitle>2. Validate (dry run)</CardTitle>
            <CardDescription>See what would happen without writing to the database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={runDry} disabled={running} variant="outline">
              {running && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <FileText className="mr-2 h-4 w-4" /> Run dry-run
            </Button>
            {dryRun && (
              <div className="rounded-md border p-3 text-sm space-y-2">
                <div className="flex items-center gap-3">
                  <Badge variant="success">Would process: {dryRun.created}</Badge>
                  {dryRun.errors.length > 0 ? (
                    <Badge variant="destructive">{dryRun.errors.length} errors</Badge>
                  ) : (
                    <Badge variant="secondary">No errors</Badge>
                  )}
                </div>
                {dryRun.errors.length > 0 && (
                  <ul className="text-xs space-y-1 mt-2">
                    {dryRun.errors.slice(0, 10).map((e) => (
                      <li key={`${e.row}-${e.message}`} className="flex items-start gap-1.5 text-destructive">
                        <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                        Row {e.row}: {e.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {csvText && (
        <Card>
          <CardHeader>
            <CardTitle>3. Import</CardTitle>
            <CardDescription>
              Existing products (matched by slug) are updated. New ones are created as drafts unless status is set.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={runImport} disabled={running}>
              {running && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Upload className="mr-2 h-4 w-4" /> Import now
            </Button>
            {result && (
              <div className="rounded-md border p-3 text-sm space-y-2">
                <div className="flex items-center gap-3">
                  <Badge variant="success">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Created: {result.created}
                  </Badge>
                  <Badge variant="secondary">Updated: {result.updated}</Badge>
                  {result.errors.length > 0 && <Badge variant="destructive">{result.errors.length} errors</Badge>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
