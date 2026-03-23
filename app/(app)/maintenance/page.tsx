import { AppShell } from "@/components/app-shell";
import { MaintenanceView } from "@/components/maintenance/maintenance-view";
import { getServerDataAccess } from "@/lib/db/server";

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ car?: string }>;
}) {
  const params = await searchParams;
  const dataAccess = await getServerDataAccess();
  const cars = await dataAccess.cars.list();
  const selectedCar =
    cars.find((car) => car.id === params.car) ?? cars[0] ?? null;

  if (!selectedCar) {
    return (
      <AppShell>
        <MaintenanceView
          cars={[]}
          selectedCarId=""
          selectedCar={null}
          items={[]}
        />
      </AppShell>
    );
  }

  const items = await dataAccess.maintenance.listByCarId(selectedCar.id);

  return (
    <AppShell>
      <MaintenanceView
        cars={cars}
        selectedCarId={selectedCar.id}
        selectedCar={selectedCar}
        items={items}
      />
    </AppShell>
  );
}
