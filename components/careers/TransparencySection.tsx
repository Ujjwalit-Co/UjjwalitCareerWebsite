'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Fingerprint, QrCode, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const TransparencySection = () => {
  return (
    <section id="verification" className="border-b border-brand-border bg-brand-secondary px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-4">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">Verification</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#F5F5F5] sm:text-4xl">Credentials that can be checked.</h2>
          <p className="max-w-xl text-base font-medium leading-7 text-[#A1A1AA]">
            Certificates include public registry validation, QR status, and revocation controls. It should feel closer to banking software than a decorative PDF.
          </p>
          <Link href="/verify" className="inline-flex">
            <Button variant="outline" className="gap-2">Open Verification Portal <ArrowRight size={16} /></Button>
          </Link>
        </div>

        <div className="rounded-lg border border-brand-border bg-brand-bg p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['QR Validation', QrCode, 'Scan to open the public registry page.'],
              ['Registry Hash', Fingerprint, 'Credential records are checked against stored data.'],
              ['Status Control', ShieldCheck, 'Active or revoked status is visible during verification.'],
            ].map(([title, Icon, detail]) => (
              <div key={title as string} className="rounded-lg border border-brand-border bg-brand-secondary p-4">
                {React.createElement(Icon as typeof QrCode, { size: 19, className: 'text-brand-blue' })}
                <h3 className="mt-4 text-sm font-extrabold text-[#F5F5F5]">{title as string}</h3>
                <p className="mt-2 text-xs leading-5 text-[#A1A1AA]">{detail as string}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
