"use client";

import { useRef, useState, KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InterestTagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

export function InterestTagInput({
  value,
  onChange,
  placeholder = "Añade un interés y pulsa +",
}: InterestTagInputProps) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = () => {
    const tag = draft.trim();
    if (!tag) return;
    if (value.includes(tag)) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
      // Keep the input focused so the user can keep typing tags on mobile.
      inputRef.current?.focus();
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleAddClick = () => {
    addTag();
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => removeTag(tag)}
              title="Eliminar"
            >
              {tag} ×
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          enterKeyHint="done"
          placeholder={placeholder}
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={handleAddClick}
          disabled={!draft.trim()}
          aria-label="Añadir interés"
        >
          <Plus className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
