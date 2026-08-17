'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatDate, getCertificateTypeLabel } from '@/lib/utils';
import {
  ArrowLeft, Award, BadgeCheck, BookOpen, Download, ExternalLink,
  GraduationCap, Loader2, Mail, MessageSquare, SearchX, ShieldCheck, Sparkles,
} from 'lucide-react';

function titleCase(str: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function certPdfUrl(path: string | null): string {
  if (!path) return '#';
  if (path.startsWith('http')) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/certificates/${path}`;
}

const CERT_STYLE: Record<string, { pill: string; dot: string }> = {
  completion:    { pill: 'bg-teal-500/10 text-teal-400 border-teal-500/25',   dot: 'bg-teal-400'  },
  achievement:   { pill: 'bg-amber-500/10 text-amber-400 border-amber-500/25', dot: 'bg-amber-400' },
  participation: { pill: 'bg-blue-500/10 text-blue-400 border-blue-500/25',   dot: 'bg-blue-400'  },
};

interface Cert {
  id: string; certificate_id: string; certificate_type: string;
  certificate_pdf_url: string | null; issued_at: string;
  student: { student_code: string; batch_name: string };
  opportunity: { title: string; slug: string } | null;
}
interface AchievementStatement { id: string; label: string; body_markdown: string; display_order: number; }
interface StudentEntry {
  id: string; student_code: string; batch_name: string;
  attendance_percentage: number; project_submitted: boolean;
  certificate_type: string; joined_at: string;
  opportunity: { title: string; slug: string } | null;
  achievement_statements: AchievementStatement[];
  application: { full_name: string; college: string; branch: string; internship_track: string; email?: string; };
}
interface ProfileData {
  profile: { id: string; full_name: string; slug: string; email: string | null; remarks: string | null };
  students: StudentEntry[];
  certificates: Cert[];
}

export default function StudentProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch(`/api/students/${encodeURIComponent(slug)}`);
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error();
        setData(await res.json());
      } catch { setNotFound(true); }
      finally { setIsLoading(false); }
    })();
  }, [slug]);

  if (isLoading) return (
    <div className="flex flex-col items-center gap-4 p-8 text-center">
      <Loader2 className="animate-spin text-blue-400" size={36} />
      <p className="font-mono text-[11px] uppercase tracking-widest text-stone-500">Loading registry...</p>
    </div>
  );

  if (notFound || !data) return (
    <div className="w-full max-w-md px-4">
      <div className="rounded-2xl border border-stone-800 bg-stone-950 p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-red-900/50 bg-red-950/40 text-red-400">
          <SearchX size={28} />
        </div>
        <h1 className="text-xl font-bold text-stone-100">Profile Not Found</h1>
        <p className="mt-2 text-sm text-stone-500">No student matching <code className="font-mono text-red-400">{slug}</code> exists in the Ujjwalit registry.</p>
        <Link href="/verify" className="mt-6 inline-flex w-full">
          <Button variant="outline" className="w-full gap-2"><ArrowLeft size={15} /> Search Again</Button>
        </Link>
      </div>
    </div>
  );

  const { profile, students, certificates } = data;
  const primaryStudent = students[0];
  const displayCollege = titleCase(primaryStudent?.application?.college ?? '');
  const displayEmail = profile.email ?? primaryStudent?.application?.email ?? null;

  const composeStatement = (st: StudentEntry): string =>
    (st.achievement_statements || [])
      .map((s) => s.body_markdown
        .replaceAll('{{attendance}}', String(st.attendance_percentage ?? 0))
        .replaceAll('{{batch}}', st.batch_name || ''))
      .join('\n\n');

  return (
    <div className="w-full max-w-2xl space-y-5 px-4 pb-16 sm:px-0">

      <Link href="/verify" className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-300 transition-colors">
        <ArrowLeft size={14} /> Back to registry
      </Link>

      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 p-5 sm:p-6 shadow-2xl">
        <div className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: 'linear-gradient(to right,#60a5fa 1px,transparent 1px),linear-gradient(to bottom,#60a5fa 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-lg sm:text-xl font-extrabold text-white shadow-lg shadow-blue-900/30 select-none">
              {initials(profile.full_name)}
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-blue-400">Ujjwalit Registry</p>
              <h1 className="mt-0.5 text-xl sm:text-2xl font-extrabold tracking-tight text-stone-100 truncate">{profile.full_name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                {displayCollege && <span className="flex items-center gap-1"><GraduationCap size={11} className="text-stone-600 shrink-0" />{displayCollege}</span>}
                {displayEmail  && <span className="flex items-center gap-1"><Mail size={11} className="text-stone-600 shrink-0" />{displayEmail}</span>}
              </div>
            </div>
          </div>
          <div className="shrink-0 self-start">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-800 bg-stone-900 px-3 py-1.5 text-xs font-semibold text-stone-400">
              <BookOpen size={12} className="text-blue-400" />
              {students.length} Program{students.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        {profile.remarks && (
          <div className="relative mt-5 rounded-xl border border-stone-800 bg-stone-900/60 p-4">
            <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-stone-500">
              <MessageSquare size={11} /> Faculty Remarks
            </p>
            <p className="text-sm leading-relaxed text-stone-400 whitespace-pre-line">{profile.remarks}</p>
          </div>
        )}
      </div>

      {/* ENROLLMENTS */}
      {students.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-600">
            <span className="h-px flex-1 bg-stone-800" />Program Enrollments<span className="h-px flex-1 bg-stone-800" />
          </h2>
          <div className="space-y-3">
            {students.map((st) => {
              const statement = composeStatement(st);
              const certStyle = CERT_STYLE[st.certificate_type] ?? CERT_STYLE.participation;
              return (
                <div key={st.id} className="rounded-2xl border border-stone-800 bg-stone-950 overflow-hidden">
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1 min-w-0">
                      {/* Program title with link */}
                      {st.opportunity ? (
                        <a
                          href={`https://careers.ujjwalit.co.in/opportunities/${st.opportunity.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 truncate transition-colors"
                        >
                          {st.opportunity.title}
                          <ExternalLink size={10} className="opacity-60 shrink-0" />
                        </a>
                      ) : (
                        <p className="text-xs font-semibold text-stone-500 truncate">Program details unavailable</p>
                      )}
                      <p className="text-sm font-bold text-stone-200">
                        Batch <span className="text-stone-400">{st.batch_name}</span>
                      </p>
                      <p className="font-mono text-[11px] text-stone-600">{st.student_code}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {/* Certificate name badge */}
                      {st.certificate_type && st.certificate_type !== 'none' && (
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${certStyle.pill}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${certStyle.dot}`} />
                          {getCertificateTypeLabel(st.certificate_type)}
                        </span>
                      )}
                      {st.joined_at && <span className="text-[11px] text-stone-600">{formatDate(st.joined_at)}</span>}
                    </div>
                  </div>
                  {statement && (
                    <div className="border-t border-stone-800/70 bg-stone-900/40 px-4 py-3">
                      <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-amber-500/80">
                        <Sparkles size={10} /> Statement of Achievement
                      </p>
                      <div className="prose prose-invert prose-sm max-w-none text-stone-400 prose-p:my-1 prose-strong:text-stone-200 prose-ul:my-1 prose-li:my-0.5">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{statement}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CERTIFICATES */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-600">
          <span className="h-px flex-1 bg-stone-800" />Certificates Issued<span className="h-px flex-1 bg-stone-800" />
        </h2>
        {certificates.length > 0 ? (
          <div className="space-y-2.5">
            {certificates.map((cert) => {
              const style = CERT_STYLE[cert.certificate_type] ?? CERT_STYLE.completion;
              return (
                <div key={cert.id} className="flex flex-col gap-3 rounded-2xl border border-stone-800 bg-stone-950 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${style.pill}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        {getCertificateTypeLabel(cert.certificate_type)}
                      </span>
                      {cert.opportunity?.title && (
                        <a 
                          href={`https://careers.ujjwalit.co.in/opportunities/${cert.opportunity.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-xs text-stone-400 hover:text-blue-400 hover:underline transition-colors flex items-center gap-1"
                        >
                          {cert.opportunity.title}
                          <ExternalLink size={10} className="inline opacity-60" />
                        </a>
                      )}
                    </div>
                    <p className="font-mono text-xs font-bold text-stone-300 truncate">{cert.certificate_id}</p>
                    <p className="text-[11px] text-stone-600">Issued {formatDate(cert.issued_at)} - {cert.student.student_code}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link href={`/verify/${encodeURIComponent(cert.certificate_id)}`}>
                      <Button variant="teal" size="sm" className="gap-1.5 text-xs whitespace-nowrap"><ShieldCheck size={12} /> Verify</Button>
                    </Link>
                    {cert.certificate_pdf_url && (
                      <a href={certPdfUrl(cert.certificate_pdf_url)} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs whitespace-nowrap"><Download size={12} /> PDF</Button>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-stone-800 bg-stone-950 py-10 text-center">
            <BadgeCheck size={30} className="text-stone-700" />
            <p className="text-sm text-stone-500">No active certificates on this profile yet.</p>
          </div>
        )}
      </section>

      {/* CTA */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-900/40 bg-blue-950/20 p-5 sm:p-6">
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-blue-700/10 blur-3xl" />
        <div className="relative">
          <p className="font-mono text-[10px] uppercase tracking-widest text-blue-400/70">Ujjwalit Developers Program</p>
          <h3 className="mt-2 text-base font-bold text-stone-100">Inspired by this achievement?</h3>
          <p className="mt-1 text-sm text-stone-400 leading-relaxed">Join the next cohort - workshops, mentorship, and real-world project experience.</p>
          <a href="https://careers.ujjwalit.co.in" target="_blank" rel="noreferrer" className="mt-4 inline-flex">
            <Button variant="primary" className="gap-2 bg-blue-600 hover:bg-blue-500 text-white border-transparent text-sm">
              <ExternalLink size={14} /> View Open Programs
            </Button>
          </a>
        </div>
      </div>

      <p className="text-center font-mono text-[10px] text-stone-700 pb-2">
        <Award size={10} className="inline mr-1" />Credentials verified by Ujjwalit Technologies Registry
      </p>
    </div>
  );
}