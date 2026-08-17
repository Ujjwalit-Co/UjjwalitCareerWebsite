import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy — Ujjwalit Technologies Private Limited',
  description:
    'Read the Privacy Policy detailing how Ujjwalit collects, stores, protects, and links cross-program student profiles and data.',
};

const EFFECTIVE_DATE = 'August 15, 2025';
const COMPANY = 'Ujjwalit Technologies Private Limited';
const WEBSITE = 'https://ujjwalit.co.in';
const EMAIL = 'ujjwalit.p@gmail.com';

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-[#71717A]">
            Effective date: <span className="text-[#A1A1AA]">{EFFECTIVE_DATE}</span>
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#A1A1AA]">
            This Privacy Policy describes how {COMPANY} collects, uses, links, and safeguards
            your personal information when you register, apply for programs, or use our
            credentials and certificate registry services.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-12">

          <Section title="1. Information We Collect">
            <p className="mb-3">
              We collect information to verify qualifications, communicate updates, and issue
              academic and internship credentials. The types of personal data collected include:
            </p>
            <ul className="space-y-2">
              <Li><strong>Personal Identifiers:</strong> Name, personal email address, phone number, and college or university affiliation.</Li>
              <Li><strong>Academic Records:</strong> Course registrations, program enrollments, internship track specifications, assignments, evaluations, and batch designations.</Li>
              <Li><strong>Issued Credentials:</strong> Digital certificates of completion, unique credential hashes, statements of achievement, and public verification logs.</Li>
            </ul>
          </Section>

          <Section title="2. Cross-Program Data Linkage & Purpose">
            <p className="mb-3">
              We utilize a unified student database to trace your learning and development
              history with Ujjwalit.
            </p>
            <p className="mb-3">
              <strong>Data Linkage Mechanism:</strong> If you register or apply for multiple programs or
              events with us under the same email address, our system automatically links these
              activities under a single persistent student profile.
            </p>
            <p className="mb-3">
              This linkage is necessary to:
            </p>
            <ul className="space-y-2">
              <Li>Consolidate your academic history so recruiters or verification bodies can view all your verified accomplishments in a single verified dashboard.</Li>
              <Li>Prevent duplicate student identifier creation and streamline credential audits.</Li>
              <Li>Offer personalized program recommendations based on previous course tracks completed.</Li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Data">
            <ul className="space-y-2">
              <Li>To process your enrollment applications and coordinate batch schedules.</Li>
              <Li>To send programmatic email notifications (such as onboarding credentials, acceptance offers, and certificate links) using dispatch pipelines.</Li>
              <Li>To maintain the public-facing certificate verification registry that allows employers to confirm your credential status via QR code checks.</Li>
              <Li>To comply with legal, tax, or regulatory requirements in India.</Li>
            </ul>
          </Section>

          <Section title="4. Sharing and Disclosure">
            <ul className="space-y-2">
              <Li><strong>Public Verification:</strong> The certificate verification system makes certain details (specifically your full name, student code, program title, completion date, and verification status) publicly visible to anyone possessing your credential ID or scanning your certificate QR code.</Li>
              <Li><strong>Third-Party Processors:</strong> We share data with database hosts (Supabase) and email delivery networks (Resend) solely to facilitate core platform operations. These processors are contractually bound to maintain strict data confidentiality.</Li>
              <Li><strong>No Commercial Sharing:</strong> We do not sell, rent, or trade your personal data with third-party marketers or advertisers.</Li>
            </ul>
          </Section>

          <Section title="5. Data Security & Storage">
            <p>
              We implement industry-standard secure socket layers (SSL), data encryption at rest,
              and strict authorization controls to protect your data. Since all program records
              and certificate credentials remain part of the public registry, your verification details
              are retained permanently to ensure long-term validation capabilities for employers, unless
              a deletion request is formally filed.
            </p>
          </Section>

          <Section title="6. Your Choices & Data Rights">
            <p className="mb-3">
              Depending on your location, you may have rights regarding your personal information:
            </p>
            <ul className="space-y-2">
              <Li><strong>Access & Rectification:</strong> You can request a correction to spelling mistakes or college naming formats on your certificate or dashboard records.</Li>
              <Li><strong>Erasure:</strong> You can request the removal of your active applicant records. Note that removing credentials from our registry will invalidate verification checks for recruiters.</Li>
            </ul>
            <p className="mt-4">
              To exercise any rights, contact us directly at{' '}
              <a href={`mailto:${EMAIL}`} className="text-[#1A8BA6] underline underline-offset-2">{EMAIL}</a>.
            </p>
          </Section>

          <Section title="7. Contact Information">
            <p>
              For inquiries regarding data processing, privacy controls, or to request record removal:
            </p>
            <div className="mt-4 rounded-lg border border-[#242424] bg-[#111111] p-5 text-sm text-[#A1A1AA] space-y-1">
              <p className="font-bold text-[#F5F5F5]">{COMPANY}</p>
              <p>Email: <a href={`mailto:${EMAIL}`} className="text-[#1A8BA6]">{EMAIL}</a></p>
              <p>Website: <a href={WEBSITE} target="_blank" rel="noreferrer" className="text-[#1A8BA6]">{WEBSITE}</a></p>
            </div>
          </Section>

          {/* Footer nav */}
          <div className="border-t border-[#242424] pt-8 flex flex-wrap gap-4 text-xs text-[#52525B]">
            <Link href="/terms" className="hover:text-[#A1A1AA] transition-colors">Terms &amp; Conditions</Link>
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
