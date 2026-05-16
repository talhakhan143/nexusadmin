import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // ── Store ──
  const existing = await db.store.findFirst();
  const storeData = {
    name: "Noor — Perfumes & Beauty",
    legalName: "Noor Perfumes (Pvt) Ltd",
    email: "mr.talha143@gmail.com",
    phone: "03368469404",
    currency: "PKR",
    locale: "en-PK",
    timezone: "Asia/Karachi",
    taxRate: 0,
    taxIncluded: true,
    country: "Pakistan",
    city: "Karachi",
    state: "Sindh",
    socialInstagram: "https://instagram.com/noorperfumes",
    socialFacebook: "https://facebook.com/noorperfumes",
  };

  if (existing) {
    await db.store.update({ where: { id: existing.id }, data: storeData });
    console.log("✓ Store updated");
  } else {
    await db.store.create({ data: storeData });
    console.log("✓ Store created");
  }

  // ── Categories ──
  const cats = [
    { name: "Perfumes", slug: "perfumes", position: 0 },
    { name: "Attars", slug: "attars", position: 1 },
    { name: "Beauty", slug: "beauty", position: 2 },
    { name: "Gift Sets", slug: "gift-sets", position: 3 },
  ];
  for (const c of cats) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, position: c.position },
      create: c,
    });
  }
  console.log(`✓ ${cats.length} perfume categories ready`);

  // Archive non-perfume categories so they hide from storefront
  await db.category.updateMany({
    where: { slug: { in: ["apparel", "electronics", "home-living", "sports"] } },
    data: { position: 99 },
  });
}

main()
  .then(() => console.log("\nDone."))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
