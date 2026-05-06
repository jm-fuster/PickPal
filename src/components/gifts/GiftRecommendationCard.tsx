import { ExternalLink, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { generateAmazonUrl } from "@/lib/amazon";
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
  onDiscard?: () => void;
}

export function GiftRecommendationCard({
  idea,
  index = 0,
  giftType = "fisica",
  onDiscard,
}: GiftRecommendationCardProps) {
  const isPhysical = giftType === "fisica";
  const isSurprise = giftType === "sorprendeme";

  const linkHref = isPhysical
    ? generateAmazonUrl(idea.amazonQuery)
    : generateGoogleUrl(idea.amazonQuery);

  const linkLabel = isPhysical ? "Amazon" : isSurprise ? "Buscar" : giftType === "tiempo-juntos" ? "Ideas" : "Buscar";

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
        <div className="flex items-start gap-3">
          <Sparkles
            className="size-4 shrink-0 mt-1 text-primary/80"
            aria-hidden
          />
          <h3 className="flex-1 text-base font-medium leading-snug">
            {idea.title}
          </h3>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground flex-1">
          {idea.description}
        </p>

        <div className="flex items-end justify-between gap-3 pt-3 border-t border-border/50">
          <div className="space-y-1">
            <Badge variant="secondary" className="text-xs">
              {idea.category}
            </Badge>
            <div className="text-lg font-medium tracking-tight">
              {formatRange(idea.priceMinEuros, idea.priceMaxEuros)}
            </div>
          </div>
          {idea.amazonQuery ? (
            <a
              href={linkHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: "sm" })}
            >
              {linkLabel}
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
