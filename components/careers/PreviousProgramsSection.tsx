'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarClock, Clock, MapPin, History } from 'lucide-react';
import { type Opportunity } from '@/lib/opportunities.shared';

export const PreviousProgramsSection = ({ programs }: { programs: Opportunity[] }) => {
  if (programs.length === 0) return null;

  return (
    <section id="previous-programs" className="border-b border-brand-border bg-brand-bg px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">Previous Programs</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#F5F5F5] sm:text-4xl">Our past cohorts and events.</h2>
            <p className="max-w-2xl text-base font-medium leading-7 text-[#A1A1AA]">
              Programs we have already conducted. Explore the details of previous sessions and check where our alumni trained.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program, index) => (
            <motion.article
              key={program.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="rounded-lg border border-brand-border bg-brand-secondary p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-orange">
                  <History size={20} />
                </div>
                <span className="rounded-md border border-brand-border px-2.5 py-1 font-mono text-xs text-[#A1A1AA]">Program concluded</span>
              </div>
              <h3 className="mt-5 text-xl font-extrabold text-[#F5F5F5]">{program.title}</h3>
              {program.cohort_label && (
                <p className="mt-1 text-xs font-semibold text-brand-blue">{program.cohort_label}</p>
              )}
              <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">{program.tagline}</p>
              <div className="mt-5 flex flex-wrap gap-4 border-t border-brand-border pt-4 text-xs font-semibold text-[#A1A1AA]">
                <span className="flex items-center gap-2"><Clock size={14} /> {program.duration_label}</span>
                <span className="flex items-center gap-2"><MapPin size={14} /> {program.location_label}</span>
                {program.ends_on && (
                  <span className="flex items-center gap-2"><CalendarClock size={14} /> Ended {new Date(program.ends_on).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}</span>
                )}
              </div>
              <Link href={`/careers/opportunities/${program.slug}`} className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-orange hover:text-orange-400">
                View program details <ArrowRight size={14} />
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
