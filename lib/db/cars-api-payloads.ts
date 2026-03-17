export interface CarsApiErrorPayload {
  error: {
    code: string;
    message: string;
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

export function getEmptyCarsUpdatePayloadErrorPayload() {
  return {
    status: 400,
    body: {
      error: {
        code: "validation",
        message: "At least one car field must be provided.",
      },
    },
  };
}

export function getCarNotFoundErrorPayload() {
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
