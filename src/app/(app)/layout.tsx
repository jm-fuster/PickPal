import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/layout/NotificationBell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold">
            Giftly
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
  );
}
