import type { ProductSpec } from "@/types/product";

export interface GuitarShowcaseSpec {
  label: string;
  value: string;
}

export interface GuitarShowcaseRow {
  left: GuitarShowcaseSpec;
  right: GuitarShowcaseSpec;
}

export interface GuitarShowcaseProfile {
  Type: string;
  Body: string;
  Neck: string;
  Fingerboard: string;
  "Scale Length": string;
  Pickup: string;
  Controls: string;
  "Pickup Selector": string;
  Bridge: string;
  "Tuners & Hardware": string;
}

/** Fixed left/right spec pairs for the guitar showcase layout. */
export const GUITAR_SHOWCASE_ROW_LABELS: Array<{
  left: string;
  right: string;
}> = [
  { left: "Type", right: "Body" },
  { left: "Neck", right: "Fingerboard" },
  { left: "Scale Length", right: "Pickup" },
  { left: "Controls", right: "Pickup Selector" },
  { left: "Bridge", right: "Tuners & Hardware" },
];

export const GUITAR_SHOWCASE_FIELD_LABELS = GUITAR_SHOWCASE_ROW_LABELS.flatMap(
  ({ left, right }) => [left, right]
);

const LABEL_ALIASES: Record<string, string[]> = {
  Type: ["type", "guitar type", "body style", "style"],
  Body: ["body", "body wood", "body material", "body wood/material"],
  Neck: ["neck", "neck material", "neck wood", "neck wood/material"],
  Fingerboard: ["fingerboard", "fretboard", "fret board"],
  "Scale Length": ["scale length", "scale"],
  Pickup: ["pickup", "pickups", "pickup configuration", "pickups configuration"],
  Controls: ["controls", "electronics"],
  "Pickup Selector": [
    "pickup selector",
    "selector",
    "selector switch",
    "pickup switch",
  ],
  Bridge: ["bridge", "bridge type"],
  "Tuners & Hardware": [
    "tuners & hardware",
    "tuners and hardware",
    "tuners",
    "hardware",
    "tuning machines",
  ],
};

export const GUITAR_SHOWCASE_PLACEHOLDER = "—";

/** Shared hero image for the guitar specs showcase on every guitar PDP. */
export const GUITAR_SHOWCASE_IMAGE =
  "/images/m/products/image/d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png";

export const GUITAR_SHOWCASE_IMAGE_ALT = "Electric guitar specification showcase";

const SEED_DEMO_TEMPLATE: Partial<GuitarShowcaseProfile> = {
  Type: "SuperStrat",
  Pickup: "H-S-S Korean",
  Bridge: "6-Screw Tremolo",
};

