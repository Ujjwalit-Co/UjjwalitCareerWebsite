import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import VerifyClient from './verify-client';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ certificateId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { certificateId } = await params;
  const supabase = createAdminClient();

  const base = {
    title: 'Certificate Verification | Ujjwalit Registry',
    description: 'Verify a Ujjwalit Technologies credential.',
  };

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

    if (!cert) return base;

    const app = (cert as any).student?.application;
    const name = app?.full_name || 'Student';
    const program = (cert as any).opportunity?.title || null;
    const status = cert.status === 'active' ? 'Verified' : 'Revoked';
    const title = program
      ? `${name} — ${program} | ${status} | Ujjwalit`
      : `${name} | ${status} | Ujjwalit Certificate`;
    const description = [
      `${status} certificate ${cert.certificate_id}`,
      `issued to ${name}`,
      app?.college ? `(${app.college})` : '',
      'by the Ujjwalit Technologies registry.',
    ]
      .filter(Boolean)
      .join(' ');

    const pageUrl = `https://verify.ujjwalit.co.in/${certificateId}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: pageUrl,
        type: 'website',
        siteName: 'Ujjwalit Registry',
        images: [
          {
            url: pageUrl,
            width: 1200,
            height: 630,
            alt: `${name} credential verification`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [pageUrl],
      },
    };
  } catch (err) {
    console.error('generateMetadata error:', err);
    return base;
  }
}

export default async function CertificateVerifyPage({ params }: Props) {
  const { certificateId } = await params;
  return <VerifyClient certificateId={certificateId} />;
}