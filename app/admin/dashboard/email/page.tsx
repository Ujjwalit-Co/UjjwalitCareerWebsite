'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { getTrackLabel } from '@/lib/utils';
import {
  Mail,
  Search,
  CheckCircle,
  AlertCircle,
  Users,
  Send,
  Loader2,
  CheckSquare,
  Square,
  Filter,
  Code,
  Eye,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';

const EMAIL_TYPES = [
  {
    id: 'acceptance',
    label: 'Offer / Acceptance',
    description: 'Notify student of program acceptance with payment instructions.',
    color: 'text-brand-orange',
    border: 'border-brand-orange/30',
    bg: 'bg-brand-orange/5',
  },
  {
    id: 'onboarding',
    label: 'Onboarding Credentials',
    description: 'Send intern code and onboarding details to enrolled students.',
    color: 'text-brand-blue',
    border: 'border-brand-blue/30',
    bg: 'bg-brand-blue/5',
  },
  {
    id: 'completion',
    label: 'Completion & Certificate',
    description: 'Dispatch completion email with QR-verifiable certificate link.',
    color: 'text-brand-success',
    border: 'border-brand-success/30',
    bg: 'bg-brand-success/5',
  },
];

// Resend free plan: 100 emails/day, batch in groups of 10 with 300ms delay
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 400;

// Defined outside component to avoid Temporal Dead Zone in useState lazy initializers
const defaultSubjects: Record<string, string> = {
  acceptance: 'Ujjwalit Technologies — Internship Offer',
  onboarding: 'Ujjwalit Technologies — Onboarding Credentials & Setup',
  completion: 'Ujjwalit Technologies — Internship Completion Certificate',
};

interface Student {
  id: string;
  student_code: string;
  batch_name: string;
  certificate_eligible: boolean;
  application: {
    full_name: string;
    email: string;
    internship_track: string;
  };
}

type SendResult = { id: string; name: string; success: boolean; error?: string };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function EmailPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [emailType, setEmailType] = useState('acceptance');
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState<SendResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templateSubjects, setTemplateSubjects] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('email_template_subjects');
    return saved ? JSON.parse(saved) : defaultSubjects;
  });
  const [templateHtml, setTemplateHtml] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('email_template_html');
    return saved ? JSON.parse(saved) : {};
  });
  const [editingSubject, setEditingSubject] = useState('');
  const [editingHtml, setEditingHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  // defaultSubjects is defined at module level above

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          student_code,
          batch_name,
          certificate_eligible,
          application:applications (
            full_name,
            email,
            internship_track
          )
        `)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      const mapped = (data || []).map((s: any) => ({
        ...s,
        application: Array.isArray(s.application) ? s.application[0] : s.application,
      }));
      setStudents(mapped as Student[]);
    } catch (err: any) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const batches = Array.from(new Set(students.map((s) => s.batch_name).filter(Boolean)));

  const filtered = students.filter((s) => {
    const term = search.toLowerCase();
    const matchSearch =
      !term ||
      s.application?.full_name?.toLowerCase().includes(term) ||
      s.student_code.toLowerCase().includes(term) ||
      s.application?.email?.toLowerCase().includes(term);
    const matchBatch = !batchFilter || s.batch_name === batchFilter;
    return matchSearch && matchBatch;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((s) => s.id)));
    }
  };

  const handleSend = async () => {
    if (selectedIds.size === 0) {
      toast.error('Select at least one student');
      return;
    }

    setIsSending(true);
    setResults([]);
    setProgress(0);

    const ids = Array.from(selectedIds);
    const total = ids.length;
    const newResults: SendResult[] = [];

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const chunk = ids.slice(i, i + BATCH_SIZE);

      const chunkResults = await Promise.all(
        chunk.map(async (studentId) => {
          const student = students.find((s) => s.id === studentId);
          try {
            const res = await fetch('/api/email/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                studentId,
                type: emailType,
                customSubject: templateSubjects[emailType],
                customHtml: templateHtml[emailType] || undefined,
              }),
            });
            const json = await res.json();
            return {
              id: studentId,
              name: student?.application?.full_name || studentId,
              success: res.ok,
              error: !res.ok ? json.error : undefined,
            } as SendResult;
          } catch (err: any) {
            return {
              id: studentId,
              name: student?.application?.full_name || studentId,
              success: false,
              error: err.message,
            } as SendResult;
          }
        })
      );

      newResults.push(...chunkResults);
      setResults([...newResults]);
      setProgress(Math.round(((i + chunk.length) / total) * 100));

      if (i + BATCH_SIZE < ids.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    const successCount = newResults.filter((r) => r.success).length;
    const failCount = newResults.length - successCount;

    if (failCount === 0) {
      toast.success(`${successCount} email${successCount !== 1 ? 's' : ''} dispatched successfully`);
    } else {
      toast.error(`${successCount} sent, ${failCount} failed — check results below`);
    }

    setIsSending(false);
    setProgress(100);
  };

  const selectedEmailType = EMAIL_TYPES.find((t) => t.id === emailType)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-display tracking-tight text-white">Email Dispatch</h1>
        <p className="text-slate-400 text-sm mt-1">
          Select students, choose a template, and send in batches of {BATCH_SIZE} to respect Resend rate limits.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Student List */}
        <div className="space-y-4">
          {/* Filters */}
          <Card variant="solid" className="p-4 bg-slate-900 border-slate-800 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3.5 text-slate-500" size={16} />
              <Input
                placeholder="Search name, email, code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-500" />
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-brand-blue"
              >
                <option value="">All Batches</option>
                {batches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <span className="ml-auto text-xs text-slate-500 shrink-0">
              {selectedIds.size} / {filtered.length} selected
            </span>
          </Card>

          {/* Table */}
          <Card variant="glass" className="overflow-hidden border-slate-900 p-0">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-brand-orange" size={28} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">No students match the current filters.</div>
            ) : (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/40 border-b border-slate-900 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-4">
                      <button onClick={toggleAll} className="flex items-center gap-1.5 hover:text-slate-200 cursor-pointer">
                        {selectedIds.size === filtered.length && filtered.length > 0 ? (
                          <CheckSquare size={16} className="text-brand-orange" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-4">Intern</th>
                    <th className="px-4 py-4">Code</th>
                    <th className="px-4 py-4">Batch</th>
                    <th className="px-4 py-4">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {filtered.map((s) => {
                    const result = results.find((r) => r.id === s.id);
                    return (
                      <tr
                        key={s.id}
                        onClick={() => toggleSelect(s.id)}
                        className={`cursor-pointer transition-colors ${
                          selectedIds.has(s.id) ? 'bg-brand-orange/5 hover:bg-brand-orange/8' : 'hover:bg-slate-900/20'
                        }`}
                      >
                        <td className="px-4 py-3">
                          {selectedIds.has(s.id) ? (
                            <CheckSquare size={16} className="text-brand-orange" />
                          ) : (
                            <Square size={16} className="text-slate-600" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-200">{s.application?.full_name}</div>
                          <div className="text-[11px] text-slate-500">{getTrackLabel(s.application?.internship_track || '')}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{s.student_code}</td>
                        <td className="px-4 py-3 text-slate-400">{s.batch_name}</td>
                        <td className="px-4 py-3 text-slate-400">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[180px]">{s.application?.email}</span>
                            {result && (
                              result.success
                                ? <CheckCircle size={14} className="text-green-400 shrink-0" />
                                : <AlertCircle size={14} className="text-red-400 shrink-0" />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        {/* Right Panel - Template & Send */}
        <div className="space-y-4">
          {/* Email Template Selector */}
          <Card variant="solid" className="p-5 bg-slate-900 border-slate-800 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-brand-orange" />
                <h3 className="font-bold text-slate-200 text-sm">Email Template</h3>
              </div>
              <button
                onClick={() => {
                  const tpl = templateHtml[emailType] || '';
                  setEditingSubject(templateSubjects[emailType] || defaultSubjects[emailType] || '');
                  setEditingHtml(tpl);
                  setShowTemplateEditor(true);
                }}
                className="inline-flex items-center gap-1 text-xs text-brand-blue hover:underline cursor-pointer"
              >
                <Code size={12} /> Customize
              </button>
            </div>
            <div className="space-y-2">
              {EMAIL_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setEmailType(t.id)}
                  className={`w-full text-left rounded-lg border p-3 transition-all cursor-pointer ${
                    emailType === t.id ? `${t.border} ${t.bg}` : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`font-bold text-sm ${emailType === t.id ? t.color : 'text-slate-300'}`}>
                    {t.label}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{t.description}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Dispatch Summary */}
          <Card variant="solid" className="p-5 bg-slate-900 border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              Dispatch Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Recipients</span>
                <span className="font-bold text-slate-200">{selectedIds.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Template</span>
                <span className={`font-bold text-sm ${selectedEmailType.color}`}>{selectedEmailType.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Batches</span>
                <span className="font-bold text-slate-200">{Math.ceil(selectedIds.size / BATCH_SIZE)}</span>
              </div>
            </div>

            {isSending && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Sending…</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-brand-orange transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleSend}
              disabled={selectedIds.size === 0 || isSending}
              isLoading={isSending}
              className="w-full gap-2 bg-brand-orange font-bold"
            >
              {!isSending && <Send size={16} />}
              {isSending ? `Sending ${progress}%…` : `Send to ${selectedIds.size} Student${selectedIds.size !== 1 ? 's' : ''}`}
            </Button>

            <p className="text-[10px] text-slate-600 leading-relaxed">
              Emails are sent in batches of {BATCH_SIZE} with a {BATCH_DELAY_MS}ms delay to respect Resend rate limits (100/day on free plan).
            </p>
          </Card>

          {/* Results Log */}
          {results.length > 0 && (
            <Card variant="solid" className="p-4 bg-slate-900 border-slate-800 space-y-2 max-h-60 overflow-y-auto">
              <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Send Results</h4>
              {results.map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-xs">
                  {r.success
                    ? <CheckCircle size={12} className="text-green-400 shrink-0" />
                    : <AlertCircle size={12} className="text-red-400 shrink-0" />}
                  <span className={r.success ? 'text-slate-300' : 'text-red-400'}>{r.name}</span>
                  {!r.success && <span className="text-slate-600 truncate">— {r.error}</span>}
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
      {/* Template Editor Modal */}
      <Modal isOpen={showTemplateEditor} onClose={() => setShowTemplateEditor(false)}>
        <div className="space-y-4 w-full max-w-3xl">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Code size={18} className="text-brand-orange" /> Edit Email Template
          </h3>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Subject Line</label>
            <input
              value={editingSubject}
              onChange={(e) => setEditingSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-brand-blue text-sm"
              placeholder="Email subject"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">HTML Body</label>
            <textarea
              value={editingHtml}
              onChange={(e) => setEditingHtml(e.target.value)}
              className="w-full h-80 px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-mono text-xs leading-relaxed focus:outline-none focus:border-brand-blue resize-y"
              placeholder="Paste your HTML email template here. Use {{name}}, {{track}}, {{code}}, {{certId}} as placeholders."
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const sampleHtml = editingHtml
                    .replace(/\{\{name\}\}/g, 'Sample Student')
                    .replace(/\{\{track\}\}/g, 'Web Development')
                    .replace(/\{\{code\}\}/g, 'UJT-2026-001')
                    .replace(/\{\{certId\}\}/g, 'CERT-ABC123');
                  setPreviewHtml(sampleHtml);
                  setShowPreview(true);
                }}
                className="gap-1.5"
              >
                <Eye size={14} /> Preview
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowTemplateEditor(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const newSubjects = { ...templateSubjects, [emailType]: editingSubject };
                  const newHtml = { ...templateHtml, [emailType]: editingHtml };
                  setTemplateSubjects(newSubjects);
                  setTemplateHtml(newHtml);
                  localStorage.setItem('email_template_subjects', JSON.stringify(newSubjects));
                  localStorage.setItem('email_template_html', JSON.stringify(newHtml));
                  toast.success('Template saved locally');
                  setShowTemplateEditor(false);
                }}
                className="gap-1.5 bg-brand-orange"
              >
                <Save size={14} /> Save Template
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)}>
        <div className="w-full max-w-3xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-100">Email Preview</h3>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </div>
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-white">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[500px]"
              title="Email Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
