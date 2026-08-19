import { sendEmail, getAcceptanceEmailHtml, getOnboardingEmailHtml, getCompletionEmailHtml } from '@/lib/email/resend';
import { getTrackLabel } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/admin';

export interface SendToStudentParams {
  studentId: string;
  type: 'acceptance' | 'onboarding' | 'completion' | 'recommendation';
  customSubject?: string;
  customHtml?: string;
  attachCertificate?: boolean;
  attachLor?: boolean;
}

export interface SendToStudentResult {
  to: string;
  subject: string;
  result: { success: boolean; id?: string };
}

const DEFAULT_SUBJECTS: Record<string, string> = {
  acceptance: 'Ujjwalit Technologies — Internship Offer',
  onboarding: 'Ujjwalit Technologies — Onboarding Credentials & Setup',
  completion: 'Ujjwalit Technologies — Internship Completion Certificate',
  recommendation: 'Ujjwalit Technologies — Letter of Recommendation',
};

const DEFAULT_BODIES: Record<string, (name: string, track: string, codeOrCert: string, profileUrl: string) => string> = {
  acceptance: (name, track, _codeOrCert, _profileUrl) => getAcceptanceEmailHtml(name, track),
  onboarding: (name, track, code, _profileUrl) => getOnboardingEmailHtml(name, track, code),
  completion: (name, track, certId, profileUrl) => getCompletionEmailHtml(name, track, certId, profileUrl),
  recommendation: (name, track) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1e293b;">
      <h2 style="color:#0f172a;border-bottom:2px solid #f97316;padding-bottom:10px;">Letter of Recommendation</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Your Letter of Recommendation for the <strong>${track}</strong> program has been issued by <strong>Ujjwalit Technologies</strong>.</p>
      <br />
      <p>Warm regards,</p>
      <p><strong>Ujjwalit Technologies Team</strong><br /><a href="https://ujjwalit.co.in">ujjwalit.co.in</a></p>
    </div>`,
};

const SENT_AT_FIELDS: Record<string, string> = {
  acceptance: 'acceptance_email_sent_at',
  onboarding: 'onboarding_email_sent_at',
  completion: 'completion_email_sent_at',
};

export async function sendToStudent(params: SendToStudentParams): Promise<SendToStudentResult> {
  const supabase = createAdminClient();
  const { studentId, type, customSubject, customHtml, attachCertificate, attachLor } = params;

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select(`
      *,
      application:applications (
        full_name,
        email,
        internship_track
      ),
      profile:student_profiles (
        slug
      )
    `)
    .eq('id', studentId)
    .single();

  if (studentError || !student) {
    throw new Error('Student not found');
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
    throw new Error(`The "${type}" email is currently disabled in Email Settings. Enable it before sending.`);
  }

  const savedSubject = savedTemplate?.subject || '';
  const savedBody = savedTemplate?.body_html || '';

  const cert =
    type === 'completion'
      ? (await supabase
          .from('certificates')
          .select('certificate_id, verification_url')
          .eq('student_id', studentId)
          .eq('status', 'active')
          .maybeSingle()).data
      : undefined;

  const certId = cert?.certificate_id;
  const certVerificationUrl = cert?.verification_url;
  const profileSlug = student.profile?.slug;
  const profileUrl = profileSlug ? `https://verify.ujjwalit.co.in/student/${profileSlug}` : undefined;

  // Public download link for the LOR PDF (letters bucket is public)
  let lorUrl: string | undefined;
  if (type === 'completion' || type === 'recommendation') {
    const { data: lorDoc } = await supabase
      .from('documents')
      .select('document_url')
      .eq('student_id', studentId)
      .eq('document_type', 'recommendation')
      .maybeSingle();
    if (lorDoc?.document_url) {
      lorUrl = supabase.storage.from('letters').getPublicUrl(lorDoc.document_url).data.publicUrl;
    }
  }

  const bodyFactory = DEFAULT_BODIES[type];
  if (!bodyFactory) {
    throw new Error('Invalid email type');
  }

  if (type === 'completion' && !certId) {
    throw new Error('No active certificate found for this student');
  }

  subject = subject || savedSubject || DEFAULT_SUBJECTS[type];
  html = html || savedBody || bodyFactory(app.full_name, trackName, certId || '', profileUrl || '');

  // Replace placeholders in custom templates
  const replacements: Record<string, string> = {
    '{{name}}': app.full_name,
    '{{track}}': trackName,
    '{{code}}': student.student_code,
    '{{certId}}': certId || '',
    '{{certificate}}': certVerificationUrl || (certId ? `https://verify.ujjwalit.co.in/${certId}` : ''),
    '{{lor}}': lorUrl || '',
    '{{profile_url}}': profileUrl || '',
  };
  for (const [key, value] of Object.entries(replacements)) {
    subject = subject.replaceAll(key, value);
    html = html.replaceAll(key, value);
  }

  // Build optional PDF attachments (certificate + LOR)
  const attachments: { filename: string; content: Buffer | string }[] = [];

  if (type === 'completion') {
    if (attachCertificate !== false) {
      const { data: cert } = await supabase
        .from('certificates')
        .select('certificate_pdf_url')
        .eq('student_id', studentId)
        .eq('status', 'active')
        .maybeSingle();
      if (cert?.certificate_pdf_url) {
        const { data: certFile, error: certFileErr } = await supabase.storage
          .from('certificates')
          .download(cert.certificate_pdf_url);
        if (!certFileErr && certFile) {
          attachments.push({
            filename: `${certId || 'certificate'}.pdf`,
            content: Buffer.from(await certFile.arrayBuffer()),
          });
        }
      }
    }

    if (attachLor) {
      const { data: lorDoc } = await supabase
        .from('documents')
        .select('document_url')
        .eq('student_id', studentId)
        .eq('document_type', 'recommendation')
        .maybeSingle();
      if (lorDoc?.document_url) {
        const { data: lorFile, error: lorFileErr } = await supabase.storage
          .from('letters')
          .download(lorDoc.document_url);
        if (!lorFileErr && lorFile) {
          attachments.push({
            filename: `${app.full_name || 'Letter_of_Recommendation'}_LOR.pdf`,
            content: Buffer.from(await lorFile.arrayBuffer()),
          });
        }
      }
    }
  }

  // Dispatch Email via Resend
  const result = await sendEmail({
    to: app.email,
    subject,
    html,
    ...(attachments.length > 0 ? { attachments } : {}),
  });

  // Record the sent timestamp in the database
  const updateField = SENT_AT_FIELDS[type];
  if (updateField) {
    await supabase
      .from('students')
      .update({ [updateField]: new Date().toISOString() })
      .eq('id', studentId);
  }

  return { to: app.email, subject, result };
}