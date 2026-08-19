import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/api-auth';
import { sendToStudent } from '@/lib/email/send-to-student';

export const maxDuration = 60; // Extend max duration for processing multiple emails

const BATCH_SIZE = 5; // Number of emails to attempt to process in one go
const DELAY_MS = 1000; // Delay between sending each email to respect Resend rate limits (2/sec free tier)

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const { limit = BATCH_SIZE } = await request.json().catch(() => ({}));

    // Fetch pending jobs, ordered by creation time
    const { data: jobs, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (fetchError) throw fetchError;
    if (!jobs || jobs.length === 0) {
      const { count: remainingCount } = await supabase.from('email_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending');
      return NextResponse.json({ processed: 0, sent: 0, failed: 0, rateLimited: false, remaining: remainingCount || 0 });
    }

    let sentCount = 0;
    let failedCount = 0;
    let rateLimited = false;

    for (const job of jobs) {
      if (rateLimited) {
        // If we hit a rate limit, stop processing further jobs in this batch
        // The remaining jobs will stay 'pending' and can be picked up later.
        break;
      }

      // Mark job as sending to prevent duplicate processing
      await supabase.from('email_queue').update({ status: 'sending', attempts: job.attempts + 1, updated_at: new Date().toISOString() }).eq('id', job.id);

      try {
        await sendToStudent({
          studentId: job.student_id,
          type: job.email_type as any, // Cast to any to match the SendToStudentParams type
          attachCertificate: job.attach_certificate,
          attachLor: job.attach_lor,
        });

        await supabase.from('email_queue').update({ status: 'sent', sent_at: new Date().toISOString(), updated_at: new Date().toISOString(), error: null }).eq('id', job.id);
        sentCount++;
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to send email';
        console.error(`Error processing email queue job ${job.id}:`, errorMessage);

        // Check for rate limit specific errors from Resend (e.g., HTTP 429)
        if (/(rate limit|429|too many requests)/i.test(errorMessage)) {
          rateLimited = true;
          // Revert status to pending or mark as failed if it's a persistent rate limit issue
          await supabase.from('email_queue').update({ status: 'pending', error: errorMessage, updated_at: new Date().toISOString() }).eq('id', job.id);
          failedCount++; // Count as failed for this attempt
          break; // Stop processing further jobs in this batch
        } else {
          await supabase.from('email_queue').update({ status: 'failed', error: errorMessage, updated_at: new Date().toISOString() }).eq('id', job.id);
          failedCount++;
        }
      }

      // Introduce a delay between sending emails
      if (!rateLimited && (sentCount + failedCount < jobs.length)) {
        await delay(DELAY_MS);
      }
    }

    const { count: remainingCount } = await supabase.from('email_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending');

    return NextResponse.json({
      processed: jobs.length,
      sent: sentCount,
      failed: failedCount,
      rateLimited,
      remaining: remainingCount || 0,
    });
  } catch (err: any) {
    console.error('Email queue processor error:', err);
    const message = err instanceof Error && err.message === 'Unauthorized'
      ? 'Unauthorized'
      : (err?.message || 'Internal error');
    return NextResponse.json({ error: message }, { status: err instanceof Error && err.message === 'Unauthorized' ? 401 : 500 });
  }
}