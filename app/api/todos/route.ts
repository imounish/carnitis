import { NextResponse } from "next/server";
import { getAuthSessionFromHeaders } from "@/lib/auth/server-session";
import { getServerDataAccessFromHeaders } from "@/lib/db/server";
import {
  buildCreateTodoInput,
  getInvalidTodoPayloadErrorPayload,
  getTodoApiErrorPayload,
  getTodoCarNotFoundErrorPayload,
  getUnauthorizedTodoErrorPayload,
  parseCreateTodoPayload,
} from "@/lib/db/todo-api";

export async function POST(request: Request) {
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

  const parsed = parseCreateTodoPayload(payload);
  if (!parsed.success) {
    const response = getInvalidTodoPayloadErrorPayload();
    return NextResponse.json(response.body, { status: response.status });
  }

  try {
    const dataAccess = await getServerDataAccessFromHeaders(request.headers);
    const car = await dataAccess.cars.getById(parsed.data.car_id);

    if (!car) {
      const response = getTodoCarNotFoundErrorPayload();
      return NextResponse.json(response.body, { status: response.status });
    }

    const item = await dataAccess.todos.create(buildCreateTodoInput(parsed.data));

    return NextResponse.json(
      {
        data: {
          id: item.id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const response = getTodoApiErrorPayload(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
