export interface EntriesApiErrorPayload {
  error: {
    code: string;
    message: string;
  };
}

export function getUnauthorizedEntriesErrorPayload() {
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

export function getInvalidEntriesPayloadErrorPayload() {
  return {
    status: 400,
    body: {
      error: {
        code: "validation",
        message: "Invalid entry payload.",
      },
    },
  };
}
