import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    // 1. Authenticate the admin
    await requireAdmin();

    const { certificateId } = await request.json();

    if (!certificateId) {
      return NextResponse.json({ error: 'Certificate ID is required' }, { status: 400 });
    }

    // 2. Verify the certificate exists before revoking
    const { data: certificate, error: findError } = await supabase
      .from('certificates')
      .select('id, certificate_id, status')
      .eq('certificate_id', certificateId)
      .maybeSingle();

    if (findError || !certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    if (certificate.status === 'revoked') {
      return NextResponse.json({ error: 'Certificate is already revoked' }, { status: 400 });
    }

    // 3. Revoke the certificate
    const { error: revokeError } = await supabase
      .from('certificates')
      .update({ status: 'revoked' })
      .eq('id', certificate.id);

    if (revokeError) {
      throw new Error(`Revoke error: ${revokeError.message}`);
    }

    return NextResponse.json({ success: true, certificateId });
  } catch (err: any) {
    console.error('Certificate revoke error:', err);
    const message = err instanceof Error && err.message === 'Unauthorized'
      ? 'Unauthorized'
      : (err?.message || 'Internal error');
    return NextResponse.json(
      { error: message },
      { status: err instanceof Error && err.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}