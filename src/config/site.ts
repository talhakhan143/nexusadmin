export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "NexusAdmin",
  description: "Premium e-commerce admin panel — Next.js 16, Prisma, NextAuth v5.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ogImage: "/og.png",
  links: {
    docs: "/docs",
    github: "https://github.com/your-org/nexusadmin",
  },
} as const;

export type SiteConfig = typeof siteConfig;
