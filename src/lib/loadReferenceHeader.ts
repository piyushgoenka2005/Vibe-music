const HEADER_SCRIPT_SRC =
  "https://assets.sweetwater.com/dist/templates/header.js";

let loadPromise: Promise<void> | null = null;

/** Load the Sweetwater reference header.js (mega menu, flyouts, mobile nav). */
export function loadReferenceHeaderScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-reference-header-js]"
    );
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("header.js failed"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = HEADER_SCRIPT_SRC;
    script.async = true;
    script.setAttribute("data-reference-header-js", "true");
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("header.js failed to load"));
    document.body.appendChild(script);
  });

  return loadPromise;
}
