export interface ShareProductOptions {
  title: string;
  url: string;
  text?: string;
}

export type ShareProductResult = "shared" | "copied" | "cancelled" | "failed";

export function getAbsoluteShareUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (typeof window === "undefined") {
    return url;
  }

  const path = url.startsWith("/") ? url : `/${url}`;
  return `${window.location.origin}${path}`;
}

export async function shareProduct(
  options: ShareProductOptions
): Promise<ShareProductResult> {
  const absoluteUrl = getAbsoluteShareUrl(options.url);
  const shareData = {
    title: options.title,
    text: options.text ?? options.title,
    url: absoluteUrl,
  };

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(shareData);
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      return "copied";
    } catch {
      return "failed";
    }
  }

  return "failed";
}
