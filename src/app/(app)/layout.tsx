import Link from "next/link";
import { Home, Users, Settings } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { SafeNotificationBell } from "@/components/layout/SafeNotificationBell";
import { SidebarLink } from "@/components/layout/SidebarLink";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1">
      {/* Sidebar — lg+ */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-background text-foreground border-r border-border">
        <div className="px-5 py-5 border-b border-border">
          <Link
            href="/dashboard"
            className="font-semibold text-lg text-foreground"
          >
            PickPal
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
          <SidebarLink href="/dashboard">
            <Home className="size-4" aria-hidden />
            Inicio
          </SidebarLink>
          <SidebarLink href="/people">
            <Users className="size-4" aria-hidden />
            Personas
          </SidebarLink>
          <SidebarLink href="/settings">
            <Settings className="size-4" aria-hidden />
            Ajustes
          </SidebarLink>
        </nav>
        <div className="p-4 border-t border-border flex items-center gap-2">
          <SafeNotificationBell />
          <ThemeToggle />
          <UserButton />
        </div>
      </aside>

      {/* Mobile header + content */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between border-b px-6 py-3">
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold">
              PickPal
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            >
              <Home className="size-4" aria-hidden />
              Inicio
            </Link>
            <Link
              href="/people"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            >
              <Users className="size-4" aria-hidden />
              Personas
            </Link>
            <Link
              href="/settings"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            >
              <Settings className="size-4" aria-hidden />
              Ajustes
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <SafeNotificationBell />
            <ThemeToggle />
            <UserButton />
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
