'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, getTrackLabel } from '@/lib/utils';
import { AlertTriangle, ArrowLeft, Award, BadgeCheck, CalendarDays, CheckCircle, Download, Fingerprint, GraduationCap, Hash, Loader2, QrCode, User, XCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

const PixelCanvas = dynamic(() => import('@/components/ui/pixel-canvas').then((mod) => mod.PixelCanvas), {
  ssr: false,
});

interface VerificationData {
  id: string;
  certificate_id: string;
  verification_hash: string;
  qr_code_url: string | null;
  certificate_pdf_url: string | null;
  status: 'active' | 'revoked';
  issued_at: string;
  opportunity: {
    id: string;
    title: string;
    description: string;
    slug: string;
    type: string;
  } | null;
  student: {
    student_code: string;
    batch_name: string;
    profile: {
      slug: string;
      full_name: string;
    } | null;
    application: {
      full_name: string;
      college: string;
      branch: string;
      internship_track: 'web-development' | 'fullstack-ai';
    };
  };
}

export default function CertificateVerifyResult({ certificateId }: { certificateId: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VerificationData | null>(null);

  useEffect(() => {
    if (!certificateId) return;

    const fetchVerification = async () => {
      try {
        const res = await fetch(`/api/verify/${encodeURIComponent(certificateId)}`);
        if (res.status === 404) {
          setError('not_found');
          setIsLoading(false);
          return;
        }
        if (!res.ok) throw new Error('Verification query failed');
        const json = await res.json();
        setData(json.certificate);
      } catch (err) {
        console.error(err);
        setError('server_error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerification();
  }, [certificateId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <Loader2 className="animate-spin text-brand-blue" size={38} />
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#A1A1AA]">Querying registry</p>
      </div>
    );
  }

  if (error === 'not_found' || !data) {
    return (
      <ResultShell>
        <Card className="p-6 text-center" hoverEffect={false}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400"><XCircle size={30} /></div>
          <h1 className="mt-5 text-2xl font-extrabold text-[#F5F5F5]">Invalid Credential</h1>
          <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">No certificate matching <code className="font-mono text-red-300">{certificateId}</code> was found in the Ujjwalit registry.</p>
          <BackButton />
        </Card>
      </ResultShell>
    );
  }

  if (data.status === 'revoked') {
    return (
      <ResultShell>
        <Card className="p-6 text-center" hoverEffect={false}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-brand-warning/30 bg-brand-warning/10 text-brand-warning"><AlertTriangle size={30} /></div>
          <h1 className="mt-5 text-2xl font-extrabold text-[#F5F5F5]">Certificate Revoked</h1>
          <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">This certificate was issued to {data.student.application.full_name}, but it is no longer valid.</p>
          <BackButton />
        </Card>
      </ResultShell>
    );
  }

  const app = data.student.application;
  const programName = data.opportunity?.title || getTrackLabel(app.internship_track);

  return (
    <ResultShell>
      <div className="mb-5 flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-success flex items-center gap-1.5">
          <BadgeCheck size={14} /> Credential Verified
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* HERO — verified status banner */}
        <BentoTile className="sm:col-span-2 lg:row-span-2 border-brand-success/25 bg-gradient-to-br from-brand-success/10 via-brand-surface/40 to-brand-surface/40">
          <div className="flex flex-col justify-between h-full gap-6">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-success/15 text-brand-success">
                <CheckCircle size={26} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-[#F5F5F5]">Verified</h1>
                <p className="mt-1 text-xs leading-5 text-[#A1A1AA]">This credential is authentic and officially issued by Ujjwalit Technologies.</p>
              </div>
            </div>

            {/* Identity block */}
            <div className="relative overflow-hidden rounded-xl border border-brand-border bg-brand-bg/60 p-4">
              <PixelCanvas gap={6} speed={30} colors={["#3B82F6", "#60A5FA", "#93C5FD"]} variant="icon" />
              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2 text-[#71717A]">
                  <User size={13} className="text-brand-blue" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em]">Issued To</span>
                </div>
                <p className="text-xl font-extrabold text-[#F5F5F5] leading-tight">{app.full_name}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 rounded-full border border-brand-border bg-brand-surface/60 px-2 py-0.5 font-mono text-[10px] text-[#A1A1AA]">
                    <GraduationCap size={11} className="text-brand-orange" /> {app.college}
                  </span>
                  {data.student.batch_name && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-brand-border bg-brand-surface/60 px-2 py-0.5 font-mono text-[10px] text-[#A1A1AA]">
                      {data.student.batch_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </BentoTile>

        {/* Program */}
        <BentoTile>
          <div className="flex items-center gap-2 text-brand-blue"><Award size={15} /><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#71717A]">Program</span></div>
          <p className="mt-2 text-sm font-bold text-[#F5F5F5] leading-snug break-words">{programName}</p>
        </BentoTile>

        {/* Issue Date */}
        <BentoTile>
          <div className="flex items-center gap-2 text-brand-orange"><CalendarDays size={15} /><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#71717A]">Issue Date</span></div>
          <p className="mt-2 text-sm font-bold text-[#F5F5F5]">{formatDate(data.issued_at)}</p>
        </BentoTile>

        {/* Certificate ID */}
        <BentoTile className="sm:col-span-2">
          <div className="flex items-center gap-2 text-cyan-400"><Hash size={15} /><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#71717A]">Certificate ID</span></div>
          <p className="mt-2 font-mono text-sm font-bold text-cyan-300 break-all">{data.certificate_id}</p>
        </BentoTile>

        {/* QR validation */}
        <BentoTile>
          <div className="flex items-center gap-2 text-brand-success"><QrCode size={15} /><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#71717A]">QR Validation</span></div>
          <p className="mt-2 text-sm font-bold text-[#F5F5F5]">{data.qr_code_url ? 'Linked' : 'Registry active'}</p>
        </BentoTile>

        {/* Registry hash — wide */}
        <BentoTile className="sm:col-span-2 lg:col-span-3">
          <div className="flex items-center gap-2 text-slate-400"><Fingerprint size={15} /><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#71717A]">Registry Hash</span></div>
          <p className="mt-2 break-all font-mono text-[11px] leading-5 text-[#A1A1AA]">{data.verification_hash}</p>
        </BentoTile>

        {/* Program details — wide */}
        {data.opportunity?.description && (
          <BentoTile className="sm:col-span-2 lg:col-span-3">
            <div className="flex items-center gap-2 text-brand-blue"><Award size={15} /><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#71717A]">Program Details</span></div>
            <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">{data.opportunity.description}</p>
          </BentoTile>
        )}

        {/* Actions — full width */}
        <div className="sm:col-span-2 lg:col-span-3 flex flex-col sm:flex-row gap-2 pt-1">
          {data.certificate_pdf_url && (
            <a
              href={data.certificate_pdf_url.startsWith('http') ? data.certificate_pdf_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/certificates/${data.certificate_pdf_url}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1"
            >
              <Button className="w-full gap-2"><Download size={16} /> Download Certificate</Button>
            </a>
          )}
          {data.student.profile?.slug && (
            <Link href={`/verify/student/${encodeURIComponent(data.student.profile.slug)}`} className="flex-1">
              <Button variant="teal" className="w-full gap-2"><User size={16} /> View Student Profile</Button>
            </Link>
          )}
          <Link href="/verify" className="flex-1">
            <Button variant="outline" className="w-full gap-2"><ArrowLeft size={16} /> Check Another</Button>
          </Link>
        </div>
      </div>
    </ResultShell>
  );
}

function ResultShell({ children }: { children: React.ReactNode }) {
  return <div className="w-full max-w-3xl px-4 sm:px-0">{children}</div>;
}

function BackButton() {
  return (
    <Link href="/verify" className="mt-5 inline-flex w-full">
      <Button variant="outline" className="w-full gap-2"><ArrowLeft size={16} /> Check Another Certificate</Button>
    </Link>
  );
}

function BentoTile({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-brand-border bg-brand-surface/30 p-4 transition-all duration-300 hover:border-brand-blue/40 hover:-translate-y-0.5 ${className}`}>
      {children}
    </div>
  );
}