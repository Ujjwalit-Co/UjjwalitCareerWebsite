"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface EnergyMeterProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  segments?: number;
  label?: string;
  orientation?: "horizontal" | "vertical";
  showValue?: boolean;
  colorOverride?: "blue" | "orange" | "teal" | "green";
}

function getVariant(value: number) {
  if (value < 30) return "critical";
  if (value <= 60) return "warning";
  return "primary";
}

const variantColors = {
  primary: {
    filled: "bg-blue-500 shadow-[0_0_7px_rgba(59,130,246,0.55)]",
    text: "text-blue-400",
  },
  warning: {
    filled: "bg-amber-500 shadow-[0_0_7px_rgba(245,158,11,0.55)]",
    text: "text-amber-400",
  },
  critical: {
    filled: "bg-red-500 shadow-[0_0_7px_rgba(239,68,68,0.55)]",
    text: "text-red-400",
  },
};

const overrideColors: Record<string, { filled: string; text: string }> = {
  blue:   { filled: "bg-blue-500 shadow-[0_0_7px_rgba(59,130,246,0.55)]",  text: "text-blue-400"   },
  orange: { filled: "bg-orange-500 shadow-[0_0_7px_rgba(249,115,22,0.55)]", text: "text-orange-400" },
  teal:   { filled: "bg-teal-400 shadow-[0_0_7px_rgba(45,212,191,0.55)]",   text: "text-teal-400"   },
  green:  { filled: "bg-green-500 shadow-[0_0_7px_rgba(34,197,94,0.55)]",   text: "text-green-400"  },
};

export function EnergyMeter({
  value,
  segments = 10,
  label,
  orientation = "horizontal",
  showValue = false,
  colorOverride,
  className,
  ...props
}: EnergyMeterProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const filledCount = Math.round((clamped / 100) * segments);
  const variant = getVariant(clamped);
  const colors = colorOverride ? overrideColors[colorOverride] : variantColors[variant];
  const isVertical = orientation === "vertical";

  const [visibleCount, setVisibleCount] = React.useState(0);
  React.useEffect(() => {
    if (filledCount === 0) { setVisibleCount(0); return; }
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setVisibleCount(current);
      if (current >= filledCount) clearInterval(interval);
    }, 55);
    return () => clearInterval(interval);
  }, [filledCount]);

  const [displayPercent, setDisplayPercent] = React.useState(0);
  React.useEffect(() => {
    const duration = filledCount * 55 + 80;
    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPercent(Math.round(clamped * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [clamped, filledCount]);

  return (
    <div
      data-slot="energy-meter"
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-3.5",
        className,
      )}
      {...props}
    >
      {/* scanline */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.04)_2px,rgba(0,0,0,0.04)_4px)] rounded-xl" />

      {(label || showValue) && (
        <div className="mb-2.5 flex items-center justify-between">
          {label && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
              {label}
            </span>
          )}
          {showValue && (
            <span className={cn("font-mono text-sm font-bold tabular-nums", colors.text)}>
              {displayPercent}%
            </span>
          )}
        </div>
      )}

      <div className={cn("flex gap-1", isVertical && "flex-col-reverse items-center")}>
        {Array.from({ length: segments }, (_, i) => {
          const isFilled = i < visibleCount;
          const isLast = i === visibleCount - 1;
          return (
            <div
              key={i}
              className={cn(
                "rounded-sm transition-all",
                isVertical ? "h-2 w-full" : "h-5 flex-1",
                isFilled ? cn(colors.filled, "duration-100") : "bg-slate-800 duration-300",
                isFilled && variant === "critical" && !colorOverride && "animate-pulse",
                isLast && isFilled && "scale-y-110",
              )}
            />
          );
        })}
      </div>

      {/* corner brackets */}
      <div className="pointer-events-none absolute left-0 top-0 h-2.5 w-2.5 border-l border-t border-slate-700" />
      <div className="pointer-events-none absolute right-0 top-0 h-2.5 w-2.5 border-r border-t border-slate-700" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l border-slate-700" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r border-slate-700" />
    </div>
  );
}

export default EnergyMeter;