/**
 * Exercises admin create → edit → delete (or edit → revert) for every main admin
 * entity, and checks product edits reach the storefront immediately.
 *
 * Writes real data, so it refuses non-localhost targets unless ALLOW_REMOTE_WRITES=1.
 *
 * Usage:
 *   npm run seed:e2e-admin && npm run verify:admin-writes
 * Env: BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD (defaults: localhost + seeded E2E admin)
 */
const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const EMAIL = process.env.ADMIN_EMAIL ?? "e2e-admin@vibemusic.test";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "E2eAdminPassword!123456";

if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE_URL) && process.env.ALLOW_REMOTE_WRITES !== "1") {
  console.error(`Refusing to write to ${BASE_URL} (set ALLOW_REMOTE_WRITES=1 to override).`);
  process.exit(1);
}

const TAG = `smoke-${Date.now().toString(36)}`;
let cookie = "";
const results: Array<{ name: string; ok: boolean; detail?: string }> = [];

type Json = Record<string, unknown>;

async function api(method: string, path: string, body?: unknown): Promise<{ status: number; json: Json }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      cookie,
      Origin: BASE_URL,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: Json = {};
  try {
    json = text ? (JSON.parse(text) as Json) : {};
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json };
}

function expectOk(step: string, r: { status: number; json: Json }): Json {
  if (r.status < 200 || r.status >= 300) {
    throw new Error(`${step} → HTTP ${r.status}: ${String(r.json.error ?? r.json.raw ?? "")}`);
  }
  return r.json;
}

function pickId(json: Json, key: string): string {
  const entity = (json[key] ?? json) as Json;
  const id = entity.id ?? entity.slug;
  if (typeof id !== "string" || !id) throw new Error(`No id in response: ${JSON.stringify(json).slice(0, 200)}`);
  return id;
}

async function step(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, detail: error instanceof Error ? error.message : String(error) });
  }
}

