'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import {
  Search,
  Users,
  Award,
  FileText,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Mail,
  ExternalLink,
  RotateCcw,
  FileUp,
  FileDown,
  Code2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PAGE_SIZE = 12;

function storagePublicUrl(bucket: string, fileName: string) {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

export default function GlobalStudentsRegistry() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailStudent, setDetailStudent] = useState<any>(null);
  const [actingCertId, setActingCertId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ updated: number; unmatched: string[]; skipped: string[] } | null>(null);

  const loadStudents = async (targetPage = page, query = searchQuery) => {
    setLoading(true);
    const supabase = createClient();
    try {
      const from = (targetPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let sb = supabase
        .from('students')
        .select(
          `
          id,
          student_code,
          batch_name,
          stage,
          joined_at,
          application:applications (
            full_name,
            email,
            college,
            branch
          ),
          opportunity:opportunities (
            title,
            cohort_label
          ),
          certificates:certificates (
            id,
            certificate_id,
            certificate_type,
            status
          )
        `,
          { count: 'exact' }
        )
        .order('joined_at', { ascending: false })
        .range(from, to);

      if (query.trim()) {
        const term = `%${query.trim().toLowerCase()}%`;
        sb = sb.or(
          `application.full_name.ilike.${term},student_code.ilike.${term},application.email.ilike.${term},opportunities.title.ilike.${term}`
        );
      }

      const { data, error, count } = await sb;
      if (error) throw error;
      setStudents(data || []);
      setTotal(count || 0);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load students registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents(1, '');
  }, []);

  // Debounced server-side search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadStudents(1, searchQuery);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const openStudent = async (id: string) => {
    setSelectedStudent(id);
    setDetailLoading(true);
    setDetailStudent(null);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          application:applications (
            full_name,
            email,
            college,
            branch,
            internship_track,
            payment_status
          ),
          opportunity:opportunities (
            title,
            cohort_label,
            slug
          ),
          certificates:certificates (
            id,
            certificate_id,
            certificate_type,
            status,
            verification_url,
            certificate_pdf_url,
            issued_at
          ),
          documents:documents (
            id,
            document_type,
            document_url
          ),
          profile:student_profiles (
            slug
          )
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      setDetailStudent(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load student details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRevokeCertificate = async (certificateId: string, name: string) => {
    const confirm = window.confirm(
      `Revoke certificate ${certificateId} for ${name}?\n\nIts verification link will show "Certificate Revoked" instead of being removed.`
    );
    if (!confirm) return;

    setActingCertId(certificateId);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('certificates')
        .update({ status: 'revoked' })
        .eq('certificate_id', certificateId);
      if (error) throw error;
      toast.success(`Certificate ${certificateId} revoked`);
      openStudent(selectedStudent!);
      loadStudents();
    } catch (err) {
      toast.error('Failed to revoke certificate');
    } finally {
      setActingCertId(null);
    }
  };

  const handleRestoreCertificate = async (certificateId: string, name: string) => {
    const confirm = window.confirm(`Restore certificate ${certificateId} for ${name} back to active?`);
    if (!confirm) return;

    setActingCertId(certificateId);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('certificates')
        .update({ status: 'active' })
        .eq('certificate_id', certificateId);
      if (error) throw error;
      toast.success(`Certificate ${certificateId} restored`);
      openStudent(selectedStudent!);
      loadStudents();
    } catch (err) {
      toast.error('Failed to restore certificate');
    } finally {
      setActingCertId(null);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    const confirm = window.confirm(`Are you sure you want to delete ${name}? This will delete their student cohort history, certificate registries, and documents permanently.`);
    if (!confirm) return;

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Student record deleted');
      setSelectedStudent(null);
      setDetailStudent(null);
      loadStudents();
    } catch (err) {
      toast.error('Failed to delete student');
    }
  };

  const certLabel = (c: any) => {
    if (c.certificate_type === 'participation') return 'Participation';
    if (c.certificate_type === 'achievement') return 'Achievement';
    return 'Completion';
  };

  const parseCSV = (text: string): { student_code: string; attendance_percentage?: string; project_score?: string; project_submitted?: string }[] => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const header = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_'));
    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(',');
      const row: any = {};
      header.forEach((h, idx) => {
        let v = cells[idx]?.trim() || '';
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/""/g, '"');
        row[h] = v;
      });
      if (row.student_code) rows.push(row);
    }
    return rows;
  };

  const handleImportFile = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) {
        toast.error('No valid rows found. First row must include a "Student Code" column.');
        return;
      }
      const res = await fetch('/api/students/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setImportResult(data);
      toast.success(`Imported ${data.updated} student${data.updated === 1 ? '' : 's'}`);
      loadStudents();
    } catch (err) {
      toast.error('Failed to import CSV');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = 'Student Code,Attendance %,Project Score,Project Submitted\nSTU-2026-001,92,88,true\nSTU-2026-002,85,79,true\nSTU-2026-003,,,false\n';
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grades-attendance-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-white flex items-center gap-2">
            <Users className="text-brand-orange" size={24} /> Students Registry
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Global repository to search, verify, and manage students across all programmes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, code, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-900 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-brand-orange/40"
            />
          </div>
          <Button
            size="sm"
            onClick={() => { setImportOpen(true); setImportResult(null); }}
            className="bg-brand-orange text-slate-950 font-bold hover:bg-brand-orange/90 text-xs gap-1.5 whitespace-nowrap"
          >
            <FileUp size={13} /> Bulk Import
          </Button>
        </div>
      </div>

      {loading && students.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-orange border-r-2"></div>
          <p className="text-slate-400 text-sm">Loading students registry...</p>
        </div>
      ) : students.length === 0 ? (
        <Card variant="glass" className="p-12 text-center text-slate-500 text-sm">
          No matching student records found in registry.
        </Card>
      ) : (
        <>
          {/* Student Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((s) => {
              const activeCount = s.certificates?.filter((c: any) => c.status === 'active').length || 0;
              return (
                <Card
                  key={s.id}
                  variant="glass"
                  hoverEffect
                  className="p-5 cursor-pointer"
                  onClick={() => openStudent(s.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-cyan-400 font-semibold block">
                        {s.student_code}
                      </span>
                      <h3 className="font-bold text-slate-100 truncate mt-0.5">
                        {s.application?.full_name}
                      </h3>
                    </div>
                    <Badge variant={s.stage === 'completed' ? 'success' : s.stage === 'active' ? 'primary' : 'default'}>
                      {s.stage}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 truncate">{s.application?.email}</p>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {s.opportunity?.title || 'Unknown Program'}
                    {s.opportunity?.cohort_label && <span className="font-mono text-[10px]"> · {s.opportunity.cohort_label}</span>}
                  </p>

                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-900/60 text-xs">
                    {activeCount > 0 ? (
                      <span className="text-green-400 font-semibold flex items-center gap-1">
                        <Award size={13} /> {activeCount} active cert{activeCount > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1">
                        <FileText size={13} /> No active cert
                      </span>
                    )}
                    <span className="ml-auto text-slate-500 text-[10px]">Click to manage</span>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500">
              Showing {students.length} of {total} student{total === 1 ? '' : 's'}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => {
                  const next = page - 1;
                  setPage(next);
                  loadStudents(next, searchQuery);
                }}
                className="text-xs gap-1"
              >
                <ChevronLeft size={14} /> Prev
              </Button>
              <span className="text-xs text-slate-500 font-mono">
                {page} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages || loading}
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  loadStudents(next, searchQuery);
                }}
                className="text-xs gap-1"
              >
                Next <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Student detail modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedStudent(null)}>
          <Card variant="solid" className="max-w-2xl w-full p-6 space-y-4 bg-slate-950 border border-slate-900 text-slate-100 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {detailLoading || !detailStudent ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-brand-orange border-r-2" />
                <p className="text-slate-500 text-xs">Loading student details...</p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 border-b border-slate-900 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{detailStudent.application?.full_name}</h3>
                    <p className="text-xs font-mono text-cyan-400 mt-0.5">{detailStudent.student_code}</p>
                  </div>
                  <button onClick={() => setSelectedStudent(null)} className="text-slate-500 hover:text-slate-200 transition-colors cursor-pointer">
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div className="text-slate-400">Email <span className="text-slate-200 float-right font-mono">{detailStudent.application?.email || '—'}</span></div>
                  <div className="text-slate-400">College <span className="text-slate-200 float-right">{detailStudent.application?.college || '—'}</span></div>
                  <div className="text-slate-400">Branch <span className="text-slate-200 float-right">{detailStudent.application?.branch || '—'}</span></div>
                  <div className="text-slate-400">Track <span className="text-slate-200 float-right capitalize">{detailStudent.application?.internship_track || '—'}</span></div>
                  <div className="text-slate-400">Program <span className="text-slate-200 float-right">{detailStudent.opportunity?.title || '—'}</span></div>
                  <div className="text-slate-400">Cohort <span className="text-slate-200 float-right font-mono">{detailStudent.opportunity?.cohort_label || detailStudent.batch_name || '—'}</span></div>
                  <div className="text-slate-400">Stage <span className="float-right"><Badge variant={detailStudent.stage === 'completed' ? 'success' : detailStudent.stage === 'active' ? 'primary' : 'default'}>{detailStudent.stage}</Badge></span></div>
                  <div className="text-slate-400">Joined <span className="text-slate-200 float-right">{new Date(detailStudent.joined_at).toLocaleDateString('en-IN')}</span></div>
                </div>

                {/* Certificates */}
                <div className="space-y-2">
                  <p className="text-slate-400 font-semibold text-[11px] uppercase tracking-wide">Certificates</p>
                  {(detailStudent.certificates || []).length === 0 ? (
                    <p className="text-slate-500 text-xs">No certificates issued.</p>
                  ) : (
                    detailStudent.certificates.map((c: any) => (
                      <div key={c.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Award size={16} className={c.status === 'revoked' ? 'text-red-400' : 'text-brand-orange'} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold text-sm ${c.status === 'revoked' ? 'text-red-400 line-through' : 'text-slate-100'}`}>
                                {certLabel(c)}
                              </span>
                              <Badge variant={c.status === 'active' ? 'success' : 'default'}>{c.status}</Badge>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 block truncate">{c.certificate_id}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {c.status === 'active' ? (
                            <>
                              {c.certificate_pdf_url && (
                                <a href={storagePublicUrl('certificates', c.certificate_pdf_url)} target="_blank" rel="noreferrer" className="text-[11px] text-brand-orange hover:underline font-semibold inline-flex items-center gap-1">
                                  <ExternalLink size={11} /> PDF
                                </a>
                              )}
                              {c.verification_url && (
                                <a href={c.verification_url} target="_blank" rel="noreferrer" className="text-[11px] text-cyan-400 hover:underline font-semibold inline-flex items-center gap-1">
                                  <ExternalLink size={11} /> Verify
                                </a>
                              )}
                              <button
                                onClick={() => handleRevokeCertificate(c.certificate_id, detailStudent.application?.full_name)}
                                disabled={actingCertId === c.certificate_id}
                                className="text-[11px] font-semibold text-red-400/80 hover:text-red-300 disabled:opacity-40 cursor-pointer"
                              >
                                Revoke
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleRestoreCertificate(c.certificate_id, detailStudent.application?.full_name)}
                              disabled={actingCertId === c.certificate_id}
                              className="text-[11px] font-semibold text-cyan-400/80 hover:text-cyan-300 inline-flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                            >
                              <RotateCcw size={11} /> Restore
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* LOR */}
                {detailStudent.documents?.some((d: any) => d.document_type === 'recommendation') && (
                  <div className="flex items-center gap-2 text-xs">
                    <FileText size={14} className="text-cyan-400" />
                    <a
                      href={storagePublicUrl('letters', detailStudent.documents.find((d: any) => d.document_type === 'recommendation').document_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline font-semibold"
                    >
                      Recommendation LOR
                    </a>
                  </div>
                )}

                {/* Shareable badge embed */}
                {detailStudent.profile?.slug && (
                  <div className="space-y-2 pt-2 border-t border-slate-900">
                    <p className="text-slate-400 font-semibold text-[11px] uppercase tracking-wide">Shareable Badge</p>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">
                          Paste this snippet into any website to show a live verified badge.
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `<iframe src="https://verify.ujjwalit.co.in/embed/${detailStudent.profile.slug}" width="360" height="360" style="border:none;overflow:hidden" loading="lazy" title="Ujjwalit Verified Badge"></iframe>`
                            );
                            toast.success('Embed snippet copied to clipboard');
                          }}
                          className="text-xs whitespace-nowrap"
                        >
                          <Code2 size={12} /> Copy Embed Code
                        </Button>
                      </div>
                      <pre className="text-[10px] font-mono text-cyan-300 bg-slate-950 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-all">
                        {`<iframe src="https://verify.ujjwalit.co.in/embed/${detailStudent.profile.slug}" width="360" height="360" style="border:none;overflow:hidden" loading="lazy" title="Ujjwalit Verified Badge"></iframe>`}
                      </pre>
                      <a
                        href={`https://verify.ujjwalit.co.in/embed/${detailStudent.profile.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-brand-orange hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        <ExternalLink size={11} /> Preview badge
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex justify-between gap-2 pt-3 border-t border-slate-900">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteStudent(detailStudent.id, detailStudent.application?.full_name)}
                    className="text-xs gap-1.5"
                  >
                    <Trash2 size={13} /> Delete Student
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedStudent(null)} className="text-xs">
                    Close
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Bulk Import modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card variant="solid" className="max-w-lg w-full p-6 space-y-4 bg-slate-950 border border-slate-900 text-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100">Bulk Import Grades / Attendance</h3>
              <button onClick={() => setImportOpen(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Upload a CSV with a <code className="text-cyan-400 font-mono">Student Code</code> column plus optional{' '}
              <code className="text-cyan-400 font-mono">Attendance %</code>,{' '}
              <code className="text-cyan-400 font-mono">Project Score</code> and{' '}
              <code className="text-cyan-400 font-mono">Project Submitted</code> (true/false) columns.
              Rows are matched by student code and updated in bulk.
            </p>

            <button
              onClick={downloadTemplate}
              className="text-[11px] text-brand-orange font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <FileDown size={12} /> Download template CSV
            </button>

            <label className="block">
              <span className="text-slate-400 font-semibold text-xs block mb-1">CSV File</span>
              <input
                type="file"
                accept=".csv,text/csv"
                disabled={importing}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImportFile(f);
                  e.target.value = '';
                }}
                className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-orange file:text-slate-950 file:cursor-pointer hover:file:bg-brand-orange/90 cursor-pointer"
              />
            </label>

            {importing && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-brand-orange border-r-2"></span>
                Importing rows…
              </div>
            )}

            {importResult && (
              <div className="space-y-2 text-xs">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-emerald-300">
                  {importResult.updated} student{importResult.updated === 1 ? '' : 's'} updated.
                </div>
                {importResult.unmatched.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-300">
                    <div className="font-semibold mb-1">Unmatched student codes ({importResult.unmatched.length}):</div>
                    <div className="font-mono text-[11px]">{importResult.unmatched.join(', ')}</div>
                  </div>
                )}
                {importResult.skipped.length > 0 && (
                  <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-3 text-slate-400">
                    <div className="font-semibold mb-1">Skipped (no values to update) ({importResult.skipped.length}):</div>
                    <div className="font-mono text-[11px]">{importResult.skipped.join(', ')}</div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-900">
              <Button size="sm" variant="ghost" onClick={() => setImportOpen(false)} className="text-xs">
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}