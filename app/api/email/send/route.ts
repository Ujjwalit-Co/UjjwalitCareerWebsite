import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getAcceptanceEmailHtml, getOnboardingEmailHtml, getCompletionEmailHtml } from '@/lib/email/resend';
import { getTrackLabel } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    const { studentId, type, customSubject, customHtml } = await request.json();

    if (!studentId || !type) {
      return NextResponse.json({ error: 'Student ID and email type are required' }, { status: 400 });
    }

    // 1. Fetch Student details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        application:applications (
          full_name,
          email,
          internship_track
        )
      `)
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 444 });
    }

    const app = student.application;
    const trackName = getTrackLabel(app.internship_track);

    let subject = customSubject || '';
    let html = customHtml || '';

    if (type === 'acceptance') {
      subject = subject || 'Ujjwalit Technologies — Internship Offer';
      html = html || getAcceptanceEmailHtml(app.full_name, trackName);
    } else if (type === 'onboarding') {
      subject = subject || 'Ujjwalit Technologies — Onboarding Credentials & Setup';
      html = html || getOnboardingEmailHtml(app.full_name, trackName, student.student_code);
    } else if (type === 'completion') {
      // Fetch Certificate ID
      const { data: cert } = await supabase
        .from('certificates')
        .select('certificate_id')
        .eq('student_id', studentId)
        .eq('status', 'active')
        .maybeSingle();

      if (!cert) {
        return NextResponse.json({ error: 'No active certificate found for this student' }, { status: 400 });
      }

      subject = subject || 'Ujjwalit Technologies — Internship Completion Certificate';
      html = html || getCompletionEmailHtml(app.full_name, trackName, cert.certificate_id);
    } else {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    // 2. Dispatch Email via Resend
    const result = await sendEmail({
      to: app.email,
      subject,
      html,
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('Email dispatcher error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
