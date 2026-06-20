'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getTrackLabel } from '@/lib/utils';
import { ArrowLeft, CheckCircle, Clock, ExternalLink, FileImage, Mail, Search, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const paymentFormUrl = process.env.NEXT_PUBLIC_PAYMENT_FORM_URL || '';

const tracker = [
  'Accepted Candidate',
  'Payment Instructions Shared',
  'Google Form Screenshot Upload',
  'Admin Verification',
  'Payment Confirmed',
  'Welcome Email Sent',
];

export default function CandidatePaymentPortal() {
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [app, setApp] = useState<any | null>(null);

  const lookupApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your application email');
      return;
    }

    setIsSearching(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, opportunity:opportunities(title, price_inr)')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (error || !data) throw new Error('No application found with this email. Double check spelling.');
      setApp(data);
    } catch (err: any) {
      toast.error(err.message || 'Error looking up registration status');
      setApp(null);
    } finally {
      setIsSearching(false);
    }
  };

  const activeIndex = !app ? 0 : app.payment_status === 'paid' ? 5 : app.payment_status === 'pending' ? 3 : app.application_status === 'accepted' ? 2 : 0;
  const payableAmount = Number(app?.opportunity?.price_inr ?? 0);
  const amount = payableAmount > 0 ? `Rs. ${payableAmount.toLocaleString('en-IN')}` : 'As shared by team';

  return (
    <div className="flex w-full flex-1 flex-col items-center bg-brand-bg px-4 py-12 pt-28 text-[#F5F5F5] sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl">
        <Link href="/careers" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#A1A1AA] hover:text-[#F5F5F5]">
          <ArrowLeft size={16} /> Back to Program
        </Link>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <div>
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">Payment</span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Payment Status & Instructions</h1>
              <p className="mt-3 text-sm leading-6 text-[#A1A1AA]">
                Payments are currently collected through a verified Google Form with a payment screenshot. No UPI or bank details are displayed on this website.
              </p>
            </div>

            <div className="rounded-lg border border-brand-border bg-brand-secondary p-4">
              <h2 className="text-sm font-extrabold">Payment progress</h2>
              <div className="mt-4 space-y-3">
                {tracker.map((item, index) => {
                  const complete = index <= activeIndex;
                  return (
                    <div key={item} className="flex items-center gap-3">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-md border text-[11px] font-bold ${complete ? 'border-brand-success/40 bg-brand-success/10 text-brand-success' : 'border-brand-border bg-brand-bg text-[#71717A]'}`}>{complete ? <CheckCircle size={14} /> : index + 1}</span>
                      <span className={`text-sm font-semibold ${complete ? 'text-[#F5F5F5]' : 'text-[#71717A]'}`}>{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {!app ? (
            <Card className="p-5 md:p-6" hoverEffect={false}>
              <form onSubmit={lookupApplication} className="space-y-5">
                <div>
                  <h2 className="text-xl font-extrabold">Find your application</h2>
                  <p className="mt-1 text-sm text-[#A1A1AA]">Enter the email used in your program application.</p>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-[39px] text-[#71717A]" size={18} />
                  <Input label="Application Email" type="email" placeholder="candidate@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                </div>
                <Button type="submit" variant="teal" isLoading={isSearching} className="w-full gap-2">
                  <Search size={16} /> Lookup Registration
                </Button>
              </form>
            </Card>
          ) : (
            <Card className="space-y-6 p-5 md:p-6" hoverEffect={false}>
              <div className="flex items-start justify-between gap-4 border-b border-brand-border pb-4">
                <div>
                  <h2 className="text-xl font-extrabold">{app.full_name}</h2>
                  <p className="mt-1 text-sm text-[#A1A1AA]">{getTrackLabel(app.internship_track)}</p>
                </div>
                <button onClick={() => setApp(null)} className="text-xs font-semibold text-[#A1A1AA] hover:text-[#F5F5F5]">Change email</button>
              </div>

              {app.application_status !== 'accepted' && (
                <StatusPanel icon={<Clock size={24} />} title="Application Under Review" tone="warning">
                  Payment instructions are shared only after acceptance. Current status: {app.application_status}.
                </StatusPanel>
              )}

              {app.application_status === 'accepted' && app.payment_status !== 'paid' && (
                <div className="space-y-5">
                  <div className="rounded-lg border border-brand-border bg-brand-bg p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-border bg-brand-secondary text-brand-blue">
                        <FileImage size={22} />
                      </div>
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#71717A]">Amount</p>
                        <p className="mt-1 text-2xl font-extrabold text-brand-orange">{amount}</p>
                        <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">
                          Complete the team-shared payment step, upload the screenshot in the Google Form, and the admin team will mark your payment as verified.
                        </p>
                      </div>
                    </div>
                  </div>

                  {paymentFormUrl ? (
                    <a href={paymentFormUrl} target="_blank" rel="noreferrer" className="block">
                      <Button variant="teal" className="w-full gap-2"><ExternalLink size={16} /> Open Payment Google Form</Button>
                    </a>
                  ) : (
                    <div className="rounded-lg border border-brand-warning/30 bg-brand-warning/10 p-4 text-sm leading-6 text-[#F5F5F5]">
                      The Google Form link is not configured in production yet. Accepted candidates will receive the link directly from Ujjwalit support.
                    </div>
                  )}
                </div>
              )}

              {app.application_status === 'accepted' && app.payment_status === 'pending' && (
                <StatusPanel icon={<Clock size={24} />} title="Verification Pending" tone="warning">
                  Your screenshot/transaction details are under admin review. Enrollment details will be sent after confirmation.
                </StatusPanel>
              )}

              {app.payment_status === 'paid' && (
                <StatusPanel icon={<ShieldCheck size={24} />} title="Payment Confirmed" tone="success">
                  Your payment is verified. A welcome email has been sent to {app.email}.
                </StatusPanel>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPanel({ icon, title, children, tone }: { icon: React.ReactNode; title: string; children: React.ReactNode; tone: 'success' | 'warning' }) {
  const styles = tone === 'success' ? 'border-brand-success/30 bg-brand-success/10 text-brand-success' : 'border-brand-warning/30 bg-brand-warning/10 text-brand-warning';
  return (
    <div className={`rounded-lg border p-6 text-center ${styles}`}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-current/30 bg-current/10">{icon}</div>
      <h3 className="mt-4 text-lg font-extrabold text-[#F5F5F5]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#A1A1AA]">{children}</p>
    </div>
  );
}
