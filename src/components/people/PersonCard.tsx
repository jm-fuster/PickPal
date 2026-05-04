import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RELATIONSHIPS } from "@/lib/schemas";
import type { Doc } from "../../../convex/_generated/dataModel";

const relationshipLabel = (value: string) =>
  RELATIONSHIPS.find((r) => r.value === value)?.label ?? value;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

export function PersonCard({ person }: { person: Doc<"people"> }) {
  return (
    <Link href={`/people/${person._id}`} className="block">
      <Card className="h-full border-border/60 transition-all hover:bg-muted/40 hover:shadow-md hover:-translate-y-0.5">
        <CardContent className="flex items-center gap-4 p-4">
          <Avatar>
            <AvatarFallback>{initials(person.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{person.name}</p>
            <p className="text-xs text-muted-foreground">
              {relationshipLabel(person.relationship)}
            </p>
            {person.interests.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {person.interests.slice(0, 3).map((i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {i}
                  </Badge>
                ))}
                {person.interests.length > 3 ? (
                  <Badge variant="outline" className="text-xs">
                    +{person.interests.length - 3}
                  </Badge>
                ) : null}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
