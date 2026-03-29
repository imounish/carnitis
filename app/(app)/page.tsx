import { AppShell } from "@/components/app-shell";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getServerDataAccess } from "@/lib/db/server";
import { getDashboardStatsFromDataAccess } from "@/lib/db/stats-service";

export default async function HomePage() {
  const dataAccess = await getServerDataAccess();

  const [stats, cars, recentEntries, maintenanceAlerts, todos] =
    await Promise.all([
      getDashboardStatsFromDataAccess(dataAccess),
      dataAccess.cars.list(),
      dataAccess.entries.listRecent(8),
      dataAccess.maintenance.listUpcoming(),
      dataAccess.todos.listAll(),
    ]);

  return (
    <AppShell>
      <DashboardView
        stats={stats}
        cars={cars}
        recentEntries={recentEntries}
        maintenanceAlerts={maintenanceAlerts}
        todos={todos}
      />
    </AppShell>
  );
}
