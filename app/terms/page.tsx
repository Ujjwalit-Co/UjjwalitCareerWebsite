import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms & Conditions — Ujjwalit Technologies Private Limited',
  description:
    'Read the Terms and Conditions governing participation in Ujjwalit internship and developer programs, certificate issuance, and use of this platform.',
};

const EFFECTIVE_DATE = 'August 15, 2025';
const COMPANY = 'Ujjwalit Technologies Private Limited';
const WEBSITE = 'https://ujjwalit.co.in';
const EMAIL = 'ujjwalit.p@gmail.com';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans">
      {/* Top bar */}
      <div className="border-b border-[#242424] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#A1A1AA] hover:text-[#F5F5F5] transition-colors"
          >
            <ArrowLeft size={15} />
            Back to Programs
          </Link>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#52525B]">
            <ShieldCheck size={12} className="text-[#1A8BA6]" />
            Legal Document
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-[#242424] bg-[#111111] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#1A8BA6]">
            {COMPANY}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Terms &amp; Conditions
          </h1>
          <p className="mt-3 text-sm text-[#71717A]">
            Effective date: <span className="text-[#A1A1AA]">{EFFECTIVE_DATE}</span>
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#A1A1AA]">
            These Terms &amp; Conditions govern your participation in any program, event, or
            service offered by {COMPANY} through this platform. By submitting an application
            or registering as a student, you agree to be bound by these terms.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-12">

          <Section title="1. About Ujjwalit Technologies Private Limited">
            <p>
              {COMPANY} ("Ujjwalit", "we", "our", or "us") is a private limited company
              registered in India. We operate developer programs, internships, and skill-based
              training programs for students and young professionals. Our primary platform is
              accessible at{' '}
              <a href={WEBSITE} target="_blank" rel="noreferrer" className="text-[#1A8BA6] underline underline-offset-2 hover:text-[#F5F5F5]">
                {WEBSITE}
              </a>{' '}
              and associated subdomains including the certificate verification portal.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <ul className="space-y-2">
              <Li>You must be at least 16 years of age to apply for or participate in any Ujjwalit program.</Li>
              <Li>Applications are open to students and early-career professionals who meet the eligibility criteria published on the specific program page.</Li>
              <Li>By submitting an application, you confirm that all information provided is accurate, complete, and not misleading.</Li>
              <Li>Ujjwalit reserves the right to reject or revoke participation if eligibility conditions are found to be misrepresented.</Li>
            </ul>
          </Section>

          <Section title="3. Programs, Batches & Enrollment">
            <ul className="space-y-2">
              <Li>Each program has its own capacity, duration, fees (if any), and eligibility criteria, all of which are published on the respective program page before you apply.</Li>
              <Li>Acceptance into a program is at the sole discretion of Ujjwalit. Receiving a confirmation email does not guarantee final enrollment until payment (where applicable) has been verified.</Li>
              <Li>Batch dates and schedules are published on the platform and may be updated with prior notice. Ujjwalit is not liable for any inconvenience caused by schedule adjustments.</Li>
              <Li>If a program is discontinued or archived, enrolled students will be notified and, where applicable, offered an alternative batch or a refund.</Li>
            </ul>
          </Section>

          <Section title="4. Fees & Payments">
            <ul className="space-y-2">
              <Li>Certain programs carry a participation fee, which is clearly stated on the program detail page before you apply.</Li>
              <Li>All fees are in Indian Rupees (INR) and are inclusive of applicable taxes unless otherwise stated.</Li>
              <Li>Payments are verified manually. Access to onboarding credentials is granted only after payment is confirmed by our team.</Li>
              <Li>Fees are generally non-refundable once onboarding has commenced, except where the program is cancelled or rescheduled by Ujjwalit.</Li>
              <Li>Refund requests must be submitted to <a href={`mailto:${EMAIL}`} className="text-[#1A8BA6] underline underline-offset-2">{EMAIL}</a> within 48 hours of payment and before onboarding begins.</Li>
            </ul>
          </Section>

          <Section title="5. Data Collection & Linkage">
            <p className="mb-3">
              When you register or apply for a program, we collect and store the following
              personal information:
            </p>
            <ul className="space-y-2">
              <Li><strong>Identity data:</strong> Full name, email address, phone number, and college/institution name.</Li>
              <Li><strong>Academic data:</strong> Internship track selected, batch name, student code assigned upon enrollment.</Li>
              <Li><strong>Credential data:</strong> Certificates issued, statements of achievement, completion status, and verification QR codes.</Li>
              <Li><strong>Cross-program linkage:</strong> If you enroll in more than one Ujjwalit program (current or future), your profile data — including your email address and college — will be linked across all your enrollments under a single persistent student record. This allows us to maintain a unified academic history and issue consolidated credentials.</Li>
            </ul>
            <p className="mt-4">
              All data is stored securely in accordance with our{' '}
              <Link href="/privacy" className="text-[#1A8BA6] underline underline-offset-2 hover:text-[#F5F5F5]">
                Privacy Policy
              </Link>
              . We do not sell, rent, or share your personal data with third parties for
              marketing purposes.
            </p>
          </Section>

          <Section title="6. Certificates & Statements of Achievement">
            <ul className="space-y-2">
              <Li>Certificates of completion are issued digitally upon satisfying the program's completion criteria as determined by Ujjwalit.</Li>
              <Li>Each certificate carries a unique verification ID and QR code that can be independently verified through our public verification portal.</Li>
              <Li>Statements of Achievement may be issued as an add-on for exceptional performance or project submissions, at Ujjwalit's discretion.</Li>
              <Li>Certificates remain the intellectual property of Ujjwalit and may include branding, logos, and program identifiers.</Li>
              <Li>Any attempt to forge, alter, or misrepresent a Ujjwalit certificate will result in immediate revocation and may be reported to relevant authorities.</Li>
            </ul>
          </Section>

          <Section title="7. Code of Conduct">
            <ul className="space-y-2">
              <Li>Participants are expected to conduct themselves professionally and respectfully during all program interactions, including online sessions, group chats, and submission reviews.</Li>
              <Li>Plagiarism, academic dishonesty, or submission of others' work as your own is strictly prohibited and will result in disqualification without refund.</Li>
              <Li>Harassment, discrimination, or any form of abusive behaviour toward Ujjwalit staff or fellow participants will result in immediate termination of enrollment.</Li>
            </ul>
          </Section>

          <Section title="8. Intellectual Property">
            <ul className="space-y-2">
              <Li>All program content, curricula, materials, and branding are the exclusive intellectual property of {COMPANY}.</Li>
              <Li>You may not reproduce, distribute, or create derivative works from our materials without prior written permission.</Li>
              <Li>Projects and submissions you create during a program remain your own intellectual property, subject to a non-exclusive licence granted to Ujjwalit to showcase your work for promotional purposes (with attribution).</Li>
            </ul>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>
              To the fullest extent permitted by applicable law, Ujjwalit shall not be liable
              for any indirect, incidental, special, or consequential damages arising from your
              participation in a program or use of this platform, including but not limited to
              loss of employment, loss of income, or failure to meet academic requirements.
              Our total liability in any matter arising from these terms shall not exceed the
              fees paid by you for the specific program in question.
            </p>
          </Section>

          <Section title="10. Modifications">
            <p>
              Ujjwalit reserves the right to modify these Terms &amp; Conditions at any time.
              Material changes will be communicated via the email address you provided during
              registration. Continued participation in a program following such notice
              constitutes your acceptance of the revised terms.
            </p>
          </Section>

          <Section title="11. Governing Law & Dispute Resolution">
            <p>
              These Terms are governed by and construed in accordance with the laws of India.
              Any disputes arising from these Terms shall be subject to the exclusive
              jurisdiction of the courts of India. We encourage you to first contact us at{' '}
              <a href={`mailto:${EMAIL}`} className="text-[#1A8BA6] underline underline-offset-2">{EMAIL}</a>{' '}
              to resolve any issue amicably before initiating legal proceedings.
            </p>
          </Section>

          <Section title="12. Contact">
            <p>
              For any questions regarding these Terms &amp; Conditions, please reach out to:
            </p>
            <div className="mt-4 rounded-lg border border-[#242424] bg-[#111111] p-5 text-sm text-[#A1A1AA] space-y-1">
              <p className="font-bold text-[#F5F5F5]">{COMPANY}</p>
              <p>Email: <a href={`mailto:${EMAIL}`} className="text-[#1A8BA6]">{EMAIL}</a></p>
              <p>Website: <a href={WEBSITE} target="_blank" rel="noreferrer" className="text-[#1A8BA6]">{WEBSITE}</a></p>
            </div>
          </Section>

          {/* Footer nav */}
          <div className="border-t border-[#242424] pt-8 flex flex-wrap gap-4 text-xs text-[#52525B]">
            <Link href="/privacy" className="hover:text-[#A1A1AA] transition-colors">Privacy Policy</Link>
            <Link href="/careers" className="hover:text-[#A1A1AA] transition-colors">Back to Programs</Link>
            <Link href="/verify" className="hover:text-[#A1A1AA] transition-colors">Certificate Verification</Link>
            <span className="ml-auto">© {new Date().getFullYear()} {COMPANY}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-extrabold tracking-tight text-[#F5F5F5]">{title}</h2>
      <div className="text-sm leading-7 text-[#A1A1AA]">{children}</div>
    </section>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1A8BA6]" />
      <span>{children}</span>
    </li>
  );
}
