/**
 * GP-9 3D model availability — GLB is optional; procedural showroom is the default.
 *
 * Drop a Draco or standard GLB at `public/models/gp9-grand.glb`.
 * Name key meshes `key_21`…`key_108` (MIDI) or `key_A0` / `key_Cs4` (note names).
 *
 * Env:
 * - NEXT_PUBLIC_GP9_GLB=1|true  → always try GLB
 * - NEXT_PUBLIC_GP9_GLB=0|false → always procedural
 * - unset / auto               → HEAD-probe the public GLB path
 */

export const GP9_GRAND_GLB_PATH = "/models/gp9-grand.glb";

export type Gp9GlbMode = "on" | "off" | "auto";

export function resolveGp9GlbMode(
  raw: string | undefined = process.env.NEXT_PUBLIC_GP9_GLB
): Gp9GlbMode {
  const value = raw?.trim().toLowerCase();
  if (value === "1" || value === "true" || value === "on") return "on";
  if (value === "0" || value === "false" || value === "off") return "off";
  return "auto";
}

/** Client-side HEAD check — does not download the full GLB. */
export async function probeGp9GlbAvailable(
  path: string = GP9_GRAND_GLB_PATH
): Promise<boolean> {
  try {
    const response = await fetch(path, {
      method: "HEAD",
      cache: "no-store",
    });
    if (response.ok) return true;
    // Some hosts reject HEAD — fall back to a ranged GET.
    if (response.status === 405 || response.status === 501) {
      const get = await fetch(path, {
        method: "GET",
        headers: { Range: "bytes=0-0" },
        cache: "no-store",
      });
      return get.ok || get.status === 206;
    }
    return false;
  } catch {
    return false;
  }
}
