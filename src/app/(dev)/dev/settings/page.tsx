"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function DevSettingsPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isDark = mounted ? resolvedTheme === "dark" : false;

  return (
    <main className="flex flex-1 flex-col gap-8 p-8 max-w-xl">
      <div>
        <h1 className="text-4xl font-medium">Ajustes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Preferencias de la cuenta.
        </p>
      </div>

      <section className="space-y-3 rounded-xl border p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="theme-toggle">Modo oscuro</Label>
            <p className="text-xs text-muted-foreground">
              Cambia entre tema claro y oscuro.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="size-4 text-muted-foreground" aria-hidden />
            <Switch
              id="theme-toggle"
              checked={isDark}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              suppressHydrationWarning
            />
            <Moon className="size-4 text-muted-foreground" aria-hidden />
          </div>
        </div>
      </section>
    </main>
  );
}
