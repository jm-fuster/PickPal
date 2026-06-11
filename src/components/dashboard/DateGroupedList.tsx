import type { Doc } from "../../../convex/_generated/dataModel";
import { nextOccurrenceDate } from "@/lib/dates";
import { UpcomingDateCard } from "./UpcomingDateCard";

type Entry = {
  date: Doc<"importantDates">;
  person: Doc<"people">;
  daysUntil: number;
};

function dateLabel(daysUntil: number, month: number, day: number): string {
  if (daysUntil === 0) return "Hoy";
  if (daysUntil === 1) return "Mañana";

  // Misma lógica de ocurrencia que la cuenta atrás (fallback 29-feb→28-feb
  // en años no bisiestos): la cabecera nunca debe decir "1 de marzo" mientras
  // el contador apunta al 28 de febrero.
  const d = nextOccurrenceDate(month, day);
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

interface DateGroupedListProps {
  entries: Entry[];
  onSelect?: (entry: Entry) => void;
  selectedDateId?: string;
}

export function DateGroupedList({ entries, onSelect, selectedDateId }: DateGroupedListProps) {
  const groups = groupEntries(entries);
  const gridClass = onSelect
    ? "grid-cols-1 gap-3"
    : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3";

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
          <div className={`grid ${gridClass}`}>
            {group.items.map((entry) => (
              <UpcomingDateCard
                key={entry.date._id}
                person={entry.person}
                date={entry.date}
                daysUntil={entry.daysUntil}
                onSelect={onSelect ? () => onSelect(entry) : undefined}
                isSelected={selectedDateId === entry.date._id}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
