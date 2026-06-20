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
        student:students (
          id,
          student_code,
          batch_name,
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

    return NextResponse.json({ certificate });
  } catch (err: any) {
    console.error('Verify API Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
