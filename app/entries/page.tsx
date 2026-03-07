import { AppShell } from "@/components/app-shell";
import { EntryLogView } from "@/components/entries/entry-log-view";

export default function EntriesPage() {
  return (
    <AppShell>
      <EntryLogView />
    </AppShell>
  );
}
