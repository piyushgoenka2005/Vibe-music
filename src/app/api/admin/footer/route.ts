import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { prisma, isPostgresConfigured } from "@/lib/db/prisma";
import { z } from "zod";

export interface FooterLinkItem {
  id: string;
  label: string;
  url: string;
  external?: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface FooterSectionItem {
  id: string;
  label: string;
  sortOrder: number;
  links: FooterLinkItem[];
}

export interface FooterConfig {
  sections: FooterSectionItem[];
  followSectionEnabled: boolean;
  socialLinks: {
    instagram: string;
    youtube: string;
    facebook: string;
    linkedin: string;
    whatsapp: string;
  };
  businessIdentity: {
    legalName: string;
    address: string;
    gstin: string;
    grievanceOfficerName: string;
    grievanceOfficerEmail: string;
  };
  updatedAt: string;
}

const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  followSectionEnabled: true,
  socialLinks: {
    instagram: "https://www.instagram.com/vibemusic.in",
    youtube: "https://www.youtube.com/@vibemusicin",
    facebook: "https://www.facebook.com/vibemusic.in",
    linkedin: "https://www.linkedin.com/company/vibemusic",
    whatsapp: "https://wa.me/918910482950",
  },
  businessIdentity: {
    legalName: "Vibe Music Retail LLP",
    address: "Unit 402, Trade Link Hub, Bandra-Kurla Complex, Mumbai, Maharashtra 400051",
    gstin: "27AABCV1234F1Z8",
    grievanceOfficerName: "Piyush Goenka",
    grievanceOfficerEmail: "grievance@vibemusic.in",
  },
  updatedAt: new Date().toISOString(),
  sections: [
    {
      id: "programs",
      label: "01 / Programs",
      sortOrder: 0,
      links: [
        { id: "p1", label: "All programs", url: "/programs", isActive: true, sortOrder: 0 },
        {
          id: "p2",
          label: "Stage & Studio Rentals",
          url: "/rentals",
          isActive: true,
          sortOrder: 1,
        },
        {
          id: "p3",
          label: "Gear Exchange & Trade-in",
          url: "/gear-exchange",
          isActive: true,
          sortOrder: 2,
        },
        { id: "p4", label: "Financing & 0% EMI", url: "/financing", isActive: true, sortOrder: 3 },
      ],
    },
    {
      id: "service",
      label: "02 / Customer Service",
      sortOrder: 1,
      links: [
        { id: "s1", label: "Shop brands", url: "/brands", isActive: true, sortOrder: 0 },
        { id: "s2", label: "Track your order", url: "/track-order", isActive: true, sortOrder: 1 },
        { id: "s3", label: "Contact support", url: "/contact", isActive: true, sortOrder: 2 },
        {
          id: "s4",
          label: "Shipping & delivery",
          url: "/pages/shipping",
          isActive: true,
          sortOrder: 3,
        },
        {
          id: "s5",
          label: "Returns & exchanges",
          url: "/pages/returns",
          isActive: true,
          sortOrder: 4,
        },
      ],
    },
    {
      id: "legal",
      label: "03 / Legal",
      sortOrder: 2,
      links: [
        {
          id: "l1",
          label: "Terms & conditions",
          url: "/pages/terms",
          isActive: true,
          sortOrder: 0,
        },
        { id: "l2", label: "Privacy policy", url: "/pages/privacy", isActive: true, sortOrder: 1 },
        { id: "l3", label: "Cookie policy", url: "/pages/cookies", isActive: true, sortOrder: 2 },
        { id: "l4", label: "Contact", url: "/contact", isActive: true, sortOrder: 3 },
      ],
    },
    {
      id: "follow",
      label: "04 / Follow",
      sortOrder: 3,
      links: [
        {
          id: "f1",
          label: "Instagram",
          url: "https://www.instagram.com/vibemusic.in",
          external: true,
          isActive: true,
          sortOrder: 0,
        },
        {
          id: "f2",
          label: "YouTube",
          url: "https://www.youtube.com/@vibemusicin",
          external: true,
          isActive: true,
          sortOrder: 1,
        },
        {
          id: "f3",
          label: "Facebook",
          url: "https://www.facebook.com/vibemusic.in",
          external: true,
          isActive: true,
          sortOrder: 2,
        },
        {
          id: "f4",
          label: "LinkedIn",
          url: "https://www.linkedin.com/company/vibemusic",
          external: true,
          isActive: true,
          sortOrder: 3,
        },
      ],
    },
  ],
};

let inMemoryFooterConfig: FooterConfig = { ...DEFAULT_FOOTER_CONFIG };

async function loadFooterConfigFromDb(): Promise<FooterConfig> {
  if (!isPostgresConfigured()) return inMemoryFooterConfig;
  try {
    const menu = await prisma.navigationMenu.findUnique({
      where: { handle: "footer_nav" },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
    if (!menu) return inMemoryFooterConfig;

    if (menu.description) {
      try {
        const parsed = JSON.parse(menu.description) as Partial<FooterConfig>;
        return {
          ...inMemoryFooterConfig,
          ...parsed,
          updatedAt: menu.updatedAt || new Date().toISOString(),
        };
      } catch {
        return inMemoryFooterConfig;
      }
    }
    return inMemoryFooterConfig;
  } catch {
    return inMemoryFooterConfig;
  }
}

export async function GET(request: Request) {
  try {
    await requireAdmin("settings:read", request);
    const config = await loadFooterConfigFromDb();
    return NextResponse.json({ config });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}

const updateFooterSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string(),
      label: z.string().min(1),
      sortOrder: z.number().default(0),
      links: z.array(
        z.object({
          id: z.string(),
          label: z.string().min(1),
          url: z.string().min(1),
          external: z.boolean().optional(),
          isActive: z.boolean().default(true),
          sortOrder: z.number().default(0),
        }),
      ),
    }),
  ),
  followSectionEnabled: z.boolean().default(true),
  socialLinks: z
    .object({
      instagram: z.string(),
      youtube: z.string(),
      facebook: z.string(),
      linkedin: z.string(),
      whatsapp: z.string(),
    })
    .optional(),
  businessIdentity: z
    .object({
      legalName: z.string(),
      address: z.string(),
      gstin: z.string(),
      grievanceOfficerName: z.string(),
      grievanceOfficerEmail: z.string(),
    })
    .optional(),
});

export async function PUT(request: Request) {
  try {
    await requireAdmin("settings:write", request);
    const body = await request.json();
    const parsed = updateFooterSchema.parse(body);

    const now = new Date().toISOString();
    const current = await loadFooterConfigFromDb();

    const updated: FooterConfig = {
      sections: parsed.sections,
      followSectionEnabled: parsed.followSectionEnabled,
      socialLinks: parsed.socialLinks
        ? { ...current.socialLinks, ...parsed.socialLinks }
        : current.socialLinks,
      businessIdentity: parsed.businessIdentity
        ? { ...current.businessIdentity, ...parsed.businessIdentity }
        : current.businessIdentity,
      updatedAt: now,
    };

    inMemoryFooterConfig = updated;

    if (isPostgresConfigured()) {
      try {
        await prisma.navigationMenu.upsert({
          where: { handle: "footer_nav" },
          create: {
            handle: "footer_nav",
            name: "Footer Navigation",
            description: JSON.stringify(updated),
            isActive: true,
            createdAt: now,
            updatedAt: now,
          },
          update: {
            description: JSON.stringify(updated),
            updatedAt: now,
          },
        });
      } catch {
        // Fallback to in-memory
      }
    }

    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}
