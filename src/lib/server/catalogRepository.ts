import fs from "fs";
import path from "path";
import type { Brand } from "@/types/brand";
import type { CatalogProduct } from "@/types/catalog";
import type { Category } from "@/types/category";

const CATALOG_DIR = path.join(process.cwd(), "src", "data", "catalog");
const PRODUCTS_PATH = path.join(CATALOG_DIR, "products.json");
const CATEGORIES_PATH = path.join(CATALOG_DIR, "categories.json");
const BRANDS_PATH = path.join(CATALOG_DIR, "brands.json");

let productsCache: CatalogProduct[] | null = null;
let productsMtime = 0;
let categoriesCache: Category[] | null = null;
let categoriesMtime = 0;
let brandsCache: Brand[] | null = null;
let brandsMtime = 0;

function invalidateProductsCache() {
  productsCache = null;
  productsMtime = 0;
}

function readProductsRaw(): CatalogProduct[] {
  const stat = fs.statSync(PRODUCTS_PATH);
  if (productsCache && stat.mtimeMs === productsMtime) {
    return productsCache;
  }
  const raw = fs.readFileSync(PRODUCTS_PATH, "utf8");
  productsCache = JSON.parse(raw) as CatalogProduct[];
  productsMtime = stat.mtimeMs;
  return productsCache;
}

function writeProductsRaw(products: CatalogProduct[]): void {
  fs.mkdirSync(CATALOG_DIR, { recursive: true });
  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2) + "\n", "utf8");
  productsCache = products;
  productsMtime = fs.statSync(PRODUCTS_PATH).mtimeMs;
}

function readCategoriesRaw(): Category[] {
  const stat = fs.statSync(CATEGORIES_PATH);
  if (categoriesCache && stat.mtimeMs === categoriesMtime) {
    return categoriesCache;
  }
  const raw = fs.readFileSync(CATEGORIES_PATH, "utf8");
  categoriesCache = JSON.parse(raw) as Category[];
  categoriesMtime = stat.mtimeMs;
  return categoriesCache;
}

export function loadProducts(): CatalogProduct[] {
  return readProductsRaw();
}

export function saveProducts(products: CatalogProduct[]): void {
  writeProductsRaw(products);
  invalidateProductsCache();
}

export function loadCategories(): Category[] {
  return readCategoriesRaw();
}

function readBrandsRaw(): Brand[] {
  const stat = fs.statSync(BRANDS_PATH);
  if (brandsCache && stat.mtimeMs === brandsMtime) {
    return brandsCache;
  }
  const raw = fs.readFileSync(BRANDS_PATH, "utf8");
  brandsCache = JSON.parse(raw) as Brand[];
  brandsMtime = stat.mtimeMs;
  return brandsCache;
}

export function loadBrands(): Brand[] {
  return readBrandsRaw();
}

export const catalogPaths = {
  products: PRODUCTS_PATH,
  categories: CATEGORIES_PATH,
  brands: BRANDS_PATH,
};
