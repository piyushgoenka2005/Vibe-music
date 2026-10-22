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

const hsnCategoriesState = [...DEFAULT_HSN_CATEGORIES];

export async function GET(request: NextRequest) {
  try {
    await requireAdmin("settings:read", request);

    const stats = {
      totalHsnCodes: hsnCategoriesState.length,
      standardGstRate: "18%",
      exemptRate: "0%",
      hsnClassifiedCatalogPercent: 100,
    };

    return NextResponse.json({
      taxCategories: hsnCategoriesState,
      stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load tax categories";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
