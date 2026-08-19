import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import ProfileClient from './profile-client';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();

  const base = {
    title: 'Student Profile Not Found',
    description: 'No matching student found in the Ujjwalit registry.',
  };

  try {
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('id, full_name, slug')
      .eq('slug', slug)
      .maybeSingle();

    if (!profile) return base;

    const { data: students } = await supabase
      .from('students')
      .select(`
        opportunity:opportunities (title),
        application:applications (college),
        batch_name
      `)
      .eq('profile_id', profile.id)
      .order('joined_at', { ascending: false })
      .limit(1);

    const s = (students?.[0] as any) || null;
    const program = s?.opportunity?.title || null;
    const college = s?.application?.college || null;
    const batch = s?.batch_name || null;

    const title = program
      ? `${profile.full_name} — ${program} | Ujjwalit Verified`
      : `${profile.full_name} | Ujjwalit Developers Program`;
    const description = [
      `${profile.full_name}${college ? `, ${college}` : ''}`,
      program ? `completed ${program}` : '',
      batch ? `(Batch ${batch})` : '',
      '— verified by the Ujjwalit Technologies registry.',
    ]
      .filter(Boolean)
      .join(' ');

    const pageUrl = `https://verify.ujjwalit.co.in/student/${profile.slug}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: pageUrl,
        type: 'profile',
        siteName: 'Ujjwalit Registry',
        images: [
          {
            url: pageUrl,
            width: 1200,
            height: 630,
            alt: `${profile.full_name} verified credential`,
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

export default async function StudentProfilePage({ params }: Props) {
  const { slug } = await params;
  return <ProfileClient slug={slug} />;
}