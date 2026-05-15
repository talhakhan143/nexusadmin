"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Power, Image as ImageIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { BannerForm } from "@/components/modules/banner-form";
import { PLACEMENT_LABEL, type BannerPlacementValue } from "@/lib/validations/banner";
import { toggleBannerActive, deleteBanner } from "@/server/actions/banners";
import { formatDate } from "@/lib/utils";

interface BannerRow {
  id: string;
  name: string;
  placement: BannerPlacementValue;
  customKey: string | null;
  title: string | null;
  subtitle: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  image: string;
  imageMobile: string | null;
  alt: string | null;
  bgColor: string | null;
  textColor: string | null;
  linkUrl: string | null;
  targetCategoryId: string | null;
  targetProductId: string | null;
  targetCategoryName: string | null;
  targetProductName: string | null;
  startsAt: string | null;
  endsAt: string | null;
  position: number;
  isActive: boolean;
}

interface Props {
  banners: BannerRow[];
  categories: { id: string; name: string; parentId: string | null }[];
  products: { id: string; name: string }[];
  canWrite: boolean;
}

export function BannersView({ banners, categories, products, canWrite }: Props) {
  // Group by placement for visual organization
  const grouped = React.useMemo(() => {
    const map = new Map<BannerPlacementValue, BannerRow[]>();
    for (const b of banners) {
      const k = b.placement;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(b);
    }
    return Array.from(map.entries());
  }, [banners]);

  return (
    <div className="space-y-4">
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-4 pb-4 flex items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-medium">How storefronts use these</p>
            <p className="text-muted-foreground">
              Storefronts call <code className="text-xs px-1 py-0.5 rounded bg-background">GET /api/public/v1/banners?placement=HOMEPAGE_HERO</code> and render whatever comes back.
              You control content + scheduling here. Each frontend chooses its own layout per placement key.
            </p>
          </div>
          {canWrite && (
            <BannerForm
              categories={categories}
              products={products}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> New banner
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-muted">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </span>
            <p className="text-sm text-muted-foreground">No banners yet — create one to start.</p>
          </CardContent>
        </Card>
      ) : (
        grouped.map(([placement, rows]) => (
          <Card key={placement}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {PLACEMENT_LABEL[placement]}
                <Badge variant="outline" className="font-mono text-[10px]">{placement}</Badge>
                <span className="text-xs text-muted-foreground font-normal">· {rows.length}</span>
              </CardTitle>
              <CardDescription>
                Storefront key: <code className="text-xs">?placement={placement}</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {rows.map((b) => (
                  <BannerRow
                    key={b.id}
                    banner={b}
                    categories={categories}
                    products={products}
                    canWrite={canWrite}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function BannerRow({
  banner,
  categories,
  products,
  canWrite,
}: {
  banner: BannerRow;
  categories: Props["categories"];
  products: Props["products"];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = React.useState(false);
  const now = new Date();
  const upcoming = banner.startsAt && new Date(banner.startsAt) > now;
  const expired = banner.endsAt && new Date(banner.endsAt) < now;

  async function onToggle() {
    const res = await toggleBannerActive(banner.id);
    if (!res.ok) toast.error(res.error);
    else {
      toast.success(res.data?.isActive ? "Activated" : "Deactivated");
      router.refresh();
    }
  }
  async function onDelete() {
    const res = await deleteBanner(banner.id);
    setPendingDelete(false);
    if (!res.ok) toast.error(res.error);
    else {
      toast.success("Banner deleted");
      router.refresh();
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 hover:bg-muted/30">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="shrink-0 h-16 w-24 rounded-md overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={banner.image} alt={banner.alt ?? ""} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium truncate">{banner.name}</p>
              {!banner.isActive && <Badge variant="secondary">Inactive</Badge>}
              {upcoming && <Badge variant="warning">Upcoming</Badge>}
              {expired && <Badge variant="destructive">Expired</Badge>}
              {banner.placement === "CUSTOM" && banner.customKey && (
                <Badge variant="outline" className="font-mono text-[10px]">key: {banner.customKey}</Badge>
              )}
            </div>
            {banner.title && (
              <p className="text-sm text-muted-foreground truncate">{banner.title}{banner.subtitle ? ` — ${banner.subtitle}` : ""}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2">
              <span>position {banner.position}</span>
              {banner.targetCategoryName && <span>→ category: {banner.targetCategoryName}</span>}
              {banner.targetProductName && <span>→ product: {banner.targetProductName}</span>}
              {banner.startsAt && <span>· from {formatDate(banner.startsAt)}</span>}
              {banner.endsAt && <span>until {formatDate(banner.endsAt)}</span>}
              {banner.linkUrl && (
                <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                  link <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </p>
          </div>
        </div>
        {canWrite && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggle}>
              <Power className="h-3.5 w-3.5" />
            </Button>
            <BannerForm
              categories={categories}
              products={products}
              initial={banner}
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setPendingDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={pendingDelete} onOpenChange={setPendingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete banner?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{banner.name}</strong> will be removed and storefronts will stop receiving it. Image will be deleted from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
