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
  SliderRoot,
  SliderControl,
  SliderTrack,
  SliderIndicator,
  SliderThumb,
} from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

// ─── Budget range slider ──────────────────────────────────────────────────────

const BUDGET_MAX = 500;
const BUDGET_STEP = 5;

interface BudgetRangeSliderProps {
  minValue: number | undefined;
  maxValue: number | undefined;
  onMinChange: (v: number | undefined) => void;
  onMaxChange: (v: number | undefined) => void;
  minError?: string;
  maxError?: string;
}

function BudgetRangeSlider({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minError,
  maxError,
}: BudgetRangeSliderProps) {
  const sliderMin = Math.min(Math.max(minValue ?? 0, 0), BUDGET_MAX);
  const sliderMax = Math.min(Math.max(maxValue ?? BUDGET_MAX, 0), BUDGET_MAX);

  return (
    <div className="space-y-3">
      <Label>Presupuesto (opcional)</Label>

      <SliderRoot
        value={[sliderMin, sliderMax]}
        onValueChange={(values) => {
          const [lo, hi] = values as number[];
          onMinChange(lo);
          onMaxChange(hi);
        }}
        min={0}
        max={BUDGET_MAX}
        step={BUDGET_STEP}
        minStepsBetweenValues={BUDGET_STEP}
        className="py-2"
      >
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
          </SliderTrack>
          <SliderThumb getAriaLabel={() => "Presupuesto mínimo"} />
          <SliderThumb getAriaLabel={() => "Presupuesto máximo"} />
        </SliderControl>
      </SliderRoot>

      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={0}
            step={1}
            placeholder="Mín."
            value={minValue ?? ""}
            onChange={(e) =>
              onMinChange(e.target.value !== "" ? Number(e.target.value) : undefined)
            }
            className="h-7 w-20 text-sm"
          />
          <span className="text-muted-foreground">€</span>
        </div>
        <span className="text-muted-foreground">–</span>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={0}
            step={1}
            placeholder="Máx."
            value={maxValue ?? ""}
            onChange={(e) =>
              onMaxChange(e.target.value !== "" ? Number(e.target.value) : undefined)
            }
            className="h-7 w-20 text-sm"
          />
          <span className="text-muted-foreground">€</span>
        </div>
      </div>

      {minError || maxError ? (
        <p className="text-xs text-destructive">{minError ?? maxError}</p>
      ) : null}
    </div>
  );
}

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

// ─── Scroll column (mobile picker) ───────────────────────────────────────────

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
            <div key={i} className="h-12 flex items-center justify-center text-lg select-none">
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

// ─── Date picker dialog (mobile) ─────────────────────────────────────────────

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
          <label htmlFor="picker-include-year" className="text-sm cursor-pointer select-none">
            Incluir año
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={() => { onChange(tmpDay, tmpMonth, includeYear ? tmpYear : undefined); onClose(); }}>
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
  const watchedBudgetMin = useWatch({ control, name: "budgetMinEuros" });
  const watchedBudgetMax = useWatch({ control, name: "budgetMaxEuros" });

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
      {/* Mobile drum-roll picker (rendered in a portal, not inside <form>) */}
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

        {/* Etiqueta — full width on both breakpoints */}
        <div className="space-y-1.5">
          <Label htmlFor="date-label">Etiqueta</Label>
          <Input id="date-label" {...register("label")} />
          {errors.label ? (
            <p className="text-xs text-destructive">{errors.label.message}</p>
          ) : null}
        </div>

        {/*
          Hidden inputs keep RHF registered for day / month / year.
          Both the desktop inputs and the mobile picker write to these
          via setValue, so there's a single source of truth.
        */}
        <input type="hidden" {...register("day", { valueAsNumber: true })} />
        <input type="hidden" {...register("month", { valueAsNumber: true })} />
        <input
          type="hidden"
          {...register("year", {
            setValueAs: (v) =>
              v === "" || v === null || v === undefined ? undefined : Number(v),
          })}
        />

        {/* ── Desktop: three inline inputs ── */}
        <div className="hidden md:grid md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="date-day-desktop">Día</Label>
            <Input
              id="date-day-desktop"
              type="number"
              min={1}
              max={31}
              placeholder="Día"
              value={watchedDay ?? ""}
              onChange={(e) =>
                setValue("day", e.target.value ? Number(e.target.value) : 1, {
                  shouldValidate: true,
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date-month-desktop">Mes</Label>
            <select
              id="date-month-desktop"
              className="h-8 w-full rounded-md border bg-background px-2 text-sm"
              value={watchedMonth ?? 1}
              onChange={(e) =>
                setValue("month", Number(e.target.value), { shouldValidate: true })
              }
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date-year-desktop">Año (opcional)</Label>
            <Input
              id="date-year-desktop"
              type="number"
              min={1900}
              max={2100}
              placeholder="Año (opcional)"
              value={watchedYear ?? ""}
              onChange={(e) =>
                setValue("year", e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>
          {errors.day || errors.month || errors.year ? (
            <p className="text-xs text-destructive md:col-span-3">
              {errors.day?.message ?? errors.month?.message ?? errors.year?.message}
            </p>
          ) : null}
        </div>

        {/* ── Mobile: single button that opens drum-roll picker ── */}
        <div className="md:hidden space-y-1.5">
          <Label>Fecha</Label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="h-8 w-full rounded-md border bg-background px-3 text-sm text-left transition-colors hover:bg-muted/50"
          >
            {formatDate(watchedDay ?? 1, watchedMonth ?? 1, watchedYear)}
          </button>
          {errors.day || errors.month || errors.year ? (
            <p className="text-xs text-destructive">
              {errors.day?.message ?? errors.month?.message ?? errors.year?.message}
            </p>
          ) : null}
        </div>

        {/* Recurrencia */}
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
              Indica el año en el campo Año (obligatorio para fechas únicas).
            </p>
          ) : null}
        </div>

        {/* Hidden RHF registrations for budget fields */}
        <input
          type="hidden"
          {...register("budgetMinEuros", {
            setValueAs: (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
          })}
        />
        <input
          type="hidden"
          {...register("budgetMaxEuros", {
            setValueAs: (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
          })}
        />

        {/* Presupuesto */}
        <BudgetRangeSlider
          minValue={watchedBudgetMin}
          maxValue={watchedBudgetMax}
          onMinChange={(v) => setValue("budgetMinEuros", v)}
          onMaxChange={(v) => setValue("budgetMaxEuros", v)}
          minError={errors.budgetMinEuros?.message}
          maxError={errors.budgetMaxEuros?.message}
        />

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
