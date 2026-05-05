import Link from "next/link";
import { Home, Users, Settings } from "lucide-react";
import { SidebarLink } from "@/components/layout/SidebarLink";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      {/* Sidebar — lg+ */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-background text-foreground border-r border-border">
        <div className="px-5 py-5 border-b border-border flex items-center justify-between">
          <Link href="/dev" className="font-semibold text-lg text-foreground">
            PickPal
          </Link>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            dev
          </span>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
          <SidebarLink href="/dev">
            <Home className="size-4" aria-hidden />
            Inicio
          </SidebarLink>
          <SidebarLink href="/dev/people">
            <Users className="size-4" aria-hidden />
            Personas
          </SidebarLink>
          <SidebarLink href="/dev/settings">
            <Settings className="size-4" aria-hidden />
            Ajustes
          </SidebarLink>
        </nav>
      </aside>

      {/* Mobile header + content */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between border-b px-6 py-3">
          <nav className="flex items-center gap-6">
            <Link href="/dev" className="font-semibold">
              PickPal <span className="text-[10px] text-muted-foreground">dev</span>
            </Link>
            <Link href="/dev" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
              <Home className="size-4" aria-hidden />
              Inicio
            </Link>
            <Link href="/dev/people" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
              <Users className="size-4" aria-hidden />
              Personas
            </Link>
          </nav>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
