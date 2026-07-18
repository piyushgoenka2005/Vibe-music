const SEO_NAME_SUFFIX =
  /,?\s*(?:for Musicians,?\s*)?Live Performance and Studio Applications\s*$/i;

/** Strip generic SEO suffixes from catalog product names. */
export function cleanProductName(name: string): string {
  return name.replace(SEO_NAME_SUFFIX, "").trim();
}
