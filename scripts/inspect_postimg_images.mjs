import crypto from "node:crypto";

async function main() {
  const res = await fetch("https://vibemusic.in/api/products?limit=200");
  const data = await res.json();
  const products = data.products || data;

  const affected = [];
  for (const p of products) {
    const rawImages = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
    const postimg = rawImages.filter(img => typeof img === "string" && img.includes("postimg.cc"));
    if (postimg.length > 0) {
      affected.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category || p.categoryId,
        categorySlug: p.categorySlug || p.categoryId,
        postimgUrls: postimg,
        allImages: rawImages,
      });
    }
  }

  console.log(`=== FOUND ${affected.length} PRODUCTS WITH postimg.cc IMAGES ===\n`);

  let successCount = 0;
  let failCount = 0;
  const verifiedList = [];

  for (const item of affected) {
    console.log(`Product: [${item.id}] "${item.name}"`);
    console.log(`  Slug: ${item.slug}`);
    console.log(`  Category: ${item.category} (slug: ${item.categorySlug})`);

    for (const url of item.postimgUrls) {
      try {
        const headRes = await fetch(url, { method: "GET", headers: { "User-Agent": "Mozilla/5.0" } });
        const contentType = headRes.headers.get("content-type");
        const contentLength = headRes.headers.get("content-length");
        const status = headRes.status;

        if (status === 200) {
          successCount++;
          console.log(`  [200 OK] ${url} (${contentType}, ${contentLength} bytes)`);
          verifiedList.push({
            productId: item.id,
            productName: item.name,
            productSlug: item.slug,
            categorySlug: item.categorySlug,
            url,
            contentType,
            contentLength: Number(contentLength || 0),
          });
        } else {
          failCount++;
          console.log(`  [FAIL ${status}] ${url}`);
        }
      } catch (err) {
        failCount++;
        console.log(`  [ERROR] ${url}: ${err.message}`);
      }
    }
    console.log("");
  }

  console.log(`\nURL Verification Summary:`);
  console.log(`  Working URLs (200 OK): ${successCount}`);
  console.log(`  Failed URLs: ${failCount}`);
}

main().catch(console.error);
