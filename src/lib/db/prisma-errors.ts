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

export function isPrismaUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return "code" in error && error.code === "P2002";
}

export function isPrismaNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return "code" in error && error.code === "P2025";
}

export function isPrismaForeignKeyError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  return code === "P2003" || code === "P2014";
}

export function getPrismaErrorMessage(error: unknown): { message: string; status: number } | null {
  if (!error || typeof error !== "object") return null;

  if (isPrismaUniqueConstraintError(error)) {
    const meta =
      "meta" in error && typeof error.meta === "object" && error.meta !== null
        ? error.meta
        : undefined;
    const target = meta && "target" in meta ? String(meta.target) : "";
    const fieldMsg = target ? ` (${target})` : "";
    return {
      message: `A record with this unique value${fieldMsg} already exists. Please choose a different value.`,
      status: 409,
    };
  }

  if (isPrismaNotFoundError(error)) {
    return {
      message: "The requested record was not found or has already been deleted.",
      status: 404,
    };
  }

  if (isPrismaForeignKeyError(error)) {
    return {
      message:
        "Cannot complete operation: this item is referenced by other records or has active dependencies.",
      status: 400,
    };
  }

  if (isPrismaUnavailableError(error)) {
    return {
      message: SERVICE_UNAVAILABLE_MESSAGE,
      status: 503,
    };
  }

  return null;
}
