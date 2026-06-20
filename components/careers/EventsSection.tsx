'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarClock, Clock, MapPin, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Opportunity, formatFee } from '@/lib/opportunities.shared';

export const EventsSection = ({ events }: { events: Opportunity[] }) => {
  return (
    <section id="events" className="border-b border-brand-border bg-brand-bg px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">Events</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#F5F5F5] sm:text-4xl">Workshops and builder sessions.</h2>
            <p className="max-w-2xl text-base font-medium leading-7 text-[#A1A1AA]">
              Focused sessions for students who want to see how production software decisions are made.
            </p>
          </div>
        </div>

        {events.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event, index) => (
              <motion.article
                key={event.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="rounded-lg border border-brand-border bg-brand-secondary p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-blue">
                    <CalendarClock size={20} />
                  </div>
                  <span className="rounded-md border border-brand-border px-2.5 py-1 font-mono text-xs text-brand-success">{formatFee(event.price_inr)}</span>
                </div>
                <h3 className="mt-5 text-xl font-extrabold text-[#F5F5F5]">{event.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">{event.description}</p>
                <div className="mt-5 flex flex-wrap gap-4 border-t border-brand-border pt-4 text-xs font-semibold text-[#A1A1AA]">
                  <span className="flex items-center gap-2"><Clock size={14} /> {event.duration_label}</span>
                  <span className="flex items-center gap-2"><MapPin size={14} /> {event.location_label}</span>
                </div>
                <Link href={`/careers/opportunities/${event.slug}`} className="mt-5 inline-flex">
                  <Button size="sm" variant="teal" className="gap-2">Register <ArrowRight size={14} /></Button>
                </Link>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-brand-border bg-brand-secondary p-6 md:p-8">
            <div className="flex max-w-2xl flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-blue">
                <Radio size={20} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[#F5F5F5]">New events and workshops will be announced soon.</h3>
                <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">Join the program to receive updates when the next technical session opens.</p>
                <Link href="#programs" className="mt-5 inline-flex">
                  <Button size="sm" className="gap-2">View Program <ArrowRight size={14} /></Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
