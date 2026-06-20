'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import {
  FileText,
  Download,
  Plus,
  ArrowRight,
  Printer,
  History,
  CheckCircle,
  Code,
  Eye,
  Save,
  Upload,
  Image,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DocumentsDashboard() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<any[]>([]);
  
  // Selection States
  const [selectedStudent, setSelectedStudent] = useState('');
  const [docType, setDocType] = useState<'acceptance' | 'onboarding' | 'completion' | 'recommendation'>('acceptance');
  const [isGenerating, setIsGenerating] = useState(false);

  // Template customization
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [customText, setCustomText] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPdfBase64, setPreviewPdfBase64] = useState('');
  const bgFileRef = useRef<HTMLInputElement>(null);

  const documentTemplates: Record<string, string> = {
    acceptance: `Dear {{name}},

Following your application and review process, we are pleased to offer you an internship position as a Software Engineering Intern specializing in {{program}} with Ujjwalit Technologies.

Your internship training is scheduled to begin on {{startDate}} and complete on {{endDate}}.

Please note that this is a remote, unpaid training internship. Upon successful submission of capstone project guidelines, you will receive a cryptographically verifiable completion certificate.

We look forward to having you work with our technology group.`,
    onboarding: `Dear {{name}},

We welcome you to Ujjwalit Technologies. We are excited to verify your registration fee payment and officially enroll you in our upcoming batch beginning {{startDate}}.

To begin your onboarding workflow, please follow these steps:
1. Join the official developer channels and Slack/WhatsApp groups shared in your confirmation email.
2. Clone the sandbox boilerplate repository and read the developer setup instructions.
3. Introduce yourself to your designated project lead and check-in to your first team scrum.

Your training requirements include consistent check-ins, timely progress updates on task boards, and standard git commit habits.`,
    completion: `TO WHOM IT MAY CONCERN

This is to certify that {{name}}, a student of {{college}}, has successfully completed their software engineering training internship at Ujjwalit Technologies in the {{program}} track.

The internship commenced on {{startDate}} and concluded on {{endDate}}.

We wish the candidate success in all their future software engineering endeavors.`,
    recommendation: `TO WHOM IT MAY CONCERN

I am writing to highly recommend {{name}} for software engineering roles. They interned with the engineering department at Ujjwalit Technologies as a specialized {{program}} developer from {{startDate}} to {{endDate}}.

They took total ownership of building complex project features, demonstrating leadership qualities and an agile developer mindset. I am confident they will prove to be an invaluable asset to any engineering organization.`,
  };

  const handleUploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBg(true);
    const supabase = createClient();
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `doc-bg-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('templates')
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('templates')
        .getPublicUrl(fileName);
      setBackgroundUrl(publicUrl);
      toast.success('Background uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setIsUploadingBg(false);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      // 1. Fetch Students
      const { data: stds } = await supabase
        .from('students')
        .select(`
          id,
          student_code,
          application:applications (
            full_name
          )
        `)
        .order('student_code');

      setStudents(stds || []);

      // 2. Fetch Generated Documents
      const { data: docs } = await supabase
        .from('documents')
        .select(`
          id,
          document_type,
          document_url,
          generated_at,
          student:students (
            student_code,
            application:applications (
              full_name
            )
          )
        `)
        .order('generated_at', { ascending: false });

      setGeneratedDocs(docs || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load document operations log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          documentType: docType,
          customText: customText || undefined,
          backgroundUrl: backgroundUrl || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to generate document');
      }

      toast.success('Letter generated successfully!');
      loadInitialData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error generating document');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-display tracking-tight text-white">
          Document Generator
        </h1>
        <p className="text-slate-400 text-sm">
          Compile and issue formal letters (acceptance, onboarding, recommendation) for enrolled students.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generator Form panel */}
        <Card variant="glass" className="lg:col-span-1 h-fit bg-slate-950/70 border-slate-800 p-8 glow-teal">
          <form onSubmit={handleGenerate} className="space-y-5">
            <h3 className="text-lg font-bold font-display text-white border-b border-slate-900 pb-3 mb-2 flex items-center gap-2">
              <Plus size={18} className="text-brand-teal" /> Issue New Letter
            </h3>

            {/* Select student */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-300">Select Enrolled Student</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 text-sm cursor-pointer"
                required
              >
                <option value="">-- Choose Student --</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.student_code} - {st.application?.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Letter Type */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-300">Letter Template</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 text-sm cursor-pointer"
                required
              >
                <option value="acceptance">Offer / Acceptance Letter</option>
                <option value="onboarding">Onboarding Instructions</option>
                <option value="completion">Completion Letter</option>
                <option value="recommendation">Letter of Recommendation (LOR)</option>
              </select>
            </div>

            <Button type="submit" variant="teal" isLoading={isGenerating} className="w-full font-bold py-3">
              <Printer size={16} className="mr-1.5" /> Compile PDF Document
            </Button>

            <div className="border-t border-slate-900 pt-4 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setCustomText(documentTemplates[docType] || '');
                  setShowTemplateEditor(true);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900 py-2.5 text-sm font-medium text-slate-300 hover:border-brand-teal/40 hover:text-white transition-all cursor-pointer"
              >
                <Code size={15} /> Customize Template
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/documents/preview', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        documentType: docType,
                        customText: customText || undefined,
                        backgroundUrl: backgroundUrl || undefined,
                      }),
                    });
                    if (!res.ok) throw new Error('Preview failed');
                    const { pdfBase64 } = await res.json();
                    setPreviewPdfBase64(pdfBase64);
                    setShowPreview(true);
                  } catch (err: any) {
                    toast.error(err.message);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-800 py-2.5 text-sm font-medium text-slate-400 hover:border-brand-blue/40 hover:text-white transition-all cursor-pointer"
              >
                <Eye size={15} /> Sample Preview
              </button>
            </div>
          </form>
        </Card>

        {/* Generated logs panel */}
        <Card variant="glass" className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-900 pb-4">
            <h3 className="text-lg font-bold font-display text-slate-100 flex items-center gap-2">
              <History size={18} className="text-brand-orange" /> Issued Documents Log
            </h3>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-brand-orange border-r-2"></div>
              <p className="text-slate-450 text-xs">Loading logs...</p>
            </div>
          ) : generatedDocs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/40 border-b border-slate-900 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Document Type</th>
                    <th className="px-6 py-4">Generated Date</th>
                    <th className="px-6 py-4 text-right">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {generatedDocs.map((doc) => {
                    const isWeb = doc.student?.application?.internship_track === 'web-development';
                    return (
                      <tr key={doc.id} className="hover:bg-slate-900/10">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-200">{doc.student?.application?.full_name}</span>
                            <span className="text-xs font-mono text-slate-500">{doc.student?.student_code}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={doc.document_type === 'acceptance' ? 'reviewing' : 'active'}>
                            {doc.document_type === 'acceptance'
                              ? 'Offer Letter'
                              : doc.document_type === 'onboarding'
                              ? 'Onboarding'
                              : doc.document_type === 'completion'
                              ? 'Completion'
                              : 'LOR'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{formatDate(doc.generated_at)}</td>
                        <td className="px-6 py-4 text-right">
                          <a
                            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/letters/${doc.document_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-teal hover:underline"
                          >
                            <Download size={14} /> Download PDF
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-sm">
              No letters have been issued yet. Use the sidebar tool to generate one.
            </div>
          )}
        </Card>
      </div>

      {/* Template Editor Modal */}
      <Modal isOpen={showTemplateEditor} onClose={() => setShowTemplateEditor(false)}>
        <div className="space-y-4 w-full max-w-3xl">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Code size={18} className="text-brand-teal" /> Edit Document Template
          </h3>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Background Image</label>
            <div className="flex items-center gap-2">
              <input
                ref={bgFileRef}
                type="file"
                accept="image/*"
                onChange={handleUploadBackground}
                className="hidden"
              />
              <button
                onClick={() => bgFileRef.current?.click()}
                disabled={isUploadingBg}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:border-brand-teal/40 cursor-pointer disabled:opacity-50"
              >
                <Upload size={14} /> {isUploadingBg ? 'Uploading...' : 'Upload Background'}
              </button>
              {backgroundUrl && (
                <>
                  <Image size={14} className="text-brand-success" />
                  <button
                    onClick={() => setBackgroundUrl('')}
                    className="text-xs text-red-400 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Body Text <span className="text-slate-500 font-normal">(use {'{{name}}'}, {'{{college}}'}, {'{{program}}'}, {'{{startDate}}'}, {'{{endDate}}'})</span>
            </label>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full h-80 px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-mono text-xs leading-relaxed focus:outline-none focus:border-brand-teal resize-y"
              placeholder="Enter document body text with placeholders..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowTemplateEditor(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)}>
        <div className="w-full max-w-3xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-100">Document Preview</h3>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </div>
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-white">
            <iframe
              src={`data:application/pdf;base64,${previewPdfBase64}`}
              className="w-full h-[500px]"
              title="Document Preview"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

