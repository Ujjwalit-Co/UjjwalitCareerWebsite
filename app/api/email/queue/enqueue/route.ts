import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const { studentIds, type, attachCertificate, attachLor, force } = await request.json();

    if (!Array.isArray(studentIds) || studentIds.length === 0 || !type) {
      return NextResponse.json({ error: 'Student IDs array and email type are required' }, { status: 400 });
    }

    let enqueued = 0;
    let skipped = 0;

    for (const studentId of studentIds) {
      // Check if an email for this student and type is already pending, sending, or sent
      const { data: existingJob } = await supabase
        .from('email_queue')
        .select('id')
        .eq('student_id', studentId)
        .eq('email_type', type)
        .in('status', ['pending', 'sending', 'sent'])
        .maybeSingle();

      if (existingJob && !force) {
        skipped++;
        continue;
      }

      // When force-resending, remove any old job for this student + type
      if (existingJob && force) {
        await supabase
          .from('email_queue')
          .delete()
          .eq('id', existingJob.id);
      }

      // Enqueue the new email job
      const { error } = await supabase.from('email_queue').insert({
        student_id: studentId,
        email_type: type,
        attach_certificate: attachCertificate ?? true,
        attach_lor: attachLor ?? false,
        status: 'pending',
      });

      if (error) {
        console.error(`Error enqueuing email for student ${studentId}:`, error);
        skipped++;
      } else {
        enqueued++;
      }
    }

    return NextResponse.json({ success: true, enqueued, skipped });
  } catch (err: any) {
    console.error('Email enqueue error:', err);
    const message = err instanceof Error && err.message === 'Unauthorized'
      ? 'Unauthorized'
      : (err?.message || 'Internal error');
    return NextResponse.json({ error: message }, { status: err instanceof Error && err.message === 'Unauthorized' ? 401 : 500 });
  }
}