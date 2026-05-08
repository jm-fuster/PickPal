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
import { computeDaysUntil } from "@/lib/dates";

const WINDOW_DAYS = 120;

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

  const [selected, setSelected] = useState<SelectedEvent | null>(null);

  const filtered = useMemo(() => {
    if (!upcoming) return [];
    const today = new Date();
    return upcoming
      .map(({ date, person }) => {
        const daysUntil = computeDaysUntil(date, today);
        return daysUntil === null ? null : { date, person, daysUntil };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null && e.daysUntil <= WINDOW_DAYS)
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
            No hay fechas en los próximos 4 meses. Buen momento para añadir
            a alguien que te falte.
          </p>
          <Link
            href="/seres-queridos/new"
            className={buttonVariants({ variant: "outline" })}
          >
            Añadir ser querido
          </Link>
        </div>
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
