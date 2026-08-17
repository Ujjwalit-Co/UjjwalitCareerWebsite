'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toCSV, downloadCSV } from '@/lib/csv';
import {
  BriefcaseBusiness,
  Award,
  Inbox,
  UserCheck,
  GraduationCap,
  FileDown,
  Mail,
  ClipboardList,
  LayoutTemplate,
  Search,
  ArrowRight,
  Filter,
  Zap,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

type RecordTab = 'applications' | 'students' | 'certificates';

const PAGE_SIZE = 15;

const TAB_CONFIG: Record<
  RecordTab,
  {
    table: string;
    select: string;
    order: string;
    statusCol: string;
    dateCol: string;
    search: (q: string) => string;
  }
> = {
  applications: {
    table: 'applications',
    select: '*, opportunity:opportunities(title, slug)',
    order: 'created_at',
    statusCol: 'application_status',
    dateCol: 'created_at',
    search: (q) =>
      `full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,college.ilike.%${q}%,internship_track.ilike.%${q}%,opportunity.title.ilike.%${q}%`,
  },
  students: {
    table: 'students',
    select:
      '*, application:applications(full_name, email, college, branch), opportunity:opportunities(title, slug), certificates:certificates(id, certificate_id, status)',
    order: 'joined_at',
    statusCol: 'stage',
    dateCol: 'joined_at',
    search: (q) =>
      `student_code.ilike.%${q}%,application.full_name.ilike.%${q}%,application.email.ilike.%${q}%,opportunity.title.ilike.%${q}%,batch_name.ilike.%${q}%`,
  },
  certificates: {
    table: 'certificates',
    select:
      '*, student:students(student_code, application:applications(full_name)), opportunity:opportunities(title, slug)',
    order: 'issued_at',
    statusCol: 'status',
    dateCol: 'issued_at',
    search: (q) =>
      `certificate_id.ilike.%${q}%,student.student_code.ilike.%${q}%,student.application.full_name.ilike.%${q}%,opportunity.title.ilike.%${q}%`,
  },
};

type QueueMap = Record<string, number>;

export default function CommandCenterDashboard() {
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<any[]>([]);

  // Attention queue aggregates (lightweight — counts only, no full rows)
  const [queueData, setQueueData] = useState<{
    pending: QueueMap;
    accepted: QueueMap;
    ready: QueueMap;
    noCert: QueueMap;
  }>({ pending: {}, accepted: {}, ready: {}, noCert: {} });

  // Records browser state
  const [tab, setTab] = useState<RecordTab>('applications');
  const [oppFilter, setOppFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<{ data: any[]; total: number }>({ data: [], total: 0 });
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // ---- Initial lightweight fetch: opportunities + attention-queue counts ----
  useEffect(() => {
    let cancelled = false;
    const fetchDashboard = async () => {
      const supabase = createClient();
      try {
        const [{ data: opps }, { data: pending }, { data: accepted }, { data: ready }, { data: completed }, { data: certs }] =
          await Promise.all([
            supabase.from('opportunities').select('id, title, slug, status').order('display_order', { ascending: true }),
            supabase.from('applications').select('opportunity_id').eq('application_status', 'pending'),
            supabase.from('students').select('opportunity_id').eq('stage', 'accepted'),
            supabase.from('students').select('opportunity_id').eq('stage', 'active').eq('project_submitted', true),
            supabase.from('students').select('id, opportunity_id').eq('stage', 'completed'),
            supabase.from('certificates').select('student_id, opportunity_id').eq('status', 'active'),
          ]);
        if (cancelled) return;

        setOpportunities(opps || []);

        const byOpp = (rows: any[]) => {
          const m: QueueMap = {};
          (rows || []).forEach((r) => {
            const k = r.opportunity_id || 'other';
            m[k] = (m[k] || 0) + 1;
          });
          return m;
        };

        const certStudentIds = new Set((certs || []).map((c) => c.student_id));
        const noCert: QueueMap = {};
        (completed || []).forEach((s) => {
          if (!certStudentIds.has(s.id)) {
            const k = s.opportunity_id || 'other';
            noCert[k] = (noCert[k] || 0) + 1;
          }
        });

        setQueueData({
          pending: byOpp(pending || []),
          accepted: byOpp(accepted || []),
          ready: byOpp(ready || []),
          noCert,
        });
      } catch (err) {
        console.error(err);
        toast.error('Failed to load command center data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const oppById = useMemo(() => {
    const m = new Map<string, any>();
    opportunities.forEach((o) => m.set(o.id, o));
    return m;
  }, [opportunities]);

  const slugForKey = (id: string) => oppById.get(id)?.slug || 'other';

  // ---- Attention queue ----
  const queue = useMemo(() => {
    const build = (map: QueueMap) =>
      Object.entries(map)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 2);

    return [
      {
        key: 'pending',
        label: 'Pending applications awaiting review',
        icon: <Inbox size={16} />,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/20',
        total: Object.values(queueData.pending).reduce((a, b) => a + b, 0),
        entries: build(queueData.pending),
        cta: 'Review',
      },
      {
        key: 'onboard',
        label: 'Accepted interns awaiting onboarding',
        icon: <UserCheck size={16} />,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10 border-blue-500/20',
        total: Object.values(queueData.accepted).reduce((a, b) => a + b, 0),
        entries: build(queueData.accepted),
        cta: 'Onboard',
      },
      {
        key: 'grade',
        label: 'Projects submitted — ready to mark complete',
        icon: <GraduationCap size={16} />,
        color: 'text-green-400',
        bg: 'bg-green-500/10 border-green-500/20',
        total: Object.values(queueData.ready).reduce((a, b) => a + b, 0),
        entries: build(queueData.ready),
        cta: 'Grade',
      },
      {
        key: 'cert',
        label: 'Completed interns without an issued certificate',
        icon: <Award size={16} />,
        color: 'text-brand-orange',
        bg: 'bg-brand-orange/10 border-brand-orange/20',
        total: Object.values(queueData.noCert).reduce((a, b) => a + b, 0),
        entries: build(queueData.noCert),
        cta: 'Issue',
      },
    ];
  }, [queueData]);

  // ---- Quick actions ----
  const quickActions = useMemo(() => {
    const sum = (m: QueueMap) => Object.values(m).reduce((a, b) => a + b, 0);
    return [
      { label: 'Review Applications', href: '/admin/dashboard/programmes', badge: sum(queueData.pending), icon: <Inbox size={16} /> },
      { label: 'Accept & Onboard', href: '/admin/dashboard/programmes', badge: sum(queueData.accepted), icon: <UserCheck size={16} /> },
      { label: 'Grade Interns', href: '/admin/dashboard/programmes', badge: sum(queueData.ready), icon: <ClipboardList size={16} /> },
      { label: 'Issue Certificates', href: '/admin/dashboard/programmes', badge: sum(queueData.noCert), icon: <Award size={16} /> },
      { label: 'Dispatch Emails', href: '/admin/dashboard/programmes', icon: <Mail size={16} /> },
      { label: 'Manage Templates', href: '/admin/dashboard/templates', icon: <LayoutTemplate size={16} /> },
    ];
  }, [queueData]);

  const scrollToRecords = () => document.getElementById('records-browser')?.scrollIntoView({ behavior: 'smooth' });

  // ---- Paginated records fetch (only current page, debounced on filters) ----
  const fetchRecords = async (targetPage: number) => {
    const cfg = TAB_CONFIG[tab];
    const supabase = createClient();
    setRecordsLoading(true);
    try {
      let query = supabase.from(cfg.table).select(cfg.select, { count: 'exact' });
      if (oppFilter !== 'all') query = query.eq('opportunity_id', oppFilter);
      if (statusFilter !== 'all') query = query.eq(cfg.statusCol, statusFilter);
      if (dateFrom) query = query.gte(cfg.dateCol, `${dateFrom}T00:00:00`);
      if (dateTo) query = query.lte(cfg.dateCol, `${dateTo}T23:59:59`);
      const q = searchQuery.trim().toLowerCase();
      if (q) query = query.or(cfg.search(q));

      const from = (targetPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, count, error } = await query.order(cfg.order, { ascending: false }).range(from, to);
      if (error) throw error;
      setRecords({ data: data || [], total: count || 0 });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load records');
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchRecords(page), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, oppFilter, statusFilter, searchQuery, dateFrom, dateTo, page]);

  const resetPage = () => setPage(1);

  // ---- CSV export (full fetch of filtered rows on demand) ----
  const exportCSV = async () => {
    const cfg = TAB_CONFIG[tab];
    const supabase = createClient();
    setExporting(true);
    try {
      let query = supabase.from(cfg.table).select(cfg.select);
      if (oppFilter !== 'all') query = query.eq('opportunity_id', oppFilter);
      if (statusFilter !== 'all') query = query.eq(cfg.statusCol, statusFilter);
      if (dateFrom) query = query.gte(cfg.dateCol, `${dateFrom}T00:00:00`);
      if (dateTo) query = query.lte(cfg.dateCol, `${dateTo}T23:59:59`);
      const q = searchQuery.trim().toLowerCase();
      if (q) query = query.or(cfg.search(q));

      const { data, error } = await query.order(cfg.order, { ascending: false });
      if (error) throw error;
      const rows = (data || []) as unknown as Record<string, unknown>[];
      const stamp = new Date().toISOString().slice(0, 10);

      if (tab === 'applications') {
        downloadCSV(`applications-${stamp}.csv`, toCSV(rows, [
          { key: 'full_name', label: 'Full Name' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          { key: 'college', label: 'College' },
          { key: 'branch', label: 'Branch' },
          { key: 'year', label: 'Year' },
          { key: 'internship_track', label: 'Track' },
          { key: 'application_status', label: 'Application Status' },
          { key: 'payment_status', label: 'Payment Status' },
          { key: 'created_at', label: 'Applied On' },
          { key: 'opportunity.title', label: 'Programme' },
        ]));
      } else if (tab === 'students') {
        downloadCSV(`students-${stamp}.csv`, toCSV(rows, [
          { key: 'student_code', label: 'Student Code' },
          { key: 'application.full_name', label: 'Full Name' },
          { key: 'application.email', label: 'Email' },
          { key: 'application.college', label: 'College' },
          { key: 'application.branch', label: 'Branch' },
          { key: 'opportunity.title', label: 'Programme' },
          { key: 'batch_name', label: 'Batch' },
          { key: 'stage', label: 'Stage' },
          { key: 'attendance_percentage', label: 'Attendance %' },
          { key: 'project_score', label: 'Project Score' },
          { key: 'project_submitted', label: 'Project Submitted' },
          { key: 'certificate_eligible', label: 'Certificate Eligible' },
          { key: 'certificate_type', label: 'Certificate Type' },
          { key: 'joined_at', label: 'Joined On' },
        ]));
      } else {
        downloadCSV(`certificates-${stamp}.csv`, toCSV(rows, [
          { key: 'certificate_id', label: 'Certificate ID' },
          { key: 'student.student_code', label: 'Student Code' },
          { key: 'student.application.full_name', label: 'Student Name' },
          { key: 'opportunity.title', label: 'Programme' },
          { key: 'certificate_type', label: 'Certificate Type' },
          { key: 'status', label: 'Status' },
          { key: 'issued_at', label: 'Issued On' },
          { key: 'verification_url', label: 'Verification URL' },
        ]));
      }
      toast.success(`Exported ${rows.length} records`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-orange border-r-2" />
        <p className="text-slate-400 text-sm">Loading command center...</p>
      </div>
    );
  }

  const statusOptions = tab === 'applications'
    ? ['pending', 'reviewing', 'accepted', 'rejected', 'waitlisted']
    : tab === 'students'
      ? ['accepted', 'active', 'completed', 'archived']
      : ['active', 'revoked'];

  const totalPages = Math.max(1, Math.ceil(records.total / PAGE_SIZE));
  const pageStart = records.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(page * PAGE_SIZE, records.total);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-white flex items-center gap-2">
            <Zap className="text-brand-orange" size={28} /> Command Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Action-first operations. Review, onboard, grade, issue, and export — all in one place.
          </p>
        </div>
        <Link href="/admin/dashboard/opportunities">
          <Button className="gap-2"><BriefcaseBusiness size={16} /> New Programme</Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickActions.map((a) => (
          <Link key={a.label} href={a.href} className="block">
            <Card variant="glass" className="p-4 space-y-2 border border-slate-900/60 hover:border-brand-orange/30 hover:translate-y-[-1px] transition-all duration-300 h-full">
              <div className="flex items-center justify-between">
                <span className="text-brand-orange">{a.icon}</span>
                {typeof a.badge === 'number' && a.badge > 0 && (
                  <span className="rounded-full bg-brand-orange/15 text-brand-orange border border-brand-orange/20 px-1.5 py-0.5 text-[9px] font-bold">
                    {a.badge}
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-300 leading-tight">{a.label}</p>
            </Card>
          </Link>
        ))}
        <button onClick={scrollToRecords} className="block w-full text-left cursor-pointer">
          <Card variant="glass" className="p-4 space-y-2 border border-slate-900/60 hover:border-brand-teal/30 hover:translate-y-[-1px] transition-all duration-300 h-full">
            <div className="flex items-center justify-between">
              <span className="text-cyan-400"><FileDown size={16} /></span>
            </div>
            <p className="text-xs font-semibold text-slate-300 leading-tight">Export Records</p>
          </Card>
        </button>
      </div>

      {/* Attention Queue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {queue.map((item) => (
          <Card key={item.key} variant="glass" className={`p-5 border space-y-3 ${item.bg}`}>
            <div className="flex items-start justify-between">
              <span className={`${item.color}`}>{item.icon}</span>
              <span className="text-2xl font-extrabold font-display text-slate-100">{item.total}</span>
            </div>
            <p className="text-xs font-semibold text-slate-300 leading-snug">{item.label}</p>
            <div className="pt-1 space-y-1">
              {item.entries.map(([key, count]) => {
                const slug = slugForKey(key);
                return slug === 'other' ? (
                  <div key={key} className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate font-mono max-w-[150px]">Unassigned</span>
                    <span className="font-bold">{count}</span>
                  </div>
                ) : (
                  <Link key={key} href={`/admin/dashboard/programme/${slug}`} className="flex items-center justify-between text-[10px] text-slate-400 hover:text-brand-orange transition-colors group">
                    <span className="truncate font-mono max-w-[150px]">{slug.replace(/-/g, ' ')}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="font-bold">{count}</span>
                      <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </Link>
                );
              })}
              {item.entries.length === 0 && (
                <p className="text-[10px] text-slate-500">All clear — nothing needs attention.</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Records Browser */}
      <div id="records-browser" className="space-y-4 scroll-mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold font-display text-slate-100 flex items-center gap-2">
            <Filter size={16} className="text-brand-orange" /> Records Browser
          </h2>
          <Button size="sm" onClick={exportCSV} isLoading={exporting} className="gap-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 text-xs">
            <FileDown size={13} /> Export CSV ({records.total})
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap bg-slate-900 p-1 rounded-lg border border-slate-800 gap-1">
          {(['applications', 'students', 'certificates'] as RecordTab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setStatusFilter('all'); resetPage(); }}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer capitalize ${
                tab === t ? 'bg-brand-orange text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={oppFilter}
            onChange={(e) => { setOppFilter(e.target.value); resetPage(); }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Programmes</option>
            {opportunities.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none capitalize"
          >
            <option value="all">All Status</option>
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); resetPage(); }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          />
          <span className="text-slate-600 text-xs">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); resetPage(); }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          />
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); resetPage(); }}
              placeholder="Search..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-brand-orange/40"
            />
          </div>
          {(searchQuery || oppFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearchQuery(''); setOppFilter('all'); setStatusFilter('all'); setDateFrom(''); setDateTo(''); resetPage(); }}
              className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <Card variant="glass" className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            {recordsLoading && (
              <div className="flex items-center justify-center py-12 space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-brand-orange border-r-2" />
                <p className="text-slate-500 text-xs">Loading records...</p>
              </div>
            )}
            {!recordsLoading && tab === 'applications' && (
              <table className="w-full text-left text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Programme</th>
                    <th className="py-3 px-4">Track</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Applied</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {records.data.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-900/5">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{a.full_name}</div>
                        <div className="text-xs text-slate-500">{a.email}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">{a.opportunity?.title || '—'}</td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-400">{a.internship_track}</td>
                      <td className="py-3 px-4"><Badge variant={a.application_status}>{a.application_status}</Badge></td>
                      <td className="py-3 px-4 text-xs text-slate-400">{a.payment_status}</td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-mono">{new Date(a.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {records.data.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-slate-500 text-xs">No applications match the current filters.</td></tr>}
                </tbody>
              </table>
            )}

            {!recordsLoading && tab === 'students' && (
              <table className="w-full text-left text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Programme</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Attendance</th>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Cert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {records.data.map((s) => {
                    const activeCert = (s.certificates || []).find((c: any) => c.status === 'active');
                    return (
                      <tr key={s.id} className="hover:bg-slate-900/5">
                        <td className="py-3 px-4">
                          <div className="font-mono text-xs text-cyan-400 font-semibold">{s.student_code}</div>
                          <div className="font-semibold text-slate-200">{s.application?.full_name}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400">{s.opportunity?.title || '—'}</td>
                        <td className="py-3 px-4"><Badge variant={s.stage === 'completed' ? 'success' : s.stage === 'active' ? 'primary' : 'default'}>{s.stage}</Badge></td>
                        <td className="py-3 px-4 text-xs text-slate-400">{s.attendance_percentage}%</td>
                        <td className="py-3 px-4 text-xs">
                          {s.project_submitted ? <span className="text-green-400 flex items-center gap-1"><CheckCircle2 size={12} /> {s.project_score}/100</span> : <span className="text-slate-500">Pending</span>}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {activeCert ? <span className="text-green-400 flex items-center gap-1"><Award size={12} /> Issued</span> : <span className="text-slate-500">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {records.data.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-slate-500 text-xs">No students match the current filters.</td></tr>}
                </tbody>
              </table>
            )}

            {!recordsLoading && tab === 'certificates' && (
              <table className="w-full text-left text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">Certificate ID</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Programme</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Issued</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {records.data.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-900/5">
                      <td className="py-3 px-4 font-mono text-xs text-cyan-400">{c.certificate_id}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{c.student?.application?.full_name}</div>
                        <div className="text-xs text-slate-500 font-mono">{c.student?.student_code}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">{c.opportunity?.title || '—'}</td>
                      <td className="py-3 px-4 text-xs text-slate-400">{c.certificate_type}</td>
                      <td className="py-3 px-4"><Badge variant={c.status}>{c.status}</Badge></td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-mono">{new Date(c.issued_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {records.data.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-slate-500 text-xs">No certificates match the current filters.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Pagination */}
        {!recordsLoading && records.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500 font-mono">
              Showing {pageStart}–{pageEnd} of {records.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <span className="text-xs text-slate-500 font-mono">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}