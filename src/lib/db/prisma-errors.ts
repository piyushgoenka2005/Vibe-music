export function isPrismaMissingTableError(error: unknown, tableName?: string): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  const message =
    "message" in error && typeof error.message === "string" ? error.message.toLowerCase() : "";

  if (code !== "P2021" && !message.includes("does not exist")) {
    return false;
  }

  if (!tableName) return true;
  const normalizedTable = tableName.toLowerCase();
  return message.includes(normalizedTable) || message.includes("catalog_taxonom");
}

export function isPrismaUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  const message =
    "message" in error && typeof error.message === "string" ? error.message.toLowerCase() : "";

  return (
    name.includes("PrismaClientInitializationError") ||
    code === "P1001" ||
    code === "P1002" ||
    message.includes("can't reach database") ||
    message.includes("database server")
  );
}

export const SERVICE_UNAVAILABLE_MESSAGE =
  "Service is temporarily unavailable. Please try again in a few minutes.";
