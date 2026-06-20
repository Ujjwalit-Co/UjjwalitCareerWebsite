'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Award, Calendar, CheckCircle2, Clock, Code2, Rocket, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Opportunity, formatFee } from '@/lib/opportunities.shared';

const roadmap = [
  { title: 'Resume-Ready Product', detail: 'A production-grade project with real workflows, clean UI, and a clear story for interviews.', icon: Code2 },
  { title: 'Full Implementation Flow', detail: 'Plan features, build interfaces, connect data, handle edge cases, and iterate through review.', icon: CheckCircle2 },
  { title: 'Live Deployment', detail: 'Publish your work with repository hygiene, environment setup, and production checks.', icon: Rocket },
  { title: 'Verified Proof', detail: 'Leave with a portfolio artifact and QR-verifiable credential tied to your completed work.', icon: ShieldCheck },
];

export const ProgramsSection = ({ opportunities }: { opportunities: Opportunity[] }) => {
  const openPrograms = opportunities.filter((item) => item.status === 'open' && item.visibility === 'public');

  return (
    <section id="programs" className="border-b border-brand-border bg-brand-bg px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div className="space-y-4">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">Program</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#F5F5F5] sm:text-4xl md:text-5xl">What You Will Build</h2>
            <p className="max-w-2xl text-base font-medium leading-7 text-[#A1A1AA]">
              Every internship can have a different domain, but the outcome stays consistent: build something credible, useful, reviewable, and strong enough to discuss on your resume.
            </p>
          </div>
          <div className="rounded-lg border border-brand-border bg-brand-secondary p-4 font-mono text-xs text-[#A1A1AA]">
            <div className="flex items-center justify-between gap-4">
              <span>admin.controlled_programs</span>
              <span className="text-brand-success">{openPrograms.length} open</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {roadmap.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="relative rounded-lg border border-brand-border bg-brand-secondary p-5"
              >
                {index < roadmap.length - 1 && <div className="absolute right-[-10px] top-1/2 z-10 hidden h-px w-5 bg-brand-blue md:block" />}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-blue">
                  <Icon size={18} />
                </div>
                <h3 className="mt-5 text-lg font-extrabold text-[#F5F5F5]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">{item.detail}</p>
              </motion.div>
            );
          })}
        </div>

{openPrograms.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {openPrograms.map((program) => (
              <article key={program.id} className="rounded-xl border border-brand-border bg-brand-secondary p-6 shadow-md transition-shadow duration-300 hover:shadow-lg">
                <div className="space-y-4">
                  <div>
                    <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-brand-blue">Open Cohort</span>
                    <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-[#F5F5F5]">{program.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#A1A1AA]">{program.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Duration', program.duration_label || 'Open', Clock],
                      ['Fee', formatFee(program.price_inr), Calendar],
                      ['Level', program.type === 'project' ? 'Project track' : 'Selective', Award],
                      ['Outcome', 'Portfolio project', Code2],
                      ['Certificate', 'QR verifiable', ShieldCheck],
                    ].map(([label, value, Icon]) => (
                      <div key={String(label)} className="rounded-lg border border-brand-border bg-brand-bg p-3">
                        {React.createElement(Icon as typeof Clock, { size: 16, className: 'text-brand-orange' })}
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#71717A]">{label as string}</p>
                        <p className="mt-0.5 text-sm font-bold text-[#F5F5F5]">{value as string}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row pt-2">
                    <Link href={`/careers/opportunities/${program.slug}`} className="flex-1">
                      <Button className="w-full gap-2">Apply Now <ArrowRight size={16} /></Button>
                    </Link>
                    <Link href={`/careers/opportunities/${program.slug}`} className="flex-1">
                      <Button variant="outline" className="w-full">View Details</Button>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-brand-border bg-brand-secondary p-6">
            <h3 className="text-xl font-extrabold text-[#F5F5F5]">No open programs right now.</h3>
            <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">New cohorts will appear here as soon as they are published from the admin dashboard.</p>
          </div>
        )}
      </div>
    </section>
  );
};
