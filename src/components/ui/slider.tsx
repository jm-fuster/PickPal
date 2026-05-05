"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { cn } from "@/lib/utils"

function SliderRoot({
  className,
  ...props
}: SliderPrimitive.Root.Props<number | readonly number[]>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      {...props}
    />
  )
}

function SliderControl({ className, ...props }: SliderPrimitive.Control.Props) {
  return (
    <SliderPrimitive.Control
      data-slot="slider-control"
      className={cn("relative flex w-full items-center", className)}
      {...props}
    />
  )
}

function SliderTrack({ className, ...props }: SliderPrimitive.Track.Props) {
  return (
    <SliderPrimitive.Track
      data-slot="slider-track"
      className={cn(
        "relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted",
        className,
      )}
      {...props}
    />
  )
}

function SliderIndicator({ className, ...props }: SliderPrimitive.Indicator.Props) {
  return (
    <SliderPrimitive.Indicator
      data-slot="slider-indicator"
      className={cn("absolute h-full bg-primary", className)}
      {...props}
    />
  )
}

function SliderThumb({ className, ...props }: SliderPrimitive.Thumb.Props) {
  return (
    <SliderPrimitive.Thumb
      data-slot="slider-thumb"
      className={cn(
        "block size-4 shrink-0 rounded-full bg-primary shadow-sm outline-none ring-ring/50 transition-[width,height] focus-visible:ring-3 data-dragging:size-5 data-dragging:ring-3",
        className,
      )}
      {...props}
    />
  )
}

export { SliderRoot, SliderControl, SliderTrack, SliderIndicator, SliderThumb }
