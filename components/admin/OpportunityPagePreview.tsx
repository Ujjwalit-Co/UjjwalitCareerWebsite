'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, Award, BookOpen, CheckCircle2, Clock, MapPin, ShieldCheck, Users } from 'lucide-react';
import { type Opportunity, formatFee } from '@/lib/opportunities.shared';

export const OpportunityPagePreview = ({ opportunity }: { opportunity: Opportunity }) => {
  const isOpen = opportunity.status === 'open';

  const facts = [
    ['Duration', opportunity.duration_label || 'Open', Clock],
    ['Mode', opportunity.location_label || 'Remote', MapPin],
    ['Capacity', opportunity.capacity ? `${opportunity.capacity} seats` : 'Limited', Users],
    ['Fee', opportunity.price_inr > 0 ? formatFee(opportunity.price_inr) : 'Free', Award],
  ] as const;

  return (
    <div className="space-y-12">
      <div className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#A1A1AA]">
        <ArrowLeft size={16} /> Back to programs
      </div>

      {isOpen ? (
        <div className="pt-2">
          <div className="mx-auto max-w-2xl text-center mb-8">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-orange">Application</span>
            <h3 className="mt-2 text-3xl font-extrabold text-[#F5F5F5]">Apply for {opportunity.title || 'Untitled Opportunity'}</h3>
            <p className="mt-2 text-sm leading-5 text-[#A1A1AA]">Four focused steps. Review happens before submission.</p>
          </div>
          <div className="mx-auto max-w-2xl rounded-lg border border-dashed border-brand-border bg-brand-secondary/40 p-6 text-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#71717A]">Application form renders here</span>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl rounded-lg border border-brand-border bg-brand-secondary/40 p-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-orange">
            <Award size={22} />
          </span>
          <h3 className="mt-4 text-2xl font-extrabold text-[#F5F5F5]">This program has concluded</h3>
          <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">
            Applications for {opportunity.title || 'this program'} are closed. Explore our current open programs to get started.
          </p>
          <span className="mt-6 inline-flex">
            <span className="inline-flex items-center gap-2 rounded-lg bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white">
              View Current Programs <ArrowRight size={14} />
            </span>
          </span>
        </div>
      )}

      <div className="mx-auto max-w-2xl rounded-lg border border-brand-border bg-brand-secondary/40 p-5">
        <h4 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A1A1AA]">What happens next</h4>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm text-[#A1A1AA]">
          {['Application review', 'Acceptance decision', 'Payment verification', 'Batch onboarding'].map((item, index) => (
            <div key={item} className="flex gap-3 items-center">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-brand-border bg-brand-secondary font-mono text-[11px] text-brand-blue">{index + 1}</span>
              <span className="font-semibold text-[#F5F5F5]">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <article className="space-y-8 border-t border-brand-border pt-12">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md border border-brand-border bg-brand-secondary px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#A1A1AA]">{opportunity.type}</span>
            <span className="rounded-md border border-brand-success/30 bg-brand-success/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-brand-success">{opportunity.status}</span>
          </div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{opportunity.title || 'Untitled Opportunity'}</h1>
          <p className="max-w-3xl text-base font-medium leading-7 text-[#A1A1AA] md:text-lg">{opportunity.tagline || 'No tagline provided yet.'}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {facts.map(([label, value, Icon]) => (
            <div key={label as string} className="rounded-lg border border-brand-border bg-brand-secondary p-4">
              <Icon size={18} className="text-brand-orange" />
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[#71717A]">{label as string}</p>
              <p className="mt-1 text-sm font-bold text-[#F5F5F5]">{value as string}</p>
            </div>
          ))}
        </div>

        <section className="rounded-lg border border-brand-border bg-brand-secondary p-5 md:p-6">
          <h2 className="text-xl font-extrabold">About this program</h2>
          <p className="mt-3 text-sm leading-6 text-[#A1A1AA]">{opportunity.description || 'No description provided yet.'}</p>
        </section>

        {opportunity.eligibility.length > 0 && (
          <section className="rounded-lg border border-brand-border bg-brand-secondary p-5 md:p-6">
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <BookOpen size={20} className="text-brand-teal" /> Eligibility
            </h2>
            <ul className="mt-4 space-y-2">
              {opportunity.eligibility.map((item: string) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-[#A1A1AA]">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-brand-teal" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {opportunity.features.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-extrabold">Technical tracks & skills covered</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {opportunity.features.slice(0, 6).map((feature: string) => (
                <li key={feature} className="flex items-start gap-3 rounded-lg border border-brand-border bg-brand-secondary p-4">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-blue" />
                  <span className="text-sm font-semibold leading-6 text-[#F5F5F5]">{feature}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {opportunity.outcomes.length > 0 && (
          <section className="rounded-lg border border-brand-border bg-brand-secondary p-5 md:p-6">
            <h2 className="text-xl font-extrabold">Verified outcomes</h2>
            <ul className="mt-4 space-y-3">
              {opportunity.outcomes.map((outcome: string) => (
                <li key={outcome} className="flex gap-3 text-sm font-semibold leading-6 text-[#A1A1AA]">
                  <ShieldCheck size={17} className="mt-0.5 shrink-0 text-brand-orange" />
                  {outcome}
                </li>
              ))}
            </ul>
          </section>
        )}

        {opportunity.project_links.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-brand-border pt-6">
            {opportunity.project_links.map((link) => (
              <span key={`${link.url}-${link.label}`} className="inline-flex items-center gap-2 rounded-lg border border-brand-border px-4 py-2 text-xs font-bold text-[#A1A1AA]">
                {link.label} <ArrowRight size={12} className="rotate-[-45deg]" />
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
};