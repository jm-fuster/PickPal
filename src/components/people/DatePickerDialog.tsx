"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

export const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export const YEAR_START = 1900;
export const YEAR_END = 2100;
export const YEARS = Array.from(
  { length: YEAR_END - YEAR_START + 1 },
  (_, i) => String(YEAR_START + i),
);
export const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));

const ITEM_H = 48;

export function formatDate(day: number, month: number, year?: number) {
  const m = MONTHS[month - 1]?.toLowerCase() ?? "";
  return year ? `${day} de ${m} de ${year}` : `${day} de ${m}`;
}

interface ScrollColumnProps {
  items: string[];
  initialIndex: number;
  onChange: (index: number) => void;
}

function ScrollColumn({ items, initialIndex, onChange }: ScrollColumnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartTop = useRef(0);
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: initialIndex * ITEM_H, behavior: "instant" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function currentIndex() {
    const el = ref.current;
    if (!el) return initialIndex;
    return Math.max(
      0,
      Math.min(items.length - 1, Math.round(el.scrollTop / ITEM_H)),
    );
  }

  function snapToNearest() {
    const el = ref.current;
    if (!el) return;
    const idx = currentIndex();
    el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    onChange(idx);
  }

  function handleScroll() {
    if (dragging.current) return;
    onChange(currentIndex());
    if (snapTimer.current) clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(snapToNearest, 120);
  }

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    dragging.current = true;
    dragStartY.current = e.clientY;
    dragStartTop.current = ref.current?.scrollTop ?? 0;
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging.current || !ref.current) return;
    ref.current.scrollTop =
      dragStartTop.current + (dragStartY.current - e.clientY);
    onChange(currentIndex());
  }

  function handleMouseUp() {
    if (!dragging.current) return;
    dragging.current = false;
    snapToNearest();
  }

  return (
    <div className="relative flex-1 h-36 overflow-hidden">
      <div
        ref={ref}
        className="h-full overflow-y-scroll cursor-grab active:cursor-grabbing select-none"
        style={{ scrollbarWidth: "none" } as React.CSSProperties}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="py-12">
          {items.map((item, i) => (
            <div
              key={i}
              className="h-12 flex items-center justify-center text-lg select-none"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-12 h-px bg-border" />
        <div className="absolute inset-x-0 bottom-12 h-px bg-border" />
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-popover to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-popover to-transparent" />
      </div>
    </div>
  );
}

interface DatePickerDialogProps {
  open: boolean;
  day: number;
  month: number;
  year?: number;
  onChange: (day: number, month: number, year?: number) => void;
  onClose: () => void;
}

export function DatePickerDialog({
  open,
  day,
  month,
  year,
  onChange,
  onClose,
}: DatePickerDialogProps) {
  const [tmpDay, setTmpDay] = useState(day);
  const [tmpMonth, setTmpMonth] = useState(month);
  const [includeYear, setIncludeYear] = useState(year !== undefined);
  const [tmpYear, setTmpYear] = useState(year ?? new Date().getFullYear());

  useEffect(() => {
    if (open) {
      setTmpDay(day);
      setTmpMonth(month);
      setIncludeYear(year !== undefined);
      setTmpYear(year ?? new Date().getFullYear());
    }
  }, [open, day, month, year]);

  const openKey = open ? "open" : "closed";

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => { if (!o) onClose(); }}>
      <DialogContent showCloseButton={false}>
        <DialogTitle className="text-2xl font-light text-center tracking-tight">
          {formatDate(tmpDay, tmpMonth, includeYear ? tmpYear : undefined)}
        </DialogTitle>

        <div className="flex gap-1">
          <ScrollColumn
            key={`day-${openKey}`}
            items={DAYS}
            initialIndex={tmpDay - 1}
            onChange={(i) => setTmpDay(i + 1)}
          />
          <ScrollColumn
            key={`month-${openKey}`}
            items={MONTHS_SHORT}
            initialIndex={tmpMonth - 1}
            onChange={(i) => setTmpMonth(i + 1)}
          />
          {includeYear && (
            <ScrollColumn
              key={`year-${openKey}`}
              items={YEARS}
              initialIndex={tmpYear - YEAR_START}
              onChange={(i) => setTmpYear(i + YEAR_START)}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={includeYear}
            onCheckedChange={setIncludeYear}
            id="picker-include-year"
          />
          <label
            htmlFor="picker-include-year"
            className="text-sm cursor-pointer select-none"
          >
            Incluir año
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onChange(tmpDay, tmpMonth, includeYear ? tmpYear : undefined);
              onClose();
            }}
          >
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
