import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: ReactNode;
  descriptionClassName?: string;
  cta?: ReactNode;
  /** Padding compacto (`p-10`) para variantes secundarias, p. ej. "sin resultados en este filtro". Por defecto `p-14`. */
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  descriptionClassName,
  cta,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border/70 bg-card/40 text-center",
        compact ? "p-10" : "p-14",
        className,
      )}
    >
      {Icon && (
        <div className="mb-3 flex justify-center" aria-hidden>
          <Icon className="size-9 text-muted-foreground" />
        </div>
      )}
      {title && <h2 className="text-2xl font-medium mb-2">{title}</h2>}
      {description && (
        <p
          className={cn(
            "text-sm text-muted-foreground max-w-sm mx-auto",
            cta && "mb-6",
            descriptionClassName,
          )}
        >
          {description}
        </p>
      )}
      {cta}
    </div>
  );
}
