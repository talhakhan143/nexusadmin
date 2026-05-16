export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Noor — Perfumes & Beauty",
  shortName: "Noor",
  tagline: "Crafted fragrances. Curated beauty.",
  description:
    "Discover Pakistan's most beloved perfumes, attars, and skincare — delivered fresh from our atelier to your doorstep.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "+923001234567",
  phone: "+92 300 123 4567",
  email: "hello@noorperfumes.pk",
  address: "Karachi · Lahore · Islamabad",
  social: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    tiktok: "https://tiktok.com",
    youtube: "https://youtube.com",
  },
  shipping: {
    freeOver: 350000, // Rs 3,500 in paise/cents
    standardDays: "3–5 working days",
    expressDays: "1–2 working days (major cities)",
  },
  paymentMethods: [
    { id: "COD", label: "Cash on Delivery", description: "Pay when your order arrives." },
    { id: "JAZZCASH", label: "JazzCash", description: "Mobile wallet payment." },
    { id: "EASYPAISA", label: "Easypaisa", description: "Mobile wallet payment." },
    { id: "CARD", label: "Debit / Credit Card", description: "Secure card payment." },
  ] as const,
};

export const NAV_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Perfumes", href: "/category/perfumes" },
  { label: "Attars", href: "/category/attars" },
  { label: "Beauty", href: "/category/beauty" },
  { label: "Gift Sets", href: "/category/gift-sets" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const FOOTER_LINKS = {
  shop: [
    { label: "All Products", href: "/shop" },
    { label: "New Arrivals", href: "/shop?sort=new" },
    { label: "Best Sellers", href: "/shop?sort=best" },
    { label: "Sale", href: "/shop?sale=true" },
  ],
  help: [
    { label: "FAQs", href: "/faq" },
    { label: "Shipping & Delivery", href: "/shipping" },
    { label: "Returns & Refunds", href: "/returns" },
    { label: "Track Order", href: "/order" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};
