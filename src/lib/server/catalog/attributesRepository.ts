import "server-only";

export interface ProductAttribute {
  id: string;
  name: string;
  code: string;
  category: string;
  type: "select" | "multiselect" | "text" | "number" | "boolean";
  isFilterable: boolean;
  isRequired: boolean;
  values: string[];
  productCount: number;
  description?: string;
  updatedAt: string;
}

const DEFAULT_ATTRIBUTES: ProductAttribute[] = [
  {
    id: "attr-1",
    name: "Body Wood / Material",
    code: "body_material",
    category: "Guitars & Basses",
    type: "select",
    isFilterable: true,
    isRequired: true,
    values: ["Alder", "Mahogany", "Ash", "Basswood", "Poplar", "Maple Top / Mahogany Back"],
    productCount: 42,
    description: "Primary tonewood used for guitar or bass solidbody construction.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "attr-2",
    name: "Fretboard Wood",
    code: "fretboard_material",
    category: "Guitars & Basses",
    type: "select",
    isFilterable: true,
    isRequired: true,
    values: ["Rosewood", "Maple", "Ebony", "Indian Laurel", "Pau Ferro"],
    productCount: 40,
    description: "Fingerboard surface material impacting play feel and articulation.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "attr-3",
    name: "Pickup Configuration",
    code: "pickup_config",
    category: "Guitars & Basses",
    type: "select",
    isFilterable: true,
    isRequired: false,
    values: ["SSS", "HSS", "HH", "HSH", "Single Humbucker", "PJ Bass", "Single Coil"],
    productCount: 38,
    description: "Arrangement of single-coil and humbucking pickups.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "attr-4",
    name: "Number of Frets",
    code: "number_of_frets",
    category: "Guitars & Basses",
    type: "number",
    isFilterable: true,
    isRequired: false,
    values: ["21", "22", "24"],
    productCount: 35,
    description: "Total usable fret count along the fingerboard.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "attr-5",
    name: "Scale Length",
    code: "scale_length",
    category: "Guitars & Basses",
    type: "select",
    isFilterable: true,
    isRequired: false,
    values: ['24.75"', '25.5"', '26.5" (Baritone)', '34" (Standard Bass)', '35" (Extended Bass)'],
    productCount: 36,
    description: "Vibrating string distance from bridge saddle to nut.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "attr-6",
    name: "Number of Keys",
    code: "key_count",
    category: "Keyboards & Synthesizers",
    type: "select",
    isFilterable: true,
    isRequired: true,
    values: ["25 Keys", "37 Keys", "49 Keys", "61 Keys", "73 Keys", "88 Keys"],
    productCount: 28,
    description: "Physical key count on digital pianos, synths, and controllers.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "attr-7",
    name: "Keybed Action",
    code: "keybed_action",
    category: "Keyboards & Synthesizers",
    type: "select",
    isFilterable: true,
    isRequired: true,
    values: ["Synth-Action", "Semi-Weighted", "Graded Hammer Action", "Wooden Key Escapement"],
    productCount: 26,
    description: "Mechanism and tactile resistance of the keybed assembly.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "attr-8",
    name: "Synthesis Engine",
    code: "synth_engine",
    category: "Keyboards & Synthesizers",
    type: "multiselect",
    isFilterable: true,
    isRequired: false,
    values: [
      "Analog Modeling",
      "True Analog",
      "FM Synthesis",
      "Wavetable",
      "Sample-Based",
      "SuperNATURAL",
    ],
    productCount: 19,
    description: "Underlying sound generation architecture.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "attr-9",
    name: "Amplifier Output Power",
    code: "power_wattage",
    category: "Amps & Effects",
    type: "select",
    isFilterable: true,
    isRequired: true,
    values: [
      "5W - 15W (Bedroom/Studio)",
      "20W - 40W (Club)",
      "50W - 100W (Stage)",
      "100W+ (Stadium)",
    ],
    productCount: 22,
    description: "Continuous RMS audio output capability.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "attr-10",
    name: "Amplifier Technology",
    code: "amp_circuit",
    category: "Amps & Effects",
    type: "select",
    isFilterable: true,
    isRequired: false,
    values: [
      "All-Tube / Valve",
      "Solid State",
      "Digital Modeling",
      "Hybrid (Tube Preamp + Class D)",
    ],
    productCount: 24,
    description: "Amplification circuit topology.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "attr-11",
    name: "Microphone Transducer",
    code: "transducer_type",
    category: "Studio & Audio",
    type: "select",
    isFilterable: true,
    isRequired: true,
    values: ["Large Diaphragm Condenser", "Small Diaphragm Condenser", "Dynamic", "Ribbon"],
    productCount: 18,
    description: "Acoustic-to-electrical signal transducer method.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "attr-12",
    name: "Polar Pattern",
    code: "polar_pattern",
    category: "Studio & Audio",
    type: "multiselect",
    isFilterable: true,
    isRequired: false,
    values: [
      "Cardioid",
      "Supercardioid",
      "Omnidirectional",
      "Figure-8",
      "Switchable Multi-Pattern",
    ],
    productCount: 18,
    description: "Directional acoustic sensitivity field.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "attr-13",
    name: "Audio Connectivity",
    code: "connectivity",
    category: "Studio & Audio",
    type: "multiselect",
    isFilterable: true,
    isRequired: false,
    values: [
      "XLR 3-Pin",
      "USB-C",
      '1/4" Balanced TRS',
      "MIDI 5-Pin DIN",
      "Bluetooth 5.0",
      "Optical S/PDIF",
    ],
    productCount: 45,
    description: "Input and output connection options supported.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "attr-14",
    name: "Drum Configuration",
    code: "drum_shell_pack",
    category: "Drums & Percussion",
    type: "select",
    isFilterable: true,
    isRequired: false,
    values: ["3-Piece Shell Pack", "4-Piece Kit", "5-Piece Studio Kit", "Electronic Mesh Kit"],
    productCount: 14,
    description: "Piece count and pad/shell configuration for percussion gear.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "attr-15",
    name: "Finish / Color Scheme",
    code: "finish_color",
    category: "All",
    type: "select",
    isFilterable: true,
    isRequired: false,
    values: [
      "Sunburst",
      "Gloss Black",
      "Olympic White",
      "Candy Apple Red",
      "Natural Satin",
      "Silver Sparkle",
    ],
    productCount: 78,
    description: "Exterior aesthetic finish and colorway.",
    updatedAt: new Date().toISOString(),
  },
];

