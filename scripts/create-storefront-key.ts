import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const raw = randomBytes(24).toString("base64url");
  const plaintext = `nx_live_${raw}`;
  const hashedKey = await bcrypt.hash(plaintext, 10);
  const prefix = plaintext.slice(0, 12);

  await db.apiKey.create({
    data: {
      name: "Noor storefront key",
      hashedKey,
      prefix,
      scopes: JSON.stringify([
        "products:read",
        "categories:read",
        "banners:read",
        "orders:read",
        "orders:write",
        "promotions:read",
      ]),
    },
  });
  console.log("\nSTOREFRONT_KEY:", plaintext);
  console.log("\nPaste this into storefront/.env.local as ADMIN_API_KEY=…\n");
}

main().finally(() => db.$disconnect());
