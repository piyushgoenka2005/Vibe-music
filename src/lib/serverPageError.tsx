import { unstable_rethrow } from "next/navigation";

/**
 * Wrap a server page component's async body with error handling.
 * If the body throws, renders ServerPageErrorFallback instead of crashing.
 *
 * Usage in server pages:
 *   import { withServerPageError } from "@/lib/serverPageError";
 *
 *   export default async function MyPage() {
 *     return withServerPageError(async () => {
 *       const data = await fetchData();
 *       return <MyComponent data={data} />;
 *     }, "My Page");
 *   }
 */
export async function withServerPageError<TRender>(
  fn: () => Promise<TRender>,
  pageName?: string,
): Promise<TRender> {
  try {
    return await fn();
  } catch (error) {
    unstable_rethrow(error);
    if (
      typeof error === "object" &&
      error !== null &&
      (("digest" in error &&
        typeof (error as { digest?: unknown }).digest === "string" &&
        (error as { digest: string }).digest.startsWith("NEXT_")) ||
        ("message" in error &&
          typeof (error as { message?: unknown }).message === "string" &&
          (error as { message: string }).message.startsWith("NEXT_")))
    ) {
      throw error;
    }
    console.error(`[server-page] ${pageName ?? "Page"} render error:`, error);
    // Dynamic import so the client component is only loaded on error.
    const { default: ServerPageErrorFallback } =
      await import("@/components/common/ServerPageErrorFallback");
    return (<ServerPageErrorFallback error={error} pageName={pageName} />) as unknown as TRender;
  }
}
