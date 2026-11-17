let upstashAuthFailed = false;

export function isUpstashAuthFailed(): boolean {
  return upstashAuthFailed;
}

export function markUpstashAuthFailed(): void {
  if (!upstashAuthFailed) {
    upstashAuthFailed = true;
    console.warn(
      "[upstash] Upstash Redis credentials unauthorized (401/403). Falling back to in-memory cache/rate-limiter.",
    );
  }
}

export function resetUpstashAuthState(): void {
  upstashAuthFailed = false;
}

export function getUpstashConfig(): { url: string; token: string } | null {
  if (upstashAuthFailed) return null;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

export async function upstashPipeline(
  commands: Array<[string, ...string[]]>,
): Promise<Array<{ result: unknown }>> {
  const config = getUpstashConfig();
  if (!config) {
    throw new Error("Upstash not configured");
  }

  const response = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
    signal: AbortSignal.timeout(300),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      markUpstashAuthFailed();
    }
    throw new Error(`Upstash request failed: ${response.status}`);
  }

  return (await response.json()) as Array<{ result: unknown }>;
}
