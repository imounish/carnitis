import { AppShell } from "@/components/app-shell";
import { CarsListView } from "@/components/cars/cars-list-view";

export default function CarsPage() {
  return (
    <AppShell>
      <CarsListView />
    </AppShell>
  );
}
