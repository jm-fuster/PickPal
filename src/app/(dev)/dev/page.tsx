"use client";

import { useState } from "react";
import Link from "next/link";
import { DateGroupedList } from "@/components/dashboard/DateGroupedList";
import { Button, buttonVariants } from "@/components/ui/button";
import { MOCK_UPCOMING } from "@/lib/mock-data";

const WINDOWS = [
  { value: 30, label: "30 días" },
  { value: 60, label: "60 días" },
  { value: 90, label: "90 días" },
] as const;

type WindowDays = (typeof WINDOWS)[number]["value"];

export default function DevDashboard() {
  const [windowDays, setWindowDays] = useState<WindowDays>(30);
  const filtered = MOCK_UPCOMING.filter((e) => e.daysUntil <= windowDays);

  return (
    <main className="flex flex-1 flex-col gap-8 p-8">
      <div>
        <h1 className="text-4xl font-medium">Inicio</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lo que llega en los próximos {windowDays} días.
        </p>
      </div>

      <div className="flex gap-2">
        {WINDOWS.map((w) => (
          <Button
            key={w.value}
            size="sm"
            variant={windowDays === w.value ? "default" : "outline"}
            onClick={() => setWindowDays(w.value)}
          >
            {w.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-14 text-center">
          <div className="text-4xl mb-3" aria-hidden>☕</div>
          <h2 className="text-2xl font-medium mb-2">Calma por delante</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            No hay fechas en los próximos {windowDays} días.
          </p>
          <Link href="/dev/people" className={buttonVariants({ variant: "outline" })}>
            Ver personas
          </Link>
        </div>
      ) : (
        <DateGroupedList entries={filtered} />
      )}
    </main>
  );
}
