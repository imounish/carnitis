export interface TodoApiErrorPayload {
  error: {
    code: string;
    message: string;
  };
}

export function getUnauthorizedTodoErrorPayload() {
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

export function getInvalidTodoPayloadErrorPayload() {
  return {
    status: 400,
    body: {
      error: {
        code: "validation",
        message: "Invalid todo payload.",
      },
    },
  };
}

export function getEmptyTodoUpdatePayloadErrorPayload() {
  return {
    status: 400,
    body: {
      error: {
        code: "validation",
        message: "At least one todo field must be provided.",
      },
    },
  };
}

export function getTodoNotFoundErrorPayload() {
  return {
    status: 404,
    body: {
      error: {
        code: "not_found",
        message: "That task could not be found.",
      },
    },
  };
}

export function getTodoCarNotFoundErrorPayload() {
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
