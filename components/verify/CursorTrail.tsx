"use client"

import React, { useEffect, useRef } from "react"

const ORANGE = "#F97316"
const BLUE = "#3B82F6"

const RADIUS = 10
const GAP = 6
const PIXEL_MAX = 3
const CYCLE_MS = 1800
const TRAIL_MAX = 70
const TRAIL_STEP = 0.03

function lerpColor(a: string, b: string, t: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)]
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)]
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t)
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t)
  const blue = Math.round(pa[2] + (pb[2] - pa[2]) * t)
  return `rgb(${r},${g},${blue})`
}

function hash(px: number, py: number): number {
  const s = Math.sin(px * 12.9898 + py * 78.233) * 43758.5453
  return s - Math.floor(s)
}

interface TrailPoint {
  x: number
  y: number
  life: number
}

function drawGlitchCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alphaMul: number,
  now: number,
) {
  const x0 = Math.floor(x - radius)
  const x1 = Math.ceil(x + radius)
  const y0 = Math.floor(y - radius)
  const y1 = Math.ceil(y + radius)

  for (let px = x0; px <= x1; px += GAP) {
    for (let py = y0; py <= y1; py += GAP) {
      const dx = px - x
      const dy = py - y
      const d2 = dx * dx + dy * dy
      if (d2 > radius * radius) continue

      const d = Math.sqrt(d2)
      const seed = hash(px, py)
      const flicker = Math.sin(now * 0.005 + seed * Math.PI * 2 + d * 0.2)
      const activePixel = flicker > 0.25

      const size = PIXEL_MAX * (0.4 + seed * 0.6)
      const alpha = (activePixel ? 0.55 + 0.35 * Math.abs(flicker) : 0.1) * alphaMul

      if (alpha > 0.02) {
        ctx.globalAlpha = Math.min(1, alpha)
        ctx.fillStyle = color
        ctx.fillRect(px - size / 2, py - size / 2, size, size)
      }
    }
  }
  ctx.globalAlpha = 1
}

export default function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const finePointer = window.matchMedia("(pointer: fine)").matches
    if (prefersReduced || !finePointer) return

    let raf = 0
    let mx = -999
    let my = -999
    let cx = -999
    let cy = -999
    let active = false
    let trail: TrailPoint[] = []

    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      if (!active) {
        active = true
        cx = mx
        cy = my
        trail = []
      }
    }
    const onLeave = () => {
      active = false
      mx = -999
      my = -999
    }
    const onResize = () => resize()

    window.addEventListener("mousemove", onMove, { passive: true })
    window.addEventListener("mouseleave", onLeave)
    window.addEventListener("resize", onResize)

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (!active) return

      cx += (mx - cx) * 0.9
      cy += (my - cy) * 0.9

      const cycle = (now % CYCLE_MS) / CYCLE_MS
      const hue = cycle < 0.5 ? cycle * 2 : 1 - (cycle - 0.5) * 2
      const color = lerpColor(BLUE, ORANGE, hue)

      trail.push({ x: mx, y: my, life: 1 })
      for (const p of trail) p.life -= TRAIL_STEP
      trail = trail.filter((p) => p.life > 0)
      if (trail.length > TRAIL_MAX) trail = trail.slice(trail.length - TRAIL_MAX)

      for (const p of trail) {
        drawGlitchCircle(ctx, p.x, p.y, RADIUS * (0.45 + p.life * 0.55), color, 0.1 + p.life * 0.45, now)
      }

      drawGlitchCircle(ctx, cx, cy, RADIUS, color, 1, now)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseleave", onLeave)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[60]"
      aria-hidden="true"
    />
  )
}