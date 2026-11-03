import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdmin("homepage:write", request);
    const { url } = (await request.json()) as { url?: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const trimmed = url.trim();

    // Match reel or post code: /reel/{code} or /p/{code}
    const reelMatch = trimmed.match(
      /instagram\.com\/(?:[a-zA-Z0-9._-]+\/)?(reel|p)\/([A-Za-z0-9_-]+)/i,
    );
    // Match handle if in URL format: instagram.com/{handle}/reel/{code}
    const handleMatch = trimmed.match(/instagram\.com\/([a-zA-Z0-9._]+)\/(?:reel|p)\//i);

    const reelCode = reelMatch ? reelMatch[2] : null;
    const kind = reelMatch ? reelMatch[1].toLowerCase() : "reel";
    let handle =
      handleMatch && !["p", "reel", "stories", "tv"].includes(handleMatch[1].toLowerCase())
        ? `@${handleMatch[1]}`
        : "@vibemusicindia";

    const cleanUrl = reelCode
      ? `https://www.instagram.com/${kind}/${reelCode}/`
      : trimmed.split("?")[0].replace(/\/+$/, "") + "/";

    let title = "";
    let posterUrl = "";

    // Attempt to scrape OpenGraph metadata using social bot User-Agent
    if (reelCode) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(cleanUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
            Accept: "text/html,application/xhtml+xml",
          },
        });
        clearTimeout(timeout);

        if (res.ok) {
          const html = await res.text();

          const ogTitleMatch =
            html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i) ||
            html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:title["']/i);
          if (ogTitleMatch && ogTitleMatch[1]) {
            title = ogTitleMatch[1].replace(/\s*\|\s*Instagram$/i, "").trim();
            // Check if title has handle format e.g. "Name (@handle) on Instagram"
            const titleHandleMatch = title.match(/\(@([a-zA-Z0-9._]+)\)/);
            if (titleHandleMatch && titleHandleMatch[1]) {
              handle = `@${titleHandleMatch[1]}`;
            }
          }

          const ogImageMatch =
            html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i) ||
            html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);
          if (ogImageMatch && ogImageMatch[1]) {
            posterUrl = ogImageMatch[1].replace(/&amp;/g, "&");
          }
        }
      } catch {
        // Social crawler fallback failed or timed out — non-fatal
      }
    }

    return NextResponse.json({
      cleanUrl,
      handle,
      reelCode,
      title: title || (reelCode ? `Reel ${reelCode}` : ""),
      posterUrl,
    });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}
