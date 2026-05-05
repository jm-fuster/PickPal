import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { SidebarLink } from "@/components/layout/SidebarLink";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1">
      {/* Sidebar — lg+ */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Link
            href="/dashboard"
            className="font-semibold text-lg text-sidebar-foreground"
          >
            PickPal
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          <SidebarLink href="/dashboard">Dashboard</SidebarLink>
          <SidebarLink href="/people">Personas</SidebarLink>
          <SidebarLink href="/settings">Ajustes</SidebarLink>
        </nav>
        <div className="p-4 border-t border-sidebar-border flex items-center gap-2">
          <NotificationBell />
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
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/people"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Personas
            </Link>
            <Link
              href="/settings"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Ajustes
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <ThemeToggle />
            <UserButton />
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
