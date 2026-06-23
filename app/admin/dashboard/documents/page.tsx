'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { formatDate, getTrackLabel } from '@/lib/utils';
import type { DocFieldConfig } from '@/lib/generators/documents';
import {
  FileText,
  Download,
  Plus,
  Eye,
  History,
  Upload,
  Trash2,
  Move,
  Layout,
  CheckCircle,
  Loader2,
  AlertTriangle,
  X,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const DOC_TEMPLATE_PREFIX = 'doc-';

const designerWidth = 500;
const designerHeight = 707;

const defaultDocFields: DocFieldConfig[] = [
  { id: '1', type: 'text', placeholder: 'UJJWALIT TECHNOLOGIES PVT. LTD.', x: 60, y: 30, fontSize: 14, fontFamily: 'Sans', fontWeight: 'bold', color: '#0B1D3F', textAlign: 'left' },
  { id: '2', type: 'text', placeholder: 'UJJWALIT DEVELOPERS PROGRAM (UDP) 2026', x: 250, y: 52, fontSize: 11, fontFamily: 'Sans', fontWeight: 'bold', color: '#1A8BA6', textAlign: 'center' },
  { id: '3', type: 'text', placeholder: 'INTERNSHIP OFFER LETTER', x: 250, y: 68, fontSize: 10, fontFamily: 'Sans', fontWeight: 'bold', color: '#0B1D3F', textAlign: 'center' },
  { id: '4', type: 'text', placeholder: `Offer Letter ID: {{offer_id}}\nDate of Issue: {{issue_date}}\n\nDear {{student_name}},\n\nWe are pleased to inform you that, following the review of your application, you have been selected to participate as a {{internship_title}} under the Ujjwalit Developers Program (UDP) 2026, an industry-oriented training and internship initiative conducted by Ujjwalit Technologies Pvt. Ltd.\n\nProgram Details\n\n• Internship Role: {{internship_title}}\n• Batch: {{batch_name}}\n• Mode: Remote\n• Duration: {{duration}}\n• Expected Weekly Commitment: 4-6 Hours\n• Start Date: {{start_date}}\n\nAs a participant in the program, you will gain practical exposure to industry-oriented development workflows through project-based learning, mentorship, and guided implementation.\n\nDuring the internship, you will:\n\n• Work on one Major Project under mentor guidance\n• Complete one Minor Project as part of self-assessment\n• Participate in mentorship and learning sessions\n• Learn modern development tools, workflows, and best practices\n• Build portfolio-ready projects and practical technical skills\n\nUpon successful completion of the program requirements, participants will be eligible to receive a Verifiable Internship Completion Certificate issued by Ujjwalit Technologies Pvt. Ltd.\n\nOutstanding participants may additionally be considered for:\n\n• Letter of Recommendation\n• Project Excellence Recognition\n• Future Opportunities with Ujjwalit Technologies\n• Performance-Based Stipends and Rewards (Limited Selection)\n\nImportant Terms\n\n1. Participation in the program does not guarantee employment with Ujjwalit Technologies Pvt. Ltd.\n2. Successful completion of assigned projects and participation requirements is mandatory for certification.\n3. Participation does not guarantee any stipend, compensation, employment, or monetary benefit.\n4. A limited number of outstanding participants may be considered for performance-based stipends, rewards, recommendation letters, or future opportunities based on their performance throughout the program.\n5. Registration and enrollment fees, once paid, are non-refundable.\n6. Participants are expected to maintain professional conduct throughout the duration of the program.\n\nYour seat has been provisionally reserved and will be confirmed upon successful completion of the enrollment and verification process.\n\nWe congratulate you on your selection and look forward to supporting your learning journey through UDP 2026.\n\nWarm Regards,\n\nUjjwal Paliwal\nProgram Director\nUjjwalit Developers Program (UDP)\n\n{{signature_image}}\n\nUjjwalit Technologies Pvt. Ltd.\ncareers.ujjwalit.co.in\nOffer Verification ID: {{offer_id}}`, x: 60, y: 90, fontSize: 8.5, fontFamily: 'Sans', fontWeight: 'normal', color: '#1e293b', textAlign: 'left' },
  { id: '5', type: 'qrcode', placeholder: 'QR_CODE_PLACEHOLDER', x: 410, y: 630, fontSize: 55, fontFamily: 'Sans', fontWeight: 'normal', color: '#000000', textAlign: 'left' },
];

export default function DocumentsDashboard() {
  const [activeTab, setActiveTab] = useState<'issue' | 'designer'>('issue');
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<any[]>([]);

  // Issue tab states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkResults, setBulkResults] = useState<{ name: string; success: boolean; url?: string; error?: string }[]>([]);

  // Designer states
  const [designDocType, setDesignDocType] = useState<'acceptance' | 'onboarding' | 'completion' | 'recommendation'>('acceptance');
  const [bgUrl, setBgUrl] = useState('');
  const [fields, setFields] = useState<DocFieldConfig[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPdfBase64, setPreviewPdfBase64] = useState('');

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);

  const loadStudents = useCallback(async () => {
    const supabase = createClient();
    try {
      const { data: stds } = await supabase
        .from('students')
        .select(`
          id,
          student_code,
          batch_name,
          joined_at,
          application:applications (
            full_name,
            college,
            internship_track
          )
        `)
        .order('student_code');

      setStudents(stds || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadGeneratedDocs = useCallback(async () => {
    const supabase = createClient();
    try {
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
    }
  }, []);

  const loadDocTemplate = useCallback(async (docType: string) => {
    const supabase = createClient();
    try {
      const { data: templates } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('name', `${DOC_TEMPLATE_PREFIX}${docType}`)
        .maybeSingle();

      if (templates) {
        setBgUrl(templates.background_url || '');
        setFields(templates.fields?.length ? templates.fields : defaultDocFields);
      } else {
        setBgUrl('');
        setFields(defaultDocFields);
      }
      setSelectedFieldId(null);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadStudents(), loadGeneratedDocs()]).finally(() => setLoading(false));
  }, [loadStudents, loadGeneratedDocs]);

  useEffect(() => {
    loadDocTemplate(designDocType);
  }, [designDocType, loadDocTemplate]);

  // Toggle student selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)));
    }
  };

  // Background upload handler
  const handleUploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
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
      setBgUrl(publicUrl);
      toast.success('Background uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Save document template to certificate_templates table
  const handleSaveTemplate = async () => {
    setIsSavingTemplate(true);
    const supabase = createClient();
    const templateName = `${DOC_TEMPLATE_PREFIX}${designDocType}`;
    try {
      const { data: existing } = await supabase
        .from('certificate_templates')
        .select('id')
        .eq('name', templateName)
        .maybeSingle();

      if (existing) {
        const { error: uErr } = await supabase
          .from('certificate_templates')
          .update({
            background_url: bgUrl || null,
            fields: fields as any,
            width: designerWidth,
            height: designerHeight,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        if (uErr) throw uErr;
      } else {
        const { error: iErr } = await supabase
          .from('certificate_templates')
          .insert({
            name: templateName,
            background_url: bgUrl || null,
            fields: fields as any,
            width: designerWidth,
            height: designerHeight,
          });
        if (iErr) throw iErr;
      }

      toast.success(`Template saved for ${designDocType} letter!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Generate sample preview
  const handleGenerateSample = async () => {
    setIsGeneratingSample(true);
    try {
      const res = await fetch('/api/documents/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields,
          backgroundUrl: bgUrl || undefined,
        }),
      });
      if (!res.ok) throw new Error('Preview failed');
      const { pdfBase64 } = await res.json();
      setPreviewPdfBase64(pdfBase64);
      setShowPreview(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGeneratingSample(false);
    }
  };

  // Bulk generate & ZIP download
  const handleBulkGenerate = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setIsBulkGenerating(true);
    const total = selectedIds.size;
    const isSingle = total === 1;
    setBulkProgress({ current: 0, total });
    setBulkResults([]);
    const results: { name: string; success: boolean; url?: string; error?: string }[] = [];
    const zip = new JSZip();

    const selectedStudents = students.filter((s) => selectedIds.has(s.id));

    for (let i = 0; i < selectedStudents.length; i++) {
      const st = selectedStudents[i];
      const app = st.application;
      const studentName = app?.full_name || 'Unknown';
      setBulkProgress({ current: i + 1, total });

      try {
        const res = await fetch('/api/documents/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: st.id,
            documentType: designDocType,
            fields,
            backgroundUrl: bgUrl || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Generation failed');

        const supabase = createClient();
        const { data: { publicUrl } } = supabase.storage
          .from('letters')
          .getPublicUrl(data.fileName);

        if (isSingle) {
          results.push({ name: studentName, success: true, url: publicUrl });
        } else {
          const pdfRes = await fetch(publicUrl);
          const pdfBlob = await pdfRes.blob();
          const safeName = `${st.student_code || `student-${i}`}-${designDocType}.pdf`;
          zip.file(safeName.replace(/[^\w\-\.]/g, '_'), pdfBlob);
          results.push({ name: studentName, success: true, url: publicUrl });
        }
      } catch (err: any) {
        results.push({ name: studentName, success: false, error: err.message });
      }

      setBulkResults([...results]);
    }

    if (isSingle && results[0]?.success && results[0]?.url) {
      window.open(results[0].url, '_blank');
      toast.success('Letter generated! Preview opened in new tab.');
    } else if (!isSingle) {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${designDocType}-letters-${Date.now()}.zip`);
      toast.success(`Generated ${results.filter((r) => r.success).length}/${total} letters — ZIP downloaded!`);
    }

    setIsBulkGenerating(false);
    await loadGeneratedDocs();
  };

  // Drag-and-drop handlers
  const handleMouseDown = (e: React.MouseEvent, fieldId: string) => {
    e.preventDefault();
    setSelectedFieldId(fieldId);

    if (!canvasRef.current) return;
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialFieldX = field.x;
    const initialFieldY = field.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const newX = Math.round(Math.max(0, Math.min(designerWidth, initialFieldX + deltaX)));
      const newY = Math.round(Math.max(0, Math.min(designerHeight, initialFieldY + deltaY)));
      setFields((prev) =>
        prev.map((f) => (f.id === fieldId ? { ...f, x: newX, y: newY } : f))
      );
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleUpdateSelectedField = (key: keyof DocFieldConfig, value: any) => {
    if (!selectedFieldId) return;
    setFields((prev) =>
      prev.map((f) => (f.id === selectedFieldId ? { ...f, [key]: value } : f))
    );
  };

  const handleAddField = (type: 'text' | 'qrcode') => {
    const newField: DocFieldConfig = {
      id: `field-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type,
      placeholder: type === 'text' ? 'New Text Field' : 'QR_CODE_PLACEHOLDER',
      x: 200,
      y: 300,
      fontSize: type === 'text' ? 14 : 70,
      fontFamily: 'Sans',
      fontWeight: 'normal',
      color: '#000000',
      textAlign: 'left',
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  };

  const handleDeleteField = () => {
    if (!selectedFieldId) return;
    setFields((prev) => prev.filter((f) => f.id !== selectedFieldId));
    setSelectedFieldId(null);
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-white flex items-center gap-2">
            <FileText size={32} className="text-brand-orange" /> Document Generator
          </h1>
          <p className="text-slate-400 text-sm">
            Design document templates and issue letters in bulk.
          </p>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-850">
          <button
            onClick={() => setActiveTab('issue')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'issue'
                ? 'bg-brand-orange text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download size={14} /> Issue Letters
          </button>
          <button
            onClick={() => setActiveTab('designer')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'designer'
                ? 'bg-brand-orange text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layout size={14} /> Design Template
          </button>
        </div>
      </div>

      {/* ISSUE LETTERS TAB */}
      {activeTab === 'issue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Student selection + bulk actions */}
          <Card variant="glass" className="lg:col-span-1 h-fit bg-slate-950/70 border-slate-800 p-6 glow-teal">
            <h3 className="text-lg font-bold font-display text-white border-b border-slate-900 pb-3 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-brand-teal" /> Bulk Letter Issue
            </h3>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">Document Type</label>
                <select
                  value={designDocType}
                  onChange={(e) => setDesignDocType(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-brand-teal text-sm cursor-pointer"
                >
                  <option value="acceptance">Offer / Acceptance Letter</option>
                  <option value="onboarding">Onboarding Instructions</option>
                  <option value="completion">Completion Letter</option>
                  <option value="recommendation">Letter of Recommendation (LOR)</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{selectedIds.size} of {students.length} selected</span>
                <button
                  onClick={toggleSelectAll}
                  className="text-brand-teal hover:underline cursor-pointer"
                >
                  {selectedIds.size === students.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {students.map((st) => {
                  const app = st.application;
                  return (
                    <label
                      key={st.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                        selectedIds.has(st.id)
                          ? 'border-brand-teal/40 bg-slate-900/80 text-slate-200'
                          : 'border-slate-800/60 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(st.id)}
                        onChange={() => toggleSelect(st.id)}
                        className="accent-brand-teal w-4 h-4"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">{app?.full_name}</span>
                        <span className="text-[11px] font-mono text-slate-500">{st.student_code}</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              <Button
                variant="teal"
                onClick={handleBulkGenerate}
                isLoading={isBulkGenerating}
                disabled={selectedIds.size === 0}
                className="w-full font-bold py-3"
              >
                {isBulkGenerating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    {bulkProgress.current}/{bulkProgress.total}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Download size={16} /> Generate & Download ZIP
                  </span>
                )}
              </Button>
            </div>
          </Card>

          {/* Results panel */}
          <Card variant="glass" className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <h3 className="text-lg font-bold font-display text-slate-100 flex items-center gap-2">
                <History size={18} className="text-brand-orange" /> Issued Documents Log
              </h3>
            </div>

            {/* Bulk results */}
            {bulkResults.length > 0 && (
              <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-4 max-h-[200px] overflow-y-auto space-y-1.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Last Bulk Run</p>
                {bulkResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {r.success ? (
                      <CheckCircle size={12} className="text-green-400 shrink-0" />
                    ) : (
                      <AlertTriangle size={12} className="text-red-400 shrink-0" />
                    )}
                    <span className="text-slate-300 truncate">{r.name}</span>
                    {r.success ? (
                      <>
                        <span className="text-green-400 ml-auto shrink-0">Done</span>
                        {r.url && (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-teal hover:underline shrink-0 ml-2"
                          >
                            Preview
                          </a>
                        )}
                      </>
                    ) : (
                      <span className="text-red-400 ml-auto shrink-0 text-[10px]">{r.error}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

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
                    {generatedDocs.map((doc) => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-sm">
                No letters have been issued yet. Select students and generate.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* DESIGN TEMPLATE TAB */}
      {activeTab === 'designer' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Canvas workspace */}
          <div className="lg:col-span-3 space-y-4">
            <Card variant="solid" className="p-4 bg-slate-900 border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Letter Type:</span>
                <select
                  value={designDocType}
                  onChange={(e) => setDesignDocType(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 cursor-pointer focus:outline-none focus:border-brand-teal"
                >
                  <option value="acceptance">Offer / Acceptance Letter</option>
                  <option value="onboarding">Onboarding Instructions</option>
                  <option value="completion">Completion Letter</option>
                  <option value="recommendation">Letter of Recommendation</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateSample}
                  isLoading={isGeneratingSample}
                  className="font-bold text-xs border-brand-orange text-brand-orange hover:bg-brand-orange/10"
                >
                  <Eye size={14} className="mr-1.5" /> Sample PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveTemplate}
                  isLoading={isSavingTemplate}
                  className="font-bold text-xs"
                >
                  Save Template
                </Button>
              </div>
            </Card>

            {/* Canvas */}
            <div className="overflow-auto border border-slate-800 rounded-xl bg-slate-950 p-2 shadow-2xl flex items-center justify-center">
              <div
                ref={canvasRef}
                style={{
                  width: `${designerWidth}px`,
                  height: `${designerHeight}px`,
                  backgroundImage: bgUrl && !bgUrl.match(/\.pdf$/i) ? `url(${bgUrl})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                }}
                className={`border rounded-lg select-none ${
                  !bgUrl ? 'bg-slate-900 border-dashed border-slate-700/50' : 'border-slate-850'
                }`}
              >
                {!bgUrl && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-2">
                    <FileText size={48} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Empty Canvas</span>
                    <span className="text-[10px] text-slate-600">Upload background image on the right panel</span>
                  </div>
                )}

                {bgUrl?.match(/\.pdf$/i) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-2 bg-slate-900/80 rounded-lg">
                    <FileText size={48} />
                    <span className="text-xs font-semibold uppercase tracking-wider">PDF Background</span>
                    <span className="text-[10px] text-slate-600">Vector quality preserved — preview available via Sample PDF</span>
                  </div>
                )}

                {fields.map((field) => {
                  const isSelected = selectedFieldId === field.id;
                  const isQr = field.type === 'qrcode';
                  const textAlignStyle = field.textAlign || 'left';
                  const alignmentShift =
                    textAlignStyle === 'center' ? '-50%' : textAlignStyle === 'right' ? '-100%' : '0%';

                  return (
                    <div
                      key={field.id}
                      onMouseDown={(e) => handleMouseDown(e, field.id)}
                      style={{
                        position: 'absolute',
                        left: `${field.x}px`,
                        top: `${field.y}px`,
                        transform: `translateX(${alignmentShift})`,
                        color: field.color || '#000000',
                        fontSize: `${field.fontSize}px`,
                        fontFamily: field.fontFamily === 'Serif' ? 'Georgia, serif' : field.fontFamily === 'Mono' ? 'monospace' : field.fontFamily === 'Sans' ? 'sans-serif' : `'${field.fontFamily}', sans-serif`,
                        fontWeight: field.fontWeight === 'bold' ? 'bold' : 'normal',
                        cursor: 'move',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                      className={`transition-shadow hover:bg-teal-500/10 group ${
                        isSelected
                          ? 'outline-2 outline-dashed outline-brand-teal bg-teal-500/10 shadow-lg'
                          : 'outline-1 outline-transparent'
                      }`}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-[10px] text-brand-teal px-1 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity flex items-center gap-1 font-bold whitespace-nowrap">
                        <Move size={8} /> {field.placeholder.substring(0, 20)}...
                      </div>

                      {isQr ? (
                        <div
                          style={{
                            width: `${field.fontSize || 75}px`,
                            height: `${field.fontSize || 75}px`,
                            backgroundColor: '#FFFFFF',
                          }}
                          className="border border-slate-350 rounded p-1 flex items-center justify-center text-slate-900"
                        >
                          <svg className="w-full h-full text-black" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 3h8v8H3zm2 2v4h4V5zm8-2h8v8h-8zm2 2v4h4V5zM3 13h8v8H3zm2 2v4h4v-4zm13-2h3v2h-3zm-2 2h2v2h-2zm2 2h3v2h-3zm-2 2h2v2h-2zm4-6h1v2h-1zm0 4h1v2h-1zm-6-2h1v2h-1zm0 4h1v2h-1z" />
                          </svg>
                        </div>
                      ) : (
                        <span
                          className="pointer-events-none"
                          style={{
                            whiteSpace: 'pre-wrap',
                            maxWidth: `${Math.max(100, designerWidth - field.x - 20)}px`,
                            display: 'inline-block',
                          }}
                        >
                          {field.placeholder}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Background Settings */}
            <Card variant="glass" className="p-5 bg-slate-950/70 border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Background</h4>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Upload Image</label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    isLoading={isUploading}
                    className="w-full text-xs font-bold flex gap-1.5 items-center justify-center py-2"
                  >
                    <Upload size={14} /> Upload
                  </Button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,.pdf"
                onChange={handleUploadBackground}
                className="hidden"
              />
                </div>
              </div>

              <div className="border-t border-slate-900 pt-3">
                <Input
                  label="Or Image URL"
                  placeholder="https://...png"
                  value={bgUrl}
                  onChange={(e) => setBgUrl(e.target.value)}
                />
              </div>

              {bgUrl && (
                <button
                  onClick={() => setBgUrl('')}
                  className="text-xs text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <X size={12} /> Remove background
                </button>
              )}

              <p className="text-[9px] text-slate-500 leading-normal">
                A4 Portrait ratio recommended (~500x707px).
              </p>
            </Card>

            {/* Field Management */}
            <Card variant="glass" className="p-5 bg-slate-950/70 border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Fields</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddField('text')}
                  className="text-xs font-bold py-2"
                >
                  + Add Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddField('qrcode')}
                  className="text-xs font-bold py-2"
                >
                  + Add QR Code
                </Button>
              </div>
              <button
                onClick={() => {
                  setFields(defaultDocFields);
                  setSelectedFieldId(null);
                }}
                className="w-full text-xs text-slate-500 hover:text-slate-300 py-1 cursor-pointer"
              >
                Reset to defaults
              </button>
            </Card>

            {/* Field Inspector */}
            <Card variant="glass" className="p-5 bg-slate-950/70 border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Inspector</h4>

              {selectedField ? (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-2.5 bg-slate-900/60 border border-slate-850 rounded-lg">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Selected:</span>
                    <p className="text-sm font-bold text-slate-200 mt-0.5 truncate">{selectedField.placeholder}</p>
                  </div>

                  {selectedField.type === 'text' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[#F5F5F5]">Placeholder Text</label>
                      <textarea
                        value={selectedField.placeholder}
                        onChange={(e) => handleUpdateSelectedField('placeholder', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2.5 bg-brand-secondary border border-brand-border rounded-lg text-[#F5F5F5] placeholder-[#71717A] focus:outline-none transition-all duration-200 text-sm md:text-base focus:ring-2 focus:border-brand-blue focus:ring-brand-blue/20 resize-y font-mono"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-medium">
                      Size: {selectedField.fontSize}px
                    </label>
                    <input
                      type="range"
                      min="6"
                      max="96"
                      value={selectedField.fontSize}
                      onChange={(e) => handleUpdateSelectedField('fontSize', parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-900 border border-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-teal"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-medium">Font</label>
                    <select
                      value={selectedField.fontFamily}
                      onChange={(e) => handleUpdateSelectedField('fontFamily', e.target.value)}
                      className="px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-250 cursor-pointer"
                    >
                      <option value="Sans">Helvetica (Sans)</option>
                      <option value="Serif">Times-Roman (Serif)</option>
                      <option value="Mono">Courier (Mono)</option>
                      <option value="Inter">Inter</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Playfair Display">Playfair Display</option>
                      <option value="Great Vibes">Great Vibes (Script)</option>
                      <option value="Alex Brush">Alex Brush (Script)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-medium">Weight</label>
                    <select
                      value={selectedField.fontWeight}
                      onChange={(e) => handleUpdateSelectedField('fontWeight', e.target.value)}
                      className="px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-250 cursor-pointer"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-medium">Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={selectedField.color}
                        onChange={(e) => handleUpdateSelectedField('color', e.target.value)}
                        className="w-8 h-8 rounded border border-slate-800 cursor-pointer bg-transparent"
                      />
                      <Input
                        value={selectedField.color}
                        onChange={(e) => handleUpdateSelectedField('color', e.target.value)}
                        className="py-1 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-medium">Align</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-850">
                      {(['left', 'center', 'right'] as const).map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => handleUpdateSelectedField('textAlign', align)}
                          className={`py-1 text-[10px] font-bold rounded capitalize cursor-pointer transition-colors ${
                            selectedField.textAlign === align
                              ? 'bg-brand-teal text-slate-950'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold bg-slate-950 p-2 rounded-lg border border-slate-900">
                    <span>X: {selectedField.x}px</span>
                    <span>Y: {selectedField.y}px</span>
                  </div>

                  <div className="pt-2 border-t border-slate-900">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleDeleteField}
                      className="w-full gap-1.5 justify-center py-2 text-xs font-bold"
                    >
                      <Trash2 size={13} /> Remove Field
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-xs italic text-center py-6">
                  Click a field on the canvas to edit its properties.
                </p>
              )}
            </Card>
          </div>
        </div>
      )}

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
