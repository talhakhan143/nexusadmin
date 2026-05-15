import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const raw = randomBytes(24).toString("base64url");
  const plaintext = `nx_live_${raw}`;
  const hashedKey = await bcrypt.hash(plaintext, 10);
  const prefix = plaintext.slice(0, 12);

  const key = await db.apiKey.create({
    data: {
      name: "Smoke test key",
      hashedKey,
      prefix,
      scopes: JSON.stringify(["products:read", "categories:read", "orders:read", "orders:write"]),
    },
  });
  console.log("ID:", key.id);
  console.log("KEY:", plaintext);
}

main().finally(() => db.$disconnect());
