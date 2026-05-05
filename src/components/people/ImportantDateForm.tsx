"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  importantDateSchema,
  type ImportantDateFormValues,
} from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const YEAR_START = 1900;
const YEAR_END = 2100;
const YEARS = Array.from({ length: YEAR_END - YEAR_START + 1 }, (_, i) =>
  String(YEAR_START + i),
);
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));

const ITEM_H = 48;

function formatDate(day: number, month: number, year?: number) {
  const m = MONTHS[month - 1]?.toLowerCase() ?? "";
  return year ? `${day} de ${m} de ${year}` : `${day} de ${m}`;
}

// ─── Scroll column ────────────────────────────────────────────────────────────

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

  // Scroll to initial position on mount (runs once)
  useEffect(() => {
    ref.current?.scrollTo({ top: initialIndex * ITEM_H, behavior: "instant" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function currentIndex() {
    const el = ref.current;
    if (!el) return initialIndex;
    return Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ITEM_H)));
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
    ref.current.scrollTop = dragStartTop.current + (dragStartY.current - e.clientY);
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

      {/* Center-item guide lines + fade edges */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-12 h-px bg-border" />
        <div className="absolute inset-x-0 bottom-12 h-px bg-border" />
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-popover to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-popover to-transparent" />
      </div>
    </div>
  );
}

// ─── Date picker dialog ───────────────────────────────────────────────────────

interface DatePickerDialogProps {
  open: boolean;
  day: number;
  month: number;
  year?: number;
  onChange: (day: number, month: number, year?: number) => void;
  onClose: () => void;
}

function DatePickerDialog({ open, day, month, year, onChange, onClose }: DatePickerDialogProps) {
  const [tmpDay, setTmpDay] = useState(day);
  const [tmpMonth, setTmpMonth] = useState(month);
  const [includeYear, setIncludeYear] = useState(year !== undefined);
  const [tmpYear, setTmpYear] = useState(year ?? new Date().getFullYear());

  // Reset temp state each time the dialog opens
  useEffect(() => {
    if (open) {
      setTmpDay(day);
      setTmpMonth(month);
      setIncludeYear(year !== undefined);
      setTmpYear(year ?? new Date().getFullYear());
    }
  }, [open, day, month, year]);

  function handleAccept() {
    onChange(tmpDay, tmpMonth, includeYear ? tmpYear : undefined);
    onClose();
  }

  // Key forces ScrollColumn to remount (and re-init scroll) when dialog opens
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
          <Button size="sm" onClick={handleAccept}>
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function ImportantDateForm({ personId }: { personId: Id<"people"> }) {
  const create = useMutation(api.importantDates.create);
  const [showForm, setShowForm] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ImportantDateFormValues>({
    resolver: zodResolver(importantDateSchema),
    defaultValues: { label: "Cumpleaños", month: 1, day: 1, recurring: true },
  });

  const watchedDay = useWatch({ control, name: "day" });
  const watchedMonth = useWatch({ control, name: "month" });
  const watchedYear = useWatch({ control, name: "year" });
  const watchedRecurring = useWatch({ control, name: "recurring" });

  const defaultValues = {
    label: "Cumpleaños",
    month: 1,
    day: 1,
    year: undefined,
    recurring: true,
    budgetMinEuros: undefined,
    budgetMaxEuros: undefined,
  };

  const onSubmit = async (values: ImportantDateFormValues) => {
    try {
      const { budgetMinEuros, budgetMaxEuros, ...rest } = values;
      await create({
        personId,
        ...rest,
        budgetMin: budgetMinEuros !== undefined ? Math.round(budgetMinEuros * 100) : undefined,
        budgetMax: budgetMaxEuros !== undefined ? Math.round(budgetMaxEuros * 100) : undefined,
      });
      toast.success("Fecha añadida");
      reset(defaultValues);
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo añadir la fecha");
    }
  };

  const handleCancel = () => {
    reset(defaultValues);
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
      >
        <Plus className="size-4" aria-hidden />
        Nueva fecha
      </button>
    );
  }

  return (
    <>
      <DatePickerDialog
        open={pickerOpen}
        day={watchedDay ?? 1}
        month={watchedMonth ?? 1}
        year={watchedYear}
        onChange={(d, m, y) => {
          setValue("day", d, { shouldValidate: true });
          setValue("month", m, { shouldValidate: true });
          setValue("year", y as number | undefined);
        }}
        onClose={() => setPickerOpen(false)}
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-3 rounded-xl border border-dashed border-border/70 bg-background/40 p-4"
      >
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Añadir fecha
        </p>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="date-label">Etiqueta</Label>
            <Input id="date-label" {...register("label")} />
            {errors.label ? (
              <p className="text-xs text-destructive">{errors.label.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="h-8 w-full rounded-md border bg-background px-3 text-sm text-left transition-colors hover:bg-muted/50"
            >
              {formatDate(watchedDay ?? 1, watchedMonth ?? 1, watchedYear)}
            </button>
            {/* Hidden RHF fields */}
            <input type="hidden" {...register("day", { valueAsNumber: true })} />
            <input type="hidden" {...register("month", { valueAsNumber: true })} />
            <input
              type="hidden"
              {...register("year", {
                setValueAs: (v) =>
                  v === "" || v === null || v === undefined ? undefined : Number(v),
              })}
            />
            {errors.day || errors.month ? (
              <p className="text-xs text-destructive">Fecha no válida</p>
            ) : null}
            {errors.year ? (
              <p className="text-xs text-destructive">{errors.year.message}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5 max-w-[14rem]">
          <Label htmlFor="date-recurring">Recurrencia</Label>
          <select
            id="date-recurring"
            className="h-8 w-full rounded-md border bg-background px-2 text-sm"
            {...register("recurring", {
              setValueAs: (v) => v === "true" || v === true,
            })}
          >
            <option value="true">Todos los años</option>
            <option value="false">Fecha única</option>
          </select>
          {watchedRecurring === false && !watchedYear ? (
            <p className="text-xs text-muted-foreground">
              Activa &ldquo;Incluir año&rdquo; en el selector de fecha.
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-xs">
          <div className="space-y-1.5">
            <Label htmlFor="date-budget-min">Presupuesto mín. € (opcional)</Label>
            <Input
              id="date-budget-min"
              type="number"
              min={0}
              step={1}
              {...register("budgetMinEuros", {
                setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
              })}
            />
            {errors.budgetMinEuros ? (
              <p className="text-xs text-destructive">{errors.budgetMinEuros.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date-budget-max">Presupuesto máx. € (opcional)</Label>
            <Input
              id="date-budget-max"
              type="number"
              min={0}
              step={1}
              {...register("budgetMaxEuros", {
                setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
              })}
            />
            {errors.budgetMaxEuros ? (
              <p className="text-xs text-destructive">{errors.budgetMaxEuros.message}</p>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Guardando…" : "Añadir fecha"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </>
  );
}
