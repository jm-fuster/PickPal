"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STYLE = "dylan";
const GRID_COUNT = 12;

const HAIR_COLORS = ["000000", "ff543d", "e8c170", "8b4513", "d2691e", "ffffff", "transparent"];
const MOODS = ["happy", "angry", "hopeful", "confused", "superHappy", "neutral"];

function buildUrl(seed: string): string {
  const hair = HAIR_COLORS.map((c) => `hairColor[]=${c}`).join("&");
  const mood = MOODS.map((m) => `mood[]=${m}`).join("&");
  return `https://api.dicebear.com/9.x/${STYLE}/svg?seed=${encodeURIComponent(seed)}&${hair}&${mood}`;
}

interface AvatarPickerProps {
  value: string | undefined;
  onChange: (url: string | undefined) => void;
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const [shuffleOffset, setShuffleOffset] = useState(0);

  const effectiveSeed = "avatar";
  const options = Array.from({ length: GRID_COUNT }, (_, i) =>
    buildUrl(`${effectiveSeed}${shuffleOffset + i}`),
  );

  const handleClick = (url: string) => {
    onChange(url === value ? undefined : url);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 justify-items-center">
        {options.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => handleClick(url)}
            className={cn(
              "rounded-full p-0.5 transition-all border-2 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              url === value
                ? "border-primary ring-2 ring-primary ring-offset-2"
                : "border-transparent hover:border-muted-foreground/40",
            )}
            aria-label="Select avatar"
            aria-pressed={url === value}
          >
            <img
              src={url}
              alt=""
              className="size-12 rounded-full bg-muted block"
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
