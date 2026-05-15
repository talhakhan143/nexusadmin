"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, Copy, KeyRound, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { createApiKey, revokeApiKey } from "@/server/actions/settings";
import { formatDate } from "@/lib/utils";

interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

const AVAILABLE_SCOPES = [
  "products:read",
  "products:write",
  "categories:read",
  "orders:read",
  "orders:write",
  "customers:read",
  "promotions:read",
  "banners:read",
];

export function ApiKeysPanel({ keys }: { keys: ApiKeyRow[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>API keys</CardTitle>
          <CardDescription>Bearer-token auth for the public storefront API. Hashed at rest.</CardDescription>
        </div>
        <NewKeyDialog />
      </CardHeader>
      <CardContent className="p-0">
        {keys.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No API keys yet.</p>
        ) : (
          <ul className="divide-y">
            {keys.map((k) => (
              <KeyRow key={k.id} k={k} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function KeyRow({ k }: { k: ApiKeyRow }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [confirmRevoke, setConfirmRevoke] = React.useState(false);
  const expired = k.expiresAt && new Date(k.expiresAt) < new Date();

  async function revoke() {
    setPending(true);
    const res = await revokeApiKey(k.id);
    setPending(false);
    setConfirmRevoke(false);
    if (!res.ok) toast.error(res.error);
    else {
      toast.success("API key revoked");
      router.refresh();
    }
  }

  return (
    <>
      <li className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-muted/30">
        <div className="flex items-start gap-3 min-w-0">
          <KeyRound className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium">{k.name}</p>
              {expired && <Badge variant="destructive">Expired</Badge>}
            </div>
            <p className="text-xs font-mono text-muted-foreground">{k.prefix}…</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {k.scopes.map((s) => (
                <Badge key={s} variant="outline" className="text-[10px] font-mono">
                  {s}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Created {formatDate(k.createdAt)}
              {k.lastUsedAt && ` · last used ${formatDate(k.lastUsedAt)}`}
              {k.expiresAt && ` · expires ${formatDate(k.expiresAt)}`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => setConfirmRevoke(true)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </li>

      <AlertDialog open={confirmRevoke} onOpenChange={setConfirmRevoke}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API key?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{k.name}</strong> will be revoked immediately. Any consumer using it will get 401 errors.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={revoke} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function NewKeyDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [name, setName] = React.useState("");
  const [scopes, setScopes] = React.useState<string[]>(["products:read", "categories:read"]);
  const [expiresAt, setExpiresAt] = React.useState("");
  const [created, setCreated] = React.useState<{ plaintext: string } | null>(null);

  function reset() {
    setName("");
    setScopes(["products:read", "categories:read"]);
    setExpiresAt("");
    setCreated(null);
  }

  function close() {
    setOpen(false);
    reset();
  }

  async function submit() {
    setSubmitting(true);
    const res = await createApiKey({
      name,
      scopes,
      expiresAt: expiresAt || null,
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setCreated({ plaintext: res.data!.plaintext });
    router.refresh();
  }

  function copy() {
    if (!created) return;
    navigator.clipboard.writeText(created.plaintext);
    toast.success("Copied to clipboard");
  }

  function toggleScope(s: string) {
    setScopes(scopes.includes(s) ? scopes.filter((x) => x !== s) : [...scopes, s]);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> New key
      </Button>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{created ? "Save your API key" : "Create API key"}</DialogTitle>
          <DialogDescription>
            {created
              ? "This is the only time the full key is shown. Copy it now and store it securely."
              : "Pick the scopes this key should have. Keys are hashed at rest."}
          </DialogDescription>
        </DialogHeader>
        {created ? (
          <div className="space-y-3">
            <div className="rounded-md border bg-muted/40 p-3 font-mono text-sm break-all flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="flex-1">{created.plaintext}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={copy}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={close}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="kname">Name *</Label>
              <Input id="kname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Storefront prod" />
            </div>
            <div className="space-y-1.5">
              <Label>Scopes *</Label>
              <div className="grid sm:grid-cols-2 gap-1.5">
                {AVAILABLE_SCOPES.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={scopes.includes(s)} onCheckedChange={() => toggleScope(s)} />
                    <code className="text-xs">{s}</code>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kexp">Expires (optional)</Label>
              <Input id="kexp" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={close} disabled={submitting}>Cancel</Button>
              <Button onClick={submit} disabled={submitting || !name || scopes.length === 0}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
