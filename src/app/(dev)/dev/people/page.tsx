import Link from "next/link";
import { Plus } from "lucide-react";
import { PersonCard } from "@/components/people/PersonCard";
import { buttonVariants } from "@/components/ui/button";
import { MOCK_PEOPLE } from "@/lib/mock-data";

export default function DevPeoplePage() {
  return (
    <main className="flex flex-1 flex-col gap-8 p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-medium">Personas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quienes te importan, en una sola libreta.
          </p>
        </div>
        <Link href="/people/new" className={buttonVariants({ size: "lg" })}>
          <Plus className="size-4" aria-hidden />
          Nueva persona
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {MOCK_PEOPLE.map((p) => (
          <PersonCard key={p._id} person={p} />
        ))}
      </div>
    </main>
  );
}
