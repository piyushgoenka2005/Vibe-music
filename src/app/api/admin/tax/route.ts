import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export interface HsnTaxCategory {
  hsnCode: string;
  name: string;
  description: string;
  gstRate: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  isActive: boolean;
  itemCount: number;
}

const DEFAULT_HSN_CATEGORIES: HsnTaxCategory[] = [
  {
    hsnCode: "9202",
    name: "Acoustic & String Instruments",
    description: "Guitars, violins, harps, ukuleles, cellos and mandolins",
    gstRate: 18,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    isActive: true,
    itemCount: 84,
  },
  {
    hsnCode: "9207",
    name: "Electronic & Amplified Instruments",
    description: "Synthesizers, digital pianos, workstation keyboards, electronic drums",
    gstRate: 18,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    isActive: true,
    itemCount: 65,
  },
  {
    hsnCode: "8518",
    name: "Pro Audio, Microphones & Amplifiers",
    description: "Loudspeakers, audio amplifiers, studio headphones and microphones",
    gstRate: 18,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    isActive: true,
    itemCount: 52,
  },
  {
    hsnCode: "9206",
    name: "Percussion & Acoustic Drums",
    description: "Acoustic drum kits, snare drums, cymbals, bongos and congas",
    gstRate: 18,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    isActive: true,
    itemCount: 22,
  },
  {
    hsnCode: "9209",
    name: "Musical Instrument Accessories & Parts",
    description: "Strings, capos, instrument cables, guitar picks, stands and cases",
    gstRate: 18,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    isActive: true,
    itemCount: 46,
  },
  {
    hsnCode: "4904",
    name: "Printed Sheet Music & Method Books",
    description: "Music manuscripts, chord charts, guitar tablature and instructional books",
    gstRate: 0,
    cgstRate: 0,
    sgstRate: 0,
    igstRate: 0,
    isActive: true,
    itemCount: 15,
  },
];

import { isPostgresConfigured, prisma } from "@/lib/db/prisma";

let hsnCategoriesState = [...DEFAULT_HSN_CATEGORIES];
let isTaxSeeded = false;

