import { AppShell } from "@/components/app-shell";
import { TodosView } from "@/components/todos/todos-view";

export default function TodosPage() {
  return (
    <AppShell>
      <TodosView />
    </AppShell>
  );
}
