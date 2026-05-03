import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between p-6">
        <Link href="/" className="font-semibold">
          Gift Reminder
        </Link>
        <ThemeToggle />
      </header>
      {children}
    </div>
  );
}
