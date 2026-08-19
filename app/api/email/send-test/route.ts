import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getAcceptanceEmailHtml, getOnboardingEmailHtml, getCompletionEmailHtml } from '@/lib/email/resend';
import { getTrackLabel } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/api-auth';

// Sample values so a test email renders like a real one
const SAMPLE = {
  name: 'Priyansh Sharma',
  track: 'Full Stack + AI Internship',
  code: 'STU-2026-001',
  certId: 'UJ-AI-2026-001',
};

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    // Authenticate the admin and resolve their inbox
    const user = await requireAdmin();
    const adminEmail = user.email;
    if (!adminEmail) {
      return NextResponse.json({ error: 'Your admin account has no email on file' }, { status: 400 });
    }

    const { type, subject: customSubject, body_html: customHtml, studentId, attachCertificate, attachLor } = await request.json();
    if (!type) {
      return NextResponse.json({ error: 'Email type is required' }, { status: 400 });
    }

    // If a real student is provided, render with their live data so links/attachments are real
    let real: Record<string, string> | null = null;
    let attachments: { filename: string; content: Buffer | string }[] = [];

    if (studentId) {
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
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      const app = student.application;
      const cert = type === 'completion'
        ? (await supabase
            .from('certificates')
            .select('certificate_id, verification_url, certificate_pdf_url')
            .eq('student_id', studentId)
            .eq('status', 'active')
            .maybeSingle()).data
        : null;

      const lorDoc = type === 'completion'
        ? (await supabase
            .from('documents')
            .select('document_url')
            .eq('student_id', studentId)
            .eq('document_type', 'recommendation')
            .maybeSingle()).data
        : null;

      real = {
        '{{name}}': app.full_name || 'Student',
        '{{track}}': getTrackLabel(app.internship_track),
        '{{code}}': student.student_code || '',
        '{{certId}}': cert?.certificate_id || '',
        '{{certificate}}': cert?.verification_url || (cert?.certificate_id ? `https://verify.ujjwalit.co.in/${cert.certificate_id}` : ''),
        '{{lor}}': lorDoc?.document_url ? supabase.storage.from('letters').getPublicUrl(lorDoc.document_url).data.publicUrl : '',
      };

      // Mirror the send route's attachment logic so the test shows exactly what ships
      if (type === 'completion') {
        if (attachCertificate !== false && cert?.certificate_pdf_url) {
          const { data: certFile, error: certFileErr } = await supabase.storage
            .from('certificates')
            .download(cert.certificate_pdf_url);
          if (!certFileErr && certFile) {
            attachments.push({
              filename: `${cert.certificate_id || 'certificate'}.pdf`,
              content: Buffer.from(await certFile.arrayBuffer()),
            });
          }
        }
        if (attachLor && lorDoc?.document_url) {
          const { data: lorFile, error: lorFileErr } = await supabase.storage
            .from('letters')
            .download(lorDoc.document_url);
          if (!lorFileErr && lorFile) {
            attachments.push({
              filename: `${real['{{name}}'] || 'Letter_of_Recommendation'}_LOR.pdf`,
              content: Buffer.from(await lorFile.arrayBuffer()),
            });
          }
        }
      }
    }

    // Load the saved template for this type so the test matches what will be sent
    const { data: savedTemplate } = await supabase
      .from('email_templates')
      .select('subject, body_html, is_enabled')
      .eq('template_key', type)
      .maybeSingle();

    if (savedTemplate && savedTemplate.is_enabled === false) {
      return NextResponse.json(
        { error: `The "${type}" email is disabled in Email Settings. Enable it before sending a test.` },
        { status: 400 }
      );
    }

    const savedSubject = savedTemplate?.subject || '';
    const savedBody = savedTemplate?.body_html || '';

    let subject = customSubject || '';
    let html = customHtml || '';

    if (type === 'acceptance') {
      subject = subject || savedSubject || 'Ujjwalit Technologies — Internship Offer';
      html = html || savedBody || getAcceptanceEmailHtml(SAMPLE.name, SAMPLE.track);
    } else if (type === 'onboarding') {
      subject = subject || savedSubject || 'Ujjwalit Technologies — Onboarding Credentials & Setup';
      html = html || savedBody || getOnboardingEmailHtml(SAMPLE.name, SAMPLE.track, SAMPLE.code);
    } else if (type === 'completion') {
      subject = subject || savedSubject || 'Ujjwalit Technologies — Internship Completion Certificate';
      html = html || savedBody || getCompletionEmailHtml(SAMPLE.name, SAMPLE.track, SAMPLE.certId, `https://verify.ujjwalit.co.in/${SAMPLE.certId}`);
    } else if (type === 'recommendation') {
      subject = subject || savedSubject || 'Ujjwalit Technologies — Letter of Recommendation';
      html = html || savedBody || `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1e293b;">
        <h2 style="color:#0f172a;border-bottom:2px solid #f97316;padding-bottom:10px;">Letter of Recommendation</h2>
        <p>Dear <strong>${SAMPLE.name}</strong>,</p>
        <p>Your Letter of Recommendation for the <strong>${SAMPLE.track}</strong> program has been issued by <strong>Ujjwalit Technologies</strong>.</p>
        <br />
        <p>Warm regards,</p>
        <p><strong>Ujjwalit Technologies Team</strong><br /><a href="https://ujjwalit.co.in">ujjwalit.co.in</a></p>
      </div>`;
    } else {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    // Fill placeholders with sample data (or real student data when provided)
    const replacements: Record<string, string> = real || {
      '{{name}}': SAMPLE.name,
      '{{track}}': SAMPLE.track,
      '{{code}}': SAMPLE.code,
      '{{certId}}': SAMPLE.certId,
      '{{certificate}}': `https://verify.ujjwalit.co.in/${SAMPLE.certId}`,
      '{{lor}}': '',
    };
    for (const [key, value] of Object.entries(replacements)) {
      subject = subject.replaceAll(key, value);
      html = html.replaceAll(key, value);
    }

    const result = await sendEmail({
      to: adminEmail,
      subject: `[TEST] ${subject}`,
      html,
      ...(attachments.length > 0 ? { attachments } : {}),
    });

    return NextResponse.json({ success: true, to: adminEmail, result });
  } catch (err: any) {
    console.error('Test email error:', err);
    const message = err instanceof Error && err.message === 'Unauthorized'
      ? 'Unauthorized'
      : (err?.message || 'Internal error');
    return NextResponse.json({ error: message }, { status: err instanceof Error && err.message === 'Unauthorized' ? 401 : 500 });
  }
}
