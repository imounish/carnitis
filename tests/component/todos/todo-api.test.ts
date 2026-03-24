import { describe, expect, it } from "vitest";
import {
  buildCreateTodoInput,
  buildDirectTodoUpdateInput,
  parseCreateTodoPayload,
  parseUpdateTodoPayload,
} from "@/lib/db/todo-api";
import {
  buildUpdateTodoPayload,
  getEditableTodoPayloadFromItem,
} from "@/lib/db/todo-form";

describe("todo helpers", () => {
  it("parses create payloads and builds pending create inputs", () => {
    const parsed = parseCreateTodoPayload({
      car_id: "car-1",
      title: " Replace air filter ",
      description: "  Cabin filter first  ",
      priority: "high",
      category: "regular_maintenance",
      estimated_cost: 29.99,
      due_date: "2026-03-25",
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }

    expect(buildCreateTodoInput(parsed.data)).toEqual({
      car_id: "car-1",
      title: "Replace air filter",
      description: "Cabin filter first",
      priority: "high",
      status: "pending",
      category: "regular_maintenance",
      estimated_cost: 29.99,
      due_date: "2026-03-25",
    });
  });

  it("rejects empty direct todo updates", () => {
    expect(parseUpdateTodoPayload({}).success).toBe(false);
  });

  it("owns completion timestamps and linkage fields for direct updates", () => {
    const now = new Date("2026-03-20T14:30:00.000Z");

    expect(
      buildDirectTodoUpdateInput(
        {
          status: "completed",
          title: "Updated title",
        },
        now
      )
    ).toEqual({
      status: "completed",
      title: "Updated title",
      linked_entry_id: null,
      completed_at: "2026-03-20T14:30:00.000Z",
    });

    expect(
      buildDirectTodoUpdateInput(
        {
          status: "pending",
        },
        now
      )
    ).toEqual({
      status: "pending",
      linked_entry_id: null,
      completed_at: null,
    });
  });

  it("builds todo edit diffs from changed form fields only", () => {
    const formData = new FormData();
    formData.set("title", "Replace air filter");
    formData.set("description", "Cabin and engine");
    formData.set("priority", "high");
    formData.set("status", "in_progress");
    formData.set("category", "repairs");
    formData.set("estimated_cost", "42.5");
    formData.set("due_date", "2026-03-28");

    const initial = getEditableTodoPayloadFromItem({
      title: "Replace air filter",
      description: null,
      priority: "medium",
      status: "pending",
      category: null,
      estimated_cost: null,
      due_date: null,
    });

    expect(buildUpdateTodoPayload(formData, initial)).toEqual({
      description: "Cabin and engine",
      priority: "high",
      status: "in_progress",
      category: "repairs",
      estimated_cost: 42.5,
      due_date: "2026-03-28",
    });
  });
});