async function ensureDefaultTaxCategoriesSeeded(): Promise<void> {
  if (isTaxSeeded || !isPostgresConfigured()) return;
  try {
    const count = await prisma.taxCategory.count();
    if (count === 0) {
      await prisma.taxCategory.createMany({
        data: DEFAULT_HSN_CATEGORIES.map((cat) => ({
          hsnCode: cat.hsnCode,
          name: cat.name,
          description: cat.description,
          gstRate: cat.gstRate,
          cgstRate: cat.cgstRate,
          sgstRate: cat.sgstRate,
          igstRate: cat.igstRate,
          isActive: cat.isActive,
          itemCount: cat.itemCount,
          updatedAt: new Date().toISOString(),
        })),
        skipDuplicates: true,
      });
    }
    isTaxSeeded = true;
  } catch {
    // Non-blocking fallback to in-memory
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin("settings:read", request);

    let categories: HsnTaxCategory[] = hsnCategoriesState;

    if (isPostgresConfigured()) {
      try {
        await ensureDefaultTaxCategoriesSeeded();
        const rows = await prisma.taxCategory.findMany({
          orderBy: { hsnCode: "asc" },
        });

        if (rows.length > 0) {
          categories = rows.map((r) => ({
            hsnCode: r.hsnCode,
            name: r.name,
            description: r.description,
            gstRate: r.gstRate,
            cgstRate: r.cgstRate,
            sgstRate: r.sgstRate,
            igstRate: r.igstRate,
            isActive: r.isActive,
            itemCount: r.itemCount,
          }));
          hsnCategoriesState = categories;
        }
      } catch {
        // Fallback to in-memory state
      }
    }

    const stats = {
      totalHsnCodes: categories.length,
      standardGstRate: "18%",
      exemptRate: "0%",
      hsnClassifiedCatalogPercent: 100,
    };

    return NextResponse.json({
      taxCategories: categories,
      stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load tax categories";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin("settings:write", request);
    const body = await request.json();

    const hsnCode = String(body.hsnCode || "").trim();
    const name = String(body.name || "").trim();
    if (!hsnCode || !name) {
      return NextResponse.json({ error: "HSN Code and Name are required" }, { status: 400 });
    }

    const gstRate = Number(body.gstRate ?? 18);
    const cgstRate = Number(body.cgstRate ?? gstRate / 2);
    const sgstRate = Number(body.sgstRate ?? gstRate / 2);
    const igstRate = Number(body.igstRate ?? gstRate);
    const description = String(body.description || "").trim();
    const isActive = body.isActive !== false;
    const itemCount = Number(body.itemCount ?? 0);

    const newCategory: HsnTaxCategory = {
      hsnCode,
      name,
      description,
      gstRate,
      cgstRate,
      sgstRate,
      igstRate,
      isActive,
      itemCount,
    };

    if (isPostgresConfigured()) {
      try {
        await prisma.taxCategory.create({
          data: {
            ...newCategory,
            updatedAt: new Date().toISOString(),
          },
        });
      } catch {
        // Fallback to in-memory state
      }
    }

    hsnCategoriesState = hsnCategoriesState.filter((c) => c.hsnCode !== hsnCode);
    hsnCategoriesState.push(newCategory);

    return NextResponse.json({ success: true, category: newCategory }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create tax category";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin("settings:write", request);
    const body = await request.json();

    const hsnCode = String(body.hsnCode || "").trim();
    if (!hsnCode) {
      return NextResponse.json({ error: "HSN Code is required" }, { status: 400 });
    }

    const existing = hsnCategoriesState.find((c) => c.hsnCode === hsnCode);
    const updated: HsnTaxCategory = {
      hsnCode,
      name: body.name !== undefined ? String(body.name).trim() : (existing?.name ?? ""),
      description:
        body.description !== undefined
          ? String(body.description).trim()
          : (existing?.description ?? ""),
      gstRate: body.gstRate !== undefined ? Number(body.gstRate) : (existing?.gstRate ?? 18),
      cgstRate:
        body.cgstRate !== undefined
          ? Number(body.cgstRate)
          : body.gstRate !== undefined
            ? Number(body.gstRate) / 2
            : (existing?.cgstRate ?? 9),
      sgstRate:
        body.sgstRate !== undefined
          ? Number(body.sgstRate)
          : body.gstRate !== undefined
            ? Number(body.gstRate) / 2
            : (existing?.sgstRate ?? 9),
      igstRate:
        body.igstRate !== undefined
          ? Number(body.igstRate)
          : body.gstRate !== undefined
            ? Number(body.gstRate)
            : (existing?.igstRate ?? 18),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : (existing?.isActive ?? true),
      itemCount: body.itemCount !== undefined ? Number(body.itemCount) : (existing?.itemCount ?? 0),
    };

    if (isPostgresConfigured()) {
      try {
        await prisma.taxCategory.upsert({
          where: { hsnCode },
          create: {
            ...updated,
            updatedAt: new Date().toISOString(),
          },
          update: {
            name: updated.name,
            description: updated.description,
            gstRate: updated.gstRate,
            cgstRate: updated.cgstRate,
            sgstRate: updated.sgstRate,
            igstRate: updated.igstRate,
            isActive: updated.isActive,
            itemCount: updated.itemCount,
            updatedAt: new Date().toISOString(),
          },
        });
      } catch {
        // Fallback to in-memory
      }
    }

    hsnCategoriesState = hsnCategoriesState.map((c) => (c.hsnCode === hsnCode ? updated : c));

    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update tax category";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin("settings:write", request);
    const { searchParams } = new URL(request.url);
    const hsnCode = searchParams.get("hsnCode");

    if (!hsnCode) {
      return NextResponse.json({ error: "hsnCode parameter is required" }, { status: 400 });
    }

    if (isPostgresConfigured()) {
      try {
        await prisma.taxCategory.delete({ where: { hsnCode } });
      } catch {
        // Fallback
      }
    }

    hsnCategoriesState = hsnCategoriesState.filter((c) => c.hsnCode !== hsnCode);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete tax category";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
