import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatDate, getCertificateTypeLabel } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const CERT_STYLE: Record<string, { pill: string; dot: string }> = {
  completion:    { pill: 'bg-teal-500/10 text-teal-400 border-teal-500/25',   dot: 'bg-teal-400'  },
  achievement:   { pill: 'bg-amber-500/10 text-amber-400 border-amber-500/25', dot: 'bg-amber-400' },
  participation: { pill: 'bg-blue-500/10 text-blue-400 border-blue-500/25',   dot: 'bg-blue-400'  },
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function EmbedBadgePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  let notFound = false;
  let profile: any = null;
  let students: any[] = [];
  let certificates: any[] = [];

  try {
    const { data: bySlug } = await supabase
      .from('student_profiles')
      .select('id, full_name, slug')
      .eq('slug', slug)
      .maybeSingle();
    if (bySlug) profile = bySlug;

    if (!profile) {
      const { data: byCode } = await supabase
        .from('students')
        .select('profile_id')
        .eq('student_code', slug.toUpperCase())
        .maybeSingle();
      if (byCode?.profile_id) {
        const { data: p } = await supabase
          .from('student_profiles')
          .select('id, full_name, slug')
          .eq('id', byCode.profile_id)
          .maybeSingle();
        if (p) profile = p;
      }
    }

    if (!profile) {
      notFound = true;
    } else {
      const { data: stuData } = await supabase
        .from('students')
        .select(`
          id,
          student_code,
          batch_name,
          attendance_percentage,
          certificate_type,
          joined_at,
          opportunity:opportunities (title, slug),
          application:applications (college)
        `)
        .eq('profile_id', profile.id)
        .order('joined_at', { ascending: false });
      students = stuData || [];

      const studentIds = students.map((s: any) => s.id);
      const { data: certData } = studentIds.length
        ? await supabase
            .from('certificates')
            .select(`
              certificate_id,
              certificate_type,
              verification_url,
              issued_at,
              student:students (student_code),
              opportunity:opportunities (title)
            `)
            .in('student_id', studentIds)
            .eq('status', 'active')
            .order('issued_at', { ascending: false })
        : { data: [] };
      certificates = certData || [];
    }
  } catch (err) {
    console.error('Embed badge error:', err);
    notFound = true;
  }

  if (notFound || !profile) {
    return (
      <div className="flex h-full min-h-[120px] w-full items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-red-900/40 bg-[#0c0c0e] p-4 text-center">
          <p className="text-xs font-semibold text-red-400">Credential Not Found</p>
          <p className="mt-1 text-[10px] text-[#71717A]">No verified profile matches this link.</p>
        </div>
      </div>
    );
  }

  const college = students[0]?.application?.college || '';
  const latestCert = certificates[0] || null;
  const progCount = students.length;

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#26262b] bg-[#0c0c0e] shadow-2xl">
        {/* Header strip */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1c1c20]">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-blue-400">
            Ujjwalit Registry
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#52525b]">
            Verified
          </span>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-sm font-extrabold text-white">
              {initials(profile.full_name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#e4e4e7]">{profile.full_name}</p>
              {college && <p className="truncate text-[10px] text-[#71717A]">{college}</p>}
              <p className="text-[9px] text-[#52525b]">
                {progCount} program{progCount !== 1 ? 's' : ''}
                {students[0]?.batch_name ? ` · Batch ${students[0].batch_name}` : ''}
              </p>
            </div>
          </div>

          {latestCert ? (
            <div className="rounded-lg border border-[#1c1c20] bg-[#101013] p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                  (CERT_STYLE[latestCert.certificate_type] ?? CERT_STYLE.completion).pill
                }`}>
                  <span className={`h-1 w-1 rounded-full ${(CERT_STYLE[latestCert.certificate_type] ?? CERT_STYLE.completion).dot}`} />
                  {getCertificateTypeLabel(latestCert.certificate_type)}
                </span>
                <span className="text-[9px] text-[#52525b]">{formatDate(latestCert.issued_at)}</span>
              </div>
              {latestCert.opportunity?.title && (
                <p className="truncate text-[10px] text-[#a1a1aa]">{latestCert.opportunity.title}</p>
              )}
              <p className="font-mono text-[10px] font-semibold text-[#e4e4e7] truncate">{latestCert.certificate_id}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-[#1c1c20] bg-[#101013] p-3">
              <p className="text-[10px] text-[#52525b]">No active certificate on this profile yet.</p>
            </div>
          )}

          <a
            href={`https://verify.ujjwalit.co.in/student/${profile.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-blue-500"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Verify Credential
          </a>
        </div>
      </div>
    </div>
  );
}