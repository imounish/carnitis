import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EditCarForm } from "@/components/cars/edit-car-form";
import { getServerDataAccess } from "@/lib/db/server";

export default async function EditCarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dataAccess = await getServerDataAccess();
  const car = await dataAccess.cars.getById(id);

  if (!car) {
    notFound();
  }

  return (
    <AppShell>
      <EditCarForm car={car} />
    </AppShell>
  );
}