const GUITAR_PROFILES: Array<{
  match: RegExp;
  profile: GuitarShowcaseProfile;
}> = [
  {
    match: /stratocaster|\bstrat\b/i,
    profile: {
      Type: "Stratocaster",
      Body: "Alder",
      Neck: "Maple, Bolt-On",
      Fingerboard: "Maple / Pau Ferro",
      "Scale Length": '25.5"',
      Pickup: "3x Single-Coil",
      Controls: "1 Volume, 2 Tone",
      "Pickup Selector": "5-Way",
      Bridge: "2-Point Tremolo",
      "Tuners & Hardware": "Standard Cast/Sealed, Chrome",
    },
  },
  {
    match: /telecaster|\btele\b/i,
    profile: {
      Type: "Telecaster",
      Body: "Alder",
      Neck: "Maple, Bolt-On",
      Fingerboard: "Maple / Pau Ferro",
      "Scale Length": '25.5"',
      Pickup: "2x Single-Coil",
      Controls: "1 Volume, 1 Tone",
      "Pickup Selector": "3-Way",
      Bridge: "String-Through Hardtail",
      "Tuners & Hardware": "Standard Cast/Sealed, Chrome",
    },
  },
  {
    match: /les paul|\blp\b/i,
    profile: {
      Type: "Les Paul",
      Body: "Mahogany with Maple Top",
      Neck: "Mahogany, Set Neck",
      Fingerboard: "Rosewood, 22 Frets",
      "Scale Length": '24.75"',
      Pickup: "2x Humbucker",
      Controls: "2 Volume, 2 Tone",
      "Pickup Selector": "3-Way",
      Bridge: "Tune-O-Matic with Stop Bar",
      "Tuners & Hardware": "Grover-style, Chrome",
    },
  },
  {
    match: /\bsg\b|sg standard/i,
    profile: {
      Type: "SG",
      Body: "Mahogany",
      Neck: "Mahogany, Set Neck",
      Fingerboard: "Rosewood, 22 Frets",
      "Scale Length": '24.75"',
      Pickup: "2x Humbucker",
      Controls: "2 Volume, 2 Tone",
      "Pickup Selector": "3-Way",
      Bridge: "Tune-O-Matic with Stop Bar",
      "Tuners & Hardware": "Grover-style, Chrome",
    },
  },
  {
    match: /semi[-\s]?hollow|hollowbody|hollow body|es-335|artcore|streamliner/i,
    profile: {
      Type: "Semi-Hollow",
      Body: "Maple / Laminate Hollow",
      Neck: "Mahogany / Maple, Set Neck",
      Fingerboard: "Rosewood / Pau Ferro",
      "Scale Length": '24.75"',
      Pickup: "2x Humbucker",
      Controls: "2 Volume, 2 Tone",
      "Pickup Selector": "3-Way",
      Bridge: "Tune-O-Matic / Stoptail",
      "Tuners & Hardware": "Die-Cast, Chrome",
    },
  },
  {
    match: /acoustic|dreadnought|j-45|fg830|grand auditorium|auditorium|\bd-28\b|\bd28\b/i,
    profile: {
      Type: "Acoustic",
      Body: "Solid Spruce Top",
      Neck: "Mahogany / Maple",
      Fingerboard: "Rosewood / Ebony",
      "Scale Length": '25.5"',
      Pickup: "Optional Acoustic Pickup",
      Controls: "Onboard Preamp (if equipped)",
      "Pickup Selector": "N/A",
      Bridge: "Rosewood / Ebony Pin Bridge",
      "Tuners & Hardware": "Die-Cast Open Gear",
    },
  },
  {
    match: /rg550|superstrat|ibanez rg|\brg\b/i,
    profile: {
      Type: "SuperStrat",
      Body: "Basswood / Alder",
      Neck: "Maple, Bolt-On",
      Fingerboard: "Maple / Rosewood",
      "Scale Length": '25.5"',
      Pickup: "H-S-H",
      Controls: "1 Volume, 1 Tone, Coil-Split",
      "Pickup Selector": "5-Way",
      Bridge: "Floyd Rose / Tremolo",
      "Tuners & Hardware": "Locking Tuners, Chrome",
    },
  },
  {
    match: /prs|\bcustom 24\b/i,
    profile: {
      Type: "Double Cutaway Solid Body",
      Body: "Mahogany with Maple Top",
      Neck: "Maple, Set Neck",
      Fingerboard: "Rosewood / Ebony",
      "Scale Length": '25"',
      Pickup: "2x Humbucker",
      Controls: "2 Volume, 1 Tone, Push-Pull",
      "Pickup Selector": "3-Way",
      Bridge: "PRS Tremolo / Stoptail",
      "Tuners & Hardware": "PRS Designed, Nickel",
    },
  },
];

const GENERIC_ELECTRIC_PROFILE: GuitarShowcaseProfile = {
  Type: "Electric Guitar",
  Body: "Solid Body",
  Neck: "Bolt-On / Set Neck",
  Fingerboard: "Rosewood / Maple",
  "Scale Length": '25.5"',
  Pickup: "Varies by Model",
  Controls: "Volume / Tone",
  "Pickup Selector": "3-Way / 5-Way",
  Bridge: "Fixed / Tremolo",
  "Tuners & Hardware": "Die-Cast, Chrome",
};

