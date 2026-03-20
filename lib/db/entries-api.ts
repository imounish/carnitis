import {
  getUserSafeErrorMessage,
  normalizeDataAccessError,
} from "./errors";
import {
  getInvalidEntriesPayloadErrorPayload,
  getUnauthorizedEntriesErrorPayload,
  type EntriesApiErrorPayload,
} from "./entries-api-payloads";
import { safeParseCreateEntryPayload } from "./entry-payload";

export function parseCreateEntryPayload(payload: unknown) {
  return safeParseCreateEntryPayload(payload);
}

export function getEntriesApiErrorPayload(error: unknown): {
  status: number;
  body: EntriesApiErrorPayload;
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
  getInvalidEntriesPayloadErrorPayload,
  getUnauthorizedEntriesErrorPayload,
};
