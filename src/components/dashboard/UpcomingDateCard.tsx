import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatDayMonth, formatDaysUntil } from "@/lib/dates";
import type { Doc } from "../../../convex/_generated/dataModel";

interface UpcomingDateCardProps {
  person: Doc<"people">;
  date: Doc<"importantDates">;
  daysUntil: number;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

export function UpcomingDateCard({
  person,
  date,
  daysUntil,
}: UpcomingDateCardProps) {
  const urgent = daysUntil <= 7;

  return (
    <Card
      className={
        urgent
          ? "border-primary/60 shadow-sm bg-primary/5"
          : "border-border/60 shadow-sm"
      }
    >
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar className="size-12">
          {person.photoUrl ? <AvatarImage src={person.photoUrl} /> : null}
          <AvatarFallback>{initials(person.name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <Link
              href={`/people/${person._id}`}
              className="font-medium truncate hover:underline"
            >
              {person.name}
            </Link>
            <span className="text-xs text-muted-foreground">{date.label}</span>
          </div>
          <p className="text-sm">
            <span className={urgent ? "font-semibold text-primary" : undefined}>
              {formatDaysUntil(daysUntil)}
            </span>
            <span className="text-muted-foreground">
              {" "}
              · {formatDayMonth(date.month, date.day)}
            </span>
          </p>
        </div>

        <Link
          href={`/people/${person._id}/gifts`}
          className={buttonVariants({ size: "sm" })}
        >
          Ver regalos
        </Link>
      </CardContent>
    </Card>
  );
}
