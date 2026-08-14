'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PixelCanvas } from '@/components/ui/pixel-canvas';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatDate, getCertificateTypeLabel } from '@/lib/utils';
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Download,
  GraduationCap,
  Loader2,
  MessageSquare,
  SearchX,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';

interface Cert {
  id: string;
  certificate_id: string;
  certificate_type: string;
  certificate_pdf_url: string | null;
  issued_at: string;
  student: { student_code: string; batch_name: string };
  opportunity: { title: string } | null;
}

interface AchievementStatementEntry {
  id: string;
  label: string;
  body_markdown: string;
  display_order: number;
}

interface StudentEntry {
  id: string;
  student_code: string;
  batch_name: string;
  attendance_percentage: number;
  project_submitted: boolean;
  certificate_type: string;
  achievement_statements: AchievementStatementEntry[];
  application: {
    full_name: string;
    college: string;
    branch: string;
    internship_track: string;
  };
}

interface ProfileData {
  profile: { id: string; full_name: string; slug: string; remarks: string | null };
  students: StudentEntry[];
  certificates: Cert[];
}

const TYPE_BADGE: Record<string, string> = {
  completion: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  achievement: 'bg-brand-orange/10 text-brand-orange border-brand-orange/20',
  participation: 'bg-green-500/10 text-green-400 border-green-500/20',
};

function certPdfUrl(path: string | null): string {
  if (!path) return '#';
  if (path.startsWith('http')) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/certificates/${path}`;
}

export default function StudentProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/students/${encodeURIComponent(slug)}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error('Profile query failed');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <Loader2 className="animate-spin text-brand-blue" size={38} />
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#A1A1AA]">Loading student profile</p>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="w-full max-w-lg">
        <Card className="p-6 text-center" hoverEffect={false}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400">
            <SearchX size={30} />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-[#F5F5F5]">Profile Not Found</h1>
          <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">
            No student profile matches <code className="font-mono text-red-300">{slug}</code> in the Ujjwalit registry.
          </p>
          <Link href="/verify" className="mt-5 inline-flex w-full">
            <Button variant="outline" className="w-full gap-2"><ArrowLeft size={16} /> Search Again</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const composeStatement = (st: StudentEntry): string =>
    (st.achievement_statements || [])
      .map((s) =>
        s.body_markdown
          .replaceAll('{{attendance}}', String(st.attendance_percentage ?? 0))
          .replaceAll('{{batch}}', st.batch_name || '')
      )
      .join('\n\n');

  return (
    <div className="relative w-full max-w-4xl space-y-8">
      {/* Pixel background effect (like the careers hero) */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <PixelCanvas
          colors={['#E8822A', '#1A8BA6', '#1e1e1e']}
          gap={16}
          speed={15}
          noFocus
        />
      </div>

      <div className="relative z-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-orange">Student Registry</span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#F5F5F5]">{data.profile.full_name}</h1>
          <p className="mt-1 text-sm text-[#A1A1AA]">Credentials and certificates issued by Ujjwalit Technologies.</p>
        </div>
        <Link href="/verify" className="inline-flex">
          <Button variant="outline" className="gap-2"><ArrowLeft size={16} /> Back</Button>
        </Link>
      </div>

      {/* Credentials card */}
      <Card className="p-6" hoverEffect={false}>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold font-display text-[#F5F5F5]">
          <User size={18} className="text-brand-blue" /> Credentials
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.students.map((st) => (
            <div key={st.id} className="rounded-lg border border-brand-border bg-brand-surface/40 p-4 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-brand-blue">{st.student_code}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#71717A]">Batch {st.batch_name}</span>
              </div>
              <p className="text-sm font-semibold text-[#F5F5F5]">{st.application?.college}</p>
              <p className="text-xs text-[#A1A1AA]">
                {st.application?.branch || '—'} • {getCertificateTypeLabel(st.certificate_type)}
              </p>
              {composeStatement(st) && (
                <div className="mt-3 rounded-lg border border-brand-border bg-brand-surface/60 p-4">
                  <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-orange">
                    Statement of Achievement
                  </p>
                  <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-strong:text-white prose-ul:my-1 prose-li:my-0.5 text-[#D4D4D8]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{composeStatement(st)}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Faculty remarks */}
      {data.profile.remarks && (
        <Card className="p-6" hoverEffect={false}>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-bold font-display text-[#F5F5F5]">
            <MessageSquare size={18} className="text-brand-orange" /> Remarks
          </h3>
          <div className="rounded-lg border border-brand-border bg-brand-surface/40 p-5">
            <p className="text-sm leading-7 text-[#D4D4D8] whitespace-pre-line">{data.profile.remarks}</p>
          </div>
        </Card>
      )}

      {/* Certificates earned */}
      <Card className="p-6" hoverEffect={false}>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold font-display text-[#F5F5F5]">
          <Award size={18} className="text-brand-teal" /> Certificates Earned
        </h3>
        {data.certificates.length > 0 ? (
          <div className="space-y-3">
            {data.certificates.map((cert) => {
              const badge = TYPE_BADGE[cert.certificate_type] || TYPE_BADGE.completion;
              return (
                <div key={cert.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-brand-border bg-brand-surface/40 p-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-full border px-2.5 py-0.5 ${badge}`}>
                        {getCertificateTypeLabel(cert.certificate_type)}
                      </span>
                      <span className="text-xs text-slate-400">{cert.opportunity?.title || 'Ujjwalit Program'}</span>
                    </div>
                    <p className="font-mono text-xs font-bold text-slate-200">{cert.certificate_id}</p>
                    <p className="text-[11px] text-slate-500">
                      Issued {formatDate(cert.issued_at)} • Student {cert.student.student_code}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/verify/${encodeURIComponent(cert.certificate_id)}`} className="inline-flex">
                      <Button variant="teal" size="sm" className="gap-1.5 text-xs"><ShieldCheck size={13} /> Verify</Button>
                    </Link>
                    {cert.certificate_pdf_url && (
                      <a href={certPdfUrl(cert.certificate_pdf_url)} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Download size={13} /> PDF</Button>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8 text-center text-slate-500">
            <BadgeCheck size={32} className="text-slate-600" />
            <p className="text-sm">No active certificates found for this profile.</p>
          </div>
        )}
      </Card>

      <div className="flex items-center gap-2 justify-center text-center text-xs text-[#71717A]">
        <GraduationCap size={14} />
        <span>This profile aggregates all certificates issued across Ujjwalit programs for this student.</span>
        <Users size={14} />
      </div>
      </div>
    </div>
  );
}
