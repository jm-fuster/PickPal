"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, RefreshCw } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GiftRecommendationCard } from "@/components/gifts/GiftRecommendationCard";
import { LoadingFallback } from "@/components/layout/LoadingFallback";
import { GIFT_TYPES, type GiftType, type GiftRecommendation } from "@/lib/gifts";

const DISCARD_DELAY = 4000;

const formatBudget = (min?: number, max?: number) => {
  const toEur = (v: number) => Math.round(v / 100);
  if (min !== undefined && max !== undefined) return ` · ${toEur(min)}–${toEur(max)}€`;
  if (min !== undefined) return ` · desde ${toEur(min)}€`;
  if (max !== undefined) return ` · hasta ${toEur(max)}€`;
  return "";
};

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
  const events = useQuery(api.importantDates.getByPerson, ready ? { personId: id } : "skip");

  const [occasion, setOccasion] = useState("");
  const [giftType, setGiftType] = useState<GiftType>("fisica");
  const [ideas, setIdeas] = useState<GiftRecommendation[] | null>(null);
  const [loading, setLoading] = useState(false);

  const removeIdea = useMutation(api.recommendations.removeIdea);
  const pendingDiscards = useRef<
    Map<string, { idea: GiftRecommendation; insertAt: number; timeoutId: ReturnType<typeof setTimeout> }>
  >(new Map());

  const cached = useQuery(
    api.recommendations.getByPersonOccasion,
    ready && occasion ? { personId: id, occasionLabel: occasion, giftType } : "skip",
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

  const hasCached = cached !== undefined && cached !== null;
  const showIdeas = ideas ?? (hasCached ? (cached!.ideas as GiftRecommendation[]) : null);

  const handleDiscard = (idea: GiftRecommendation, displayIndex: number) => {
    // Remove from local state immediately
    setIdeas((prev) => (prev ?? showIdeas ?? []).filter((_, i) => i !== displayIndex));

    const timeoutId = setTimeout(() => {
      pendingDiscards.current.delete(idea.title);
      removeIdea({ personId: id, occasionLabel: occasion, giftType, ideaTitle: idea.title }).catch(() => {});
    }, DISCARD_DELAY);

    pendingDiscards.current.set(idea.title, { idea, insertAt: displayIndex, timeoutId });

    toast("Esta idea no se volverá a mostrar", {
      duration: DISCARD_DELAY,
      action: {
        label: "Deshacer",
        onClick: () => {
          const pending = pendingDiscards.current.get(idea.title);
          if (!pending) return;
          clearTimeout(pending.timeoutId);
          pendingDiscards.current.delete(idea.title);
          setIdeas((prev) => {
            const current = prev ?? [];
            const next = [...current];
            next.splice(pending.insertAt, 0, pending.idea);
            return next;
          });
        },
      },
    });
  };

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
          <div className="space-y-1.5">
            <Label>¿Para qué ocasión?</Label>
            <Select
              value={occasion}
              onValueChange={(v) => {
                if (!v) return;
                setOccasion(v);
                setIdeas(null);
              }}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Elige un evento" />
              </SelectTrigger>
              <SelectContent>
                {events && events.length > 0 ? (
                  events.map((ev) => (
                    <SelectItem key={ev._id} value={ev.label}>
                      {ev.label}{formatBudget(ev.budgetMin, ev.budgetMax)}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__none__" disabled>
                    Sin eventos guardados
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="lg"
            onClick={generate}
            disabled={loading || !occasion}
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
              className="h-52 rounded-2xl border border-dashed border-border/60 bg-muted/40 animate-pulse"
            />
          ))}
        </div>
      ) : showIdeas ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {showIdeas.map((idea, i) => (
            <GiftRecommendationCard
              key={idea.title}
              idea={idea}
              index={i}
              giftType={giftType}
              onDiscard={() => handleDiscard(idea, i)}
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
            {events && events.length === 0
              ? "Añade un evento en el perfil para poder generar ideas con el presupuesto correcto."
              : "La IA combinará intereses, notas y presupuesto que has guardado con la ocasión y el tipo de regalo que elijas para sugerir seis ideas concretas."}
          </p>
        </div>
      )}
    </main>
  );
}
