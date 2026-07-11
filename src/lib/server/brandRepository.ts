import "server-only";

import { prisma } from "@/lib/db/prisma";
import { loadBrands, saveBrands } from "@/lib/server/catalogRepository";
import { invalidateCatalogCache } from "@/lib/server/firestoreCatalogRepository";
import { brandToPrisma, prismaToBrand } from "@/lib/server/prisma/mappers";
import { slugify } from "@/lib/slug";
import type { Brand } from "@/types/brand";

async function syncBrandsJson(brands: Brand[]): Promise<void> {
  saveBrands([...brands].sort((a, b) => a.name.localeCompare(b.name)));
  invalidateCatalogCache();
}

async function seedBrandsFromStatic(): Promise<Brand[]> {
  const brands = await loadBrands();
  if (brands.length === 0) return [];

  await prisma.$transaction(
    brands.map((brand) =>
      prisma.brand.upsert({
        where: { id: brand.id },
        create: brandToPrisma(brand),
        update: brandToPrisma(brand),
      })
    )
  );
  return brands;
}

export async function listBrands(): Promise<Brand[]> {
  const rows = await prisma.brand.findMany({ orderBy: { name: "asc" } });
  if (rows.length === 0) {
    return seedBrandsFromStatic();
  }
  return rows.map(prismaToBrand);
}

export async function getBrandById(id: string): Promise<Brand | null> {
  const row = await prisma.brand.findUnique({ where: { id } });
  return row ? prismaToBrand(row) : null;
}

export async function createBrand(input: {
  name: string;
  slug?: string;
}): Promise<Brand> {
  const slug = (input.slug?.trim() || slugify(input.name)).toLowerCase();
  const record: Brand = {
    id: slug,
    name: input.name.trim(),
    slug,
  };
  await prisma.brand.create({ data: brandToPrisma(record) });
  await syncBrandsJson(await listBrands());
  return record;
}

export async function updateBrand(
  id: string,
  patch: Partial<Pick<Brand, "name" | "slug">>
): Promise<Brand> {
  const existing = await getBrandById(id);
  if (!existing) throw new Error("Brand not found");

  const nextSlug = patch.slug?.trim() || existing.slug;
  const nextName = patch.name?.trim() || existing.name;
  const record: Brand = { id, name: nextName, slug: nextSlug };

  if (nextSlug !== id) {
    await prisma.$transaction([
      prisma.brand.create({ data: brandToPrisma({ ...record, id: nextSlug }) }),
      prisma.brand.delete({ where: { id } }),
    ]);
  } else {
    await prisma.brand.update({
      where: { id },
      data: brandToPrisma(record),
    });
  }

  await syncBrandsJson(await listBrands());
  return record;
}

export async function deleteBrand(id: string): Promise<void> {
  await prisma.brand.delete({ where: { id } });
  await syncBrandsJson(await listBrands());
}
