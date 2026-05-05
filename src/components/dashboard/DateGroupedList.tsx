import type { Doc } from "../../../convex/_generated/dataModel";
import { UpcomingDateCard } from "./UpcomingDateCard";

type Entry = {
  date: Doc<"importantDates">;
  person: Doc<"people">;
  daysUntil: number;
};

function dateLabel(daysUntil: number, month: number, day: number): string {
  if (daysUntil === 0) return "Hoy";
  if (daysUntil === 1) return "Mañana";

  const year = new Date().getFullYear();
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

function daysLabel(daysUntil: number): string {
  if (daysUntil === 0 || daysUntil === 1) return "";
  return `En ${daysUntil} días`;
}

function groupEntries(entries: Entry[]): { key: string; label: string; badge: string; items: Entry[] }[] {
  const map = new Map<string, { label: string; badge: string; items: Entry[] }>();
  for (const entry of entries) {
    const key = `${entry.date.month}-${entry.date.day}`;
    if (!map.has(key)) {
      map.set(key, {
        label: dateLabel(entry.daysUntil, entry.date.month, entry.date.day),
        badge: daysLabel(entry.daysUntil),
        items: [],
      });
    }
    map.get(key)!.items.push(entry);
  }
  return Array.from(map.entries()).map(([key, val]) => ({ key, ...val }));
}

export function DateGroupedList({ entries }: { entries: Entry[] }) {
  const groups = groupEntries(entries);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.key}>
          <div className="flex items-baseline gap-3 mb-3">
            <h2 className="text-base font-semibold">{group.label}</h2>
            {group.badge && (
              <span className="text-xs text-muted-foreground">{group.badge}</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {group.items.map((entry) => (
              <UpcomingDateCard
                key={entry.date._id}
                person={entry.person}
                date={entry.date}
                daysUntil={entry.daysUntil}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
