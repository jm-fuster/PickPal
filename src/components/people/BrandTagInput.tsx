"use client";

import { useRef, useState, KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeInterest } from "@/lib/interests";

// Espejo de MAX_BRANDS en convex/validators.ts — si cambia allí, cambiar aquí.
export const MAX_BRANDS = 10;

interface BrandTagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

/**
 * Input de tags libre para marcas favoritas. Mismo patrón de chips que
 * InterestTagInput pero sin catálogo: las marcas son un vocabulario abierto
 * (Nike, LEGO, Lush…) que no tiene sentido autocompletar localmente.
 */
export function BrandTagInput({
  value,
  onChange,
  placeholder = "LEGO, Nike, Apple…",
}: BrandTagInputProps) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const atCap = value.length >= MAX_BRANDS;

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag || atCap) return;
    const normalized = normalizeInterest(tag);
    if (!value.some((t) => normalizeInterest(t) === normalized)) {
      onChange([...value, tag]);
    }
    setDraft("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
      // Keep the input focused so the user can keep typing tags on mobile.
      inputRef.current?.focus();
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <li key={tag}>
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80 transition-colors"
                title="Eliminar"
                aria-label={`Eliminar ${tag}`}
                render={<button type="button" onClick={() => removeTag(tag)} />}
              >
                {tag}
                <X className="size-3" aria-hidden />
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          enterKeyHint="done"
          placeholder={atCap ? "Máximo alcanzado" : placeholder}
          disabled={atCap}
          aria-label="Nueva marca favorita"
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => {
            addTag(draft);
            inputRef.current?.focus();
          }}
          disabled={!draft.trim() || atCap}
          aria-label="Añadir marca"
        >
          <Plus className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
