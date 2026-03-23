export interface MaintenanceApiErrorPayload {
  error: {
    code: string;
    message: string;
  };
}

export function getUnauthorizedMaintenanceErrorPayload() {
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

export function getInvalidMaintenancePayloadErrorPayload() {
  return {
    status: 400,
    body: {
      error: {
        code: "validation",
        message: "Invalid maintenance payload.",
      },
    },
  };
}

export function getEmptyMaintenanceUpdatePayloadErrorPayload() {
  return {
    status: 400,
    body: {
      error: {
        code: "validation",
        message: "At least one maintenance field must be provided.",
      },
    },
  };
}

export function getMaintenanceNotFoundErrorPayload() {
  return {
    status: 404,
    body: {
      error: {
        code: "not_found",
        message: "That maintenance item could not be found.",
      },
    },
  };
}

export function getMaintenanceCarNotFoundErrorPayload() {
  return {
    status: 404,
    body: {
      error: {
        code: "not_found",
        message: "That car could not be found.",
      },
    },
  };
}
