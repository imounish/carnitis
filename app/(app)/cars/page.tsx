import { AppShell } from "@/components/app-shell";
import { CarsListView } from "@/components/cars/cars-list-view";
import { getServerDataAccess } from "@/lib/db/server";

export default async function CarsPage() {
  const dataAccess = await getServerDataAccess();
  const cars = await dataAccess.cars.list();

  return (
    <AppShell>
      <CarsListView initialCars={cars} />
    </AppShell>
  );
}
