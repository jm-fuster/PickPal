"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { DateGroupedList } from "@/components/dashboard/DateGroupedList";
import { Button, buttonVariants } from "@/components/ui/button";
import { computeDaysUntil } from "@/lib/dates";

const WINDOWS = [
  { value: 30, label: "30 días" },
  { value: 60, label: "60 días" },
  { value: 90, label: "90 días" },
] as const;

type WindowDays = (typeof WINDOWS)[number]["value"];

export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const ready = isLoaded && isSignedIn;
  const upcoming = useQuery(
    api.importantDates.getUpcoming,
    ready ? {} : "skip",
  );

  const [windowDays, setWindowDays] = useState<WindowDays>(30);

  const filtered = useMemo(() => {
    if (!upcoming) return [];
    const today = new Date();
    return upcoming
      .map(({ date, person }) => {
        const daysUntil = computeDaysUntil(date, today);
        return daysUntil === null ? null : { date, person, daysUntil };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null && e.daysUntil <= windowDays)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [upcoming, windowDays]);

  return (
    <main className="flex flex-1 flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-4xl font-medium">Agenda</h1>
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

      {!ready || upcoming === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl border border-dashed border-border/60 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-14 text-center">
          <div className="text-4xl mb-3" aria-hidden>
            ☕
          </div>
          <h2 className="text-2xl font-medium mb-2">Calma por delante</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            No hay fechas en los próximos {windowDays} días. Buen momento
            para añadir a alguien que te falte.
          </p>
          <Link
            href="/people"
            className={buttonVariants({ variant: "outline" })}
          >
            Ver seres queridos
          </Link>
        </div>
      ) : (
        <DateGroupedList entries={filtered} />
      )}
    </main>
  );
}
