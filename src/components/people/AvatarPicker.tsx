"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STYLES = [
  "adventurer",
  "adventurer-neutral",
  "avataaars",
  "avataaars-neutral",
  "big-ears",
  "big-smile",
  "lorelei",
  "micah",
  "miniavs",
  "open-peeps",
  "personas",
  "pixel-art",
];

function buildUrl(style: string, seed: string): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

interface AvatarPickerProps {
  name: string;
  value: string | undefined;
  onChange: (url: string | undefined) => void;
}

export function AvatarPicker({ name, value, onChange }: AvatarPickerProps) {
  const [shuffleOffset, setShuffleOffset] = useState(0);

  const effectiveSeed = name.trim() || "avatar";
  const options = STYLES.map((style, i) =>
    buildUrl(style, `${effectiveSeed}${shuffleOffset + i}`),
  );

  const handleClick = (url: string) => {
    onChange(url === value ? undefined : url);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
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
              className="size-14 rounded-full bg-muted"
              loading="lazy"
            />
          </button>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShuffleOffset((prev) => prev + 12)}
        className="gap-1.5"
      >
        <RefreshCw className="size-3.5" />
        Regenerar
      </Button>
    </div>
  );
}
