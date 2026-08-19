import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Ujjwalit Technologies <send@hr.ujjwalit.co.in>';
const careersUrl = process.env.NEXT_PUBLIC_CAREERS_URL || 'https://careers.ujjwalit.co.in';
const verifyUrl = process.env.NEXT_PUBLIC_VERIFY_URL || 'https://verify.ujjwalit.co.in';
const paymentFormUrl = process.env.NEXT_PUBLIC_PAYMENT_FORM_URL || `${careersUrl}/payment`;

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer | string }[];
}

export async function sendEmail({ to, subject, html, attachments }: SendMailParams) {
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
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
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

export function getCompletionEmailHtml(name: string, track: string, certId: string, profileUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate of Completion — Ujjwalit</title>
  <style>
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #0b1120 !important;
      }
      .container {
        background-color: #1e293b !important;
        border: 1px solid #334155 !important;
      }
      .header-bg {
        background-color: #3B82F6 !important;
      }
      .header-text {
        color: #ffffff !important;
      }
      .body-text {
        color: #e2e8f0 !important;
      }
      .section-bg {
        background-color: #334155 !important;
        border-color: #475569 !important;
      }
      .link-text {
        color: #F97316 !important;
      }
      .footer-bg {
        background-color: #0f172a !important;
        color: #94a3b8 !important;
      }
      .footer-link {
        color: #94a3b8 !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, Helvetica, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <!-- Email Container -->
        <table class="container" width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td class="header-bg" align="center" style="background-color: #3B82F6; padding: 36px 24px; color: #ffffff;">
              <h1 class="header-text" style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 0.5px;">Ujjwalit Developers Program</h1>
              <p class="header-text" style="font-size: 18px; margin-top: 10px; font-weight: 600; opacity: 0.9;">Certificate of Completion</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 32px; color: #334155; line-height: 1.7;">
              <h2 style="margin: 0 0 16px 0; color: #1e3a8a; font-size: 22px;">Congratulations, ${name}!</h2>
              <p class="body-text" style="font-size: 16px; margin: 0 0 16px 0;">
                We are thrilled to celebrate your successful completion of the
                <strong style="color: #F97316;">${track}</strong> program. Your hard work and dedication have truly paid off!
              </p>

              <!-- Certificate & Badge Section -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" class="section-bg" style="background-color: #f0f4f8; border: 1px solid #e0e7ef; border-radius: 10px; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 12px 0; color: #1e3a8a; font-size: 18px;">Access Your Credentials</h3>
                    <p class="body-text" style="font-size: 15px; margin: 0 0 16px 0;">
                      Your Certificate ID: <strong style="color: #1e3a8a; font-family: Consolas, Menlo, monospace;">${certId}</strong>
                    </p>
                    <div style="text-align: center; margin-bottom: 16px;">
                      <a href="${profileUrl}" class="link-text" style="background-color: #F97316; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        View & Download Certificate and Badge →
                      </a>
                    </div>
                    <p class="body-text" style="font-size: 14px; color: #64748b; margin: 0;">
                      This link will take you to your personal verification page where you can download your official certificate and shareable badge.
                    </p>
                  </td>
                </tr>
              </table>

              <p class="body-text" style="font-size: 16px; margin: 0 0 16px 0;">
                If you are interested in a Letter of Recommendation, please reply to this email within this week to initiate your request.
              </p>

              <p class="body-text" style="font-size: 16px; margin: 0; color: #334155;">
                Warm regards,<br>
                <strong style="color: #1e3a8a;">The Ujjwalit Team</strong><br>
                <span style="font-size: 13px; color: #64748b;">Ujjwalit Technologies Pvt. Ltd.</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer-bg" align="center" style="background-color: #0f172a; padding: 20px 24px; color: #94a3b8; font-size: 13px;">
              <p style="margin: 0;">© 2026 Ujjwalit Technologies Pvt. Ltd. All rights reserved.</p>
              <p style="margin: 6px 0 0 0;">
                <a href="https://verify.ujjwalit.co.in" class="footer-link" style="color: #94a3b8; text-decoration: none;">Verify a credential</a>
                &nbsp;·&nbsp;
                <a href="https://careers.ujjwalit.co.in" class="footer-link" style="color: #94a3b8; text-decoration: none;">Explore programs</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function getApplyReceivedEmailHtml(name: string, _programTitle: string): string {
  return `
<div
  style="
    background:#0a0a0a;
    padding:20px 12px;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
  "
>
  <table
    role="presentation"
    cellpadding="0"
    cellspacing="0"
    width="100%"
    style="
      max-width:620px;
      margin:auto;
      background:#111111;
      border:1px solid #242424;
    "
  >
    <!-- HEADER -->
    <tr>
      <td
        style="
          padding:32px 24px;
          border-top:4px solid #f97316;
          border-bottom:1px solid #242424;
        "
      >
        <p
          style="
            margin:0;
            color:#f97316;
            font-size:11px;
            letter-spacing:3px;
            text-transform:uppercase;
          "
        >
          UJJWALIT TECHNOLOGIES
        </p>

        <h1
          style="
            margin:12px 0 8px;
            color:#ffffff;
            font-size:32px;
            line-height:38px;
            font-weight:800;
          "
        >
          DEVELOPERS
          <span style="color:#f97316;">PROGRAM</span>
        </h1>

        <p
          style="
            margin:0;
            color:#a1a1aa;
            font-size:14px;
          "
        >
          Mentored &bull; Guided &bull; Internship Opportunities
        </p>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td style="padding:32px 24px;">
        <h2
          style="
            margin:0 0 20px;
            color:#ffffff;
            font-size:24px;
            line-height:30px;
          "
        >
          Hello ${name},
        </h2>

        <p
          style="
            color:#d4d4d8;
            font-size:15px;
            line-height:28px;
            margin:0 0 20px;
          "
        >
          Thank you for applying to the
          <strong>Ujjwalit Developers Program (UDP)</strong>.
        </p>

        <p
          style="
            color:#d4d4d8;
            font-size:15px;
            line-height:28px;
            margin:0;
          "
        >
          After reviewing your application, we are pleased to inform you that
          your profile has been shortlisted for the next stage of the selection
          process.
        </p>

        <p
          style="
            color:#d4d4d8;
            font-size:15px;
            line-height:28px;
            margin-top:20px;
          "
        >
          Please note that this does
          <strong>not confirm your final admission</strong>
          into the program. To proceed further, you must complete the remaining
          onboarding steps below.
        </p>

        <!-- ACTION REQUIRED -->
        <div
          style="
            margin-top:32px;
            padding:24px;
            background:#0f0f0f;
            border:1px solid #242424;
          "
        >
          <h3
            style="
              margin:0 0 16px;
              color:#f97316;
              font-size:18px;
            "
          >
            Action Required
          </h3>

          <p
            style="
              color:#f5f5f5;
              margin:0 0 16px;
              line-height:28px;
            "
          >
            <strong>Step 1:</strong> Join the Official UDP Community
          </p>

          <div style="text-align:center;margin-bottom:24px;">
            <a
              href="https://chat.whatsapp.com/GLr25QLnFe10YYBgVxiNg1"
              style="
                display:inline-block;
                background:#25D366;
                color:#ffffff;
                text-decoration:none;
                padding:14px 24px;
                font-weight:600;
              "
            >
              Join WhatsApp Community
            </a>
          </div>

          <p
            style="
              color:#f5f5f5;
              margin:0 0 16px;
              line-height:28px;
            "
          >
            <strong>Step 2:</strong> Complete Your Registration Form
          </p>

          <div style="text-align:center;">
            <a
              href="https://forms.gle/EVsAyRdT88Yg8iCL8"
              style="
                display:inline-block;
                background:#f97316;
                color:#ffffff;
                text-decoration:none;
                padding:14px 24px;
                font-weight:600;
              "
            >
              Complete Registration
            </a>
          </div>

          <p
            style="
              color:#a1a1aa;
              font-size:13px;
              line-height:24px;
              margin-top:20px;
            "
          >
            Please ensure you have also completed your application through
            careers.ujjwalit.co.in
          </p>
        </div>

        <!-- WHAT HAPPENS NEXT -->
        <div
          style="
            margin-top:32px;
            padding:24px;
            border:1px solid #242424;
            background:#0f0f0f;
          "
        >
          <h3
            style="
              margin-top:0;
              color:#3b82f6;
              font-size:18px;
            "
          >
            What Happens Next?
          </h3>

          <p style="color:#f5f5f5;line-height:30px;margin:0;">
            &check; Your registration will be reviewed<br />
            &check; Payment verification will be completed<br />
            &check; An official Offer Letter will be issued<br />
            &check; You will be added to your batch's WhatsApp group<br />
            &check; Session links and resources will be shared weekly<br />
            &check; You will work under mentor guidance on your Major Project<br />
            &check; You will complete your Minor Project using the same development
            principles<br />
            &check; Final evaluation will be conducted based on participation and
            project quality
          </p>
        </div>

        <!-- PROGRAM HIGHLIGHTS -->
        <div
          style="
            margin-top:32px;
            padding:24px;
            border:1px solid #242424;
          "
        >
          <h3
            style="
              margin-top:0;
              color:#f97316;
            "
          >
            Program Highlights
          </h3>

          <table width="100%">
            <tr>
              <td style="color:#f5f5f5;padding:8px 0;">
                &check; One Major Project
              </td>
              <td style="color:#f5f5f5;padding:8px 0;">
                &check; One Minor Project
              </td>
            </tr>

            <tr>
              <td style="color:#f5f5f5;padding:8px 0;">
                &check; Guided Mentorship
              </td>
              <td style="color:#f5f5f5;padding:8px 0;">
                &check; Portfolio Development
              </td>
            </tr>

            <tr>
              <td style="color:#f5f5f5;padding:8px 0;">
                &check; Industry Workflows
              </td>
              <td style="color:#f5f5f5;padding:8px 0;">
                &check; Verifiable Certificate
              </td>
            </tr>
          </table>
        </div>

        <!-- IMPORTANT NOTICE -->
        <div
          style="
            margin-top:32px;
            padding:24px;
            background:#171717;
            border-left:4px solid #f97316;
          "
        >
          <h3
            style="
              margin-top:0;
              color:#ffffff;
            "
          >
            Important Notice
          </h3>

          <p
            style="
              color:#d4d4d8;
              line-height:28px;
              margin:0;
            "
          >
            UDP is an unpaid training and internship program.
          </p>

          <p
            style="
              color:#d4d4d8;
              line-height:28px;
              margin-top:16px;
            "
          >
            Only a limited number of outstanding participants may be selected
            for recommendation letters, future opportunities, project-based
            incentives, and performance-based stipends of up to &₹;5,000.
          </p>

          <p
            style="
              color:#d4d4d8;
              line-height:28px;
              margin-top:16px;
            "
          >
            Stipends are not guaranteed and are awarded solely on the basis of
            performance, participation, and project outcomes.
          </p>
        </div>

        <!-- REFUND POLICY -->
        <div
          style="
            margin-top:24px;
            padding:24px;
            background:#2b0f0f;
            border:1px solid #7f1d1d;
          "
        >
          <h3
            style="
              margin-top:0;
              color:#fca5a5;
            "
          >
            Refund Policy
          </h3>

          <p
            style="
              color:#fecaca;
              line-height:28px;
              margin:0;
            "
          >
            All registration and enrollment fees paid towards the Ujjwalit
            Developers Program are strictly non-refundable once payment has been
            completed.
          </p>
        </div>

        <!-- LIMITED SEATS -->
        <div
          style="
            margin-top:24px;
            padding:24px;
            background:#0c1628;
            border:1px solid #1d4ed8;
          "
        >
          <h3
            style="
              margin-top:0;
              color:#60a5fa;
            "
          >
            Limited Seats Available
          </h3>

          <p
            style="
              color:#dbeafe;
              line-height:28px;
              margin:0;
            "
          >
            Applications are reviewed on a rolling basis. Candidates who
            complete all onboarding requirements earlier will receive priority
            consideration during batch allocation.
          </p>
        </div>

        <!-- FOOTER -->
        <div
          style="
            margin-top:40px;
            padding-top:24px;
            border-top:1px solid #242424;
          "
        >
          <p
            style="
              color:#a1a1aa;
              line-height:26px;
              font-size:14px;
            "
          >
            Best Regards,<br />
            <strong style="color:#ffffff;">
              Ujjwalit Developers Program (UDP)
            </strong><br />
            Powered by Ujjwalit Technologies
          </p>

          <p
            style="
              color:#71717a;
              font-size:13px;
            "
          >
            careers.ujjwalit.co.in
          </p>
        </div>
      </td>
    </tr>
  </table>
</div>
  `;
}
