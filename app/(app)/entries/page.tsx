import { AppShell } from "@/components/app-shell";
import { EntryLogView } from "@/components/entries/entry-log-view";
import { getServerDataAccess } from "@/lib/db/server";

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ car?: string; maintenance?: string; mode?: string }>;
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

  return (
    <AppShell>
      <EntryLogView
        cars={cars}
        selectedCarId={selectedCar.id}
        selectedCar={selectedCar}
        maintenanceItems={maintenanceItems}
        todoItems={todoItems.filter(
          (todo) => todo.status !== "completed" && todo.status !== "cancelled"
        )}
        recentEntries={entries.slice(0, 8)}
        initialEntryType={shouldPrefillService ? "maintenance_done" : "fuel"}
        initialShowAdvanced={shouldPrefillService}
        preselectedMaintenanceItemId={preselectedMaintenanceItemId}
      />
    </AppShell>
  );
}
