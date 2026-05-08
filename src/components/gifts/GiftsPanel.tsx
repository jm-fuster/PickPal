"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  RefreshCw,
  ShoppingBag,
  Ticket,
  Heart,
  Shuffle,
  ArrowLeft,
  X,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GiftRecommendationCard } from "@/components/gifts/GiftRecommendationCard";
import { LoadingFallback } from "@/components/layout/LoadingFallback";
import { GIFT_TYPES, type GiftType, type GiftRecommendation } from "@/lib/gifts";
import { ALL_STORES, sanitizeFavoriteStores } from "@/lib/stores";

const formatBudget = (min?: number, max?: number) => {
  const toEur = (v: number) => Math.round(v / 100);
  if (min !== undefined && max !== undefined) return ` · ${toEur(min)}–${toEur(max)}€`;
  if (min !== undefined) return ` · desde ${toEur(min)}€`;
  if (max !== undefined) return ` · hasta ${toEur(max)}€`;
  return "";
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

interface GiftsPanelProps {
  personId: Id<"people">;
  initialOccasion?: string;
  embedded?: boolean;
  onClose?: () => void;
  backHref?: string;
}

export function GiftsPanel({
  personId,
  initialOccasion,
  embedded = false,
  onClose,
  backHref = "/agenda",
}: GiftsPanelProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const ready = isLoaded && isSignedIn;

  const person = useQuery(api.people.getById, ready ? { id: personId } : "skip");
  const events = useQuery(
    api.importantDates.getByPerson,
    ready ? { personId } : "skip",
  );
  const settings = useQuery(api.settings.getMine, ready ? {} : "skip");
  const favoriteStores =
    settings && settings.favoriteStores.length > 0
      ? sanitizeFavoriteStores(settings.favoriteStores)
      : [...ALL_STORES];

  const [occasion, setOccasion] = useState(initialOccasion ?? "");
  const [giftType, setGiftType] = useState<GiftType>("fisica");
  const [ideas, setIdeas] = useState<GiftRecommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHeaderRegen, setShowHeaderRegen] = useState(false);
  const controlsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const removeIdea = useMutation(api.recommendations.removeIdea);
  const pendingDiscards = useRef<
    Map<
      string,
      {
        idea: GiftRecommendation;
        insertAt: number;
        args: Parameters<typeof removeIdea>[0];
      }
    >
  >(new Map());

  useEffect(() => {
    return () => {
      pendingDiscards.current.forEach(({ args }) => {
        removeIdea(args).catch(() => {});
      });
      pendingDiscards.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!embedded) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const check = () => {
      const controls = controlsRef.current;
      if (!controls) { setShowHeaderRegen(false); return; }
      const controlsBottom = controls.getBoundingClientRect().bottom;
      const containerTop = container.getBoundingClientRect().top;
      setShowHeaderRegen(controlsBottom < containerTop);
    };
    check();
    container.addEventListener("scroll", check, { passive: true });
    return () => container.removeEventListener("scroll", check);
  }, [embedded, person]);

  const cached = useQuery(
    api.recommendations.getByPersonOccasion,
    ready && occasion
      ? { personId, occasionLabel: occasion, giftType }
      : "skip",
  );

  if (!ready || person === undefined) {
    return embedded ? (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <LoadingFallback />
      </div>
    ) : (
      <LoadingFallback />
    );
  }

  if (person === null) {
    return (
      <div className="p-8 space-y-3">
        <p>Persona no encontrada.</p>
        {!embedded && (
          <Link href="/seres-queridos" className={buttonVariants({ variant: "outline" })}>
            Volver
          </Link>
        )}
      </div>
    );
  }

  const generate = async () => {
    setLoading(true);
    setIdeas(null);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId, occasionLabel: occasion, giftType }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail = data.detail ? ` (${data.detail})` : "";
        throw new Error((data.error ?? `Error ${res.status}`) + detail);
      }
      const data = (await res.json()) as { ideas: GiftRecommendation[] };
      setIdeas(data.ideas);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudieron generar ideas, inténtalo de nuevo",
      );
    } finally {
      setLoading(false);
    }
  };

  const hasCached = cached !== undefined && cached !== null;
  const showIdeas = ideas ?? (hasCached ? (cached!.ideas as GiftRecommendation[]) : null);

  const handleDiscard = (idea: GiftRecommendation, displayIndex: number) => {
    setIdeas((prev) => (prev ?? showIdeas ?? []).filter((_, i) => i !== displayIndex));

    const args = { personId, occasionLabel: occasion, giftType, ideaTitle: idea.title };
    pendingDiscards.current.set(idea.title, { idea, insertAt: displayIndex, args });

    toast("Esta idea no se volverá a mostrar", {
      duration: Infinity,
      action: {
        label: "Deshacer",
        onClick: () => {
          const pending = pendingDiscards.current.get(idea.title);
          if (!pending) return;
          pendingDiscards.current.delete(idea.title);
          setIdeas((prev) => {
            const current = prev ?? [];
            const next = [...current];
            next.splice(pending.insertAt, 0, pending.idea);
            return next;
          });
        },
      },
      onDismiss: () => {
        if (!pendingDiscards.current.has(idea.title)) return;
        pendingDiscards.current.delete(idea.title);
        removeIdea(args).catch(() => {});
      },
    });
  };

  const content = (
    <div className="flex flex-col gap-6">
      {!embedded && (
        <div className="space-y-2">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {backHref === "/agenda" ? "Agenda" : (person?.name ?? "Volver")}
          </Link>
          <h1 className="text-4xl font-medium leading-tight">Ideas de regalo</h1>
          <p className="text-sm text-muted-foreground">
            Sugerencias personalizadas con sus intereses, notas y presupuesto.
          </p>
        </div>
      )}

      <div ref={embedded ? controlsRef : undefined} className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
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
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Elige un evento" />
              </SelectTrigger>
              <SelectContent>
                {events && events.length > 0 ? (
                  events.map((ev) => (
                    <SelectItem key={ev._id} value={ev.label}>
                      {ev.label}
                      {formatBudget(ev.budgetMin, ev.budgetMax)}
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
          {/* Desktop: botón inline junto al selector de ocasión */}
          <Button
            size="lg"
            className="hidden sm:inline-flex sm:w-auto"
            onClick={generate}
            disabled={loading || !occasion}
          >
            {hasCached ? (
              <RefreshCw className="size-4" aria-hidden />
            ) : (
              <Sparkles className="size-4" aria-hidden />
            )}
            {loading ? "Generando…" : hasCached ? "Regenerar" : "Generar 9 ideas"}
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Tipo de regalo</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {GIFT_TYPES.map((t) => {
              const selected = giftType === t.value;
              const Icon = { ShoppingBag, Ticket, Heart, Shuffle }[t.icon];
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setGiftType(t.value);
                    setIdeas(null);
                  }}
                  className={[
                    "flex flex-col items-start gap-1 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                    selected
                      ? "bg-muted border border-border text-foreground"
                      : "border border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
                  ].join(" ")}
                >
                  <Icon className="size-4" aria-hidden />
                  <span className="font-medium leading-tight">{t.label}</span>
                  <span className="text-xs text-muted-foreground leading-tight">
                    {t.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Móvil: botón debajo del Tipo de regalo */}
        <Button
          size="lg"
          className="w-full sm:hidden"
          onClick={generate}
          disabled={loading || !occasion}
        >
          {hasCached ? (
            <RefreshCw className="size-4" aria-hidden />
          ) : (
            <Sparkles className="size-4" aria-hidden />
          )}
          {loading ? "Generando…" : hasCached ? "Regenerar" : "Generar 9 ideas"}
        </Button>

        {hasCached && !loading && (
          <p className="text-xs text-muted-foreground">
            Tienes ideas guardadas para esta combinación. Regenerar consume cuota diaria.
          </p>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="h-52 rounded-2xl border border-dashed border-border/60 bg-muted/40 animate-pulse"
            />
          ))}
        </div>
      ) : showIdeas ? (
        <div className={`grid gap-4 ${embedded ? "grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
          {showIdeas.map((idea, i) => (
            <GiftRecommendationCard
              key={idea.title}
              idea={idea}
              index={i}
              giftType={giftType}
              favoriteStores={favoriteStores}
              onDiscard={() => handleDiscard(idea, i)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-14 text-center">
          <div className="text-4xl mb-3" aria-hidden>
            ✨
          </div>
          {events && events.length === 0 ? (
            <>
              <h2 className="text-2xl font-medium mb-2">Sin eventos todavía</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                Para generar ideas necesitas al menos un evento — cumpleaños, aniversario, lo que sea.
              </p>
              <Link
                href={`/seres-queridos/${personId}`}
                className={buttonVariants({ variant: "outline" })}
              >
                Añadir evento a {person.name}
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-medium mb-2">A medida para {person.name}</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                La IA combinará intereses, notas y presupuesto que has guardado con la ocasión y el tipo de regalo que elijas para sugerir nueve ideas concretas.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden h-full flex flex-col">
        {/* Cabecera fija */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="size-9 shrink-0">
              {person.avatarUrl ? (
                <AvatarImage src={person.avatarUrl} alt={person.name} />
              ) : null}
              <AvatarFallback>{initials(person.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium truncate">{person.name}</p>
              <p className="text-xs text-muted-foreground">Ideas de regalo</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(hasCached || ideas) && (
              <Button
                size="sm"
                onClick={generate}
                disabled={loading}
                className={[
                  "transition-opacity duration-200",
                  showHeaderRegen ? "opacity-100" : "opacity-0 pointer-events-none",
                ].join(" ")}
              >
                <RefreshCw className="size-3.5" aria-hidden />
                {loading ? "Generando…" : "Regenerar"}
              </Button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Cerrar panel"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
        {/* Cuerpo scrollable */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60 [scrollbar-width:thin] [scrollbar-color:hsl(var(--border)/0.6)_transparent]">
          {content}
        </div>
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-8 p-8 max-w-6xl">
      {content}
    </main>
  );
}
