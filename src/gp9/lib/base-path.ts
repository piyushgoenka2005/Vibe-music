export const GP9_BASE = "/gp9";

export function gp9Path(path = ""): string {
  if (!path) return GP9_BASE;
  return path.startsWith("/") ? `${GP9_BASE}${path}` : `${GP9_BASE}/${path}`;
}
