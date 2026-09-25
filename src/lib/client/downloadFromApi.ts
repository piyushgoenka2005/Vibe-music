/**
 * Trigger a same-origin file download without assigning window.location (eslint-safe).
 * Use for admin CSV/PDF exports served from /api/* routes.
 */
export function downloadFromApi(path: string): void {
  const url = new URL(path, window.location.origin);
  const anchor = document.createElement("a");
  anchor.href = url.toString();
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
