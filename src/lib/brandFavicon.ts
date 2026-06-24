import { readFile } from "node:fs/promises";
import path from "node:path";

let cachedLogoDataUrl: string | null = null;

export async function getBrandLogoDataUrl(): Promise<string> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;

  const logoPath = path.join(process.cwd(), "public/logo.jpeg");
  const data = await readFile(logoPath);
  cachedLogoDataUrl = `data:image/jpeg;base64,${data.toString("base64")}`;
  return cachedLogoDataUrl;
}
