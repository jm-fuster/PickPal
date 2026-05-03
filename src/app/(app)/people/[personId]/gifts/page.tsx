"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GiftRecommendationCard } from "@/components/gifts/GiftRecommendationCard";
import type { GiftRecommendation } from "@/lib/gifts";

export default function GiftsPage({
  params,
}: {
  params: Promise<{ personId: string }>;
}) {
  const { personId } = use(params);
  const id = personId as Id<"people">;
  const { isLoaded, isSignedIn } = useAuth();
  const ready = isLoaded && isSignedIn;

  const person = useQuery(api.people.getById, ready ? { id } : "skip");

  const [occasion, setOccasion] = useState("Cumpleaños");
  const [ideas, setIdeas] = useState<GiftRecommendation[] | null>(null);
  const [loading, setLoading] = useState(false);

  if (!ready || person === undefined) {
    return <p className="p-8 text-muted-foreground">Cargando…</p>;
  }
  if (person === null) {
    return (
      <main className="p-8 space-y-3">
        <p>Persona no encontrada.</p>
        <Link href="/people" className={buttonVariants({ variant: "outline" })}>
          Volver
        </Link>
      </main>
    );
  }

  const generate = async () => {
    setLoading(true);
    setIdeas(null);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: id, occasionLabel: occasion }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Error ${res.status}`);
      }
      const data = (await res.json()) as { ideas: GiftRecommendation[] };
      setIdeas(data.ideas);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error generando ideas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div className="space-y-1">
        <Link
          href={`/people/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver al perfil
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          Ideas de regalo para {person.name}
        </h1>
      </div>

      <div className="flex flex-wrap items-end gap-3 max-w-xl">
        <div className="flex-1 min-w-[180px] space-y-1.5">
          <Label htmlFor="occasion">Ocasión</Label>
          <Input
            id="occasion"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            placeholder="Cumpleaños, Aniversario…"
          />
        </div>
        <Button onClick={generate} disabled={loading || !occasion.trim()}>
          {loading ? "Generando…" : "Generar 6 ideas"}
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-md border border-dashed animate-pulse"
            />
          ))}
        </div>
      ) : ideas ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea, i) => (
            <GiftRecommendationCard key={i} idea={idea} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Pulsa &ldquo;Generar 6 ideas&rdquo; para que la IA cree recomendaciones
          personalizadas según los intereses, presupuesto y notas de{" "}
          {person.name}.
        </p>
      )}
    </main>
  );
}
