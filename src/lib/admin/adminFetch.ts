/** Shared admin client fetch helpers — surface API error messages in the UI. */

export async function readAdminApiError(res: Response): Promise<string> {
  try {
    const body = (await res.clone().json()) as { error?: string; message?: string };
    const detail = body.error ?? body.message;
    if (detail) return detail;
  } catch {
    /* non-JSON body */
  }
  return `Request failed (${res.status})`;
}

export async function adminFetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw new Error(await readAdminApiError(res));
  }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
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
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
