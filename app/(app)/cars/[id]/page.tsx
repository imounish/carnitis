import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CarDetailView } from "@/components/cars/car-detail-view";
import { getServerDataAccess } from "@/lib/db/server";

export default async function CarDetailPage({
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
      <CarDetailView car={car} />
    </AppShell>
  );
}
