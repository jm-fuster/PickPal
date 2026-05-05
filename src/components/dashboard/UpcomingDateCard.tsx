import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { RELATIONSHIPS } from "@/lib/schemas";
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

const relationshipLabel = (value: string) =>
  RELATIONSHIPS.find((r) => r.value === value)?.label ?? value;

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
        <Avatar className="size-12 shrink-0">
          {person.avatarUrl ? (
            <AvatarImage src={person.avatarUrl} alt={person.name} />
          ) : null}
          <AvatarFallback>{initials(person.name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <Link
              href={`/people/${person._id}`}
              className="font-medium truncate hover:underline"
            >
              {person.name}
            </Link>
            <span className="text-xs text-muted-foreground shrink-0">
              {date.label} · {relationshipLabel(person.relationship)}
            </span>
          </div>

          {(person.interests?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1">
              {person.interests.slice(0, 4).map((i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {i}
                </Badge>
              ))}
              {person.interests.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{person.interests.length - 4}
                </Badge>
              )}
            </div>
          )}

          {person.notes && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {person.notes}
            </p>
          )}
        </div>

        <Link
          href={`/people/${person._id}/gifts`}
          className={buttonVariants({ size: "sm", className: "shrink-0" })}
        >
          Ver regalos
        </Link>
      </CardContent>
    </Card>
  );
}
