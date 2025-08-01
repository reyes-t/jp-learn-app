
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

type ProgressProps = React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
  value?: number;
  indicatorClassName?: string;
  multiValue?: { value: number; className: string }[];
};


const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, multiValue, ...props }, ref) => {

  if (multiValue) {
    let accumulatedWidth = 0;
    return (
       <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...props}
      >
        {multiValue.map((item, index) => {
          const bar = (
             <div
              key={index}
              className={cn("absolute h-full", item.className)}
              style={{ width: `${item.value}%`, left: `${accumulatedWidth}%` }}
            />
          );
          accumulatedWidth += item.value;
          return bar;
        })}
      </ProgressPrimitive.Root>
    )
  }

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorClassName)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
