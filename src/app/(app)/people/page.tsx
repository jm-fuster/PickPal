"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PersonCard } from "@/components/people/PersonCard";
import { buttonVariants } from "@/components/ui/button";

export default function PeoplePage() {
  const { isLoaded, isSignedIn } = useAuth();
  const people = useQuery(
    api.people.getAll,
    isLoaded && isSignedIn ? {} : "skip",
  );

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

      {!isLoaded || people === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-56 rounded-2xl border border-dashed border-border/60 animate-pulse"
            />
          ))}
        </div>
      ) : people.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-14 text-center">
          <div className="text-4xl mb-3" aria-hidden>
            📓
          </div>
          <h2 className="text-2xl font-medium mb-2">Una libreta en blanco</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Empieza por alguien fácil — pareja, padres, mejor amigo. Anota sus
            intereses y déjanos cuidar las fechas.
          </p>
          <Link href="/people/new" className={buttonVariants({ size: "lg" })}>
            Añadir la primera persona
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {people.map((p) => (
            <PersonCard key={p._id} person={p} />
          ))}
        </div>
      )}
    </main>
  );
}
