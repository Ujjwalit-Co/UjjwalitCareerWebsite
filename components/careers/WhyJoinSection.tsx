'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const rows = [
  ['Watch Tutorials', 'Build Projects'],
  ['Theory First', 'Product First'],
  ['Generic Certificates', 'Verifiable Credentials'],
  ['Individual Learning', 'Mentored Development'],
];

export const WhyJoinSection = () => {
  return (
    <section id="about" className="border-b border-brand-border bg-brand-secondary px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-4">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">Why Join</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#F5F5F5] sm:text-4xl">A sharper path than passive learning.</h2>
          <p className="max-w-xl text-base font-medium leading-7 text-[#A1A1AA]">
            UDP is selective by design. The focus is on guided implementation, review habits, deployment discipline, and credentials that can be checked.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden rounded-lg border border-brand-border bg-brand-bg"
        >
          <div className="grid grid-cols-[1fr_auto_1fr] border-b border-brand-border bg-brand-surface px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A1A1AA]">
            <span>Traditional Learning</span>
            <span />
            <span className="text-right text-brand-blue">UDP</span>
          </div>
          {rows.map(([traditional, udp]) => (
            <div key={traditional} className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-brand-border px-4 py-4 last:border-b-0">
              <span className="text-sm font-semibold text-[#A1A1AA]">{traditional}</span>
              <ArrowRight size={16} className="text-brand-orange" />
              <span className="text-right text-sm font-bold text-[#F5F5F5]">{udp}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
