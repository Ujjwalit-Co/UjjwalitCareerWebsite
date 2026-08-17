'use client';

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface PlaceholderDef {
  key: string;
  description: string;
}

interface PlaceholderGuideProps {
  title?: string;
  placeholders: PlaceholderDef[];
  className?: string;
  align?: 'left' | 'right';
}

export function PlaceholderGuide({ title = 'Available placeholders', placeholders, className = '', align = 'right' }: PlaceholderGuideProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-brand-orange transition-colors cursor-pointer shrink-0"
        aria-label="Placeholder guide"
      >
        <HelpCircle size={12} /> <span className="underline decoration-dotted">Keys</span>
      </button>

      {open && (
        <span
          className={`absolute top-5 z-50 w-56 p-2.5 rounded-lg border border-slate-800 bg-slate-950 shadow-2xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            {title}
          </span>
          <span className="block space-y-1.5">
            {placeholders.map((p) => (
              <span key={p.key} className="flex items-start gap-1.5">
                <code className="text-[10px] font-mono text-cyan-400 shrink-0">{p.key}</code>
                <span className="text-[10px] leading-tight text-slate-400">{p.description}</span>
              </span>
            ))}
          </span>
        </span>
      )}
    </span>
  );
}