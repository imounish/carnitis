"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Car,
  LayoutDashboard,
  Wrench,
  ListTodo,
  Gauge,
  Plus,
  LogOut,
  UserCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth/auth-context";

const navItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/cars", label: "Cars", icon: Car },
  { href: "/entries", label: "Log", icon: Plus, primary: true },
  { href: "/maintenance", label: "Service", icon: Wrench },
  { href: "/todos", label: "Tasks", icon: ListTodo },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

  async function handleSignOut() {
    const ok = await signOut();
    if (ok) {
      router.replace("/sign-in");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar - compact on mobile */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md md:h-14 lg:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary md:h-8 md:w-8">
            <Gauge className="h-3.5 w-3.5 text-primary-foreground md:h-4 md:w-4" />
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground md:text-lg">
            Carnitis
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button
            asChild
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Account settings"
            className="h-10 w-10"
          >
            <Link href="/settings">
              <UserCircle2 className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            aria-label="Sign out"
            className="hidden h-10 w-10 sm:inline-flex"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main content - padded for bottom nav on mobile */}
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            if (item.primary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-11 min-w-11 flex-col items-center justify-center rounded-xl"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform active:scale-95">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="mt-0.5 text-[10px] font-medium text-primary">
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors active:bg-accent",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                <span
                  className={cn(
                    "text-[10px]",
                    isActive ? "font-semibold" : "font-medium"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        {/* Safe area for phones with home indicator */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
