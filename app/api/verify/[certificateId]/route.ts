import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  const { certificateId } = await params;

  if (!certificateId) {
    return NextResponse.json(
      { error: 'Certificate ID or verification hash is required' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  try {
    // Look up certificate by certificate_id or verification_hash
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(`
        id,
        certificate_id,
        verification_hash,
        qr_code_url,
        certificate_pdf_url,
        status,
        issued_at,
        opportunity:opportunities (
          id,
          title,
          description,
          slug,
          type
        ),
        student:students (
          id,
          student_code,
          batch_name,
          profile:student_profiles (
            id,
            slug,
            full_name
          ),
          application:applications (
            id,
            full_name,
            college,
            branch,
            internship_track
          )
        )
      `)
      .or(`certificate_id.eq.${certificateId},verification_hash.eq.${certificateId}`)
      .single();

    if (error || !certificate) {
      return NextResponse.json(
        { error: 'Certificate not found or invalid' },
        { status: 404 }
      );
    }

    // Fallback: if opportunity join is null (legacy cert with no opportunity_id),
    // look it up by the slug stored in the application's internship_track field
    if (!certificate.opportunity) {
      const trackSlug = (certificate as any).student?.application?.internship_track;
      if (trackSlug) {
        const { data: fallbackOpp } = await supabase
          .from('opportunities')
          .select('id, title, description, slug, type')
          .eq('slug', trackSlug)
          .maybeSingle();
        if (fallbackOpp) {
          (certificate as any).opportunity = fallbackOpp;
        }
      }
    }

    return NextResponse.json({ certificate });
  } catch (err) {
    console.error('Verify API Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
