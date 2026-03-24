import { AppShell } from "@/components/app-shell";
import { TodosView } from "@/components/todos/todos-view";
import { getServerDataAccess } from "@/lib/db/server";

export default async function TodosPage({
  searchParams,
}: {
  searchParams: Promise<{ car?: string }>;
}) {
  const params = await searchParams;
  const dataAccess = await getServerDataAccess();
  const cars = await dataAccess.cars.list();
  const selectedCarId =
    params.car && cars.some((car) => car.id === params.car) ? params.car : "all";

  const items =
    cars.length === 0
      ? []
      : selectedCarId === "all"
        ? (
            await Promise.all(cars.map((car) => dataAccess.todos.listByCarId(car.id)))
          ).flat()
        : await dataAccess.todos.listByCarId(selectedCarId);

  return (
    <AppShell>
      <TodosView cars={cars} selectedCarId={selectedCarId} items={items} />
    </AppShell>
  );
}
