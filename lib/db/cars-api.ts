import { createCarInputSchema } from "./validation";
import {
  getUserSafeErrorMessage,
  normalizeDataAccessError,
} from "./errors";

export interface CarsApiErrorPayload {
  error: {
    code: string;
    message: string;
  };
}

export function parseCreateCarPayload(payload: unknown) {
  return createCarInputSchema.safeParse(payload);
}

export function getCarsApiErrorPayload(error: unknown): {
  status: number;
  body: CarsApiErrorPayload;
} {
  const normalized = normalizeDataAccessError(error);

  return {
    status: normalized.status,
    body: {
      error: {
        code: normalized.code,
        message: getUserSafeErrorMessage(normalized),
      },
    },
  };
}

export function getUnauthorizedCarsErrorPayload() {
  return {
    status: 401,
    body: {
      error: {
        code: "unauthorized",
        message: "You need to sign in first.",
      },
    },
  };
}

export function getInvalidCarsPayloadErrorPayload() {
  return {
    status: 400,
    body: {
      error: {
        code: "validation",
        message: "Invalid car payload.",
      },
    },
  };
}
