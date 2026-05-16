import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type ProductSeed = {
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  basePrice: number; // paise
  compareAtPrice?: number | null;
  image: string;
  variants: Array<{ name: string; price: number; stock: number; sku: string; options?: Array<{ name: string; value: string }> }>;
};

const PRODUCTS: ProductSeed[] = [
  // ── PERFUMES ──
  {
    name: "Mehboob Eau de Parfum",
    slug: "mehboob-edp",
    description: "A romantic Eastern oriental built around Bulgarian rose, amber, and aged oud. Composed in Lahore, aged 90 days before release. Lasts 8-10 hours on skin.",
    categorySlug: "perfumes",
    basePrice: 450000, // Rs 4,500
    compareAtPrice: 600000,
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1200",
    variants: [
      { name: "50ml", price: 450000, stock: 24, sku: "MEH-50", options: [{ name: "Size", value: "50ml" }] },
      { name: "100ml", price: 750000, stock: 18, sku: "MEH-100", options: [{ name: "Size", value: "100ml" }] },
    ],
  },
  {
    name: "Saffron & Sandalwood",
    slug: "saffron-sandalwood",
    description: "Gilgit saffron threads steeped in Mysore sandalwood. Warm, slightly sweet, deeply masculine. A modern take on classical attar perfumery.",
    categorySlug: "perfumes",
    basePrice: 550000,
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1200",
    variants: [
      { name: "50ml", price: 550000, stock: 15, sku: "SAF-50", options: [{ name: "Size", value: "50ml" }] },
      { name: "100ml", price: 950000, stock: 8, sku: "SAF-100", options: [{ name: "Size", value: "100ml" }] },
    ],
  },
  {
    name: "Night Jasmine",
    slug: "night-jasmine",
    description: "Hand-picked Sambac jasmine layered with white musk and a whisper of vanilla. Floral, feminine, unforgettable.",
    categorySlug: "perfumes",
    basePrice: 380000,
    compareAtPrice: 480000,
    image: "https://images.unsplash.com/photo-1615375036519-bdf9bcd3a895?q=80&w=1200",
    variants: [
      { name: "50ml", price: 380000, stock: 30, sku: "NJ-50", options: [{ name: "Size", value: "50ml" }] },
      { name: "100ml", price: 650000, stock: 20, sku: "NJ-100", options: [{ name: "Size", value: "100ml" }] },
    ],
  },
  {
    name: "Royal Oud",
    slug: "royal-oud",
    description: "Cambodian oud wood at the heart, lifted by bergamot and pink pepper. The signature scent of our atelier.",
    categorySlug: "perfumes",
    basePrice: 850000,
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=1200",
    variants: [
      { name: "30ml", price: 850000, stock: 12, sku: "RO-30", options: [{ name: "Size", value: "30ml" }] },
      { name: "50ml", price: 1250000, stock: 6, sku: "RO-50", options: [{ name: "Size", value: "50ml" }] },
    ],
  },

  // ── ATTARS ──
  {
    name: "Pure Mitti Attar",
    slug: "pure-mitti-attar",
    description: "The smell of first monsoon rain on dry earth. Distilled from baked clay in copper alembics — a Pakistani heritage scent.",
    categorySlug: "attars",
    basePrice: 280000,
    image: "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=1200",
    variants: [
      { name: "6ml", price: 280000, stock: 40, sku: "MIT-6", options: [{ name: "Size", value: "6ml" }] },
      { name: "12ml", price: 480000, stock: 22, sku: "MIT-12", options: [{ name: "Size", value: "12ml" }] },
    ],
  },
  {
    name: "Rose Otto Attar",
    slug: "rose-otto-attar",
    description: "Pure Kasur rose, steam-distilled twice. No alcohol, no additives. Just the soul of a thousand petals.",
    categorySlug: "attars",
    basePrice: 320000,
    compareAtPrice: 400000,
    image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=1200",
    variants: [
      { name: "6ml", price: 320000, stock: 35, sku: "RA-6", options: [{ name: "Size", value: "6ml" }] },
      { name: "12ml", price: 550000, stock: 18, sku: "RA-12", options: [{ name: "Size", value: "12ml" }] },
    ],
  },
  {
    name: "Hina Attar",
    slug: "hina-attar",
    description: "The classic winter attar — warm, spicy, and grounding. Henna petals blended with saffron and oud.",
    categorySlug: "attars",
    basePrice: 240000,
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1200",
    variants: [
      { name: "6ml", price: 240000, stock: 45, sku: "HA-6", options: [{ name: "Size", value: "6ml" }] },
      { name: "12ml", price: 420000, stock: 25, sku: "HA-12", options: [{ name: "Size", value: "12ml" }] },
    ],
  },

  // ── BEAUTY ──
  {
    name: "Rose Water Toner",
    slug: "rose-water-toner",
    description: "100% pure Kasur rose hydrosol — a by-product of our attar distillation. Refreshing, hydrating, alcohol-free.",
    categorySlug: "beauty",
    basePrice: 85000,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1200",
    variants: [
      { name: "100ml", price: 85000, stock: 60, sku: "RWT-100", options: [{ name: "Size", value: "100ml" }] },
      { name: "200ml", price: 145000, stock: 40, sku: "RWT-200", options: [{ name: "Size", value: "200ml" }] },
    ],
  },
  {
    name: "Saffron Glow Cream",
    slug: "saffron-glow-cream",
    description: "Gilgit saffron infused in shea butter and rosehip oil. Visibly brightens skin tone with consistent use.",
    categorySlug: "beauty",
    basePrice: 145000,
    compareAtPrice: 180000,
    image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=1200",
    variants: [
      { name: "30g", price: 145000, stock: 28, sku: "SGC-30", options: [{ name: "Size", value: "30g" }] },
    ],
  },
  {
    name: "Oud Body Oil",
    slug: "oud-body-oil",
    description: "Light, fast-absorbing body oil scented with our signature Royal Oud. Leaves a lingering, sensual trail.",
    categorySlug: "beauty",
    basePrice: 195000,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1200",
    variants: [
      { name: "100ml", price: 195000, stock: 22, sku: "OBO-100", options: [{ name: "Size", value: "100ml" }] },
    ],
  },

  // ── GIFT SETS ──
  {
    name: "Mehboob Discovery Set",
    slug: "mehboob-discovery-set",
    description: "5×8ml decants of our most-loved perfumes. The perfect way to find your signature, or to gift someone the full journey.",
    categorySlug: "gift-sets",
    basePrice: 550000,
    compareAtPrice: 750000,
    image: "https://images.unsplash.com/photo-1605648916361-9bc12ad6a569?q=80&w=1200",
    variants: [
      { name: "Standard set", price: 550000, stock: 15, sku: "MDS-STD" },
    ],
  },
  {
    name: "Eid Luxury Gift Box",
    slug: "eid-luxury-gift-box",
    description: "Our signature 50ml perfume + matching body oil + rose water toner, hand-wrapped in a velvet-lined gift box with handwritten card.",
    categorySlug: "gift-sets",
    basePrice: 950000,
    compareAtPrice: 1250000,
    image: "https://images.unsplash.com/photo-1606293459339-a98099fe9c89?q=80&w=1200",
    variants: [
      { name: "Mehboob set", price: 950000, stock: 10, sku: "EID-MEH", options: [{ name: "Fragrance", value: "Mehboob" }] },
      { name: "Royal Oud set", price: 1350000, stock: 6, sku: "EID-RO", options: [{ name: "Fragrance", value: "Royal Oud" }] },
    ],
  },
];

