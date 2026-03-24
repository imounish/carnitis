import { AppShell } from "@/components/app-shell";
import { EntryLogView } from "@/components/entries/entry-log-view";
import { getServerDataAccess } from "@/lib/db/server";
import { isTodoActive } from "@/lib/db/todo-helpers";

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    car?: string;
    maintenance?: string;
    mode?: string;
    todo?: string;
  }>;
}) {
  const params = await searchParams;
  const dataAccess = await getServerDataAccess();
  const cars = await dataAccess.cars.list();
  const selectedCar =
    cars.find((car) => car.id === params.car) ?? cars[0] ?? null;

  if (!selectedCar) {
    return (
      <AppShell>
        <EntryLogView
          cars={[]}
          selectedCarId=""
          selectedCar={null}
          maintenanceItems={[]}
          todoItems={[]}
          recentEntries={[]}
          preselectedTodoItemId={null}
        />
      </AppShell>
    );
  }

  const [maintenanceItems, todoItems, entries] = await Promise.all([
    dataAccess.maintenance.listByCarId(selectedCar.id),
    dataAccess.todos.listByCarId(selectedCar.id),
    dataAccess.entries.listByCarId(selectedCar.id),
  ]);

  const shouldPrefillService = params.mode === "service";
  const preselectedMaintenanceItemId =
    shouldPrefillService &&
    params.maintenance &&
    maintenanceItems.some((item) => item.id === params.maintenance)
      ? params.maintenance
      : null;
  const eligibleTodoItems = todoItems.filter(
    (todo) => isTodoActive(todo) && todo.linked_entry_id === null
  );
  const preselectedTodoItem =
    params.todo && eligibleTodoItems.some((todo) => todo.id === params.todo)
      ? eligibleTodoItems.find((todo) => todo.id === params.todo) ?? null
      : null;
  const shouldPrefillTodoAsService =
    preselectedTodoItem?.category === "regular_maintenance" ||
    preselectedTodoItem?.category === "preventive_maintenance";

  return (
    <AppShell>
      <EntryLogView
        cars={cars}
        selectedCarId={selectedCar.id}
        selectedCar={selectedCar}
        maintenanceItems={maintenanceItems}
        todoItems={eligibleTodoItems}
        recentEntries={entries.slice(0, 8)}
        initialEntryType={
          shouldPrefillService || shouldPrefillTodoAsService
            ? "maintenance_done"
            : preselectedTodoItem
              ? "maintenance_expense"
              : "fuel"
        }
        initialShowAdvanced={
          shouldPrefillService || preselectedTodoItem !== null
        }
        preselectedMaintenanceItemId={preselectedMaintenanceItemId}
        preselectedTodoItemId={preselectedTodoItem?.id ?? null}
      />
    </AppShell>
  );
}
