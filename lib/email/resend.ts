import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Ujjwalit Technologies <internships@ujjwalit.co.in>';
const careersUrl = process.env.NEXT_PUBLIC_CAREERS_URL || 'https://careers.ujjwalit.co.in';
const verifyUrl = process.env.NEXT_PUBLIC_VERIFY_URL || 'https://verify.ujjwalit.co.in';
const paymentFormUrl = process.env.NEXT_PUBLIC_PAYMENT_FORM_URL || `${careersUrl}/payment`;

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendMailParams) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is not defined. Email dispatch skipped.');
      return { success: false, warning: 'API key missing' };
    }

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) throw error;
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('Email send error:', err);
    throw err;
  }
}

export function getAcceptanceEmailHtml(name: string, track: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
      <h2 style="color: #0f172a; border-bottom: 2px solid #f97316; padding-bottom: 10px;">Program Acceptance</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Congratulations. Following your application review, we are pleased to accept you into the <strong>${track}</strong> track at <strong>Ujjwalit Technologies</strong>.</p>
      <p>Please follow the payment instructions and upload your payment screenshot through the form below:</p>
      <div style="margin: 25px 0; text-align: center;">
        <a href="${paymentFormUrl}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Open Payment Form</a>
      </div>
      <p>Once submitted, our admin team will verify the screenshot and send your onboarding credentials.</p>
      <p>If you have any questions, feel free to reply directly to this email.</p>
      <br />
      <p>Warm regards,</p>
      <p><strong>Ujjwalit Technologies Team</strong><br /><a href="https://ujjwalit.co.in">ujjwalit.co.in</a></p>
    </div>
  `;
}

export function getOnboardingEmailHtml(name: string, track: string, code: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
      <h2 style="color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Onboarding Credentials</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>We are excited to welcome you to <strong>Ujjwalit Technologies</strong>. Your registration payment is verified, and you are officially enrolled.</p>
      <table style="width: 100%; margin: 15px 0; border-collapse: collapse; font-size: 14px;">
        <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-weight: bold; width: 120px;">Intern Code:</td>
          <td style="padding: 10px; font-family: monospace; font-weight: bold; color: #0f172a;">${code}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-weight: bold;">Specialization:</td>
          <td style="padding: 10px;">${track}</td>
        </tr>
      </table>
      <p>Please follow the onboarding instructions shared by the team for your repository, tasks, and review schedule.</p>
      <br />
      <p>Welcome aboard,</p>
      <p><strong>Ujjwalit Technologies Team</strong><br /><a href="https://ujjwalit.co.in">ujjwalit.co.in</a></p>
    </div>
  `;
}

export function getCompletionEmailHtml(name: string, track: string, certId: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
      <h2 style="color: #0f172a; border-bottom: 2px solid #22c55e; padding-bottom: 10px;">Program Completion Certificate</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Congratulations on successfully completing the <strong>${track}</strong> program at <strong>Ujjwalit Technologies</strong>.</p>
      <p>Your digital certificate has been issued and registered. Certificate ID: <strong>${certId}</strong>.</p>
      <div style="margin: 25px 0; text-align: center;">
        <a href="${verifyUrl}/${certId}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Certificate</a>
      </div>
      <p>You can share the verification link with recruiters or add it to your portfolio.</p>
      <br />
      <p>Warm regards,</p>
      <p><strong>Ujjwalit Technologies Team</strong><br /><a href="https://ujjwalit.co.in">ujjwalit.co.in</a></p>
    </div>
  `;
}
