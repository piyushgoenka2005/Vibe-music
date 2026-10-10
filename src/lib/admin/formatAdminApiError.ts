export type AdminApiErrorBody = {
  error?: string;
  issues?: Array<{ path?: string; message?: string }>;
};

/** Turn admin API JSON errors (incl. Zod issues) into a single form message. */
export function formatAdminApiError(data: AdminApiErrorBody | null | undefined): string {
  if (!data) return "Save failed";
  if (Array.isArray(data.issues) && data.issues.length > 0) {
    return data.issues
      .map((issue) => {
        const field = issue.path?.trim() || "field";
        const message = issue.message?.trim() || "invalid";
        return `${field}: ${message}`;
      })
      .join(" · ");
  }
  return data.error?.trim() || "Save failed";
}
