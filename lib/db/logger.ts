import { normalizeDataAccessError } from "@/lib/db/errors";

interface LogContext {
  operation: string;
  entity: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

const REDACTED_KEYS = new Set([
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "email",
]);

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    return sanitizeMetadata(value as Record<string, unknown>);
  }

  return value;
}

function sanitizeMetadata(
  metadata: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!metadata) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      REDACTED_KEYS.has(key) ? "[redacted]" : sanitizeValue(value),
    ])
  );
}

export function logDataAccessError(context: LogContext, error: unknown) {
  const normalized = normalizeDataAccessError(
    error,
    `Failed to ${context.operation} ${context.entity}.`
  );

  console.error("[db]", {
    operation: context.operation,
    entity: context.entity,
    userId: context.userId ?? "unknown",
    code: normalized.code,
    message: normalized.message,
    metadata: sanitizeMetadata(context.metadata),
  });

  return normalized;
}
