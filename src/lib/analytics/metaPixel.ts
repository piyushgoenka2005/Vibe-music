/** Meta (Facebook) Pixel ID — numeric string from Events Manager. */
export function getMetaPixelId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  if (!id) return undefined;
  if (!/^\d{5,20}$/.test(id)) return undefined;
  return id;
}

export function isMetaPixelConfigured(): boolean {
  return Boolean(getMetaPixelId());
}
