'use client';

import React from 'react';
import { ArrowRight, Calendar, CalendarClock, ChevronDown, Clock, History, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Opportunity, formatFee } from '@/lib/opportunities.shared';

export const OpportunityCardPreview = ({ opportunity }: { opportunity: Opportunity }) => {
  const isClosed = opportunity.status === 'closed' || opportunity.status === 'archived';

  if (opportunity.status === 'open' && opportunity.type === 'event') {
    return (
      <article className="rounded-lg border border-brand-border bg-brand-secondary p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-blue">
            <CalendarClock size={20} />
          </div>
          <span className="rounded-md border border-brand-border px-2.5 py-1 font-mono text-xs text-brand-success">{formatFee(opportunity.price_inr)}</span>
        </div>
        <h3 className="mt-5 text-xl font-extrabold text-[#F5F5F5]">{opportunity.title || 'Untitled Event'}</h3>
        <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">{opportunity.description || 'No description provided yet. Write a short one.'}</p>
        <div className="mt-5 flex flex-wrap gap-4 border-t border-brand-border pt-4 text-xs font-semibold text-[#A1A1AA]">
          <span className="flex items-center gap-2"><Clock size={14} /> {opportunity.duration_label || 'Open'}</span>
          <span className="flex items-center gap-2"><MapPin size={14} /> {opportunity.location_label || 'Remote'}</span>
        </div>
        <div className="mt-5 inline-flex">
          <Button size="sm" variant="teal" className="gap-2">Register <ArrowRight size={14} /></Button>
        </div>
      </article>
    );
  }

  if (isClosed) {
    return (
      <article className="rounded-lg border border-brand-border bg-brand-secondary p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-orange">
            <History size={20} />
          </div>
          <span className="rounded-md border border-brand-border px-2.5 py-1 font-mono text-xs text-[#A1A1AA]">Program concluded</span>
        </div>
        <h3 className="mt-5 text-xl font-extrabold text-[#F5F5F5]">{opportunity.title || 'Untitled Opportunity'}</h3>
        {opportunity.cohort_label && (
          <p className="mt-1 text-xs font-semibold text-brand-blue">{opportunity.cohort_label}</p>
        )}
        <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">{opportunity.tagline || 'No tagline provided yet.'}</p>
        <div className="mt-5 flex flex-wrap gap-4 border-t border-brand-border pt-4 text-xs font-semibold text-[#A1A1AA]">
          <span className="flex items-center gap-2"><Clock size={14} /> {opportunity.duration_label || 'Open'}</span>
          <span className="flex items-center gap-2"><MapPin size={14} /> {opportunity.location_label || 'Remote'}</span>
        </div>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-orange">
          View program details <ArrowRight size={14} />
        </span>
      </article>
    );
  }

  if (opportunity.status === 'open') {
    return (
      <div className="rounded-xl border border-brand-border bg-brand-secondary overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-brand-blue">Open Cohort</span>
              <h3 className="mt-1 text-xl font-extrabold tracking-tight text-[#F5F5F5] sm:text-2xl">{opportunity.title || 'Untitled Opportunity'}</h3>
            </div>
            <ChevronDown size={20} className="mt-1 shrink-0 text-[#71717A]" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { icon: MapPin, label: opportunity.location_label || 'Remote' },
              { icon: Clock, label: opportunity.duration_label || 'Open' },
              { icon: Calendar, label: formatFee(opportunity.price_inr) },
              { icon: Users, label: opportunity.capacity ? `${opportunity.capacity} seats` : 'Limited' },
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
            <Button size="sm" className="gap-1.5 text-xs">Apply Now <ArrowRight size={12} /></Button>
            <Button variant="outline" size="sm" className="text-xs">View Details</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-brand-border bg-brand-secondary/60 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#71717A]">Draft</span>
          <h3 className="mt-1 text-xl font-extrabold tracking-tight text-[#F5F5F5]/70 sm:text-2xl">{opportunity.title || 'Untitled Draft'}</h3>
        </div>
        <ChevronDown size={20} className="mt-1 shrink-0 text-[#3F3F46]" />
      </div>
      <p className="mt-2 text-sm leading-6 text-[#A1A1AA]/70">
        Drafts are hidden from the public site. Set the status to <span className="font-mono text-brand-success">open</span> to publish this card under Open Programs.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 opacity-50 pointer-events-none">
        <Button size="sm" className="gap-1.5 text-xs">Apply Now <ArrowRight size={12} /></Button>
        <Button variant="outline" size="sm" className="text-xs">View Details</Button>
      </div>
    </div>
  );
};