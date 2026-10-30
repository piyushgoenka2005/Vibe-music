/** Shared admin client fetch helpers — surface API error messages in the UI safely without JSON parse crashes. */

export async function readAdminApiError(res: Response): Promise<string> {
  const status = res.status;
  if (status === 401 && typeof window !== "undefined") {
    try {
      sessionStorage.removeItem("vibe_admin_session");
      window.dispatchEvent(new CustomEvent("vibe:admin:unauthorized"));
    } catch {
      /* ignore */
    }
  }
  try {
    const text = await res.clone().text();
    const trimmed = text.trim();
    if (trimmed.startsWith("<") || trimmed.includes("<html") || trimmed.includes("<!DOCTYPE")) {
      if (status === 413 || text.includes("413") || text.includes("Request Entity Too Large")) {
        return "File is too large. Please upload an image under 10MB.";
      }
      if (
        status === 502 ||
        status === 504 ||
        text.includes("Bad Gateway") ||
        text.includes("Gateway Timeout")
      ) {
        return "Server is temporarily restarting or busy. Please try again in a few moments.";
      }
      if (
        status === 401 ||
        status === 403 ||
        text.includes("login") ||
        text.includes("Authentication")
      ) {
        return "Admin session expired or access denied. Please refresh or sign in again.";
      }
      if (status === 404) {
        return `Requested resource or API endpoint not found (${status}).`;
      }
      return `Server error (${status}). Please try again.`;
    }
    const body = JSON.parse(text) as { error?: string; message?: string };
    const detail = body.error ?? body.message;
    if (detail) return detail;
  } catch {
    /* non-JSON body */
  }
  return `Request failed (${status})`;
}

/**
 * Safely parses a fetch Response body as JSON.
 * If the server returned an HTML error page (413, 502, 504, 404, or redirect),
 * it returns a clean, human-readable error instead of throwing a SyntaxError.
 */
export async function safeReadApiResponse<T>(
  res: Response,
): Promise<{ ok: boolean; data?: T; error?: string }> {
  const status = res.status;
  let text = "";
  try {
    text = await res.text();
  } catch {
    return { ok: false, error: `Failed to read server response (${status})` };
  }

  const trimmed = text.trim();
  const isHtml =
    trimmed.startsWith("<") ||
    trimmed.includes("<html") ||
    trimmed.includes("<!DOCTYPE") ||
    (res.headers.get("content-type") || "").includes("text/html");

  if (status === 401 && typeof window !== "undefined") {
    try {
      sessionStorage.removeItem("vibe_admin_session");
      window.dispatchEvent(new CustomEvent("vibe:admin:unauthorized"));
    } catch {
      /* ignore */
    }
  }

  if (isHtml) {
    if (status === 413 || text.includes("413") || text.includes("Request Entity Too Large")) {
      return { ok: false, error: "File is too large. Please select an image under 10MB." };
    }
    if (
      status === 502 ||
      status === 504 ||
      text.includes("Bad Gateway") ||
      text.includes("Gateway Timeout")
    ) {
      return {
        ok: false,
        error: "Server is temporarily restarting. Please retry in a few seconds.",
      };
    }
    if (
      status === 401 ||
      status === 403 ||
      text.includes("login") ||
      text.includes("Authentication")
    ) {
      return {
        ok: false,
        error: "Admin session expired. Please refresh the page or log in again.",
      };
    }
    if (status === 404) {
      return { ok: false, error: "Requested resource or endpoint not found (404)." };
    }
    if (!res.ok) {
      return { ok: false, error: `Server error (${status}). Please try again.` };
    }
    return { ok: false, error: "Server returned an unexpected page instead of data." };
  }

  try {
    const json = JSON.parse(text) as T & { error?: string; message?: string };
    if (!res.ok) {
      return { ok: false, error: json.error || json.message || `Request failed (${status})` };
    }
    return { ok: true, data: json };
  } catch {
    if (!res.ok) {
      return { ok: false, error: `Server error (${status}). Please try again.` };
    }
    return { ok: false, error: `Invalid response format from server (${status})` };
  }
}

export async function adminFetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw new Error(await readAdminApiError(res));
  }
  const result = await safeReadApiResponse<T>(res);
  if (!result.ok || result.data === undefined) {
    throw new Error(result.error ?? "Failed to parse server response");
  }
  return result.data;
}

/** POST/PUT/PATCH/DELETE — throws with API error message on failure. */
export async function adminMutateJson<T = void>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw new Error(await readAdminApiError(res));
  }
  const result = await safeReadApiResponse<T>(res);
  if (!result.ok) {
    throw new Error(result.error ?? "Failed to parse server response");
  }
  return (result.data ?? undefined) as T;
}
