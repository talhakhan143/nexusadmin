import { PrismaClient, UserRole, ProductStatus, CouponType, CouponScope } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding NexusAdmin...");

  // ── Super admin user ──
  const password = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@nexusadmin.dev" },
    update: {},
    create: {
      email: "admin@nexusadmin.dev",
      name: "Super Admin",
      hashedPassword: password,
      role: UserRole.SUPER_ADMIN,
      emailVerified: new Date(),
    },
  });

  // Demo manager + viewer
  await prisma.user.upsert({
    where: { email: "manager@nexusadmin.dev" },
    update: {},
    create: {
      email: "manager@nexusadmin.dev",
      name: "Manager Demo",
      hashedPassword: password,
      role: UserRole.MANAGER,
      emailVerified: new Date(),
    },
  });
  await prisma.user.upsert({
    where: { email: "viewer@nexusadmin.dev" },
    update: {},
    create: {
      email: "viewer@nexusadmin.dev",
      name: "Viewer Demo",
      hashedPassword: password,
      role: UserRole.VIEWER,
      emailVerified: new Date(),
    },
  });

  // ── Store ──
  const existingStore = await prisma.store.findFirst();
  if (!existingStore) {
    await prisma.store.create({
      data: {
        name: "NexusAdmin Demo Store",
        email: "hello@nexusadmin.dev",
        currency: "USD",
        taxRate: 7.5,
        country: "US",
        timezone: "America/New_York",
      },
    });
  }

  // ── Categories ──
  const categories = [
    { name: "Apparel", slug: "apparel" },
    { name: "Electronics", slug: "electronics" },
    { name: "Home & Living", slug: "home-living" },
    { name: "Beauty", slug: "beauty" },
    { name: "Sports", slug: "sports" },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }
  const apparel = await prisma.category.findUnique({ where: { slug: "apparel" } });
  const electronics = await prisma.category.findUnique({ where: { slug: "electronics" } });

  // ── Products with variants ──
  const products = [
    {
      name: "Classic Cotton T-Shirt",
      slug: "classic-cotton-tshirt",
      description: "Soft 100% cotton tee. Pre-shrunk, durable.",
      basePrice: 2499,
      compareAtPrice: 2999,
      categoryId: apparel?.id,
      variants: [
        { name: "Black / S", price: 2499, stock: 25, options: [{ name: "Color", value: "Black" }, { name: "Size", value: "S" }] },
        { name: "Black / M", price: 2499, stock: 30, options: [{ name: "Color", value: "Black" }, { name: "Size", value: "M" }] },
        { name: "White / M", price: 2499, stock: 20, options: [{ name: "Color", value: "White" }, { name: "Size", value: "M" }] },
      ],
    },
    {
      name: "Wireless Noise-Cancelling Headphones",
      slug: "wireless-nc-headphones",
      description: "40-hour battery, ANC, Bluetooth 5.3.",
      basePrice: 19999,
      compareAtPrice: 24999,
      categoryId: electronics?.id,
      variants: [
        { name: "Midnight Black", price: 19999, stock: 12, options: [{ name: "Color", value: "Black" }] },
        { name: "Pearl White", price: 19999, stock: 8, options: [{ name: "Color", value: "White" }] },
      ],
    },
    {
      name: "Smart Mug Warmer",
      slug: "smart-mug-warmer",
      description: "Keeps your coffee at the perfect temperature.",
      basePrice: 4999,
      categoryId: electronics?.id,
      variants: [{ name: "Default", price: 4999, stock: 50, options: [] }],
    },
  ];

  for (const p of products) {
    const { variants, ...productData } = p;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...productData,
        status: ProductStatus.ACTIVE,
        featured: true,
      },
    });

    for (const v of variants) {
      const { options, ...variantData } = v;
      const exists = await prisma.productVariant.findFirst({
        where: { productId: product.id, name: v.name },
      });
      if (!exists) {
        await prisma.productVariant.create({
          data: {
            ...variantData,
            productId: product.id,
            options: { create: options },
          },
        });
      }
    }
  }

  // ── Sample customers ──
  await prisma.customer.upsert({
    where: { email: "jane.doe@example.com" },
    update: {},
    create: { email: "jane.doe@example.com", name: "Jane Doe", phone: "+1-555-0100" },
  });
  await prisma.customer.upsert({
    where: { email: "john.smith@example.com" },
    update: {},
    create: { email: "john.smith@example.com", name: "John Smith", phone: "+1-555-0101" },
  });

  // ── Coupons ──
  const coupons = [
    {
      code: "WELCOME10",
      description: "10% off your first order",
      type: CouponType.PERCENTAGE,
      value: 10,
      minPurchase: 2000,
      maxDiscount: 5000,
      scope: CouponScope.ALL,
    },
    {
      code: "FREESHIP",
      description: "Free shipping on orders over $50",
      type: CouponType.FREE_SHIPPING,
      value: 0,
      minPurchase: 5000,
      scope: CouponScope.ALL,
    },
    {
      code: "FLAT5",
      description: "$5 off any order",
      type: CouponType.FIXED,
      value: 500,
      scope: CouponScope.ALL,
    },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  console.log("✅ Seed complete.");
  console.log("   Login: admin@nexusadmin.dev / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
