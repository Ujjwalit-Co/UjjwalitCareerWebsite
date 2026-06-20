'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, getTrackLabel } from '@/lib/utils';
import { AlertTriangle, ArrowLeft, CheckCircle, Download, Loader2, ShieldCheck, XCircle } from 'lucide-react';
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
  student: {
    student_code: string;
    batch_name: string;
    application: {
      full_name: string;
      college: string;
      branch: string;
      internship_track: 'web-development' | 'fullstack-ai';
    };
  };
}

export default function CertificateVerifyResult() {
  const params = useParams();
  const certificateId = params.certificateId as string;
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
  const rows = [
    ['Status', 'Verified'],
    ['Name', app.full_name],
    ['Program', getTrackLabel(app.internship_track)],
    ['Issue Date', formatDate(data.issued_at)],
    ['Certificate ID', data.certificate_id],
    ['QR Validation Status', data.qr_code_url ? 'Linked' : 'Registry record active'],
  ];

  return (
    <ResultShell>
      <Card className="p-5 sm:p-6" hoverEffect={false}>
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-brand-success/30 bg-brand-success/10 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-success/10 text-brand-success"><CheckCircle size={22} /></div>
          <div>
            <h1 className="text-lg font-extrabold text-[#F5F5F5]">Verified</h1>
            <p className="text-xs leading-5 text-[#A1A1AA]">This credential is authentic and officially issued.</p>
          </div>
        </div>

        <div className="space-y-3 my-5">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="relative group overflow-hidden rounded-xl border border-brand-border bg-brand-surface/30 p-4 transition-all duration-300 ease-in-out hover:border-brand-blue/40"
            >
              {/* Pixel reveal effect on hover */}
              <PixelCanvas
                gap={6}
                speed={30}
                colors={["#3B82F6", "#60A5FA", "#93C5FD"]}
                variant="icon"
              />

              {/* Corner brackets that appear on hover */}
              <div className="absolute top-2.5 left-2.5 w-4 h-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute top-0 left-0 w-3 h-0.5 bg-brand-blue" />
                <div className="absolute top-0 left-0 w-0.5 h-3 bg-brand-blue" />
              </div>
              <div className="absolute bottom-2.5 right-2.5 w-4 h-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute bottom-0 right-0 w-3 h-0.5 bg-brand-blue" />
                <div className="absolute bottom-0 right-0 w-0.5 h-3 bg-brand-blue" />
              </div>

              {/* Content */}
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#71717A] group-hover:text-brand-blue transition-colors duration-300">
                  {label}
                </span>
                <span className="font-bold text-[#F5F5F5] text-sm sm:text-base text-right">
                  {value}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-lg border border-brand-border bg-brand-bg p-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#71717A]">Registry Hash</p>
          <p className="mt-2 break-all font-mono text-[11px] leading-5 text-[#A1A1AA]">{data.verification_hash}</p>
        </div>

        {data.certificate_pdf_url && (
          <a href={data.certificate_pdf_url.startsWith('http') ? data.certificate_pdf_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/certificates/${data.certificate_pdf_url}`} target="_blank" rel="noreferrer" className="mt-5 block">
            <Button className="w-full gap-2"><Download size={16} /> Download Certificate</Button>
          </a>
        )}
        <BackButton />
      </Card>
    </ResultShell>
  );
}

function ResultShell({ children }: { children: React.ReactNode }) {
  return <div className="w-full max-w-lg">{children}</div>;
}

function BackButton() {
  return (
    <a href="/verify" className="mt-5 inline-flex w-full">
      <Button variant="outline" className="w-full gap-2"><ArrowLeft size={16} /> Check Another Certificate</Button>
    </a>
  );
}
