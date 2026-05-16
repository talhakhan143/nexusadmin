// Shape mirrors NexusAdmin public API responses.
// Money fields are integer minor units (paise). Use formatPKR().

export interface ApiImage {
  id: string;
  url: string;
  alt?: string | null;
  position: number;
}

export interface ApiCategoryRef {
  id?: string;
  name: string;
  slug: string;
}

export interface ApiVariantOption {
  id: string;
  name: string;
  value: string;
}

export interface ApiVariantSummary {
  id: string;
  name: string | null;
  price: number;
  stock: number;
}

export interface ApiVariantFull extends ApiVariantSummary {
  sku?: string | null;
  compareAtPrice?: number | null;
  options: ApiVariantOption[];
  image?: string | null;
}

export interface ApiTag {
  name: string;
  slug: string;
}

export interface ApiProductListItem {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  basePrice: number;
  compareAtPrice?: number | null;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  createdAt: string;
  images: ApiImage[];
  category: ApiCategoryRef | null;
  variants: ApiVariantSummary[];
}

export interface ApiProductDetail extends ApiProductListItem {
  metaTitle?: string | null;
  metaDescription?: string | null;
  variants: ApiVariantFull[];
  tags: ApiTag[];
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  parentId: string | null;
  _count: { products: number };
}

export interface ApiBanner {
  id: string;
  name: string;
  placement: BannerPlacement;
  customKey?: string | null;
  title?: string | null;
  subtitle?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  image: string;
  imageMobile?: string | null;
  alt?: string | null;
  bgColor?: string | null;
  textColor?: string | null;
  linkUrl?: string | null;
  targetCategory: ApiCategoryRef | null;
  targetProduct: { slug: string; name: string } | null;
  position: number;
}

export type BannerPlacement =
  | "HOMEPAGE_HERO"
  | "HOMEPAGE_SECONDARY"
  | "HOMEPAGE_FOOTER"
  | "CATEGORY_TOP"
  | "PRODUCT_DETAIL_SIDE"
  | "CART_SIDEBAR"
  | "CHECKOUT_TOP"
  | "POPUP"
  | "CUSTOM";

export interface ApiAddressInput {
  firstName: string;
  lastName?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  phone?: string;
}

export interface ApiCheckoutItem {
  variantId: string;
  quantity: number;
}

export interface ApiCheckoutPayload {
  customer: { email: string; name?: string; phone?: string; acceptsMarketing?: boolean };
  items: ApiCheckoutItem[];
  shippingAddress: ApiAddressInput;
  billingAddress?: ApiAddressInput;
  shippingAmount: number;
  couponCode?: string | null;
  notes?: string | null;
  paymentMethod?: "COD" | "JAZZCASH" | "EASYPAISA" | "CARD";
}

export interface ApiCheckoutResponse {
  orderNumber: string;
  id: string;
  status: string;
  paymentStatus: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  checkoutUrl: string | null;
}

export interface ApiStore {
  name: string;
  legalName: string | null;
  email: string;
  phone: string | null;
  logo: string | null;
  currency: string;
  locale: string;
  timezone: string;
  country: string | null;
  city: string | null;
  state: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  socialInstagram: string | null;
  socialFacebook: string | null;
  socialTwitter: string | null;
}

export interface ApiOrderDetail {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  trackingNumber: string | null;
  trackingUrl: string | null;
  placedAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: Array<{
    name?: string;
    variant?: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  shippingAddress: ApiAddressInput;
  timeline: Array<{ status: string; at: string; note: string | null }>;
}
