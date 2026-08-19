import { ImageResponse } from 'next/og';
import { createAdminClient } from '@/lib/supabase/admin';

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const alt = 'Ujjwalit Developers Program verified credential';

async function getProfile(slug: string) {
  const supabase = createAdminClient();
  try {
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('id, full_name, slug')
      .eq('slug', slug)
      .maybeSingle();
    if (!profile) return null;

    const { data: students } = await supabase
      .from('students')
      .select(`
        id,
        student_code,
        batch_name,
        opportunity:opportunities (title),
        application:applications (college)
      `)
      .eq('profile_id', profile.id)
      .order('joined_at', { ascending: false });
    const s = (students?.[0] as any) || null;

    const studentIds = (students || []).map((x: any) => x.id);
    let cert: string | null = null;
    if (studentIds.length) {
      const { data: certificates } = await supabase
        .from('certificates')
        .select('certificate_id')
        .in('student_id', studentIds)
        .eq('status', 'active')
        .order('issued_at', { ascending: false })
        .limit(1);
      cert = certificates?.[0]?.certificate_id ?? null;
    }

    return {
      name: profile.full_name,
      program: s?.opportunity?.title || null,
      college: s?.application?.college || null,
      batch: s?.batch_name || null,
      cert,
      slug: profile.slug,
    };
  } catch (err) {
    console.error('OG profile fetch error:', err);
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProfile(slug);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #0B1120 0%, #05080F 100%)',
          position: 'relative',
          padding: 56,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: 'linear-gradient(90deg, #3B82F6 0%, #F97316 50%, #3B82F6 100%)',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://verify.ujjwalit.co.in/ujjwalitlogo.png"
            width={72}
            height={72}
            style={{ borderRadius: 16 }}
            alt=""
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#F5F5F5', letterSpacing: 2 }}>UJJWALIT</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#F97316', letterSpacing: 4 }}>DEVELOPERS PROGRAM</div>
          </div>
        </div>

        <div style={{ display: 'flex', marginTop: 40, color: '#94A3B8', fontSize: 18, fontWeight: 600 }}>
          VERIFIED CREDENTIAL
        </div>
        <div style={{ fontSize: 46, fontWeight: 800, color: '#F5F5F5', marginTop: 8, textAlign: 'center' }}>
          {p?.name || 'Student'}
        </div>
        {(p?.program || p?.college) && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 12, gap: 4 }}>
            {p?.program && <div style={{ fontSize: 24, fontWeight: 700, color: '#60A5FA' }}>{p.program}</div>}
            {p?.college && <div style={{ fontSize: 18, color: '#94A3B8' }}>{p.college}</div>}
          </div>
        )}
        {p?.cert && (
          <div style={{ marginTop: 20, padding: '12px 24px', border: '2px solid rgba(59,130,246,0.4)', borderRadius: 14, background: 'rgba(148,163,184,0.06)' }}>
            <div style={{ fontSize: 13, color: '#64748B', fontWeight: 700, marginBottom: 4 }}>CERTIFICATE ID</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#E2E8F0', fontFamily: 'monospace' }}>{p.cert}</div>
          </div>
        )}
        <div style={{ marginTop: 32, fontSize: 16, color: '#60A5FA', fontFamily: 'monospace' }}>
          {`verify.ujjwalit.co.in/student/${p?.slug || slug}`}
        </div>
      </div>
    ),
    size
  );
}