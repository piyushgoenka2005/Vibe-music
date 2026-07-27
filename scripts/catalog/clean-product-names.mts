/**
 * Remove ", for Musicians, Live Performance and Studio Applications" from catalog names.
 */
import fs from "node:fs";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";

const SUFFIX =
  /,?\s*(?:for Musicians,?\s*)?Live Performance and Studio Applications/gi;

function cleanName(value: string): string {
  return value.replace(SUFFIX, "").replace(/\s{2,}/g, " ").trim();
}

function walk<T>(value: T): T {
  if (typeof value === "string") return cleanName(value) as T;
  if (Array.isArray(value)) return value.map((item) => walk(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, walk(item)])
    ) as T;
  }
  return value;
}

const catalogPaths = [
  path.join(process.cwd(), "src", "data", "catalog", "products.json"),
];

for (const filePath of catalogPaths) {
  const products = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown[];
  const cleaned = walk(products);
  fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2) + "\n", "utf8");
  console.log("Wrote", filePath);
}

const prisma = new PrismaClient();
const rows = await prisma.product.findMany({
  select: { id: true, name: true, detail: true },
});

let dbUpdated = 0;
for (const row of rows) {
  const name = cleanName(row.name);
  const detail = row.detail ? walk(row.detail) : row.detail;
  if (name !== row.name || JSON.stringify(detail) !== JSON.stringify(row.detail)) {
    await prisma.product.update({
      where: { id: row.id },
      data: {
        name,
        detail:
          detail === null ? Prisma.JsonNull : (detail as Prisma.InputJsonValue),
      },
    });
    dbUpdated += 1;
  }
}

console.log("DB products updated:", dbUpdated);
await prisma.$disconnect();
