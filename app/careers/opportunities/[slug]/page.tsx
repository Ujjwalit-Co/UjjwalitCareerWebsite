import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Award, Calendar, CheckCircle2, Clock, MapPin, ShieldCheck, Users } from 'lucide-react';
import { getOpportunityBySlug, getOpenOpportunities } from '@/lib/opportunities';
import { formatFee } from '@/lib/opportunities.shared';
import { ApplicationForm } from '@/components/careers/ApplicationForm';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const opportunity = await getOpportunityBySlug(slug);

  if (!opportunity) {
    notFound();
  }

  const allOpportunities = await getOpenOpportunities();

  const facts = [
    ['Duration', opportunity.duration_label || 'Open', Clock],
    ['Mode', opportunity.location_label || 'Remote', MapPin],
    ['Capacity', opportunity.capacity ? `${opportunity.capacity} seats` : 'Limited', Users],
    ['Fee', opportunity.price_inr > 0 ? formatFee(opportunity.price_inr) : 'Free', Award],
  ];

  return (
    <div className="w-full border-t border-brand-border bg-brand-bg px-4 pt-28 pb-14 text-[#F5F5F5] sm:px-6 md:pt-32 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/careers" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#A1A1AA] transition-colors hover:text-[#F5F5F5]">
          <ArrowLeft size={16} /> Back to programs
        </Link>

        <div className="space-y-12">
          {/* Internship Details Article */}
          <article className="space-y-8">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md border border-brand-border bg-brand-secondary px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#A1A1AA]">{opportunity.type}</span>
                <span className="rounded-md border border-brand-success/30 bg-brand-success/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-brand-success">{opportunity.status}</span>
              </div>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">{opportunity.title}</h1>
              <p className="max-w-3xl text-base font-medium leading-7 text-[#A1A1AA] md:text-lg">{opportunity.tagline}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {facts.map(([label, value, Icon]) => (
                <div key={label as string} className="rounded-lg border border-brand-border bg-brand-secondary p-4">
                  {React.createElement(Icon as typeof Clock, { size: 18, className: 'text-brand-orange' })}
                  <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[#71717A]">{label as string}</p>
                  <p className="mt-1 text-sm font-bold text-[#F5F5F5]">{value as string}</p>
                </div>
              ))}
            </div>

            <section className="rounded-lg border border-brand-border bg-brand-secondary p-5 md:p-6">
              <h2 className="text-xl font-extrabold">About this program</h2>
              <p className="mt-3 text-sm leading-6 text-[#A1A1AA]">{opportunity.description}</p>
            </section>

            {opportunity.features?.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-extrabold">Technical tracks & skills covered</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {opportunity.features.slice(0, 6).map((feature) => (
                    <li key={feature} className="flex items-start gap-3 rounded-lg border border-brand-border bg-brand-secondary p-4">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-blue" />
                      <span className="text-sm font-semibold leading-6 text-[#F5F5F5]">{feature}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {opportunity.outcomes?.length > 0 && (
              <section className="rounded-lg border border-brand-border bg-brand-secondary p-5 md:p-6">
                <h2 className="text-xl font-extrabold">Verified outcomes</h2>
                <ul className="mt-4 space-y-3">
                  {opportunity.outcomes.map((outcome) => (
                    <li key={outcome} className="flex gap-3 text-sm font-semibold leading-6 text-[#A1A1AA]">
                      <ShieldCheck size={17} className="mt-0.5 shrink-0 text-brand-orange" />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {opportunity.project_links?.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-brand-border pt-6">
                {opportunity.project_links.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-brand-border px-4 py-2 text-xs font-bold text-[#A1A1AA] transition-colors hover:border-brand-blue hover:text-[#F5F5F5]">
                    {link.label} <ArrowRight size={12} className="rotate-[-45deg]" />
                  </a>
                ))}
              </div>
            )}
          </article>

          {/* Centered Application Form Section */}
          <div className="border-t border-brand-border pt-12">
            <div className="mx-auto max-w-2xl text-center mb-8">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-orange">Application</span>
              <h3 className="mt-2 text-3xl font-extrabold text-[#F5F5F5]">Begin your application</h3>
              <p className="mt-2 text-sm leading-5 text-[#A1A1AA]">Four focused steps. Review happens before submission.</p>
            </div>
            <div className="mx-auto max-w-2xl">
              <Suspense fallback={<div className="flex min-h-[300px] items-center justify-center rounded-lg border border-brand-border bg-brand-bg text-sm text-[#A1A1AA]">Loading application form...</div>}>
                <ApplicationForm opportunities={allOpportunities} defaultSlug={opportunity.slug} />
              </Suspense>
            </div>
          </div>

          {/* Onboarding Steps Below Form */}
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
        </div>
      </div>
    </div>
  );
}

