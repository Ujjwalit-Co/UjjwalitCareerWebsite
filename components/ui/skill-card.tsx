"use client"

import type { LucideIcon } from "lucide-react"
import dynamic from "next/dynamic"

const PixelCanvas = dynamic(() => import("@/components/ui/pixel-canvas").then((mod) => mod.PixelCanvas), {
  ssr: false,
})
import { cn } from "@/lib/utils"

interface SkillCardProps {
  name: string
  category: string
  icon: LucideIcon
  className?: string
}

export function SkillCard({ name, category, icon: Icon, className }: SkillCardProps) {
  return (
    <div
      className={cn(
        "group/card relative w-48 shrink-0 overflow-hidden rounded-xl border border-brand-border bg-brand-surface transition-colors duration-300 hover:border-brand-blue/60 sm:w-56",
        className,
      )}
    >
      {/* pixel reveal effect on hover */}
      <PixelCanvas
        gap={6}
        speed={30}
        colors={["#3B82F6", "#60A5FA", "#93C5FD"]}
        variant="icon"
      />

      <div className="relative z-10 flex flex-col gap-4 p-5">
        <div className="flex size-10 items-center justify-center rounded-lg border border-brand-border bg-brand-bg text-[#A1A1AA] transition-colors duration-300 group-hover/card:border-brand-blue/60 group-hover/card:text-brand-blue">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold tracking-tight text-[#F5F5F5]">
            {name}
          </span>
          <span className="font-mono text-[0.7rem] uppercase tracking-wider text-[#A1A1AA]">
            {category}
          </span>
        </div>
      </div>

      {/* bottom accent line */}
      <div
        aria-hidden="true"
        className="absolute inset-x-5 bottom-0 z-10 h-px scale-x-0 bg-gradient-to-r from-transparent via-brand-blue to-transparent opacity-0 transition-all duration-300 group-hover/card:scale-x-100 group-hover/card:opacity-100"
      />
    </div>
  )
}