const g = globalThis as unknown as { __vibeAttributesState?: ProductAttribute[] };
g.__vibeAttributesState ??= [...DEFAULT_ATTRIBUTES];

function getAttributesState(): ProductAttribute[] {
  return (g.__vibeAttributesState ??= [...DEFAULT_ATTRIBUTES]);
}

export async function getProductAttributes(filters?: {
  search?: string;
  category?: string;
}): Promise<ProductAttribute[]> {
  let list = getAttributesState();

  if (filters?.category && filters.category !== "all" && filters.category !== "All") {
    list = list.filter(
      (a) => a.category.toLowerCase() === filters.category!.toLowerCase() || a.category === "All",
    );
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.values.some((v) => v.toLowerCase().includes(q)),
    );
  }

  return list;
}

export async function getProductAttributeById(id: string): Promise<ProductAttribute | null> {
  return getAttributesState().find((a) => a.id === id) ?? null;
}

export async function createProductAttribute(
  payload: Omit<ProductAttribute, "id" | "updatedAt" | "productCount">,
): Promise<ProductAttribute> {
  const newAttr: ProductAttribute = {
    ...payload,
    id: `attr-${Date.now()}`,
    productCount: 0,
    updatedAt: new Date().toISOString(),
  };
  getAttributesState().unshift(newAttr);
  return newAttr;
}

export async function updateProductAttribute(
  id: string,
  payload: Partial<Omit<ProductAttribute, "id" | "updatedAt">>,
): Promise<ProductAttribute | null> {
  const state = getAttributesState();
  const index = state.findIndex((a) => a.id === id);
  if (index === -1) return null;

  state[index] = {
    ...state[index],
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  return state[index];
}

export async function deleteProductAttribute(id: string): Promise<boolean> {
  const state = getAttributesState();
  const initialLength = state.length;
  g.__vibeAttributesState = state.filter((a) => a.id !== id);
  return g.__vibeAttributesState.length < initialLength;
}
