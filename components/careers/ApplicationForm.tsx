'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileText, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Opportunity, formatFee } from '@/lib/opportunities.shared';

type Step = 1 | 2 | 3 | 4 | 5;

const stepMeta = [
  { id: 1, label: 'Basic Information' },
  { id: 2, label: 'Education' },
  { id: 3, label: 'Portfolio & Motivation' },
  { id: 4, label: 'Review & Submit' },
] as const;

export const ApplicationForm = ({
  opportunities,
  defaultSlug,
}: {
  opportunities: Opportunity[];
  defaultSlug?: string;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestedSlug = defaultSlug || searchParams.get('opportunity') || searchParams.get('track');
  const initialOpportunity = opportunities.find((item) => item.slug === requestedSlug) || opportunities[0];

  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    college: '',
    branch: '',
    year: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    motivation: '',
    opportunitySlug: initialOpportunity?.slug || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedOpportunity = useMemo(
    () => opportunities.find((item) => item.slug === formData.opportunitySlug && item.status === 'open' && item.visibility === 'public') || null,
    [formData.opportunitySlug, opportunities]
  );

  const completion = step === 5 ? 100 : Math.round(((step - 1) / 4) * 100);
  const minutesRemaining = Math.max(1, 5 - step);

  const motivationWordCount = useMemo(() => {
    return formData.motivation.trim().split(/\s+/).filter(Boolean).length;
  }, [formData.motivation]);

  const validateStep = (currentStep: Step): boolean => {
    const newErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Enter a valid email address';
      if (!/^\d{10}$/.test(formData.phone.replace(/[\s\-+]/g, ''))) newErrors.phone = 'Enter a valid 10-digit phone number';
    }
    if (currentStep === 2) {
      if (!formData.college.trim()) newErrors.college = 'College or university is required';
      if (!formData.branch.trim()) newErrors.branch = 'Branch or stream is required';
      if (!formData.year.trim()) newErrors.year = 'Graduation year is required';
    }
    if (currentStep === 3) {
      if (!selectedOpportunity) newErrors.opportunitySlug = 'This program is no longer open for applications';
      if (!resumeFile) newErrors.resume = 'Please upload your resume';
      if (motivationWordCount > 500) newErrors.motivation = 'Keep the answer under 500 words';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (file.size > 5 * 1024 * 1024) return toast.error('Resume size must be less than 5MB');
    if (!allowed.includes(file.type)) return toast.error('Only PDF or Word documents are allowed');
    setResumeFile(file);
    setErrors((prev) => ({ ...prev, resume: '' }));
  };

  const goNext = (currentStep: Step) => {
    if (validateStep(currentStep)) setStep((currentStep + 1) as Step);
  };

  const executeSubmit = async () => {
    if (!validateStep(3) || !selectedOpportunity) {
      setStep(3);
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      if (!selectedOpportunity.id.startsWith('fallback-')) {
        const { data: liveOpportunity, error: opportunityError } = await supabase
          .from('opportunities')
          .select('id')
          .eq('id', selectedOpportunity.id)
          .eq('status', 'open')
          .eq('visibility', 'public')
          .maybeSingle();

        if (opportunityError || !liveOpportunity) {
          throw new Error('This program is no longer accepting applications. Please refresh and choose another open program.');
        }
      }

      let resumeUrl = '';
      if (resumeFile) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('resumes').upload(fileName, resumeFile);
        if (uploadError) throw new Error(`Resume upload failed: ${uploadError.message}`);
        resumeUrl = fileName;
      }

      const { error: dbError } = await supabase.from('applications').insert({
        opportunity_id: selectedOpportunity.id.startsWith('fallback-') ? null : selectedOpportunity.id,
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        whatsapp: formData.whatsapp.trim() || null,
        college: formData.college.trim(),
        branch: formData.branch.trim(),
        year: formData.year.trim(),
        linkedin_url: formData.linkedinUrl.trim() || null,
        github_url: formData.githubUrl.trim() || null,
        portfolio_url: formData.portfolioUrl.trim() || null,
        motivation: formData.motivation.trim() || null,
        internship_track: selectedOpportunity.slug,
        resume_url: resumeUrl,
        application_status: 'pending',
      });

      if (dbError) throw new Error(`Database submission failed: ${dbError.message}`);
      
      // Dispatch confirmation email
      try {
        await fetch('/api/email/apply-received', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.fullName.trim(),
            email: formData.email.trim(),
            programTitle: selectedOpportunity.title
          })
        });
      } catch (emailErr) {
        console.error('Failed to send confirmation email', emailErr);
      }

      toast.success('Application submitted successfully');
      setStep(5);
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedOpportunity) {
    return (
      <div className="w-full rounded-lg border border-brand-border bg-brand-secondary p-5 text-center">
        <h2 className="text-xl font-extrabold text-[#F5F5F5]">Applications are closed</h2>
        <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">This program is not currently open. Please return to the programs page and choose an active opportunity.</p>
        <Button variant="outline" onClick={() => router.push('/careers#programs')} className="mt-5">View Open Programs</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-8 shadow-2xl shadow-black/50 scale-[0.95] origin-top">
      {step < 5 && (
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">{completion}% complete</p>
              <p className="mt-1 text-xs font-semibold text-brand-orange">{minutesRemaining} minutes remaining</p>
            </div>
            <div className="font-mono text-xs text-slate-400">Step {step} / 4</div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-950">
            <div className="h-full bg-brand-blue transition-all duration-300" style={{ width: `${completion}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stepMeta.map((item) => (
              <div key={item.id} className={`rounded-md border px-2 py-2 text-[11px] font-bold text-center ${step === item.id ? 'border-brand-blue bg-slate-800 text-[#F5F5F5]' : 'border-slate-800 text-[#71717A]'}`}>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }} className="space-y-5">
            <div><h2 className="text-2xl font-extrabold text-[#F5F5F5]">Basic Information</h2><p className="text-sm text-slate-400">Use contact details where the team can reliably reach you.</p></div>
            <Input name="fullName" label="Full Name" className="bg-slate-800 border-slate-700/80" placeholder="Enter your name" value={formData.fullName} onChange={handleChange} error={errors.fullName} />
            <Input name="email" type="email" label="Email Address" className="bg-slate-800 border-slate-700/80" placeholder="you@example.com" value={formData.email} onChange={handleChange} error={errors.email} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="phone" type="tel" label="Phone Number" className="bg-slate-800 border-slate-700/80" placeholder="10-digit number" value={formData.phone} onChange={handleChange} error={errors.phone} />
              <Input name="whatsapp" type="tel" label="WhatsApp Number" className="bg-slate-800 border-slate-700/80" placeholder="Optional" value={formData.whatsapp} onChange={handleChange} />
            </div>
            <div className="flex justify-end pt-2"><Button onClick={() => goNext(1)} className="gap-2">Next <ArrowRight size={16} /></Button></div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }} className="space-y-5">
            <div><h2 className="text-2xl font-extrabold text-[#F5F5F5]">Education</h2><p className="text-sm text-slate-400">Academic context helps reviewers understand your current stage.</p></div>
            <Input name="college" label="College / University" className="bg-slate-800 border-slate-700/80" value={formData.college} onChange={handleChange} error={errors.college} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="branch" label="Branch / Stream" className="bg-slate-800 border-slate-700/80" value={formData.branch} onChange={handleChange} error={errors.branch} />
              <Input name="year" label="Graduation Year" className="bg-slate-800 border-slate-700/80" value={formData.year} onChange={handleChange} error={errors.year} />
            </div>
            <div className="flex justify-between pt-2"><Button variant="outline" onClick={() => setStep(1)} className="gap-2"><ArrowLeft size={16} /> Back</Button><Button onClick={() => goNext(2)} className="gap-2">Next <ArrowRight size={16} /></Button></div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }} className="space-y-5">
            <div><h2 className="text-2xl font-extrabold text-[#F5F5F5]">Portfolio & Motivation</h2><p className="text-sm text-slate-400">Show how you think, not just where you study.</p></div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#F5F5F5]">Program</label>
              {defaultSlug ? (
                <div className="rounded-lg border border-slate-700/80 bg-slate-800 px-4 py-3 text-sm font-bold text-[#F5F5F5]">{selectedOpportunity?.title}</div>
              ) : (
                <select name="opportunitySlug" value={formData.opportunitySlug} onChange={handleChange} className="w-full rounded-lg border border-slate-700/80 bg-slate-800 px-4 py-3 text-sm text-[#F5F5F5] focus:border-brand-blue focus:outline-none">
                  {opportunities.filter((item) => item.status === 'open' && item.visibility === 'public').map((item) => <option key={item.id} value={item.slug}>{item.title} ({formatFee(item.price_inr)})</option>)}
                </select>
              )}
              {errors.opportunitySlug && <p className="text-xs font-bold text-red-400">{errors.opportunitySlug}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input name="linkedinUrl" label="LinkedIn" className="bg-slate-800 border-slate-700/80" placeholder="https://linkedin.com/in/..." value={formData.linkedinUrl} onChange={handleChange} />
              <Input name="githubUrl" label="GitHub" className="bg-slate-800 border-slate-700/80" placeholder="https://github.com/..." value={formData.githubUrl} onChange={handleChange} />
              <Input name="portfolioUrl" label="Portfolio" className="bg-slate-800 border-slate-700/80" placeholder="Optional" value={formData.portfolioUrl} onChange={handleChange} />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between gap-3"><label className="text-sm font-semibold text-[#F5F5F5]">What do you hope to build or achieve through this program?</label><span className="text-[11px] text-[#71717A]">{motivationWordCount}/500</span></div>
              <textarea name="motivation" value={formData.motivation} onChange={handleChange} rows={4} placeholder="A short, specific answer is enough." className="w-full rounded-lg border border-slate-700/80 bg-slate-800 px-4 py-3 text-sm text-[#F5F5F5] placeholder-[#71717A] focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20" />
              {errors.motivation && <p className="text-xs font-bold text-red-400">{errors.motivation}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#F5F5F5]">Upload Resume / CV</label>
              <div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }} onClick={() => fileInputRef.current?.click()} className={`cursor-pointer rounded-lg border border-dashed p-6 text-center ${resumeFile ? 'border-brand-success bg-brand-success/5' : errors.resume ? 'border-red-500 bg-red-500/5' : 'border-slate-700 bg-slate-800/40 hover:border-brand-blue/40 transition-colors'}`}>
                <input type="file" ref={fileInputRef} accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                <Upload className="mx-auto text-brand-blue" size={24} />
                <p className="mt-3 text-sm font-bold text-[#F5F5F5]">{resumeFile ? resumeFile.name : 'Click to upload resume'}</p>
                <p className="mt-1 text-xs text-slate-400">PDF, DOC, or DOCX up to 5MB</p>
              </div>
              {errors.resume && <p className="text-xs font-bold text-red-400">{errors.resume}</p>}
            </div>
            <div className="flex justify-between pt-2"><Button variant="outline" onClick={() => setStep(2)} className="gap-2"><ArrowLeft size={16} /> Back</Button><Button onClick={() => goNext(3)} className="gap-2">Review <ArrowRight size={16} /></Button></div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }} className="space-y-5">
            <div><h2 className="text-2xl font-extrabold text-[#F5F5F5]">Review & Submit</h2><p className="text-sm text-slate-400">Check the details before sending your application for review.</p></div>
            <div className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-950">
              {[
                ['Name', formData.fullName],
                ['Email', formData.email],
                ['Phone', formData.phone],
                ['College', formData.college],
                ['Program', selectedOpportunity?.title],
                ['Resume', resumeFile?.name],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[110px_1fr] gap-3 px-4 py-3 text-sm">
                  <span className="font-mono text-xs uppercase tracking-[0.14em] text-[#71717A]">{label}</span>
                  <span className="font-semibold text-[#F5F5F5]">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2"><Button variant="outline" onClick={() => setStep(3)} disabled={isSubmitting} className="gap-2"><ArrowLeft size={16} /> Back</Button><Button onClick={executeSubmit} isLoading={isSubmitting} className="gap-2"><Check size={16} /> Submit Application</Button></div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="step5" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-brand-success/30 bg-brand-success/10 text-brand-success"><CheckCircle2 size={34} /></div>
            <h2 className="mt-6 text-3xl font-extrabold text-[#F5F5F5]">Application received</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Thanks, <b>{formData.fullName}</b>. Your application for <b>{selectedOpportunity?.title}</b> has been received.</p>

            <div className="mt-6 w-full rounded-lg border border-brand-orange/30 bg-brand-orange/5 p-5 text-left">
              <h3 className="text-lg font-bold text-[#F5F5F5]">Mandatory: Complete the Registration Form</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                To process your application, you <strong className="text-brand-orange">must</strong> fill out the official registration form.
              </p>
              <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
                <div className="flex flex-col items-center gap-2">
                  <img
                    src="/QR.jpeg"
                    alt="Payment QR Code"
                    className="h-32 w-32 rounded-lg border border-slate-700"
                  />
                  <span className="text-[10px] text-slate-500">Scan to pay</span>
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  <a
                    href="https://forms.gle/hGeRn2mgTfKwrsdf9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-orange px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-orange/90"
                  >
                    Fill Mandatory Registration Form
                  </a>
                  <p className="text-xs leading-5 text-slate-500">
                    You can pay using the QR code or find the payment link inside the Google Form to complete your registration.
                  </p>
                </div>
              </div>
            </div>

            <Button variant="outline" onClick={() => router.push('/careers')} className="mt-6 gap-2"><FileText size={16} /> Back to Programs</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