function normalizeLabel(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function findSpecValue(
  specs: ProductSpec[],
  canonicalLabel: string
): string | null {
  const aliases = new Set([
    normalizeLabel(canonicalLabel),
    ...(LABEL_ALIASES[canonicalLabel] ?? []).map(normalizeLabel),
  ]);

  for (const spec of specs) {
    const label = normalizeLabel(spec.label);
    if (!aliases.has(label)) continue;
    const value = spec.value.trim();
    if (value) return value;
  }

  return null;
}

function profileToSpecs(profile: GuitarShowcaseProfile): ProductSpec[] {
  return GUITAR_SHOWCASE_FIELD_LABELS.map((label) => ({
    label,
    value: profile[label as keyof GuitarShowcaseProfile],
  }));
}

export function inferGuitarProfile(
  productName: string,
  brand = ""
): GuitarShowcaseProfile {
  const haystack = `${brand} ${productName}`.trim();
  for (const entry of GUITAR_PROFILES) {
    if (entry.match.test(haystack)) return entry.profile;
  }
  return GENERIC_ELECTRIC_PROFILE;
}

function isSeedDemoTemplate(specs: ProductSpec[]): boolean {
  const type = findSpecValue(specs, "Type");
  const pickup = findSpecValue(specs, "Pickup");
  const bridge = findSpecValue(specs, "Bridge");
  return (
    type === SEED_DEMO_TEMPLATE.Type &&
    pickup === SEED_DEMO_TEMPLATE.Pickup &&
    bridge === SEED_DEMO_TEMPLATE.Bridge
  );
}

function hasShowcaseSpecValue(
  specs: ProductSpec[],
  label: keyof GuitarShowcaseProfile
): boolean {
  const value = findSpecValue(specs, label);
  return Boolean(value && value !== GUITAR_SHOWCASE_PLACEHOLDER);
}

export function resolveGuitarShowcaseSpecs(
  productName: string,
  brand: string,
  specs: ProductSpec[]
): ProductSpec[] {
  const inferred = inferGuitarProfile(productName, brand);
  const useInferredBase =
    isSeedDemoTemplate(specs) ||
    !GUITAR_SHOWCASE_FIELD_LABELS.some((label) =>
      hasShowcaseSpecValue(specs, label as keyof GuitarShowcaseProfile)
    );

  const merged = new Map<string, string>();

  if (useInferredBase) {
    for (const spec of profileToSpecs(inferred)) {
      merged.set(spec.label, spec.value);
    }
  }

  const skipExplicitShowcaseSpecs =
    useInferredBase && isSeedDemoTemplate(specs);

  for (const spec of specs) {
    const label = spec.label.trim();
    const value = spec.value.trim();
    if (!value) continue;
    if (GUITAR_SHOWCASE_FIELD_LABELS.includes(label)) {
      if (skipExplicitShowcaseSpecs) continue;
      merged.set(label, value);
      continue;
    }
  }

  for (const label of GUITAR_SHOWCASE_FIELD_LABELS) {
    if (merged.has(label)) continue;
    const inferredValue = inferred[label as keyof GuitarShowcaseProfile];
    if (inferredValue) merged.set(label, inferredValue);
  }

  return GUITAR_SHOWCASE_FIELD_LABELS.map((label) => ({
    label,
    value: merged.get(label) ?? GUITAR_SHOWCASE_PLACEHOLDER,
  }));
}

export function enrichGuitarSpecifications(
  productName: string,
  brand: string,
  specifications: Record<string, string>
): Record<string, string> {
  const specs = resolveGuitarShowcaseSpecs(
    productName,
    brand,
    Object.entries(specifications).map(([label, value]) => ({ label, value }))
  );

  const enriched = { ...specifications };
  for (const spec of specs) {
    if (spec.value === GUITAR_SHOWCASE_PLACEHOLDER) continue;
    enriched[spec.label] = spec.value;
  }
  return enriched;
}

export function buildGuitarShowcaseRows(
  specs: ProductSpec[],
  options?: { productName?: string; brand?: string }
): GuitarShowcaseRow[] {
  const resolved =
    options?.productName != null
      ? resolveGuitarShowcaseSpecs(options.productName, options.brand ?? "", specs)
      : specs;

  return GUITAR_SHOWCASE_ROW_LABELS.map(({ left, right }) => ({
    left: {
      label: left,
      value: findSpecValue(resolved, left) ?? GUITAR_SHOWCASE_PLACEHOLDER,
    },
    right: {
      label: right,
      value: findSpecValue(resolved, right) ?? GUITAR_SHOWCASE_PLACEHOLDER,
    },
  }));
}

export function isGuitarProduct(categorySlug: string, category: string): boolean {
  const slug = categorySlug.toLowerCase();
  const name = category.toLowerCase();
  return slug === "guitars" || slug === "guitar" || name === "guitars";
}
