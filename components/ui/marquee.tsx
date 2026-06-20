"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface MarqueeProps {
  children: ReactNode
  /** Scroll the opposite direction */
  reverse?: boolean
  /** Pause the animation when the user hovers the row */
  pauseOnHover?: boolean
  /** Seconds for one full loop */
  duration?: number
  /** Gap between cards (any CSS length) */
  gap?: string
  className?: string
}

export function Marquee({
  children,
  reverse = false,
  pauseOnHover = true,
  duration = 40,
  gap = "1rem",
  className,
}: MarqueeProps) {
  return (
    <div
      className={cn("group flex w-full overflow-hidden", className)}
      style={
        {
          "--marquee-duration": `${duration}s`,
          "--marquee-gap": gap,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "flex w-max shrink-0 items-stretch [gap:var(--marquee-gap)]",
          reverse ? "animate-marquee-reverse" : "animate-marquee",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
      >
        <div className="flex shrink-0 items-stretch [gap:var(--marquee-gap)]">
          {children}
        </div>
        {/* duplicate for a seamless infinite loop */}
        <div
          aria-hidden="true"
          className="flex shrink-0 items-stretch [gap:var(--marquee-gap)]"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
