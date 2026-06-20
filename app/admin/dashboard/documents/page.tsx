'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    </div>
  );
}

