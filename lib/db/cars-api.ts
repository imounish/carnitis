import { createCarInputSchema, updateCarInputSchema } from "./validation";
import {
  getUserSafeErrorMessage,
  normalizeDataAccessError,
} from "./errors";
import {
  getCarNotFoundErrorPayload,
  getEmptyCarsUpdatePayloadErrorPayload,
  getInvalidCarsPayloadErrorPayload,
  getUnauthorizedCarsErrorPayload,
  type CarsApiErrorPayload,
} from "./cars-api-payloads";

export function parseCreateCarPayload(payload: unknown) {
  return createCarInputSchema.safeParse(payload);
}

export function parseUpdateCarPayload(payload: unknown) {
  return updateCarInputSchema.safeParse(payload);
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

export {
  getUnauthorizedCarsErrorPayload,
  getInvalidCarsPayloadErrorPayload,
  getEmptyCarsUpdatePayloadErrorPayload,
  getCarNotFoundErrorPayload,
};
