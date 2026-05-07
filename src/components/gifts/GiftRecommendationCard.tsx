import { ExternalLink, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
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
  onDiscard?: () => void;
}

export function GiftRecommendationCard({
  idea,
  index = 0,
  giftType = "fisica",
  favoriteStores,
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
      className="relative flex flex-col h-full border-border/60 shadow-sm transition-shadow hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {onDiscard && (
        <button
          type="button"
          onClick={onDiscard}
          aria-label="Descartar idea"
          className="absolute top-2 right-2 z-10 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-1.5">
          <h3 className="text-base font-medium leading-snug pr-6">
            {idea.title}
          </h3>
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

        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4 min-h-[5rem]">
          {idea.description}
        </p>

        <div className="space-y-3 pt-3 border-t border-border/50">
          <div className="text-lg font-medium tracking-tight">
            {formatRange(idea.priceMinEuros, idea.priceMaxEuros)}
          </div>

          {idea.amazonQuery ? (
            isPhysical ? (
              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {storesToRender.map((store) => {
                    return (
                      <a
                        key={store}
                        href={generateStoreSearchUrl(store, idea.amazonQuery, {
                          minEuros: idea.priceMinEuros,
                          maxEuros: idea.priceMaxEuros,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonVariants({
                          size: "sm",
                        })}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={STORE_ICONS[store]} alt="" className="size-3.5 rounded-sm object-contain bg-white p-px" aria-hidden />
                        {STORE_LABELS[store]}
                        <ExternalLink className="size-3" aria-hidden />
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
              <div className="flex flex-wrap gap-1.5">
                <a
                  href={generateGoogleUrl(idea.amazonQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ size: "sm" })}
                >
                  {nonPhysicalLabel}
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </div>
            )
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
