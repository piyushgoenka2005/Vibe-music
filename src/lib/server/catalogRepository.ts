import fs from "fs";
import path from "path";
import type { CatalogProduct } from "@/types/catalog";
import type { Category } from "@/types/category";

const CATALOG_DIR = path.join(process.cwd(), "src", "data", "catalog");
const PRODUCTS_PATH = path.join(CATALOG_DIR, "products.json");
const CATEGORIES_PATH = path.join(CATALOG_DIR, "categories.json");

let productsCache: CatalogProduct[] | null = null;
let productsMtime = 0;
let categoriesCache: Category[] | null = null;
let categoriesMtime = 0;

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

export const catalogPaths = {
  products: PRODUCTS_PATH,
  categories: CATEGORIES_PATH,
};
