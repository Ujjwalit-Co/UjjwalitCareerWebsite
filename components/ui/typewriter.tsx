'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TypewriterProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  loop?: boolean;
  pauseAfter?: number;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'p';
}

export function Typewriter({
  text,
  className,
  speed = 50,
  delay = 500,
  loop = false,
  pauseAfter = 2000,
  as: Tag = 'span',
}: TypewriterProps) {
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase] = useState<'idle' | 'typing' | 'pause' | 'deleting'>('idle');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = setTimeout(() => setPhase('typing'), delay);
          observer.disconnect();
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  useEffect(() => {
    if (phase === 'idle') return;
    if (phase === 'typing' && displayed.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayed(text.slice(0, displayed.length + 1));
      }, speed);
      return () => clearTimeout(timer);
    }
    if (phase === 'typing' && displayed.length === text.length && loop) {
      const timer = setTimeout(() => setPhase('pause'), pauseAfter);
      return () => clearTimeout(timer);
    }
    if (phase === 'pause' && loop) {
      const timer = setTimeout(() => setPhase('deleting'), 500);
      return () => clearTimeout(timer);
    }
    if (phase === 'deleting' && displayed.length > 0) {
      const timer = setTimeout(() => {
        setDisplayed(text.slice(0, displayed.length - 1));
      }, speed / 2);
      return () => clearTimeout(timer);
    }
    if (phase === 'deleting' && displayed.length === 0) {
      const timer = setTimeout(() => setPhase('typing'), delay);
      return () => clearTimeout(timer);
    }
  }, [phase, displayed, text, speed, loop, pauseAfter, delay]);

  return (
    <div ref={wrapperRef} className="inline">
      <Tag className={cn(className)}>
        {displayed}
        {(phase === 'typing' || phase === 'deleting') && displayed.length > 0 && (
          <span className="inline-block w-[2px] h-[1em] bg-brand-orange ml-0.5 animate-pulse align-middle" />
        )}
      </Tag>
    </div>
  );
}