async function login() {
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE_URL },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Admin login failed: HTTP ${res.status}`);
  cookie = res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

async function main() {
  await login();

  await step("categories: create/edit/list/delete", async () => {
    const created = expectOk("create", await api("POST", "/api/admin/categories", { name: `Cat ${TAG}`, slug: `cat-${TAG}` }));
    const id = pickId(created, "category");
    expectOk("edit", await api("PUT", `/api/admin/categories/${id}`, { name: `Cat ${TAG} edited` }));
    const list = expectOk("list", await api("GET", "/api/admin/categories"));
    const found = (list.categories as Json[]).find((c) => c.id === id);
    if (found?.name !== `Cat ${TAG} edited`) throw new Error("edited name not in list");
    expectOk("delete", await api("DELETE", `/api/admin/categories/${id}`));
  });

  await step("brands: create/edit/delete", async () => {
    const created = expectOk("create", await api("POST", "/api/admin/brands", { name: `Brand ${TAG}` }));
    const id = pickId(created, "brand");
    expectOk("edit", await api("PUT", `/api/admin/brands/${id}`, { name: `Brand ${TAG} edited` }));
    expectOk("delete", await api("DELETE", `/api/admin/brands/${id}`));
  });

  await step("coupons: create/deactivate/delete", async () => {
    const code = `SMK${Date.now().toString(36).slice(-6)}`.toUpperCase();
    const created = expectOk(
      "create",
      await api("POST", "/api/admin/coupons", { code, label: "Smoke test", type: "percentage", value: 5, isActive: true }),
    );
    const id = pickId(created, "coupon");
    expectOk("deactivate", await api("PATCH", `/api/admin/coupons/${id}`, { isActive: false }));
    expectOk("delete", await api("DELETE", `/api/admin/coupons/${id}`));
  });

  await step("banners: create/edit/delete", async () => {
    const created = expectOk(
      "create",
      await api("POST", "/api/admin/banners", {
        title: `Banner ${TAG}`,
        image: "https://cdn.vibemusic.in/banners/smoke.webp",
        ctaLink: "/search",
        status: "inactive",
      }),
    );
    const id = pickId(created, "banner");
    expectOk(
      "edit",
      await api("PUT", `/api/admin/banners/${id}`, {
        title: `Banner ${TAG} edited`,
        image: "https://cdn.vibemusic.in/banners/smoke.webp",
        ctaLink: "/search",
        status: "inactive",
      }),
    );
    expectOk("delete", await api("DELETE", `/api/admin/banners/${id}`));
  });

  await step("blog: create/edit/delete", async () => {
    const created = expectOk(
      "create",
      await api("POST", "/api/admin/blog", { title: `Post ${TAG}`, slug: `post-${TAG}`, content: "<p>Smoke</p>", status: "draft" }),
    );
    const id = pickId(created, "post");
    expectOk("edit", await api("PUT", `/api/admin/blog/${id}`, { title: `Post ${TAG} edited` }));
    expectOk("delete", await api("DELETE", `/api/admin/blog/${id}`));
  });

  await step("cms pages: create/edit/delete", async () => {
    const slug = `page-${TAG}`;
    const page = { slug, title: `Page ${TAG}`, eyebrow: "Smoke", sections: [{ paragraphs: ["Smoke test."] }] };
    expectOk("create", await api("POST", "/api/admin/cms/pages", page));
    expectOk("edit", await api("PUT", `/api/admin/cms/pages/${slug}`, { ...page, title: `Page ${TAG} edited` }));
    const read = expectOk("read", await api("GET", `/api/admin/cms/pages/${slug}`));
    if ((read.page as Json)?.title !== `Page ${TAG} edited`) throw new Error("edited title not returned");
    expectOk("delete", await api("DELETE", `/api/admin/cms/pages/${slug}`));
  });

  await step("shipping zones: create/edit/delete", async () => {
    const created = expectOk(
      "create",
      await api("POST", "/api/admin/shipping-zones", { name: `Zone ${TAG}`, states: [], pinCodePrefixes: ["999"], methodCharges: { standard: 50 }, isActive: false }),
    );
    const id = pickId(created, "zone");
    expectOk(
      "edit",
      await api("PUT", `/api/admin/shipping-zones/${id}`, { name: `Zone ${TAG} edited`, states: [], pinCodePrefixes: ["999"], methodCharges: { standard: 60 }, isActive: false }),
    );
    expectOk("delete", await api("DELETE", `/api/admin/shipping-zones/${id}`));
  });

  await step("settings: save unchanged", async () => {
    const current = expectOk("read", await api("GET", "/api/admin/settings"));
    const settings = (current.settings ?? current) as Json;
    expectOk("save", await api("PUT", "/api/admin/settings", { storeName: settings.storeName ?? "Vibe Music" }));
  });

  await step("homepage: edit section + revert", async () => {
    const hp = expectOk("read", await api("GET", "/api/admin/homepage"));
    const section = (hp.sections as Json[])[0];
    if (!section) throw new Error("no homepage sections");
    const key = String(section.key ?? section.sectionKey);
    const title = String(section.title);
    expectOk("edit", await api("PUT", `/api/admin/homepage/sections/${key}`, { title: `${title} ${TAG}` }));
    expectOk("revert", await api("PUT", `/api/admin/homepage/sections/${key}`, { title }));
  });

  await step("products: edit name → storefront shows it → revert", async () => {
    const list = expectOk("list", await api("GET", "/api/admin/products?limit=1&status=active"));
    const first = (list.products as Json[])[0];
    if (!first) throw new Error("no products");
    const id = String(first.id);
    const detail = expectOk("read", await api("GET", `/api/admin/products/${id}`));
    const product = (detail.product ?? detail) as Json;
    const originalName = String(product.name);
    const edited = `${originalName} ${TAG}`;
    try {
      expectOk("edit", await api("PUT", `/api/admin/products/${id}`, { ...product, name: edited }));
      // Cache invalidation runs in after(); give it a beat, then the very next render must be fresh.
      await new Promise((r) => setTimeout(r, 750));
      const html = await (await fetch(`${BASE_URL}/product/${String(product.slug)}`)).text();
      if (!html.includes(TAG)) throw new Error("storefront product page still shows the old name");
    } finally {
      expectOk("revert", await api("PUT", `/api/admin/products/${id}`, { ...product, name: originalName }));
    }
  });

  await step("inventory: adjust to same quantity", async () => {
    const list = expectOk("list", await api("GET", "/api/admin/products?limit=1&status=active"));
    const first = (list.products as Json[])[0] as Json;
    expectOk(
      "adjust",
      await api("POST", "/api/admin/inventory", {
        productId: first.id,
        newQuantity: Number(first.stockQuantity ?? 0),
        reason: `Smoke test ${TAG} (no change)`,
      }),
    );
  });

  for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${failed ? "FAIL" : "PASS"}: ${results.length - failed}/${results.length} admin write flows`);
  process.exit(failed ? 1 : 0);
}

void main();
