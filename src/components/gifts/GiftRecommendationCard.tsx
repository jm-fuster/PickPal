import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { generateAmazonUrl } from "@/lib/amazon";
import type { GiftRecommendation } from "@/lib/gifts";

const formatRange = (min: number, max: number) =>
  min === max ? `${Math.round(min)}€` : `${Math.round(min)}€ – ${Math.round(max)}€`;

export function GiftRecommendationCard({ idea }: { idea: GiftRecommendation }) {
  return (
    <Card className="flex flex-col h-full border-border/60 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium leading-tight">{idea.title}</h3>
          <Badge variant="secondary" className="shrink-0">
            {idea.category}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground flex-1">
          {idea.description}
        </p>

        <div className="flex items-center justify-between gap-3 pt-2">
          <span className="text-sm font-medium">
            {formatRange(idea.priceMinEuros, idea.priceMaxEuros)}
          </span>
          <a
            href={generateAmazonUrl(idea.amazonQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ size: "sm" })}
          >
            Buscar en Amazon
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
