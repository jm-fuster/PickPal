"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { DateGroupedList } from "@/components/dashboard/DateGroupedList";
import { GiftsPanel } from "@/components/gifts/GiftsPanel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { computeDaysUntil, monthsWindowDays } from "@/lib/dates";

const WINDOW_MONTHS = 4;

type SelectedEvent = {
  personId: Id<"people">;
  occasion: string;
  dateId: string;
};

export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const ready = isLoaded && isSignedIn;
  const upcoming = useQuery(
    api.importantDates.getUpcoming,
    ready ? {} : "skip",
  );
  const people = useQuery(api.people.getAll, ready ? {} : "skip");

  const [selected, setSelected] = useState<SelectedEvent | null>(null);

  const filtered = useMemo(() => {
    if (!upcoming) return [];
    const today = new Date();
    const windowDays = monthsWindowDays(WINDOW_MONTHS, today);
    return upcoming
      .map(({ date, person }) => {
        const daysUntil = computeDaysUntil(date, today);
        return daysUntil === null ? null : { date, person, daysUntil };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null && e.daysUntil <= windowDays)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [upcoming]);

  return (
    <main className="flex flex-1 flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-4xl font-medium">Agenda</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lo que llega en los próximos 4 meses.
        </p>
      </div>

      {!ready || upcoming === undefined ? (
        <div className="space-y-3" role="status">
          <span className="sr-only">Cargando agenda…</span>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              aria-hidden
              className="h-20 rounded-2xl border border-dashed border-border/60 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        people && people.length > 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-14 text-center">
            <div className="text-4xl mb-3" aria-hidden>
              ☕
            </div>
            <h2 className="text-2xl font-medium mb-2">Todo tranquilo</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Tus seres queridos no tienen fechas en los próximos 4 meses. ¿Les falta algún evento?
            </p>
            <Link
              href="/seres-queridos"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Ver seres queridos
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-14 text-center">
            <div className="text-4xl mb-3" aria-hidden>
              ☕
            </div>
            <h2 className="text-2xl font-medium mb-2">Empieza aquí</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Añade a alguien para que la agenda cobre vida.
            </p>
            <Link
              href="/seres-queridos/new"
              className={buttonVariants({ size: "lg" })}
            >
              Añadir ser querido
            </Link>
          </div>
        )
      ) : (
        <>
          <div className="xl:max-w-[480px] xl:px-1 xl:pb-1">
            <DateGroupedList
              entries={filtered}
              onSelect={(entry) =>
                setSelected({
                  personId: entry.person._id,
                  occasion: entry.date.label,
                  dateId: entry.date._id,
                })
              }
              selectedDateId={selected?.dateId}
            />
          </div>

          {selected && (
            <div className="hidden xl:flex flex-col fixed top-8 bottom-8 right-8 left-[48.5rem]">
              <GiftsPanel
                key={`${selected.personId}-${selected.occasion}`}
                personId={selected.personId}
                initialOccasion={selected.occasion}
                embedded
                onClose={() => setSelected(null)}
              />
            </div>
          )}
        </>
      )}
    </main>
  );
}
