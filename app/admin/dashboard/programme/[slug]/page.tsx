'use client';

import React, { useEffect, useState, use } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { PlaceholderGuide } from '@/components/admin/PlaceholderGuide';
import { getTrackLabel } from '@/lib/utils';
import {
  FileText,
  Users,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Download,
  Mail,
  Award,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Search,
  Trash2,
  LayoutTemplate,
  Eye,
  X,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

function storagePublicUrl(bucket: string, fileName: string) {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

function resolveTemplateBg(bgUrl: string | null | undefined) {
  if (!bgUrl) return '';
  if (/^https?:\/\//i.test(bgUrl)) return bgUrl;
  return storagePublicUrl('templates', bgUrl);
}

interface PipelinePageProps {
  params: Promise<{ slug: string }>;
}

export default function PipelineWorkspacePage({ params }: PipelinePageProps) {
  const { slug } = use(params);

  const [loading, setLoading] = useState(true);
  const [opp, setOpp] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'incoming' | 'accepted' | 'active' | 'completed' | 'archived'>('incoming');
  const [searchQuery, setSearchQuery] = useState('');

  // Data pools
  const [applications, setApplications] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [achievementStatements, setAchievementStatements] = useState<any[]>([]);

  // Selection states for batch operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Certificate templates for generation
  const [templates, setTemplates] = useState<any[]>([]);

  // Certificate generation modal
  const [genModal, setGenModal] = useState<{ mode: 'single'; student: any } | { mode: 'batch' } | null>(null);
  const [genTemplateId, setGenTemplateId] = useState('');
  const [isGeneratingCerts, setIsGeneratingCerts] = useState(false);

  // Modal / Inline forms
  const [editingStudent, setEditingStudent] = useState<any>(null);

  // Dispatch email preview modal
  const [dispatchModal, setDispatchModal] = useState(false);
  const [dispatchSingleId, setDispatchSingleId] = useState<string | null>(null);
  const [dispatchPreviewId, setDispatchPreviewId] = useState<string | null>(null);
  const [dispatchTemplate, setDispatchTemplate] = useState<{ subject: string; body_html: string; is_enabled: boolean } | null>(null);
  const [dispatchTemplateLoading, setDispatchTemplateLoading] = useState(false);
  const [dispatchAttachCert, setDispatchAttachCert] = useState(true);
  const [dispatchAttachLor, setDispatchAttachLor] = useState(true);
  const [dispatchTesting, setDispatchTesting] = useState(false);

  const loadPipelineData = async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      // 1. Get current Opportunity details
      const { data: currentOpp, error: oppErr } = await supabase
        .from('opportunities')
        .select('*')
        .eq('slug', slug)
        .single();

      if (oppErr || !currentOpp) {
        toast.error('Opportunity/Cohort not found');
        return;
      }
      setOpp(currentOpp);

      // 2. Fetch applications linked to this opportunity
      const { data: apps } = await supabase
        .from('applications')
        .select('*')
        .eq('opportunity_id', currentOpp.id)
        .order('created_at', { ascending: false });

      setApplications(apps || []);

      // 3. Fetch active students linked to this opportunity
      const { data: stus } = await supabase
        .from('students')
        .select(`
          *,
          application:applications (
            full_name,
            email,
            college,
            branch,
            resume_url,
            payment_status,
            payment_tx_id
          ),
          documents:documents (
            id,
            document_type,
            document_url
          ),
          certificates:certificates (
            id,
            certificate_id,
            certificate_type,
            status,
            verification_url,
            certificate_pdf_url
          ),
          student_achievement_statements:student_achievement_statements (
            statement_id
          )
        `)
        .eq('opportunity_id', currentOpp.id);

      const loadedStus = stus || [];
      
      // Auto-repair mismatch: if application is paid but student stage is still 'accepted', auto-promote to 'active'
      const mismatchedStus = loadedStus.filter(s => s.stage === 'accepted' && s.application?.payment_status === 'paid');
      if (mismatchedStus.length > 0) {
        (async () => {
          for (const s of mismatchedStus) {
            await supabase.from('students').update({ stage: 'active' }).eq('id', s.id);
            s.stage = 'active'; // Update local memory reference directly so it renders immediately
          }
          toast.success(`Automatically moved ${mismatchedStus.length} paid intern(s) to Active stage`);
        })();
      }

      setStudents(loadedStus);

      // 4. Fetch statements library
      const { data: statements } = await supabase
        .from('achievement_statements')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      setAchievementStatements(statements || []);

      // 5. Fetch certificate templates for the generation picker
      const { data: templatesData } = await supabase
        .from('certificate_templates')
        .select('id, name, template_type, background_url, is_default')
        .order('created_at', { ascending: false });

      setTemplates(templatesData || []);
    } catch (err) {
      console.error(err);
      toast.error('Error loading pipeline data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipelineData();
  }, [slug]);

  // Bulk / Selection helpers
  const handleSelectToggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (visibleItems: any[]) => {
    const visibleIds = visibleItems.map(item => item.id);
    const allSelected = visibleIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Actions
  const handleAcceptApplication = async (appId: string) => {
    setIsProcessing(true);
    const resolveToast = toast.loading('Processing acceptance pipeline...');
    try {
      const res = await fetch('/api/pipeline/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId, opportunityId: opp.id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Accepted! Profile created, offer letter generated, and email sent.', { id: resolveToast });
        loadPipelineData();
      } else {
        toast.error(data.error || 'Failed to accept application', { id: resolveToast });
      }
    } catch (err) {
      toast.error('Connection failed', { id: resolveToast });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectApplication = async (appId: string) => {
    const confirm = window.confirm('Are you sure you want to reject this applicant?');
    if (!confirm) return;

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          application_status: 'rejected',
          archived_at: new Date().toISOString(),
        })
        .eq('id', appId);

      if (error) throw error;
      toast.success('Application rejected and archived');
      loadPipelineData();
    } catch (err) {
      toast.error('Failed to reject application');
    }
  };

  const handleVerifyPayment = async (student: any, status: 'paid' | 'unpaid') => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('applications')
        .update({ payment_status: status })
        .eq('id', student.application_id);

      if (error) throw error;

      // Auto-advance stage: paid -> active, revoked -> back to accepted
      const newStage = status === 'paid' ? 'active' : 'accepted';
      await supabase.from('students').update({ stage: newStage }).eq('id', student.id);

      toast.success(status === 'paid'
        ? 'Payment confirmed — intern moved to Active'
        : 'Payment revoked — intern moved back to Accepted'
      );
      loadPipelineData();
    } catch (err) {
      toast.error('Failed to update payment status');
    }
  };

  const handleOnboardStudent = async (studentId: string) => {
    const supabase = createClient();
    try {
      // 1. Move student to active stage
      const { error } = await supabase
        .from('students')
        .update({ stage: 'active' })
        .eq('id', studentId);

      if (error) throw error;

      // 2. Dispatch onboarding credentials email
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, type: 'onboarding' }),
      });

      toast.success('Intern onboarded and credential email sent');
      loadPipelineData();
    } catch (err) {
      toast.error('Failed to onboard intern');
    }
  };

  const handleSaveInternScores = async () => {
    if (!editingStudent) return;
    const supabase = createClient();
    try {
      // 1. Update students table
      const { error } = await supabase
        .from('students')
        .update({
          attendance_percentage: parseFloat(editingStudent.attendance_percentage) || 0,
          project_score: parseFloat(editingStudent.project_score) || 0,
          project_submitted: editingStudent.project_submitted,
          certificate_eligible: editingStudent.certificate_eligible,
          certificate_type: editingStudent.certificate_type,
        })
        .eq('id', editingStudent.id);

      if (error) throw error;

      // 2. Sync achievement statements
      // Delete existing
      await supabase
        .from('student_achievement_statements')
        .delete()
        .eq('student_id', editingStudent.id);

      // Insert new ones
      if (editingStudent.selectedStatements && editingStudent.selectedStatements.length > 0) {
        const payload = editingStudent.selectedStatements.map((sid: string, idx: number) => ({
          student_id: editingStudent.id,
          statement_id: sid,
          display_order: idx,
        }));
        const { error: insError } = await supabase
          .from('student_achievement_statements')
          .insert(payload);

        if (insError) throw insError;
      }

      toast.success('Scores, eligibility, and statements updated');
      setEditingStudent(null);
      loadPipelineData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save scores or statements');
    }
  };

  const handleGenerateCertificate = async (student: any, templateId: string) => {
    setIsGeneratingCerts(true);
    const resolveToast = toast.loading('Generating certificate...');
    try {
      const res = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          forceRegenerate: true,
          templateId: templateId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Certificate generated: ${data.certificateId}`, { id: resolveToast });
        setGenModal(null);
        loadPipelineData();
        window.open(storagePublicUrl('certificates', `${data.certificateId}.pdf`), '_blank');
      } else {
        toast.error(data.error || 'Failed to generate certificate', { id: resolveToast });
      }
    } catch (err) {
      toast.error('Failed to connect to server', { id: resolveToast });
    } finally {
      setIsGeneratingCerts(false);
    }
  };

  const handleBatchGenerateCertificates = async (templateId: string) => {
    if (selectedIds.length === 0) {
      toast.error('No interns selected');
      setGenModal(null);
      return;
    }
    setIsGeneratingCerts(true);
    const resolveToast = toast.loading(`Generating ${selectedIds.length} certificates...`);
    try {
      const res = await fetch('/api/certificates/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: opp.id,
          studentIds: selectedIds,
          forceRegenerate: true,
          templateId: templateId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Successfully processed batch certificates!`, { id: resolveToast });
        setGenModal(null);
        setSelectedIds([]);
        loadPipelineData();
      } else {
        toast.error(data.error || 'Batch generation failed', { id: resolveToast });
      }
    } catch (err) {
      toast.error('Connection failed', { id: resolveToast });
    } finally {
      setIsGeneratingCerts(false);
    }
  };

  const handleMarkAsCompleted = async (studentId: string) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('students')
        .update({ stage: 'completed' })
        .eq('id', studentId);

      if (error) throw error;
      toast.success('Student marked as Completed');
      loadPipelineData();
    } catch (err) {
      toast.error('Failed to complete student');
    }
  };

  const handleGenerateRecommendation = async (studentId: string) => {
    const resolveToast = toast.loading('Generating LOR PDF...');
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          documentType: 'recommendation',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Recommendation letter generated successfully!', { id: resolveToast });
        loadPipelineData();
      } else {
        toast.error(data.error || 'Failed to generate document', { id: resolveToast });
      }
    } catch (err) {
      toast.error('Connection error', { id: resolveToast });
    }
  };

  const handleSendCompletionEmail = (studentId: string) => {
    openDispatchModal(studentId);
  };

  const handleRevokeCertificate = async (certificateId: string, studentName: string) => {
    const confirm = window.confirm(
      `Revoke certificate ${certificateId} for ${studentName}?\n\nIts verification link will show "Certificate Revoked" instead of being removed. This cannot be undone by the UI (regenerating creates a new certificate).`
    );
    if (!confirm) return;
    const resolveToast = toast.loading('Revoking certificate...');
    try {
      const res = await fetch('/api/certificates/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Certificate ${certificateId} revoked`, { id: resolveToast });
        loadPipelineData();
      } else {
        toast.error(data.error || 'Failed to revoke certificate', { id: resolveToast });
      }
    } catch (err) {
      toast.error('Failed to connect to the API', { id: resolveToast });
    }
  };

  const dispatchCandidates = () => {
    if (dispatchSingleId) {
      return completedStus.filter((s) => s.id === dispatchSingleId && s.certificates?.some((c: any) => c.status === 'active'));
    }
    if (selectedIds.length === 0) return [];
    return completedStus.filter((s) => selectedIds.includes(s.id) && s.certificates?.some((c: any) => c.status === 'active'));
  };

  const fillEmailPlaceholders = (text: string, stu: any) => {
    const app = stu.application || {};
    const activeCert = stu.certificates?.find((c: any) => c.status === 'active');
    const repl: Record<string, string> = {
      '{{name}}': app.full_name || 'Student',
      '{{track}}': getTrackLabel(app.internship_track),
      '{{code}}': stu.student_code || '',
      '{{certId}}': activeCert?.certificate_id || '',
    };
    return (text || '').replace(/{{[a-zA-Z_]+}}/g, (match) => repl[match] ?? match);
  };

  const openDispatchModal = async (studentId?: string) => {
    if (studentId) {
      setDispatchSingleId(studentId);
      const stu = completedStus.find((s) => s.id === studentId);
      if (!stu || !stu.certificates?.some((c: any) => c.status === 'active')) {
        toast.error('This intern has no active certificate yet. Issue a certificate first.');
        return;
      }
    } else {
      setDispatchSingleId(null);
      const toSend = dispatchCandidates();
      if (toSend.length === 0) {
        const skipped = selectedIds.length - toSend.length;
        toast.error(skipped > 0 ? 'None of the selected interns have an active certificate yet. Issue certificates first.' : 'No interns selected');
        return;
      }
    }
    const previewId = studentId || dispatchCandidates()[0]?.id || null;
    setDispatchModal(true);
    setDispatchPreviewId(previewId);
    setDispatchAttachCert(true);
    setDispatchAttachLor(true);
    setDispatchTemplateLoading(true);
    setDispatchTemplate(null);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('email_templates')
        .select('subject, body_html, is_enabled')
        .eq('template_key', 'completion')
        .maybeSingle();
      setDispatchTemplate(data || null);
    } catch (err) {
      console.error(err);
      setDispatchTemplate(null);
    } finally {
      setDispatchTemplateLoading(false);
    }
  };

  const handleTestDispatchEmail = async () => {
    const stu = dispatchCandidates().find((s) => s.id === dispatchPreviewId) || dispatchCandidates()[0];
    if (!stu) return;
    setDispatchTesting(true);
    const toastId = toast.loading('Sending test email to your inbox...');
    try {
      const res = await fetch('/api/email/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'completion',
          studentId: stu.id,
          subject: dispatchTemplate?.subject,
          body_html: dispatchTemplate?.body_html,
          attachCertificate: dispatchAttachCert,
          attachLor: dispatchAttachLor,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Test email sent to ${data.to}`, { id: toastId });
      } else {
        toast.error(data.error || 'Test email failed', { id: toastId });
      }
    } catch (err) {
      toast.error('Failed to connect to the mail API', { id: toastId });
    } finally {
      setDispatchTesting(false);
    }
  };

  const handleBatchSendCompletionEmails = async () => {
    const candidates = dispatchCandidates();
    const studentIds = candidates.map((s) => s.id);
    const skippedInitial = selectedIds.length - candidates.length; // Students selected but without active certs

    if (studentIds.length === 0) {
      toast.error(skippedInitial > 0 ? 'None of the selected interns have an active certificate yet. Issue certificates first.' : 'No interns selected');
      return;
    }

    let toastId = toast.loading('Enqueuing completion emails...');

    try {
      // Enqueue jobs
      const enqueueRes = await fetch('/api/email/queue/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds,
          type: 'completion',
          attachCertificate: dispatchAttachCert,
          attachLor: dispatchAttachLor,
        }),
      });
      const enqueueData = await enqueueRes.json();

      if (!enqueueRes.ok) throw new Error(enqueueData.error || 'Failed to enqueue emails');

      const totalEnqueued = enqueueData.enqueued;
      const skippedDuringEnqueue = enqueueData.skipped; // Already pending/sent

      if (totalEnqueued === 0 && skippedDuringEnqueue > 0) {
        toast.success(`All selected emails are already in the queue or sent.`, { id: toastId });
        setDispatchModal(false);
        setSelectedIds([]);
        loadPipelineData();
        return;
      } else if (totalEnqueued === 0) {
        toast.error('No emails were enqueued. Check if students have active certificates.', { id: toastId });
        return;
      }

      toast.loading(`Enqueued ${totalEnqueued} email(s). Processing...`, { id: toastId });

      let sent = 0;
      let failed = 0;
      let processedInIteration = 0;
      let totalRemainingInQueue = totalEnqueued;
      let rateLimitHit = false;
      const POLLING_INTERVAL_MS = 2000; // Poll every 2 seconds

      // Polling loop to process the queue
      while (totalRemainingInQueue > 0 && !rateLimitHit) {
        const processRes = await fetch('/api/email/queue/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // The backend defines its own batch size and delay, so no need to send it here
        });
        const processData = await processRes.json();

        if (!processRes.ok) throw new Error(processData.error || 'Failed to process email queue');

        sent += processData.sent;
        failed += processData.failed;
        totalRemainingInQueue = processData.remaining;
        rateLimitHit = processData.rateLimited;
        processedInIteration = processData.processed; // How many were processed in THIS call to the route

        const currentStatus = `Sent ${sent}${failed > 0 ? `, ${failed} failed` : ''}${rateLimitHit ? ' (rate limit hit)' : ''}... ${totalRemainingInQueue} remaining`;
        toast.loading(currentStatus, { id: toastId });

        if (totalRemainingInQueue === 0 || rateLimitHit || (processedInIteration === 0 && (sent + failed) > 0)) {
          // Queue is empty, rate limit hit, or no jobs were processed in an iteration (but some were sent/failed) -> stop polling
          break;
        }

        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
      }

      // Final toast message
      let finalMessage = `Successfully processed ${sent + failed} email(s): ${sent} sent, ${failed} failed.`;
      if (skippedInitial > 0) finalMessage += `, skipped ${skippedInitial} initially (no active certs).`;
      if (skippedDuringEnqueue > 0) finalMessage += ` ${skippedDuringEnqueue} already in queue.`;
      if (rateLimitHit) finalMessage += ` Sending paused due to Resend rate limits. ${totalRemainingInQueue} remaining in queue.`;
      else if (totalRemainingInQueue > 0) finalMessage += ` ${totalRemainingInQueue} remaining in queue.`; // Should not happen if loop correctly exits

      if (failed > 0 || rateLimitHit) {
        toast.error(finalMessage, { id: toastId, duration: 8000 });
      } else {
        toast.success(finalMessage, { id: toastId, duration: 5000 });
      }

      setDispatchModal(false);
      setSelectedIds([]);
      loadPipelineData();
    } catch (err: any) {
      console.error('Bulk email dispatch UI error:', err);
      toast.error(err.message || 'Bulk email dispatch failed', { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-orange border-r-2"></div>
        <p className="text-slate-400 text-sm">Loading programme pipeline...</p>
      </div>
    );
  }

  // Data Filtering
  const filteredApps = applications.filter(app =>
    app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(s =>
    s.application?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.student_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Tab views
  const incomingApps = filteredApps.filter(a => a.application_status === 'pending' || a.application_status === 'reviewing');
  const acceptedStus = filteredStudents.filter(s => s.stage === 'accepted');
  const activeStus = filteredStudents.filter(s => s.stage === 'active');
  const completedStus = filteredStudents.filter(s => s.stage === 'completed');
  const archivedApps = filteredApps.filter(a => a.application_status === 'rejected');

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-white flex items-center gap-3">
            {opp?.title}
            <Badge variant={opp?.status === 'open' ? 'success' : 'default'}>
              {opp?.status}
            </Badge>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Cohort: {opp?.cohort_label || 'Default'} | Duration: {opp?.duration_label}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={loadPipelineData} variant="ghost" className="border border-slate-800 text-slate-300">
            <RefreshCw size={14} className="mr-1.5" /> Refresh
          </Button>
          <Link href="/admin/dashboard">
            <Button size="sm" variant="ghost" className="text-brand-orange">
              Back to Overview
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Tabs Controller */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 border border-slate-900 rounded-xl max-w-md w-full">
          <button
            onClick={() => { setActiveTab('incoming'); setSelectedIds([]); }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-center transition-all ${
              activeTab === 'incoming' ? 'bg-brand-orange/15 text-brand-orange border border-brand-orange/10 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Incoming ({incomingApps.length})
          </button>
          <button
            onClick={() => { setActiveTab('accepted'); setSelectedIds([]); }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-center transition-all ${
              activeTab === 'accepted' ? 'bg-brand-orange/15 text-brand-orange border border-brand-orange/10 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Accepted ({acceptedStus.length})
          </button>
          <button
            onClick={() => { setActiveTab('active'); setSelectedIds([]); }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-center transition-all ${
              activeTab === 'active' ? 'bg-brand-orange/15 text-brand-orange border border-brand-orange/10 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active ({activeStus.length})
          </button>
          <button
            onClick={() => { setActiveTab('completed'); setSelectedIds([]); }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-center transition-all ${
              activeTab === 'completed' ? 'bg-brand-orange/15 text-brand-orange border border-brand-orange/10 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Done ({completedStus.length})
          </button>
          <button
            onClick={() => { setActiveTab('archived'); setSelectedIds([]); }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-center transition-all ${
              activeTab === 'archived' ? 'bg-brand-orange/15 text-brand-orange border border-brand-orange/10 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Archived ({archivedApps.length})
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-900 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-brand-orange/40"
          />
        </div>
      </div>

      {/* --- incoming tab view --- */}
      {activeTab === 'incoming' && (
        <Card variant="glass" className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 font-semibold text-xs uppercase tracking-wider pb-3">
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">College & Education</th>
                  <th className="pb-3">Motivation Brief</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {incomingApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-900/5">
                    <td className="py-4">
                      <div className="font-semibold text-slate-200">{app.full_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{app.email}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{app.phone}</div>
                    </td>
                    <td className="py-4 text-xs">
                      <div className="text-slate-300">{app.college}</div>
                      <div className="text-slate-400 mt-0.5">{app.branch} | Year: {app.year}</div>
                      {app.resume_url && (
                        <a
                          href={storagePublicUrl('resumes', app.resume_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-brand-orange hover:underline gap-1 mt-1 font-semibold"
                        >
                          <Download size={12} /> Resume
                        </a>
                      )}
                    </td>
                    <td className="py-4 text-xs text-slate-400 max-w-sm truncate" title={app.motivation}>
                      {app.motivation || 'N/A'}
                    </td>
                    <td className="py-4 text-right space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptApplication(app.id)}
                        disabled={isProcessing}
                        className="bg-brand-orange text-slate-950 font-bold hover:bg-brand-orange/95 cursor-pointer text-xs"
                      >
                        Accept & Enroll
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRejectApplication(app.id)}
                        disabled={isProcessing}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer text-xs"
                      >
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))}
                {incomingApps.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500 text-xs">
                      No incoming applications pending review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* --- accepted tab view --- */}
      {activeTab === 'accepted' && (
        <Card variant="glass" className="p-6 space-y-4">
          {/* Bulk action toolbar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between bg-brand-orange/10 border border-brand-orange/20 rounded-xl px-4 py-3">
              <span className="text-xs font-semibold text-brand-orange">
                {selectedIds.length} student{selectedIds.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    const supabase = createClient();
                    for (const id of selectedIds) {
                      const stu = acceptedStus.find(s => s.id === id);
                      if (stu) await supabase.from('applications').update({ payment_status: 'paid' }).eq('id', stu.application_id);
                    }
                    toast.success(`Marked ${selectedIds.length} student(s) as paid`);
                    setSelectedIds([]);
                    loadPipelineData();
                  }}
                  className="bg-green-500/20 text-green-400 border border-green-500/20 hover:bg-green-500/30 text-xs font-semibold cursor-pointer"
                >
                  Mark Selected as Paid
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-slate-400 border border-slate-800"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 font-semibold text-xs uppercase tracking-wider pb-3">
                  <th className="pb-3 w-10">
                    <input
                      type="checkbox"
                      checked={acceptedStus.length > 0 && acceptedStus.every(s => selectedIds.includes(s.id))}
                      onChange={() => handleSelectAll(acceptedStus)}
                      className="h-4 w-4 accent-brand-orange cursor-pointer"
                    />
                  </th>
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Student Code</th>
                  <th className="pb-3">Offer Letter</th>
                  <th className="pb-3">Payment Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {acceptedStus.map((stu) => {
                  const hasOffer = stu.documents?.some((d: any) => d.document_type === 'acceptance');
                  const offerDoc = stu.documents?.find((d: any) => d.document_type === 'acceptance');
                  const isChecked = selectedIds.includes(stu.id);
                  return (
                    <tr key={stu.id} className={`hover:bg-slate-900/5 ${isChecked ? 'bg-brand-orange/5' : ''}`}>
                      <td className="py-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectToggle(stu.id)}
                          className="h-4 w-4 accent-brand-orange cursor-pointer"
                        />
                      </td>
                      <td className="py-4">
                        <div className="font-semibold text-slate-200">{stu.application?.full_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{stu.application?.email}</div>
                      </td>
                      <td className="py-4 text-xs font-mono text-slate-400">
                        {stu.student_code}
                      </td>
                      <td className="py-4 text-xs">
                        {hasOffer ? (
                          <a
                            href={storagePublicUrl('letters', offerDoc.document_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-cyan-400 hover:underline gap-1 font-semibold"
                          >
                            <FileText size={12} /> View Offer Letter
                          </a>
                        ) : (
                          <span className="text-slate-500">Not generated</span>
                        )}
                      </td>
                      <td className="py-4 text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant={stu.application?.payment_status === 'paid' ? 'success' : 'default'}>
                            {stu.application?.payment_status || 'unpaid'}
                          </Badge>
                          {stu.application?.payment_tx_id && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              TxID: {stu.application.payment_tx_id}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Payment toggle */}
                          {stu.application?.payment_status !== 'paid' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleVerifyPayment(stu, 'paid')}
                              className="text-green-400 hover:text-green-300 hover:bg-green-500/10 cursor-pointer text-xs"
                            >
                              Mark Paid
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleVerifyPayment(stu, 'unpaid')}
                              className="text-slate-400 hover:text-slate-300 hover:bg-slate-800 cursor-pointer text-xs"
                            >
                              Revoke Paid
                            </Button>
                          )}

                          {/* Direct Onboard action — changes stage to active directly without requiring payment first */}
                          {stu.application?.payment_status !== 'paid' && (
                            <Button
                              size="sm"
                              onClick={async () => {
                                const supabase = createClient();
                                await supabase.from('students').update({ stage: 'active' }).eq('id', stu.id);
                                toast.success('Intern onboarded and moved to Active');
                                loadPipelineData();
                              }}
                              className="bg-brand-orange text-slate-950 font-bold hover:bg-brand-orange/95 cursor-pointer text-xs"
                            >
                              Onboard
                            </Button>
                          )}

                          {/* Delete duplicate — only show when no offer letter was generated */}
                          {!hasOffer && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                if (!window.confirm(`Delete duplicate record ${stu.student_code}? This cannot be undone.`)) return;
                                const supabase = createClient();
                                await supabase.from('students').delete().eq('id', stu.id);
                                toast.success('Duplicate record deleted');
                                loadPipelineData();
                              }}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer text-xs"
                            >
                              <Trash2 size={12} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {acceptedStus.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                      No accepted candidates waiting for onboarding.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </Card>
      )}

      {/* --- active tab view --- */}
      {activeTab === 'active' && (
        <Card variant="glass" className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 font-semibold text-xs uppercase tracking-wider pb-3">
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Attendance</th>
                  <th className="pb-3">Project Status</th>
                  <th className="pb-3">Graduation Eligibility</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {activeStus.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-900/5">
                    <td className="py-4">
                      <div className="font-semibold text-slate-200">{stu.application?.full_name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{stu.student_code}</div>
                    </td>
                    <td className="py-4 text-xs font-mono text-slate-300">
                      {stu.attendance_percentage}%
                    </td>
                    <td className="py-4 text-xs">
                      {stu.project_submitted ? (
                        <div className="space-y-0.5">
                          <span className="text-green-400 font-semibold flex items-center gap-1">
                            <CheckCircle size={12} /> Submitted
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">Score: {stu.project_score}/100</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1">
                          <XCircle size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-xs">
                      {stu.certificate_eligible ? (
                        <span className="text-brand-orange font-semibold flex items-center gap-1">
                          Eligible ({stu.certificate_type})
                        </span>
                      ) : (
                        <span className="text-slate-500">Not Marked</span>
                      )}
                    </td>
                    <td className="py-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingStudent({
                          ...stu,
                          selectedStatements: stu.student_achievement_statements?.map((sas: any) => sas.statement_id) || []
                        })}
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 cursor-pointer text-xs"
                      >
                        Edit Grade / Attendance
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleGenerateRecommendation(stu.id)}
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 cursor-pointer text-xs"
                      >
                        Generate LOR
                      </Button>
                      <Button
                        size="sm"
                        disabled={!stu.certificate_eligible}
                        onClick={() => handleMarkAsCompleted(stu.id)}
                        className="bg-brand-orange text-slate-950 font-bold hover:bg-brand-orange/95 cursor-pointer text-xs disabled:opacity-40"
                      >
                        Mark Completed
                      </Button>
                    </td>
                  </tr>
                ))}
                {activeStus.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                      No active interns currently enrolled in this program.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* --- completed tab view --- */}
      {activeTab === 'completed' && (
        <Card variant="glass" className="p-6 space-y-4">
          <div className="border-b border-slate-900 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-400 font-medium">
                {selectedIds.length} interns selected for batch actions.
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSelectAll(completedStus)}
                  variant="ghost"
                  className="text-xs text-slate-300 border border-slate-800"
                >
                  Toggle Select All
                </Button>
                <Button
                  size="sm"
                  onClick={() => openDispatchModal()}
                  disabled={selectedIds.length === 0}
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 cursor-pointer text-xs disabled:opacity-40"
                >
                  <Mail size={12} className="inline mr-1" /> Dispatch Emails ({selectedIds.length})
                </Button>
                <Button
                  size="sm"
                  onClick={() => { setGenTemplateId(''); setGenModal({ mode: 'batch' }); }}
                  disabled={selectedIds.length === 0}
                  className="bg-brand-orange text-slate-950 font-bold hover:bg-brand-orange/95 cursor-pointer text-xs disabled:opacity-40"
                >
                  Generate Selected ({selectedIds.length})
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 font-semibold text-xs uppercase tracking-wider pb-3">
                  <th className="pb-3 w-10">Select</th>
                  <th className="pb-3">Intern</th>
                  <th className="pb-3">Verification Details</th>
                  <th className="pb-3">Issued Credentials</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {completedStus.map((stu) => {
                  const activeCert = stu.certificates?.find((c: any) => c.status === 'active');
                  const allCerts = (stu.certificates || []).filter((c: any) => c.status === 'active');
                  const lorDoc = stu.documents?.find((d: any) => d.document_type === 'recommendation');
                  const isChecked = selectedIds.includes(stu.id);

                  return (
                    <tr key={stu.id} className="hover:bg-slate-900/5">
                      <td className="py-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectToggle(stu.id)}
                          className="h-4 w-4 accent-brand-orange cursor-pointer"
                        />
                      </td>
                      <td className="py-4">
                        <div className="font-semibold text-slate-200">{stu.application?.full_name}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{stu.student_code}</div>
                      </td>
                      <td className="py-4 text-xs font-mono text-slate-400">
                        {allCerts.length > 0 ? (
                          <div className="space-y-1">
                            {allCerts.map((c: any) => (
                              <div key={c.id} className="space-y-0.5">
                                <span className="text-green-400 font-semibold">
                                  {c.certificate_id}
                                </span>
                                <span className="block text-[10px] text-slate-500 capitalize">
                                  {c.certificate_type}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500">Pending Issuance</span>
                        )}
                      </td>
                      <td className="py-4 text-xs">
                        <div className="space-y-1">
                          {allCerts.map((c: any) => (
                            <div key={c.id} className="flex items-center gap-2">
                              <a
                                href={c.certificate_pdf_url ? storagePublicUrl('certificates', c.certificate_pdf_url) : undefined}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-brand-orange hover:underline"
                              >
                                <Award size={12} /> {c.certificate_type === 'participation' ? 'Participation PDF' : 'Certificate PDF'}
                              </a>
                              <button
                                onClick={() => handleRevokeCertificate(c.certificate_id, stu.application?.full_name)}
                                className="inline-flex items-center gap-0.5 text-red-400/80 hover:text-red-300 text-[10px] font-semibold cursor-pointer"
                                title="Revoke this certificate"
                              >
                                <XCircle size={11} /> Revoke
                              </button>
                            </div>
                          ))}
                          {lorDoc && (
                            <a
                              href={storagePublicUrl('letters', lorDoc.document_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-cyan-400 hover:underline gap-1 font-semibold block"
                            >
                              <FileText size={12} /> Recommendation LOR
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingStudent({
                            ...stu,
                            selectedStatements: stu.student_achievement_statements?.map((sas: any) => sas.statement_id) || []
                          })}
                          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 cursor-pointer text-xs"
                        >
                          Edit Grade / Attendance
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setGenTemplateId(''); setGenModal({ mode: 'single', student: stu }); }}
                          className="text-slate-300 hover:text-white hover:bg-slate-900 cursor-pointer text-xs"
                        >
                          {activeCert ? 'Regenerate Cert' : 'Issue Certificate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleGenerateRecommendation(stu.id)}
                          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 cursor-pointer text-xs"
                        >
                          Generate LOR
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!activeCert}
                          onClick={() => handleSendCompletionEmail(stu.id)}
                          className="text-brand-orange hover:text-brand-orange/80 hover:bg-brand-orange/10 cursor-pointer text-xs disabled:opacity-40"
                        >
                          <Mail size={12} className="inline mr-1" /> Dispatch Email
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {completedStus.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                      No interns marked as completed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* --- archived tab view --- */}
      {activeTab === 'archived' && (
        <div className="space-y-4">
          {/* Summary count cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card variant="glass" className="p-5 border border-slate-900 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Applications Received</span>
              <p className="text-3xl font-bold font-display text-slate-100">{applications.length}</p>
            </Card>
            <Card variant="glass" className="p-5 border border-slate-900 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Rejected / Not Selected</span>
              <p className="text-3xl font-bold font-display text-red-400">{archivedApps.length}</p>
            </Card>
            <Card variant="glass" className="p-5 border border-slate-900 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Acceptance Rate</span>
              <p className="text-3xl font-bold font-display text-brand-orange">
                {applications.length > 0
                  ? `${Math.round(((applications.length - archivedApps.length) / applications.length) * 100)}%`
                  : 'N/A'}
              </p>
            </Card>
          </div>

          <Card variant="glass" className="p-6 border border-slate-900">
            <div className="flex items-center gap-3 text-slate-400">
              <XCircle size={16} className="text-slate-600 flex-shrink-0" />
              <p className="text-xs leading-relaxed">
                Rejected applicant profiles are not shown here to keep your workspace clean.
                Only the <span className="text-slate-200 font-semibold">{archivedApps.length} rejection count</span> is tracked for programme analytics.
                All data remains in your database and is not deleted.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Grade editing inline overlay modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card variant="solid" className="max-w-md w-full p-6 space-y-4 bg-slate-950 border border-slate-900 text-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-100 border-b border-slate-900 pb-2">
              Update intern details: {editingStudent.application?.full_name}
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Attendance Percentage</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingStudent.attendance_percentage || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, attendance_percentage: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-900 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Project Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingStudent.project_score || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, project_score: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-900 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="project_submitted"
                  checked={editingStudent.project_submitted || false}
                  onChange={(e) => setEditingStudent({ ...editingStudent, project_submitted: e.target.checked })}
                  className="h-4 w-4 accent-brand-orange"
                />
                <label htmlFor="project_submitted" className="text-slate-300 font-medium">Project Submitted</label>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="cert_eligible"
                  checked={editingStudent.certificate_eligible || false}
                  onChange={(e) => setEditingStudent({ ...editingStudent, certificate_eligible: e.target.checked })}
                  className="h-4 w-4 accent-brand-orange"
                />
                <label htmlFor="cert_eligible" className="text-slate-300 font-medium">Eligible for Certificate</label>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Certificate Type</label>
                <select
                  value={editingStudent.certificate_type || 'none'}
                  onChange={(e) => setEditingStudent({ ...editingStudent, certificate_type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-900 rounded-lg p-2 text-slate-200"
                >
                  <option value="none">none</option>
                  <option value="completion">completion</option>
                  <option value="participation">participation</option>
                </select>
              </div>

              {/* Achievement Statements */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400 font-semibold block">Achievement Statements</label>
                  <PlaceholderGuide
                    placeholders={[
                      { key: '{{attendance}}', description: 'This intern\'s attendance % (set above)' },
                      { key: '{{batch}}', description: 'This intern\'s batch name' },
                    ]}
                  />
                </div>
                {achievementStatements.length === 0 ? (
                  <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-3 text-[11px] text-slate-500 leading-relaxed">
                    No statements defined yet. Add snippets in <span className="text-brand-orange font-semibold">Settings → Statements</span> — then they appear here as checkboxes per student.
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] text-slate-500">
                      Tick the snippets to show on this intern&apos;s public profile. Statements can be used inside markdown like <code className="text-cyan-400 font-mono">{'{'}{'{'}attendance{'}'}{'}'}</code>.
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 bg-slate-950/60 border border-slate-900 rounded-lg p-3">
                      {achievementStatements.map((stmt: any) => {
                        const isAssigned = (editingStudent.selectedStatements || []).includes(stmt.id);
                        return (
                          <label key={stmt.id} className="flex items-start gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={() => {
                                const current: string[] = editingStudent.selectedStatements || [];
                                const updated = isAssigned
                                  ? current.filter((id: string) => id !== stmt.id)
                                  : [...current, stmt.id];
                                setEditingStudent({ ...editingStudent, selectedStatements: updated });
                              }}
                              className="mt-0.5 h-3.5 w-3.5 accent-brand-orange flex-shrink-0"
                            />
                            <span className={`text-[11px] leading-relaxed transition-colors ${isAssigned ? 'text-slate-200' : 'text-slate-500 group-hover:text-slate-400'}`}>
                              {stmt.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-900">
              <Button size="sm" variant="ghost" onClick={() => setEditingStudent(null)} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveInternScores} className="bg-brand-orange text-slate-950 font-bold hover:bg-brand-orange/90 text-xs">
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Certificate generation modal with template picker */}
      {dispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card variant="solid" className="max-w-2xl w-full p-6 space-y-4 bg-slate-950 border border-slate-900 text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-slate-900 pb-2">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Mail size={16} className="text-cyan-400" />
                Dispatch Completion Emails ({dispatchCandidates().length})
              </h3>
              <button onClick={() => setDispatchModal(false)} className="text-slate-500 hover:text-slate-200 transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {dispatchCandidates().length === 0 ? (
                <p className="text-slate-400">No selected interns have an active certificate. Issue certificates first.</p>
              ) : (
                <>
                  {/* Recipient selector */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold block">Preview recipient</label>
                    <select
                      value={dispatchPreviewId || ''}
                      onChange={(e) => setDispatchPreviewId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 cursor-pointer"
                    >
                      {dispatchCandidates().map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.application?.full_name} — {s.certificates?.find((c: any) => c.status === 'active')?.certificate_id}
                        </option>
                      ))}
                    </select>
                  </div>

                  {dispatchTemplateLoading ? (
                    <div className="flex items-center justify-center py-10 gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-cyan-400 border-r-2" />
                      <span className="text-slate-500">Loading email template...</span>
                    </div>
                  ) : !dispatchTemplate ? (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-[11px] text-amber-200/80 leading-relaxed">
                      No saved completion email template found in Email Settings. Emails will fall back to the default
                      completion template with the student&apos;s real data.
                    </div>
                  ) : dispatchTemplate.is_enabled === false ? (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-[11px] text-red-200/80 leading-relaxed">
                      The completion email is <strong>disabled</strong> in Email Settings. Enable it before dispatching.
                    </div>
                  ) : null}

                  {/* Attachment toggles */}
                  <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 space-y-2">
                    <p className="text-slate-400 font-semibold text-[11px] uppercase tracking-wide">Attachments (optional)</p>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dispatchAttachCert}
                        onChange={(e) => setDispatchAttachCert(e.target.checked)}
                        className="accent-cyan-500 h-4 w-4"
                      />
                      <span className="text-slate-200">
                        <FileText size={12} className="inline mr-1 text-cyan-400" />
                        Certificate PDF
                      </span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dispatchAttachLor}
                        onChange={(e) => setDispatchAttachLor(e.target.checked)}
                        className="accent-cyan-500 h-4 w-4"
                      />
                      <span className="text-slate-200">
                        <FileText size={12} className="inline mr-1 text-brand-orange" />
                        Letter of Recommendation (LOR) PDF
                      </span>
                    </label>
                    {dispatchAttachLor && dispatchCandidates().some((s) => !s.documents?.some((d: any) => d.document_type === 'recommendation')) && (
                      <p className="text-[10px] text-amber-200/80">
                        Some selected interns have no LOR generated yet — those will be sent without the LOR attachment. Use "Generate LOR" on the Completed tab first.
                      </p>
                    )}
                  </div>

                  {(() => {
                    const stu = dispatchCandidates().find((s) => s.id === dispatchPreviewId) || dispatchCandidates()[0];
                    if (!stu) return null;
                    const subject = dispatchTemplate?.subject || 'Ujjwalit Technologies — Internship Completion Certificate';
                    const body = dispatchTemplate?.body_html || '';
                    return (
                      <div className="space-y-2">
                        <div className="border border-slate-800 rounded-lg overflow-auto">
                          <div className="bg-slate-800/80 px-3 py-1.5 text-[10px] font-mono text-slate-400 border-b border-slate-700 flex items-center justify-between gap-2">
                            <span className="truncate">To: {stu.application?.email}</span>
                            <span className="truncate shrink-0">Subject: {fillEmailPlaceholders(subject, stu)}</span>
                          </div>
                          <div
                            className="w-full min-h-48 bg-white p-4 text-sm"
                            dangerouslySetInnerHTML={{
                              __html: body
                                ? fillEmailPlaceholders(body, stu)
                                : `<div style="font-family:Arial;color:#334155"><h3 style="color:#0f172a">Program Completion Certificate</h3><p>Dear <strong>${stu.application?.full_name || 'Student'}</strong>,</p><p>Congratulations on completing your internship. Your certificate has been issued and registered.</p></div>`,
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                          Placeholders are filled with this student&apos;s real data. Emails include a "Verify Certificate" link plus any attachments you enable above.
                          <PlaceholderGuide
                            placeholders={[
                              { key: '{{name}}', description: "This intern's full name" },
                              { key: '{{track}}', description: 'Track name (e.g. Frontend Development)' },
                              { key: '{{code}}', description: 'Program code (e.g. FE-010)' },
                              { key: '{{certId}}', description: 'Certificate ID of the active certificate' },
                              { key: '{{certificate}}', description: 'Full verification link (verify.ujjwalit.co.in/{certId})' },
                              { key: '{{lor}}', description: 'Public URL of this intern\'s generated LOR PDF' },
                            ]}
                          />
                        </p>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-900">
              <Button size="sm" variant="ghost" onClick={() => setDispatchModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleTestDispatchEmail}
                isLoading={dispatchTesting}
                disabled={dispatchCandidates().length === 0 || dispatchTemplateLoading || (dispatchTemplate?.is_enabled === false)}
                className="text-xs gap-1.5"
              >
                <Eye size={13} />
                Send Test Email
              </Button>
              <Button
                size="sm"
                onClick={handleBatchSendCompletionEmails}
                disabled={dispatchCandidates().length === 0 || dispatchTemplateLoading || (dispatchTemplate?.is_enabled === false)}
                className="bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 text-xs gap-1.5 disabled:opacity-40"
              >
                <Send size={13} />
                Send {dispatchCandidates().length} Email{dispatchCandidates().length === 1 ? '' : 's'}
                {dispatchAttachCert || dispatchAttachLor
                  ? ` (with ${[dispatchAttachCert ? 'certificate' : '', dispatchAttachLor ? 'LOR' : ''].filter(Boolean).join(' + ')})`
                  : ' (no attachments)'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {genModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card variant="solid" className="max-w-lg w-full p-6 space-y-4 bg-slate-950 border border-slate-900 text-slate-100">
            <h3 className="text-lg font-bold text-slate-100 border-b border-slate-900 pb-2 flex items-center gap-2">
              <Award size={16} className="text-brand-orange" />
              {genModal.mode === 'single'
                ? (genModal.student.certificates?.some((c: any) => c.status === 'active')
                  ? 'Update Certificate'
                  : 'Issue Certificate')
                : `Generate Certificates (${selectedIds.length})`}
            </h3>

            <div className="space-y-3 text-xs">
              {genModal.mode === 'single' ? (
                <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3 space-y-0.5">
                  <p className="font-semibold text-slate-200">{genModal.student.application?.full_name}</p>
                  <p className="text-slate-500 font-mono">{genModal.student.student_code}</p>
                </div>
              ) : (
                <p className="text-slate-400">
                  Will generate for <span className="text-slate-200 font-semibold">{selectedIds.length} selected intern(s)</span>.
                </p>
              )}

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Certificate Template</label>
                <select
                  value={genTemplateId}
                  onChange={(e) => setGenTemplateId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 cursor-pointer"
                >
                  <option value="">Auto (program / type default)</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}{t.is_default ? ' (default)' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Template preview */}
              <div className="rounded-lg border border-slate-800 overflow-hidden bg-slate-900/60">
                {(() => {
                  const t = templates.find((x) => x.id === genTemplateId);
                  if (!t) {
                    return (
                      <div className="p-6 text-center text-slate-500 text-xs">
                        <LayoutTemplate size={28} className="mx-auto mb-2 opacity-50" />
                        Auto template — uses the template linked to this program, otherwise the default for the certificate type.
                      </div>
                    );
                  }
                  const bg = resolveTemplateBg(t.background_url);
                  const isPdf = bg.toLowerCase().endsWith('.pdf');
                  return (
                    <div>
                      <div className="relative w-full" style={{ aspectRatio: '800/566' }}>
                        {bg && !isPdf ? (
                          <img src={bg} alt={t.name} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 gap-2">
                            {isPdf ? (
                              <>
                                <FileText size={24} className="opacity-40" />
                                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">PDF background (vector)</span>
                              </>
                            ) : (
                              <>
                                <LayoutTemplate size={24} className="opacity-40" />
                                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">No background image</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 border-t border-slate-800">
                        <span className="text-xs font-semibold text-slate-200">{t.name}</span>
                        <span className="text-[10px] rounded-full border border-slate-700 px-2 py-0.5 text-slate-400 capitalize">{t.template_type}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-200/80 leading-relaxed">
                Regenerating keeps the same certificate ID and verification link (already-shared URLs keep working) and
                re-renders the PDF with this intern&apos;s current details — name, program, attendance, and template.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-900">
              <Button size="sm" variant="ghost" onClick={() => setGenModal(null)} className="text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                isLoading={isGeneratingCerts}
                onClick={() => genModal.mode === 'single'
                  ? handleGenerateCertificate(genModal.student, genTemplateId)
                  : handleBatchGenerateCertificates(genTemplateId)}
                className="bg-brand-orange text-slate-950 font-bold hover:bg-brand-orange/90 text-xs"
              >
                <Award size={13} className="mr-1" />
                {genModal.mode === 'single' ? 'Issue Certificate' : `Generate ${selectedIds.length} Certificate(s)`}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
