import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoMark } from "@/components/ui/LogoMark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between p-6">
        <Link href="/" className="font-semibold flex items-center gap-2">
          <LogoMark className="size-7" />
          PickPal
        </Link>
        <ThemeToggle />
      </header>
      {children}
    </div>
  );
}
