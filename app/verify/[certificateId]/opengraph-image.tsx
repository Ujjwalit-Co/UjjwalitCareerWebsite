import { ImageResponse } from 'next/og';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatDate } from '@/lib/utils';

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const alt = 'Ujjwalit certificate verification';

async function getCert(certificateId: string) {
  const supabase = createAdminClient();
  try {
    const { data: cert } = await supabase
      .from('certificates')
      .select(`
        certificate_id,
        issued_at,
        status,
        opportunity:opportunities (title),
        student:students (
          student_code,
          application:applications (full_name, college)
        )
      `)
      .eq('certificate_id', certificateId)
      .maybeSingle();
    if (!cert) return null;
    return cert;
  } catch (err) {
    console.error('OG cert fetch error:', err);
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = await params;
  const cert = await getCert(certificateId);

  const name = (cert as any)?.student?.application?.full_name || 'Student';
  const program = (cert as any)?.opportunity?.title || 'Ujjwalit Developers Program';
  const status = cert?.status === 'active' ? 'Verified' : 'Revoked';
  const statusColor = cert?.status === 'active' ? '#10B981' : '#EF4444';

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
            <div style={{ fontSize: 20, fontWeight: 700, color: '#F97316', letterSpacing: 4 }}>REGISTRY</div>
          </div>
        </div>

        <div style={{ display: 'flex', marginTop: 36, padding: '8px 18px', borderRadius: 999, border: `2px solid ${statusColor}`, color: statusColor, fontSize: 20, fontWeight: 800, letterSpacing: 2 }}>
          {status.toUpperCase()} ✓
        </div>
        <div style={{ fontSize: 46, fontWeight: 800, color: '#F5F5F5', marginTop: 16, textAlign: 'center' }}>{name}</div>
        {program && <div style={{ fontSize: 24, fontWeight: 700, color: '#60A5FA', marginTop: 8 }}>{program}</div>}
        {cert?.issued_at && (
          <div style={{ fontSize: 18, color: '#94A3B8', marginTop: 8 }}>Issued {formatDate(cert.issued_at)}</div>
        )}
        <div style={{ marginTop: 24, padding: '10px 22px', border: '2px solid rgba(59,130,246,0.4)', borderRadius: 14, background: 'rgba(148,163,184,0.06)' }}>
          <div style={{ fontSize: 13, color: '#64748B', fontWeight: 700, marginBottom: 4, textAlign: 'center' }}>CERTIFICATE ID</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#E2E8F0', fontFamily: 'monospace' }}>{cert?.certificate_id || certificateId}</div>
        </div>
        <div style={{ marginTop: 28, fontSize: 16, color: '#60A5FA', fontFamily: 'monospace' }}>
          {`verify.ujjwalit.co.in/${certificateId}`}
        </div>
      </div>
    ),
    size
  );
}