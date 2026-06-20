'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Award, Calendar, CheckCircle2, Clock, Code2, Rocket, ShieldCheck, ChevronDown, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Typewriter } from '@/components/ui/typewriter';
import { PixelCanvas } from '@/components/ui/pixel-canvas';
import { CpuArchitecture } from '@/components/ui/cpu-architecture';
import { Opportunity, formatFee } from '@/lib/opportunities.shared';

const roadmap = [
  { title: 'Resume-Ready Product', detail: 'A production-grade project with real workflows, clean UI, and a clear story for interviews.', icon: Code2 },
  { title: 'Full Implementation Flow', detail: 'Plan features, build interfaces, connect data, handle edge cases, and iterate through review.', icon: CheckCircle2 },
  { title: 'Live Deployment', detail: 'Publish your work with repository hygiene, environment setup, and production checks.', icon: Rocket },
  { title: 'Verified Proof', detail: 'Leave with a portfolio artifact and QR-verifiable credential tied to your completed work.', icon: ShieldCheck },
];

export const ProgramsSection = ({ opportunities }: { opportunities: Opportunity[] }) => {
  const openPrograms = opportunities.filter((item) => item.status === 'open' && item.visibility === 'public');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section id="programs" className="relative border-b border-brand-border bg-brand-bg px-4 py-14 sm:px-6 md:py-20 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <PixelCanvas colors={['#E8822A', '#1A8BA6', '#1e1e1e']} gap={16} speed={15} noFocus />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end"
        >
          <div className="space-y-4">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">Program</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#F5F5F5] sm:text-4xl md:text-5xl"><Typewriter text="Open Programs" as="span" /></h2>
            <p className="max-w-2xl text-base font-medium leading-7 text-[#A1A1AA]">
              Explore our active programs. Click each card to learn more about the structure, skills covered, and outcomes.
            </p>
          </div>
          <div className="rounded-lg border border-brand-border bg-brand-secondary p-4 font-mono text-xs text-[#A1A1AA]">
            <div className="flex items-center justify-between gap-4">
              <span>admin.controlled_programs</span>
              <span className="text-brand-success">{openPrograms.length} open</span>
            </div>
          </div>
        </motion.div>

        {openPrograms.length > 0 ? (
          <div className="space-y-3">
            {openPrograms.map((program) => {
              const isOpen = expandedId === program.id;
              return (
                <div
                  key={program.id}
                  className="rounded-xl border border-brand-border bg-brand-secondary overflow-hidden transition-all duration-300 hover:bg-brand-surface/40 hover:shadow-lg hover:border-brand-blue/30 active:bg-brand-surface/60"
                >
                  <div
                    onClick={() => toggleAccordion(program.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleAccordion(program.id); }}
                    role="button"
                    tabIndex={0}
                    className="w-full text-left cursor-pointer"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-brand-blue">Open Cohort</span>
                          <h3 className="mt-1 text-xl font-extrabold tracking-tight text-[#F5F5F5] sm:text-2xl">{program.title}</h3>
                        </div>
                        <ChevronDown
                          size={20}
                          className={`mt-1 shrink-0 text-[#71717A] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          { icon: MapPin, label: program.location_label || 'Remote' },
                          { icon: Clock, label: program.duration_label || 'Open' },
                          { icon: Calendar, label: formatFee(program.price_inr) },
                          { icon: Users, label: program.capacity ? `${program.capacity} seats` : 'Limited' },
                        ].map((item) => (
                          <span
                            key={item.label}
                            className="inline-flex items-center gap-1.5 rounded-md border border-brand-border bg-brand-bg px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#A1A1AA]"
                          >
                            <item.icon size={12} className="text-brand-orange" />
                            {item.label}
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Link href={`/careers/opportunities/${program.slug}`} onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" className="gap-1.5 text-xs group">Apply Now <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5" /></Button>
                        </Link>
                        <Link href={`/careers/opportunities/${program.slug}`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" className="text-xs">View Details</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-brand-border px-5 pb-6 pt-4 sm:px-6 space-y-4">
                          <p className="text-sm leading-6 text-[#A1A1AA]">{program.description}</p>
                          {program.features.length > 0 && (
                            <div>
                              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-orange mb-2">Skills & Features</p>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {program.features.map((f, i) => (
                                  <div key={i} className="flex items-start gap-2 text-sm text-[#A1A1AA]">
                                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-brand-blue" />
                                    <span>{f}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {program.outcomes.length > 0 && (
                            <div>
                              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-orange mb-2">Outcomes</p>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {program.outcomes.map((o, i) => (
                                  <div key={i} className="flex items-start gap-2 text-sm text-[#A1A1AA]">
                                    <ShieldCheck size={14} className="mt-0.5 shrink-0 text-brand-success" />
                                    <span>{o}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {program.eligibility.length > 0 && (
                            <div>
                              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-orange mb-2">Eligibility</p>
                              <ul className="list-disc pl-5 space-y-1 text-sm text-[#A1A1AA]">
                                {program.eligibility.map((e, i) => (
                                  <li key={i}>{e}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-brand-border bg-brand-secondary p-6">
            <h3 className="text-xl font-extrabold text-[#F5F5F5]">No open programs right now.</h3>
            <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">New cohorts will appear here as soon as they are published from the admin dashboard.</p>
          </div>
        )}

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
                className="relative overflow-hidden rounded-lg border border-brand-border bg-brand-secondary p-5"
              >
                <div className="absolute -bottom-1 right-6 w-100 h-100 opacity-25 pointer-events-none">
                  <CpuArchitecture text={item.title.split(' ')[0]} animateLines animateText animateMarkers width="100%" height="100%" />
                </div>
                {index < roadmap.length - 1 && <div className="absolute right-[-10px] top-1/2 z-10 hidden h-px w-5 bg-brand-blue md:block" />}
                <div className="absolute -top-px -right-px h-10 w-10">
                  <div className="absolute inset-0 overflow-hidden rounded-br-lg rounded-tr-md rounded-tl-md">
                    <div className="h-full w-full bg-gradient-to-br from-brand-blue/20 to-transparent" />
                  </div>
                  <div className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-md border border-brand-border bg-brand-surface/80 text-brand-blue backdrop-blur-sm">
                    <Icon size={14} />
                  </div>
                </div>
                <h3 className="mt-5 text-lg font-extrabold text-[#F5F5F5]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">{item.detail}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
