"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { UpcomingDateCard } from "@/components/dashboard/UpcomingDateCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { computeDaysUntilNextOccurrence } from "@/lib/dates";

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
      .map(({ date, person }) => ({
        date,
        person,
        daysUntil: computeDaysUntilNextOccurrence(
          date.month,
          date.day,
          today,
        ),
      }))
      .filter((entry) => entry.daysUntil <= windowDays)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [upcoming, windowDays]);

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Fechas que se acercan en los próximos {windowDays} días.
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
        <p className="text-muted-foreground">Cargando…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No hay fechas en los próximos {windowDays} días.
          </p>
          <Link href="/people" className={buttonVariants({ variant: "outline" })}>
            Ver personas
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <UpcomingDateCard
              key={entry.date._id}
              person={entry.person}
              date={entry.date}
              daysUntil={entry.daysUntil}
            />
          ))}
        </div>
      )}
    </main>
  );
}
