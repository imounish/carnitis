import type { DataAccess } from "@/lib/db/contracts";
import {
  mockCars,
  mockEntries,
  mockMaintenanceItems,
  mockTodos,
} from "@/lib/db/mock-data";
import { logDataAccessError } from "@/lib/db/logger";
import {
  applyDerivedMaintenanceState,
  compareMaintenanceItems,
} from "@/lib/db/maintenance-scheduling";
import {
  compareTodos,
  isTodoActive,
  normalizeDirectTodoUpdates,
  todoPriorityOrder,
} from "@/lib/db/todo-helpers";
import {
  parseCreateCarInput,
  parseCreateEntryInput,
  parseCreateMaintenanceItemInput,
  parseCreateTodoInput,
  parseUpdateCarInput,
  parseUpdateMaintenanceItemInput,
  parseUpdateTodoInput,
} from "@/lib/db/validation";
import {
  addMonthsToIsoDateClamped,
  compareIsoDateStringsDesc,
} from "@/lib/time";

const delay = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

function compareEntriesDesc<
  TEntry extends { date: string; created_at: string }
>(left: TEntry, right: TEntry) {
  const byDate = compareIsoDateStringsDesc(left.date, right.date);
  if (byDate !== 0) {
    return byDate;
  }

  return right.created_at.localeCompare(left.created_at);
}

