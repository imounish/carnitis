import { ZodError } from "zod";

export type DataAccessErrorCode =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "unsupported"
  | "unexpected";

export class DataAccessError extends Error {
  readonly code: DataAccessErrorCode;
  readonly status: number;
  readonly cause?: unknown;

  constructor(
    code: DataAccessErrorCode,
    message: string,
    options?: {
      cause?: unknown;
      status?: number;
    }
  ) {
    super(message);
    this.name = "DataAccessError";
    this.code = code;
    this.status = options?.status ?? getStatusForCode(code);
    this.cause = options?.cause;
  }
}

function getStatusForCode(code: DataAccessErrorCode): number {
  switch (code) {
    case "validation":
      return 400;
    case "unauthorized":
      return 401;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "conflict":
      return 409;
    case "unsupported":
      return 501;
    default:
      return 500;
  }
}

type PostgresLikeError = {
  code?: string;
  message?: string;
};

export function isDataAccessError(error: unknown): error is DataAccessError {
  return error instanceof DataAccessError;
}

export function normalizeDataAccessError(
  error: unknown,
  fallbackMessage = "Unexpected data access failure."
): DataAccessError {
  if (error instanceof DataAccessError) {
    return error;
  }

  if (error instanceof ZodError) {
    const details = error.issues
      .map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`)
      .join("; ");

    return new DataAccessError(
      "validation",
      details || "Invalid request payload.",
      { cause: error }
    );
  }

  const postgresError = error as PostgresLikeError;
  switch (postgresError?.code) {
    case "23505":
      return new DataAccessError("conflict", "A record with that value already exists.", {
        cause: error,
      });
    case "23503":
      return new DataAccessError(
        "validation",
        "A related record could not be found for this request.",
        { cause: error }
      );
    case "22P02":
      return new DataAccessError("validation", "One of the provided values is invalid.", {
        cause: error,
      });
    default:
      return new DataAccessError("unexpected", fallbackMessage, {
        cause: error,
      });
  }
}

export function getUserSafeErrorMessage(error: unknown): string {
  const normalized = normalizeDataAccessError(error);

  switch (normalized.code) {
    case "validation":
    case "conflict":
    case "unsupported":
      return normalized.message;
    case "unauthorized":
      return "You need to sign in again before continuing.";
    case "forbidden":
      return "You do not have access to that record.";
    case "not_found":
      return "That record could not be found.";
    default:
      return "Something went wrong while loading your data. Please try again.";
  }
}
