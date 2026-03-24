import { NextResponse } from "next/server";
import { getAuthSessionFromHeaders } from "@/lib/auth/server-session";
import { getServerDataAccessFromHeaders } from "@/lib/db/server";
import {
  buildDirectTodoUpdateInput,
  getEmptyTodoUpdatePayloadErrorPayload,
  getInvalidTodoPayloadErrorPayload,
  getTodoApiErrorPayload,
  getTodoNotFoundErrorPayload,
  getUnauthorizedTodoErrorPayload,
  parseUpdateTodoPayload,
} from "@/lib/db/todo-api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSessionFromHeaders(request.headers);

  if (!session) {
    const response = getUnauthorizedTodoErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    const response = getInvalidTodoPayloadErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    Object.keys(payload).length === 0
  ) {
    const response = getEmptyTodoUpdatePayloadErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  const parsed = parseUpdateTodoPayload(payload);
  if (!parsed.success) {
    const response = getInvalidTodoPayloadErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  try {
    const { id } = await params;
    const dataAccess = await getServerDataAccessFromHeaders(request.headers);
    const updated = await dataAccess.todos.update(
      id,
      buildDirectTodoUpdateInput(parsed.data)
    );

    if (!updated) {
      const response = getTodoNotFoundErrorPayload();
      return NextResponse.json(response.body, { status: response.status });
    }

    return NextResponse.json(
      {
        data: {
          id: updated.id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const response = getTodoApiErrorPayload(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSessionFromHeaders(request.headers);

  if (!session) {
    const response = getUnauthorizedTodoErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  try {
    const { id } = await params;
    const dataAccess = await getServerDataAccessFromHeaders(request.headers);
    const deleted = await dataAccess.todos.delete(id);

    if (!deleted) {
      const response = getTodoNotFoundErrorPayload();
      return NextResponse.json(response.body, { status: response.status });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const response = getTodoApiErrorPayload(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
