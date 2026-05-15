"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@/server/db";
import { signIn } from "@/server/auth";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";
import { sendEmail } from "@/lib/email";
import { siteConfig } from "@/config/site";

export type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
    return { ok: true };
  } catch (e: any) {
    if (e?.type === "CredentialsSignin") return { ok: false, error: "Invalid email or password" };
    return { ok: false, error: "Sign-in failed" };
  }
}

export async function registerAction(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const { name, email, password } = parsed.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "Email already registered" };

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.user.create({
    data: { name, email, hashedPassword, role: "VIEWER" },
  });

  return { ok: true };
}

export async function forgotPasswordAction(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // Always respond ok to avoid user enumeration
  if (!user) return { ok: true };

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1h

  await db.passwordResetToken.create({
    data: { token, userId: user.id, expires },
  });

  const link = `${siteConfig.url}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: `Reset your ${siteConfig.name} password`,
    html: `<p>Hi ${user.name ?? ""},</p><p>Click the link below to reset your password (valid for 1 hour):</p><p><a href="${link}">${link}</a></p>`,
  });

  return { ok: true };
}

export async function resetPasswordAction(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const { token, password } = parsed.data;
  const record = await db.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expires < new Date()) {
    return { ok: false, error: "Invalid or expired token" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { hashedPassword } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return { ok: true };
}
