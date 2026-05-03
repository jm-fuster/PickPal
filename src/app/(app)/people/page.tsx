"use client";

import Link from "next/link";
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
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Personas</h1>
        <Link href="/people/new" className={buttonVariants({ size: "lg" })}>
          + Nueva persona
        </Link>
      </div>

      {!isLoaded || people === undefined ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-md border border-dashed animate-pulse"
            />
          ))}
        </div>
      ) : people.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-muted-foreground mb-4">
            Aún no tienes personas guardadas.
          </p>
          <Link href="/people/new" className={buttonVariants()}>
            Añadir la primera
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((p) => (
            <PersonCard key={p._id} person={p} />
          ))}
        </div>
      )}
    </main>
  );
}
