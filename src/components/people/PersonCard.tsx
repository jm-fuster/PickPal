import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      <Card className="hover:bg-muted/50 transition-colors h-full">
        <CardContent className="flex items-center gap-4 p-4">
          <Avatar>
            {person.photoUrl ? <AvatarImage src={person.photoUrl} /> : null}
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
