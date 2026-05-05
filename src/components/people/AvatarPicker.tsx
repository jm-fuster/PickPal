"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STYLES: { id: string; label: string }[] = [
  { id: "adventurer", label: "Aventurero" },
  { id: "avataaars", label: "Caricatura" },
  { id: "big-ears", label: "Big Ears" },
  { id: "big-smile", label: "Sonrisa" },
  { id: "lorelei", label: "Lorelei" },
  { id: "micah", label: "Minimalista" },
  { id: "miniavs", label: "Mini" },
  { id: "open-peeps", label: "Ilustrado" },
  { id: "personas", label: "Personas" },
  { id: "pixel-art", label: "Pixel" },
  { id: "notionists", label: "Notion" },
  { id: "croodles", label: "Garabatos" },
];

const GRID_COUNT = 12;

function buildUrl(style: string, seed: string): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

interface AvatarPickerProps {
  name: string;
  value: string | undefined;
  onChange: (url: string | undefined) => void;
}

export function AvatarPicker({ name, value, onChange }: AvatarPickerProps) {
  const [activeStyle, setActiveStyle] = useState(STYLES[0].id);
  const [shuffleOffset, setShuffleOffset] = useState(0);

  const effectiveSeed = name.trim() || "avatar";
  const options = Array.from({ length: GRID_COUNT }, (_, i) =>
    buildUrl(activeStyle, `${effectiveSeed}${shuffleOffset + i}`),
  );

  const handleStyleChange = (styleId: string) => {
    setActiveStyle(styleId);
    setShuffleOffset(0);
  };

  const handleClick = (url: string) => {
    onChange(url === value ? undefined : url);
  };

  return (
    <div className="space-y-3">
      {/* Selector de estilo */}
      <div className="flex flex-wrap gap-1.5">
        {STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => handleStyleChange(s.id)}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border",
              activeStyle === s.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Grid de avatares */}
      <div className="inline-grid grid-cols-6 gap-2">
        {options.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => handleClick(url)}
            className={cn(
              "rounded-full p-0.5 transition-all border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              url === value
                ? "border-primary ring-2 ring-primary ring-offset-2"
                : "border-transparent hover:border-muted-foreground/40",
            )}
            aria-label="Seleccionar avatar"
            aria-pressed={url === value}
          >
            <img
              src={url}
              alt=""
              className="size-12 rounded-full bg-muted"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShuffleOffset((prev) => prev + GRID_COUNT)}
        className="gap-1.5"
      >
        <RefreshCw className="size-3.5" />
        Regenerar
      </Button>
    </div>
  );
}
