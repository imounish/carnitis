import { AppShell } from "@/components/app-shell";
import { AccountSettingsView } from "@/components/settings/account-settings-view";

export default function SettingsPage() {
  return (
    <AppShell>
      <AccountSettingsView />
    </AppShell>
  );
}
