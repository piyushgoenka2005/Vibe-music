import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { prisma, isPostgresConfigured } from "@/lib/db/prisma";
import { z } from "zod";

export interface SeoSettings {
  siteTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalBaseUrl: string;
  ogImage: string;
  twitterCard: "summary" | "summary_large_image";
  twitterHandle: string;
  robotsTxtDirectives: string;
  sitemapFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly";
  sitemapPriorityHome: number;
  sitemapPriorityProducts: number;
  sitemapPriorityCategories: number;
  sitemapPriorityPages: number;
  googleSiteVerification: string;
  bingSiteVerification: string;
  gaMeasurementId: string;
  updatedAt: string;
}

const DEFAULT_SEO_SETTINGS: SeoSettings = {
  siteTitle: "Vibe Music | India's Premier Musical Instrument & Pro Audio Store",
  metaDescription:
    "Shop authentic electric & acoustic guitars, digital pianos, synths, drums, microphones, and studio audio equipment with official manufacturer warranty and free express shipping across India.",
  keywords:
    "musical instruments, buy guitar online, fender guitar india, roland synthesizers, audio interface, shure microphone, drum kits mumbai",
  canonicalBaseUrl: "https://vibemusic.in",
  ogImage: "/og-banner.webp",
  twitterCard: "summary_large_image",
  twitterHandle: "@vibemusicin",
  robotsTxtDirectives:
    "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /checkout\nDisallow: /account\nDisallow: /orders/*/pay\n\nSitemap: https://vibemusic.in/sitemap.xml",
  sitemapFrequency: "daily",
  sitemapPriorityHome: 1.0,
  sitemapPriorityProducts: 0.9,
  sitemapPriorityCategories: 0.8,
  sitemapPriorityPages: 0.7,
  googleSiteVerification: "google-site-verification=vibemusic-prod-2026",
  bingSiteVerification: "",
  gaMeasurementId: "G-VIBEMUSIC26",
  updatedAt: new Date().toISOString(),
};

let inMemorySeoSettings: SeoSettings = { ...DEFAULT_SEO_SETTINGS };

async function loadSeoFromDb(): Promise<SeoSettings> {
  if (!isPostgresConfigured()) return inMemorySeoSettings;
  try {
    const row = await prisma.localizationSetting.findUnique({
      where: { id: "seo" },
    });
    if (row && row.preferences && typeof row.preferences === "object") {
      return {
        ...DEFAULT_SEO_SETTINGS,
        ...(row.preferences as Record<string, unknown>),
        updatedAt: row.updatedAt || new Date().toISOString(),
      };
    }
    return inMemorySeoSettings;
  } catch {
    return inMemorySeoSettings;
  }
}

export async function GET(request: Request) {
  try {
    await requireAdmin("settings:read", request);
    const settings = await loadSeoFromDb();
    return NextResponse.json({ settings });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}

const updateSeoSchema = z.object({
  siteTitle: z.string().min(1).max(200),
  metaDescription: z.string().min(1).max(500),
  keywords: z.string().max(500),
  canonicalBaseUrl: z.string().url().or(z.literal("")),
  ogImage: z.string().min(1),
  twitterCard: z.enum(["summary", "summary_large_image"]),
  twitterHandle: z.string().max(100),
  robotsTxtDirectives: z.string().max(2000),
  sitemapFrequency: z.enum(["always", "hourly", "daily", "weekly", "monthly"]),
  sitemapPriorityHome: z.number().min(0).max(1),
  sitemapPriorityProducts: z.number().min(0).max(1),
  sitemapPriorityCategories: z.number().min(0).max(1),
  sitemapPriorityPages: z.number().min(0).max(1),
  googleSiteVerification: z.string().max(200),
  bingSiteVerification: z.string().max(200),
  gaMeasurementId: z.string().max(50),
});

export async function PUT(request: Request) {
  try {
    await requireAdmin("settings:write", request);
    const body = await request.json();
    const parsed = updateSeoSchema.parse(body);

    const now = new Date().toISOString();
    const updated: SeoSettings = {
      ...parsed,
      updatedAt: now,
    };

    inMemorySeoSettings = updated;

    if (isPostgresConfigured()) {
      try {
        await prisma.localizationSetting.upsert({
          where: { id: "seo" },
          create: {
            id: "seo",
            currencies: [],
            locales: [],
            preferences: updated as unknown as object,
            updatedAt: now,
          },
          update: {
            preferences: updated as unknown as object,
            updatedAt: now,
          },
        });
      } catch {
        // Fallback to in-memory
      }
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}
