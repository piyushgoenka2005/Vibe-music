import "server-only";

import { randomUUID } from "crypto";
import { isPostgresConfigured, prisma } from "@/lib/db/prisma";
import { asJsonValue } from "@/lib/server/prisma/mappers";
import type { ShippingZone } from "@/types/shippingZone";

export const SHIPPING_ZONES_COLLECTION = "shippingZones";

const DEFAULT_ZONES: Omit<ShippingZone, "createdAt" | "updatedAt">[] = [
  {
    id: "metro",
    name: "Metro cities",
    description: "Delhi NCR, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata, Pune",
    states: ["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Telangana", "West Bengal"],
    pinCodePrefixes: ["11", "40", "56", "60", "50", "70", "41"],
    methodCharges: { standard: 0, express: 0, overnight: 0 },
    freeShippingThreshold: 0,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "rest-of-india",
    name: "Rest of India",
    description: "All other serviceable pin codes",
    states: [],
    pinCodePrefixes: [],
    methodCharges: { standard: 0, express: 0, overnight: 0 },
    freeShippingThreshold: 0,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "remote",
    name: "Remote & North-East",
    description: "J&K, Ladakh, Andaman, Lakshadweep, and select remote areas",
    states: ["Jammu and Kashmir", "Ladakh", "Andaman and Nicobar Islands", "Lakshadweep"],
    pinCodePrefixes: ["19", "74", "79", "68", "69"],
    methodCharges: { standard: 249, express: 399, overnight: 699 },
    isActive: true,
    sortOrder: 3,
  },
];

function mapShippingZone(row: {
  id: string;
  name: string;
  description: string | null;
  states: unknown;
  pinCodePrefixes: unknown;
  methodCharges: unknown;
  freeShippingThreshold: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}): ShippingZone {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    states: Array.isArray(row.states) ? row.states.map(String) : [],
    pinCodePrefixes: Array.isArray(row.pinCodePrefixes)
      ? row.pinCodePrefixes.map(String)
      : [],
    methodCharges:
      row.methodCharges && typeof row.methodCharges === "object"
        ? (row.methodCharges as ShippingZone["methodCharges"])
        : {},
    freeShippingThreshold:
      typeof row.freeShippingThreshold === "number"
        ? row.freeShippingThreshold
        : undefined,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function defaultZonesWithTimestamps(): ShippingZone[] {
  const now = new Date().toISOString();
  return DEFAULT_ZONES.map((zone) => ({ ...zone, createdAt: now, updatedAt: now }));
}

export async function listShippingZones(): Promise<ShippingZone[]> {
  if (!isPostgresConfigured()) {
    return defaultZonesWithTimestamps();
  }

  try {
    const rows = await prisma.shippingZone.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    if (rows.length === 0) return defaultZonesWithTimestamps();
    return rows.map(mapShippingZone);
  } catch {
    return defaultZonesWithTimestamps();
  }
}

export async function listAllShippingZones(): Promise<ShippingZone[]> {
  if (!isPostgresConfigured()) {
    return defaultZonesWithTimestamps();
  }

  const rows = await prisma.shippingZone.findMany({ orderBy: { sortOrder: "asc" } });
  if (rows.length === 0) return defaultZonesWithTimestamps();
  return rows.map(mapShippingZone);
}

export async function getShippingZoneById(id: string): Promise<ShippingZone | null> {
  const row = await prisma.shippingZone.findUnique({ where: { id } });
  if (!row) {
    const fallback = DEFAULT_ZONES.find((zone) => zone.id === id);
    if (!fallback) return null;
    const now = new Date().toISOString();
    return { ...fallback, createdAt: now, updatedAt: now };
  }
  return mapShippingZone(row);
}

export async function upsertShippingZone(
  zone: Omit<ShippingZone, "createdAt" | "updatedAt" | "id"> & { id?: string }
): Promise<ShippingZone> {
  const now = new Date().toISOString();
  const id = zone.id ?? randomUUID();
  const existing = zone.id
    ? await prisma.shippingZone.findUnique({ where: { id: zone.id } })
    : null;

  const record: ShippingZone = {
    id,
    name: zone.name,
    description: zone.description,
    states: zone.states,
    pinCodePrefixes: zone.pinCodePrefixes,
    methodCharges: zone.methodCharges,
    freeShippingThreshold: zone.freeShippingThreshold,
    isActive: zone.isActive,
    sortOrder: zone.sortOrder,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await prisma.shippingZone.upsert({
    where: { id },
    create: {
      id: record.id,
      name: record.name,
      description: record.description ?? null,
      states: asJsonValue(record.states),
      pinCodePrefixes: asJsonValue(record.pinCodePrefixes),
      methodCharges: asJsonValue(record.methodCharges),
      freeShippingThreshold: record.freeShippingThreshold ?? null,
      isActive: record.isActive,
      sortOrder: record.sortOrder,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    },
    update: {
      name: record.name,
      description: record.description ?? null,
      states: asJsonValue(record.states),
      pinCodePrefixes: asJsonValue(record.pinCodePrefixes),
      methodCharges: asJsonValue(record.methodCharges),
      freeShippingThreshold: record.freeShippingThreshold ?? null,
      isActive: record.isActive,
      sortOrder: record.sortOrder,
      updatedAt: record.updatedAt,
    },
  });

  return record;
}

export async function deleteShippingZone(id: string): Promise<void> {
  await prisma.shippingZone.delete({ where: { id } });
}
