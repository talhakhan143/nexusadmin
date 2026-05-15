import { Store, Users, KeyRound, Mail, Palette, History } from "lucide-react";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { can } from "@/lib/rbac";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/modules/page-header";
import { StorePanel } from "./store-panel";
import { TeamPanel } from "./team-panel";
import { ApiKeysPanel } from "./api-keys-panel";
import { EmailPanel } from "./email-panel";
import { ThemePanel } from "./theme-panel";
import { AuditPanel } from "./audit-panel";
import { getEmailSettings, getDefaultTheme } from "@/server/actions/settings";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!can(session?.user?.role, "settings:manage")) redirect("/");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  const [store, users, keys, emailSettings, defaultTheme, audit] = await Promise.all([
    db.store.findFirst(),
    db.user.findMany({ orderBy: { createdAt: "asc" } }),
    db.apiKey.findMany({ orderBy: { createdAt: "desc" } }),
    getEmailSettings(),
    getDefaultTheme(),
    db.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const storeInitial = {
    name: store?.name ?? "NexusAdmin Demo Store",
    legalName: store?.legalName ?? "",
    email: store?.email ?? "hello@nexusadmin.dev",
    phone: store?.phone ?? "",
    logo: store?.logo ?? "",
    favicon: store?.favicon ?? "",
    currency: store?.currency ?? "USD",
    locale: store?.locale ?? "en-US",
    timezone: store?.timezone ?? "UTC",
    taxRate: store?.taxRate ?? 0,
    taxIncluded: store?.taxIncluded ?? false,
    addressLine1: store?.addressLine1 ?? "",
    addressLine2: store?.addressLine2 ?? "",
    city: store?.city ?? "",
    state: store?.state ?? "",
    country: store?.country ?? "",
    postalCode: store?.postalCode ?? "",
    socialFacebook: store?.socialFacebook ?? "",
    socialInstagram: store?.socialInstagram ?? "",
    socialTwitter: store?.socialTwitter ?? "",
  };

  const apiKeyRows = keys.map((k) => {
    let scopes: string[] = [];
    try { scopes = JSON.parse(k.scopes); } catch {}
    return {
      id: k.id,
      name: k.name,
      prefix: k.prefix,
      scopes,
      lastUsedAt: k.lastUsedAt,
      expiresAt: k.expiresAt,
      createdAt: k.createdAt,
    };
  });

  const userRows = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
  }));

  return (
    <>
      <PageHeader title="Settings" description="Store profile, team, integrations, theme and audit log." />
      <Tabs defaultValue="store">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="store"><Store className="mr-2 h-4 w-4" />Store</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="team"><Users className="mr-2 h-4 w-4" />Team</TabsTrigger>}
          {isSuperAdmin && <TabsTrigger value="apikeys"><KeyRound className="mr-2 h-4 w-4" />API keys</TabsTrigger>}
          <TabsTrigger value="email"><Mail className="mr-2 h-4 w-4" />Email</TabsTrigger>
          <TabsTrigger value="theme"><Palette className="mr-2 h-4 w-4" />Theme</TabsTrigger>
          <TabsTrigger value="audit"><History className="mr-2 h-4 w-4" />Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="store">
          <StorePanel initial={storeInitial} />
        </TabsContent>
        {isSuperAdmin && (
          <TabsContent value="team">
            <TeamPanel users={userRows} currentUserId={session.user.id} />
          </TabsContent>
        )}
        {isSuperAdmin && (
          <TabsContent value="apikeys">
            <ApiKeysPanel keys={apiKeyRows} />
          </TabsContent>
        )}
        <TabsContent value="email">
          <EmailPanel initial={emailSettings} resendConfigured={!!process.env.RESEND_API_KEY} />
        </TabsContent>
        <TabsContent value="theme">
          <ThemePanel defaultPreset={defaultTheme} />
        </TabsContent>
        <TabsContent value="audit">
          <AuditPanel
            entries={audit.map((a) => ({
              id: a.id,
              action: a.action,
              entity: a.entity,
              entityId: a.entityId,
              user: a.user,
              createdAt: a.createdAt,
              diff: a.diff,
            }))}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
