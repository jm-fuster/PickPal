import { ExternalLink, ThumbsDown, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ALL_STORES,
  STORE_ICONS,
  STORE_LABELS,
  generateStoreSearchUrl,
  pickEffectiveStores,
  type StoreId,
} from "@/lib/stores";
import type { GiftRecommendation, GiftType } from "@/lib/gifts";

const formatRange = (min: number, max: number) =>
  min === max
    ? `${Math.round(min)}€`
    : `${Math.round(min)}–${Math.round(max)}€`;

const generateGoogleUrl = (query: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(query)}`;

interface GiftRecommendationCardProps {
  idea: GiftRecommendation;
  index?: number;
  giftType?: GiftType;
  favoriteStores?: StoreId[];
  saved?: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
}

export function GiftRecommendationCard({
  idea,
  index = 0,
  giftType = "fisica",
  favoriteStores,
  saved = false,
  onSave,
  onDiscard,
}: GiftRecommendationCardProps) {
  const isPhysical = giftType === "fisica";
  const isSurprise = giftType === "sorprendeme";

  const userFavorites =
    favoriteStores && favoriteStores.length > 0
      ? ALL_STORES.filter((s) => favoriteStores.includes(s))
      : [...ALL_STORES];

  const { stores: storesToRender, isFallback } = pickEffectiveStores(
    userFavorites,
    idea.suggestedStores ?? undefined,
  );

  const nonPhysicalLabel = isSurprise
    ? "Buscar"
    : giftType === "tiempo-juntos"
      ? "Ideas"
      : "Buscar";

  return (
    <Card
      className="flex flex-col h-full border-border/60 shadow-sm transition-shadow hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Layout fijo desde arriba: título (2 líneas) + descripción (4 líneas)
          tienen altura reservada para que el precio quede a la misma altura
          entre cards; los botones de tienda alargan la card hacia abajo. */}
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-medium leading-snug line-clamp-2 min-h-[2.75rem]">
              {idea.title}
            </h3>
            {(onSave || onDiscard) && (
              <div className="flex gap-0.5 shrink-0">
                {onSave && (
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={saved}
                    aria-label={saved ? "Idea guardada" : "Guardar idea"}
                    aria-pressed={saved}
                    className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:pointer-events-none"
                  >
                    <ThumbsUp className="size-3.5" aria-hidden fill={saved ? "currentColor" : "none"} />
                  </button>
                )}
                {onDiscard && (
                  <button
                    type="button"
                    onClick={onDiscard}
                    aria-label="No me interesa"
                    className="rounded-full p-1 text-muted-foreground hover:text-destructive hover:bg-muted/60 transition-colors"
                  >
                    <ThumbsDown className="size-3.5" aria-hidden />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {(Array.isArray(idea.category)
              ? idea.category
              : (idea.category as unknown as string).split(" · ")
            ).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground min-h-24 line-clamp-4">
          {idea.description}
        </p>

        <div className="space-y-3 pt-3 border-t border-border/50">
          <div className="text-lg font-medium tracking-tight">
            {formatRange(idea.priceMinEuros, idea.priceMaxEuros)}
          </div>

          {idea.amazonQuery ? (
            isPhysical ? (
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-2">
                  {storesToRender.map((store, i) => {
                    const isLastOdd =
                      storesToRender.length % 2 === 1 &&
                      i === storesToRender.length - 1;
                    return (
                      <a
                        key={store}
                        href={generateStoreSearchUrl(store, idea.amazonQuery, {
                          minEuros: idea.priceMinEuros,
                          maxEuros: idea.priceMaxEuros,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Buscar ${idea.title} en ${STORE_LABELS[store]} (abre en una pestaña nueva)`}
                        className={cn(
                          buttonVariants({ size: "default", variant: "outline" }),
                          "min-w-0",
                          isLastOdd && "col-span-2",
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={STORE_ICONS[store]} alt="" className="size-4 shrink-0 rounded-sm object-contain bg-white p-px" aria-hidden />
                        <span className="truncate">{STORE_LABELS[store]}</span>
                        <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                      </a>
                    );
                  })}
                </div>
                {isFallback && (
                  <p className="text-[11px] text-muted-foreground">
                    Búsqueda genérica — esta idea encaja mejor en otras tiendas.
                  </p>
                )}
              </div>
            ) : (
              <a
                href={generateGoogleUrl(idea.amazonQuery)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${nonPhysicalLabel}: ${idea.title} (abre en una pestaña nueva)`}
                className={cn(buttonVariants({ size: "default", variant: "outline" }), "w-full")}
              >
                {nonPhysicalLabel}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
