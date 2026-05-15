"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { requirePermission } from "@/lib/rbac";
import {
  storeSchema,
  teamUserSchema,
  apiKeySchema,
  emailSettingsSchema,
  type StoreInput,
  type TeamUserInput,
  type ApiKeyInput,
  type EmailSettingsInput,
} from "@/lib/validations/settings";

export type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

// ── Store ──

export async function updateStore(input: StoreInput): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "store:manage");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const parsed = storeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  const existing = await db.store.findFirst();
  if (existing) {
    await db.store.update({
      where: { id: existing.id },
      data: { ...data, logo: data.logo || null, favicon: data.favicon || null },
    });
  } else {
    await db.store.create({
      data: { ...data, logo: data.logo || null, favicon: data.favicon || null },
    });
  }
  revalidatePath("/settings");
  return { ok: true };
}

// ── Team ──

export async function createTeamUser(input: TeamUserInput): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") return { ok: false, error: "Super admin only" };

  const parsed = teamUserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const exists = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { ok: false, error: "Email already in use" };

  const password = parsed.data.password || randomBytes(12).toString("base64url");
  const hashed = await bcrypt.hash(password, 10);
  const u = await db.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name ?? null,
      role: parsed.data.role,
      hashedPassword: hashed,
      emailVerified: new Date(),
    },
  });
  revalidatePath("/settings");
  return { ok: true, data: { id: u.id } };
}

export async function updateUserRole(userId: string, role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "VIEWER"): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") return { ok: false, error: "Super admin only" };
  if (userId === session.user.id) return { ok: false, error: "Cannot change your own role" };

  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/settings");
  return { ok: true };
}

export async function toggleUserActive(userId: string): Promise<ActionResult<{ isActive: boolean }>> {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") return { ok: false, error: "Super admin only" };
  if (userId === session.user.id) return { ok: false, error: "Cannot deactivate yourself" };

  const u = await db.user.findUnique({ where: { id: userId } });
  if (!u) return { ok: false, error: "User not found" };
  const updated = await db.user.update({ where: { id: u.id }, data: { isActive: !u.isActive } });
  revalidatePath("/settings");
  return { ok: true, data: { isActive: updated.isActive } };
}

// ── API Keys ──

const API_KEY_PREFIX = "nx_live_";

export async function createApiKey(
  input: ApiKeyInput
): Promise<ActionResult<{ id: string; plaintext: string; prefix: string }>> {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") return { ok: false, error: "Super admin only" };

  const parsed = apiKeySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const raw = randomBytes(24).toString("base64url");
  const plaintext = `${API_KEY_PREFIX}${raw}`;
  const hashedKey = await bcrypt.hash(plaintext, 10);
  const prefix = plaintext.slice(0, 12);

  const key = await db.apiKey.create({
    data: {
      name: parsed.data.name,
      hashedKey,
      prefix,
      scopes: JSON.stringify(parsed.data.scopes),
      createdById: session.user.id,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    },
  });

  revalidatePath("/settings");
  return { ok: true, data: { id: key.id, plaintext, prefix } };
}

export async function revokeApiKey(id: string): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") return { ok: false, error: "Super admin only" };
  await db.apiKey.delete({ where: { id } });
  revalidatePath("/settings");
  return { ok: true };
}

// ── Email settings (stored in Setting kv) ──

const EMAIL_KEY = "email.settings";

export async function getEmailSettings(): Promise<EmailSettingsInput> {
  const row = await db.setting.findUnique({ where: { key: EMAIL_KEY } });
  if (!row) {
    return {
      fromName: "NexusAdmin",
      fromAddress: process.env.EMAIL_FROM ?? "noreply@example.com",
      replyTo: "",
    };
  }
  try {
    return JSON.parse(row.value);
  } catch {
    return { fromName: "NexusAdmin", fromAddress: "noreply@example.com", replyTo: "" };
  }
}

export async function updateEmailSettings(input: EmailSettingsInput): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "settings:manage");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const parsed = emailSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  await db.setting.upsert({
    where: { key: EMAIL_KEY },
    update: { value: JSON.stringify(parsed.data) },
    create: { key: EMAIL_KEY, value: JSON.stringify(parsed.data) },
  });
  revalidatePath("/settings");
  return { ok: true };
}

// ── Theme persistence (per-store default; client can still override) ──

const THEME_KEY = "theme.preset";

export async function getDefaultTheme(): Promise<string> {
  const row = await db.setting.findUnique({ where: { key: THEME_KEY } });
  return row ? row.value : "blue";
}

export async function setDefaultTheme(presetId: string): Promise<ActionResult> {
  const session = await auth();
  try {
    requirePermission(session?.user?.role, "settings:manage");
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  await db.setting.upsert({
    where: { key: THEME_KEY },
    update: { value: presetId },
    create: { key: THEME_KEY, value: presetId },
  });
  revalidatePath("/settings");
  return { ok: true };
}
