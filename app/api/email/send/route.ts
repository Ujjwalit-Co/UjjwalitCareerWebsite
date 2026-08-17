import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getAcceptanceEmailHtml, getOnboardingEmailHtml, getCompletionEmailHtml } from '@/lib/email/resend';
import { getTrackLabel } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    // 1. Authenticate the admin
    await requireAdmin();

    const { studentId, type, customSubject, customHtml } = await request.json();

    if (!studentId || !type) {
      return NextResponse.json({ error: 'Student ID and email type are required' }, { status: 400 });
    }

    // 2. Fetch Student details
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

    // Load the admin-configured template (subject, body, enabled state) for this email type
    const { data: savedTemplate } = await supabase
      .from('email_templates')
      .select('subject, body_html, is_enabled')
      .eq('template_key', type)
      .maybeSingle();

    if (savedTemplate && savedTemplate.is_enabled === false) {
      return NextResponse.json(
        { error: `The "${type}" email is currently disabled in Email Settings. Enable it before sending.` },
        { status: 400 }
      );
    }

    const savedSubject = savedTemplate?.subject || '';
    const savedBody = savedTemplate?.body_html || '';

    const certId =
      type === 'completion'
        ? (await supabase
            .from('certificates')
            .select('certificate_id')
            .eq('student_id', studentId)
            .eq('status', 'active')
            .maybeSingle()).data?.certificate_id
        : undefined;

    if (type === 'acceptance') {
      subject = subject || savedSubject || 'Ujjwalit Technologies — Internship Offer';
      html = html || savedBody || getAcceptanceEmailHtml(app.full_name, trackName);
    } else if (type === 'onboarding') {
      subject = subject || savedSubject || 'Ujjwalit Technologies — Onboarding Credentials & Setup';
      html = html || savedBody || getOnboardingEmailHtml(app.full_name, trackName, student.student_code);
    } else if (type === 'completion') {
      if (!certId) {
        return NextResponse.json({ error: 'No active certificate found for this student' }, { status: 400 });
      }

      subject = subject || savedSubject || 'Ujjwalit Technologies — Internship Completion Certificate';
      html = html || savedBody || getCompletionEmailHtml(app.full_name, trackName, certId);
    } else {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    // Replace placeholders in custom templates
    const replacements: Record<string, string> = {
      '{{name}}': app.full_name,
      '{{track}}': trackName,
      '{{code}}': student.student_code,
      '{{certId}}': certId || '',
    };
    for (const [key, value] of Object.entries(replacements)) {
      subject = subject.replaceAll(key, value);
      html = html.replaceAll(key, value);
    }

    // 3. Dispatch Email via Resend
    const result = await sendEmail({
      to: app.email,
      subject,
      html,
    });

    // Record the sent timestamp in the database
    let updateField = '';
    if (type === 'acceptance') updateField = 'acceptance_email_sent_at';
    else if (type === 'onboarding') updateField = 'onboarding_email_sent_at';
    else if (type === 'completion') updateField = 'completion_email_sent_at';

    if (updateField) {
      await supabase
        .from('students')
        .update({ [updateField]: new Date().toISOString() })
        .eq('id', studentId);
    }

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('Email dispatcher error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