export function createMockDataAccess(): DataAccess {
  return {
    cars: {
      async list() {
        await delay();
        return [...mockCars];
      },
      async getById(id) {
        await delay();
        return mockCars.find((car) => car.id === id) ?? null;
      },
      async create(input) {
        try {
          const car = parseCreateCarInput(input);
          await delay();

          const newCar = {
            ...car,
            id: `car-${Date.now()}`,
            total_fuel_spent: 0,
            total_maintenance_spent: 0,
            total_improvements_spent: 0,
            total_repairs_spent: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockCars.push(newCar);
          return newCar;
        } catch (error) {
          throw logDataAccessError({ operation: "create", entity: "car" }, error);
        }
      },
      async update(id, updates) {
        try {
          const parsedUpdates = parseUpdateCarInput(updates);
          await delay();

          const index = mockCars.findIndex((car) => car.id === id);
          if (index === -1) {
            return null;
          }

          mockCars[index] = {
            ...mockCars[index],
            ...parsedUpdates,
            updated_at: new Date().toISOString(),
          };

          return mockCars[index];
        } catch (error) {
          throw logDataAccessError(
            { operation: "update", entity: "car", metadata: { id } },
            error
          );
        }
      },
      async delete(id) {
        await delay();
        const index = mockCars.findIndex((car) => car.id === id);
        if (index === -1) {
          return false;
        }

        mockCars.splice(index, 1);
        return true;
      },
    },
    entries: {
      async listByCarId(carId, entryType) {
        await delay();
        let entries = mockEntries.filter((entry) => entry.car_id === carId);
        if (entryType) {
          entries = entries.filter((entry) => entry.entry_type === entryType);
        }

        return entries.sort(compareEntriesDesc);
      },
      async listRecent(limit = 10) {
        await delay();

        return [...mockEntries]
          .sort(compareEntriesDesc)
          .slice(0, limit)
          .map((entry) => ({
            ...entry,
            car: mockCars.find((car) => car.id === entry.car_id),
          }));
      },
      async create(input) {
        try {
          const entry = parseCreateEntryInput(input);
          await delay();

          const newEntry = {
            ...entry,
            id: `entry-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockEntries.push(newEntry);

          const car = mockCars.find((candidate) => candidate.id === entry.car_id);
          if (car) {
            if (entry.mileage > car.current_mileage) {
              car.current_mileage = entry.mileage;
            }

            const amount = entry.expense_amount ?? entry.fuel_total_cost ?? 0;
            switch (entry.expense_category) {
              case "fuel":
                car.total_fuel_spent += amount;
                break;
              case "regular_maintenance":
              case "preventive_maintenance":
                car.total_maintenance_spent += amount;
                break;
              case "improvements":
                car.total_improvements_spent += amount;
                break;
              case "repairs":
                car.total_repairs_spent += amount;
                break;
            }

            car.updated_at = new Date().toISOString();
          }

          if (entry.maintenance_item_id) {
            const item = mockMaintenanceItems.find(
              (candidate) => candidate.id === entry.maintenance_item_id
            );

            if (item) {
              item.last_done_mileage = entry.mileage;
              item.last_done_date = entry.date;
              item.next_due_mileage = entry.mileage + item.interval_miles;

              if (item.interval_months) {
                item.next_due_date = addMonthsToIsoDateClamped(
                  entry.date,
                  item.interval_months
                );
              }

              item.status = "upcoming";
              item.updated_at = new Date().toISOString();
            }
          }

          if (entry.todo_id) {
            const todo = mockTodos.find((candidate) => candidate.id === entry.todo_id);
            if (todo) {
              todo.status = "completed";
              todo.linked_entry_id = newEntry.id;
              todo.completed_at = new Date().toISOString();
              todo.updated_at = new Date().toISOString();
            }
          }

          return newEntry;
        } catch (error) {
          throw logDataAccessError({ operation: "create", entity: "entry" }, error);
        }
      },
    },
    maintenance: {
      async listByCarId(carId) {
        await delay();
        const car = mockCars.find((candidate) => candidate.id === carId);
        const currentMileage = car?.current_mileage ?? 0;

        return mockMaintenanceItems
          .filter((item) => item.car_id === carId)
          .map((item) => applyDerivedMaintenanceState(item, currentMileage))
          .sort(compareMaintenanceItems);
      },
      async getById(id) {
        await delay();
        const item = mockMaintenanceItems.find((candidate) => candidate.id === id);
        if (!item) {
          return null;
        }

        const car = mockCars.find((candidate) => candidate.id === item.car_id);
        return applyDerivedMaintenanceState(item, car?.current_mileage ?? 0);
      },
      async listUpcoming() {
        await delay();
        return mockMaintenanceItems
          .map((item) => {
            const car = mockCars.find((candidate) => candidate.id === item.car_id);
            return {
              ...applyDerivedMaintenanceState(item, car?.current_mileage ?? 0),
              car,
            };
          })
          .filter((item) => item.status !== "completed")
          .sort(compareMaintenanceItems)
          .map((item) => ({
            ...item,
          }));
      },
      async create(input) {
        try {
          const item = parseCreateMaintenanceItemInput(input);
          await delay();

          const newItem = {
            ...item,
            id: `maint-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockMaintenanceItems.push(newItem);
          return newItem;
        } catch (error) {
          throw logDataAccessError(
            { operation: "create", entity: "maintenance_item" },
            error
          );
        }
      },
      async update(id, updates) {
        try {
          const parsedUpdates = parseUpdateMaintenanceItemInput(updates);
          await delay();

          const index = mockMaintenanceItems.findIndex((item) => item.id === id);
          if (index === -1) {
            return null;
          }

          mockMaintenanceItems[index] = {
            ...mockMaintenanceItems[index],
            ...parsedUpdates,
            updated_at: new Date().toISOString(),
          };

          return mockMaintenanceItems[index];
        } catch (error) {
          throw logDataAccessError(
            {
              operation: "update",
              entity: "maintenance_item",
              metadata: { id },
            },
            error
          );
        }
      },
      async delete(id) {
        await delay();
        const index = mockMaintenanceItems.findIndex((item) => item.id === id);
        if (index === -1) {
          return false;
        }

        mockMaintenanceItems.splice(index, 1);
        return true;
      },
    },
    todos: {
      async listByCarId(carId) {
        await delay();
        return mockTodos.filter((todo) => todo.car_id === carId).sort(compareTodos);
      },
      async listAll() {
        await delay();
        return mockTodos
          .filter(isTodoActive)
          .sort(
            (left, right) =>
              todoPriorityOrder[left.priority] - todoPriorityOrder[right.priority]
          )
          .map((todo) => ({
            ...todo,
            car: mockCars.find((car) => car.id === todo.car_id),
          }));
      },
      async create(input) {
        try {
          const todo = parseCreateTodoInput(input);
          await delay();

          const newTodo = {
            ...todo,
            linked_entry_id: null,
            completed_at: null,
            id: `todo-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          mockTodos.push(newTodo);
          return newTodo;
        } catch (error) {
          throw logDataAccessError({ operation: "create", entity: "todo" }, error);
        }
      },
      async update(id, updates) {
        try {
          const parsedUpdates = normalizeDirectTodoUpdates(
            parseUpdateTodoInput(updates)
          );
          await delay();

          const index = mockTodos.findIndex((todo) => todo.id === id);
          if (index === -1) {
            return null;
          }

          mockTodos[index] = {
            ...mockTodos[index],
            ...parsedUpdates,
            updated_at: new Date().toISOString(),
          };

          return mockTodos[index];
        } catch (error) {
          throw logDataAccessError(
            { operation: "update", entity: "todo", metadata: { id } },
            error
          );
        }
      },
      async delete(id) {
        await delay();
        const index = mockTodos.findIndex((todo) => todo.id === id);
        if (index === -1) {
          return false;
        }

        mockTodos.splice(index, 1);
        return true;
      },
    },
  };
}