async function main() {
  // Wipe products + dependents that may conflict on slug
  await db.orderItem.deleteMany();
  await db.inventoryLog.deleteMany();
  await db.variantOption.deleteMany();
  await db.productVariant.deleteMany();
  await db.productImage.deleteMany();
  await db.productTag.deleteMany().catch(() => {});
  await db.product.deleteMany();
  await db.order.deleteMany();
  console.log("✓ Cleared existing products + orders");

  let created = 0;
  for (const p of PRODUCTS) {
    const cat = await db.category.findUnique({ where: { slug: p.categorySlug } });
    if (!cat) {
      console.warn(`  Skipping ${p.name}: category ${p.categorySlug} not found`);
      continue;
    }

    await db.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        sku: p.variants[0]?.sku ?? null,
        status: "ACTIVE",
        basePrice: p.basePrice,
        compareAtPrice: p.compareAtPrice ?? null,
        taxable: false,
        categoryId: cat.id,
        images: { create: [{ url: p.image, alt: p.name, position: 0 }] },
        variants: {
          create: p.variants.map((v, i) => ({
            name: v.name,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            lowStockThreshold: 5,
            position: i,
            options: v.options ? { create: v.options } : undefined,
          })),
        },
      },
    });
    created++;
  }

  console.log(`✓ Created ${created} perfume products across ${new Set(PRODUCTS.map((p) => p.categorySlug)).size} categories\n`);
}

main()
  .then(() => console.log("Done."))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
