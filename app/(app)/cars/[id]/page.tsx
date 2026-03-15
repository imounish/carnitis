import { AppShell } from "@/components/app-shell";
import { CarDetailView } from "@/components/cars/car-detail-view";

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <CarDetailView carId={id} />
    </AppShell>
  );
}
