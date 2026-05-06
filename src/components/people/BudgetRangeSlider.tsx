"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SliderRoot,
  SliderControl,
  SliderTrack,
  SliderIndicator,
  SliderThumb,
} from "@/components/ui/slider";

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

export function BudgetRangeSlider({
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
