"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Sparkles, RefreshCw } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GiftRecommendationCard } from "@/components/gifts/GiftRecommendationCard";
import { LoadingFallback } from "@/components/layout/LoadingFallback";
import { GIFT_TYPES, type GiftType, type GiftRecommendation } from "@/lib/gifts";

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
  const [giftType, setGiftType] = useState<GiftType>("fisica");
  const [ideas, setIdeas] = useState<GiftRecommendation[] | null>(null);
  const [loading, setLoading] = useState(false);

  const removeIdea = useMutation(api.recommendations.removeIdea);

  const cached = useQuery(
    api.recommendations.getByPersonOccasion,
    ready ? { personId: id, occasionLabel: occasion, giftType } : "skip",
  );

  if (!ready || person === undefined) {
    return <LoadingFallback />;
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
        body: JSON.stringify({ personId: id, occasionLabel: occasion, giftType }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Error ${res.status}`);
      }
      const data = (await res.json()) as { ideas: GiftRecommendation[] };
      setIdeas(data.ideas);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron generar ideas, inténtalo de nuevo");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = (index: number) => {
    setIdeas((prev) => {
      const base = prev ?? (cached?.ideas as GiftRecommendation[] ?? []);
      return base.filter((_, i) => i !== index);
    });
    removeIdea({ personId: id, occasionLabel: occasion, giftType, ideaIndex: index })
      .catch(() => toast.error("No se pudo descartar la idea, inténtalo de nuevo"));
  };

  const hasCached = cached !== undefined && cached !== null;
  const showIdeas = ideas ?? (hasCached ? (cached!.ideas as GiftRecommendation[]) : null);

  return (
    <main className="flex flex-1 flex-col gap-8 p-8 max-w-6xl">
      <div className="space-y-2">
        <Link
          href={`/people/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground w-fit"
        >
          ← {person.name}
        </Link>
        <h1 className="text-4xl font-medium leading-tight">
          Ideas de regalo
        </h1>
        <p className="text-sm text-muted-foreground">
          Sugerencias personalizadas con sus intereses, notas y presupuesto.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-5 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px] space-y-1.5">
            <Label htmlFor="occasion">¿Para qué ocasión?</Label>
            <Input
              id="occasion"
              value={occasion}
              onChange={(e) => {
                setOccasion(e.target.value);
                setIdeas(null);
              }}
              placeholder="Cumpleaños, aniversario, Navidad…"
            />
          </div>
          <Button
            size="lg"
            onClick={generate}
            disabled={loading || !occasion.trim()}
          >
            {hasCached ? (
              <RefreshCw className="size-4" aria-hidden />
            ) : (
              <Sparkles className="size-4" aria-hidden />
            )}
            {loading ? "Generando…" : hasCached ? "Regenerar" : "Generar 6 ideas"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {GIFT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setGiftType(t.value);
                setIdeas(null);
              }}
              className={[
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                giftType === t.value
                  ? "bg-primary text-primary-foreground"
                  : "border border-border/60 bg-background/60 text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              <span aria-hidden>{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>

        {hasCached && !loading && (
          <p className="text-xs text-muted-foreground">
            Tienes ideas guardadas para esta combinación. Regenerar consume cuota diaria.
          </p>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-52 rounded-2xl border border-dashed border-border/60 animate-pulse"
            />
          ))}
        </div>
      ) : showIdeas && showIdeas.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {showIdeas.map((idea, i) => (
            <GiftRecommendationCard
              key={idea.title}
              idea={idea}
              index={i}
              giftType={giftType}
              onDiscard={() => handleDiscard(i)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-14 text-center">
          <div className="text-4xl mb-3" aria-hidden>
            ✨
          </div>
          <h2 className="text-2xl font-medium mb-2">A medida para {person.name}</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            La IA combinará intereses, notas y presupuesto que has guardado
            con la ocasión y el tipo de regalo que elijas para sugerir seis ideas concretas.
          </p>
        </div>
      )}
    </main>
  );
}
