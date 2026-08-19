'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { BarChart3, TrendingUp, Mail, Award, Users, CalendarRange, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type OppStat = {
  id: string;
  title: string;
  slug: string;
  status: string;
  applied: number;
  accepted: number;
  active: number;
  completed: number;
  completionRate: number | null;
  avgAttendance: number | null;
  acceptanceSent: number;
  onboardingSent: number;
  completionSent: number;
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [oppStats, setOppStats] = useState<OppStat[]>([]);
  const [overview, setOverview] = useState({ applied: 0, accepted: 0, active: 0, completed: 0 });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const supabase = createClient();
      try {
        const [opps, apps, students] = await Promise.all([
          supabase.from('opportunities').select('id, title, slug, status').order('display_order', { ascending: true }),
          supabase.from('applications').select('opportunity_id, application_status'),
          supabase
            .from('students')
            .select('id, opportunity_id, stage, attendance_percentage, acceptance_email_sent_at, onboarding_email_sent_at, completion_email_sent_at'),
        ]);
        if (cancelled) return;

        const appRows = apps.data || [];
        const stuRows = students.data || [];

        const oppCount = (id: string) => appRows.filter((a) => a.opportunity_id === id).length;
        const appByStatus = (id: string, status: string) =>
          appRows.filter((a) => a.opportunity_id === id && a.application_status === status).length;
        const stuByStage = (id: string, stage: string) => stuRows.filter((s) => s.opportunity_id === id && s.stage === stage).length;
        const avgAttendance = (id: string) => {
          const rows = stuRows.filter((s) => s.opportunity_id === id && s.attendance_percentage != null);
          if (rows.length === 0) return null;
          return rows.reduce((acc, s) => acc + (Number(s.attendance_percentage) || 0), 0) / rows.length;
        };
        const emailCount = (id: string, col: 'acceptance_email_sent_at' | 'onboarding_email_sent_at' | 'completion_email_sent_at') =>
          stuRows.filter((s) => s.opportunity_id === id && s[col]).length;

        const stats: OppStat[] = (opps.data || []).map((o) => {
          const applied = oppCount(o.id);
          const accepted = stuByStage(o.id, 'accepted');
          const active = stuByStage(o.id, 'active');
          const completed = stuByStage(o.id, 'completed');
          return {
            id: o.id,
            title: o.title,
            slug: o.slug,
            status: o.status,
            applied,
            accepted,
            active,
            completed,
            completionRate: applied > 0 ? Math.round((completed / applied) * 100) : null,
            avgAttendance: avgAttendance(o.id),
            acceptanceSent: emailCount(o.id, 'acceptance_email_sent_at'),
            onboardingSent: emailCount(o.id, 'onboarding_email_sent_at'),
            completionSent: emailCount(o.id, 'completion_email_sent_at'),
          };
        });

        setOppStats(stats);
        setOverview({
          applied: appRows.length,
          accepted: stuRows.filter((s) => s.stage === 'accepted').length,
          active: stuRows.filter((s) => s.stage === 'active').length,
          completed: stuRows.filter((s) => s.stage === 'completed').length,
        });
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(() => {
    const sum = (f: (o: OppStat) => number) => oppStats.reduce((a, o) => a + (f(o) || 0), 0);
    const applied = sum((o) => o.applied);
    const completed = sum((o) => o.completed);
    return {
      applied,
      accepted: sum((o) => o.accepted),
      active: sum((o) => o.active),
      completed,
      completionRate: applied > 0 ? Math.round((completed / applied) * 100) : 0,
      avgAttendance:
        oppStats.length > 0 && oppStats.some((o) => o.avgAttendance != null)
          ? oppStats.reduce((a, o) => a + (o.avgAttendance || 0), 0) / oppStats.filter((o) => o.avgAttendance != null).length
          : null,
      emails: sum((o) => o.acceptanceSent) + sum((o) => o.onboardingSent) + sum((o) => o.completionSent),
    };
  }, [oppStats]);

  const summaryCards = [
    { label: 'Applications', value: totals.applied, icon: <Users size={16} />, color: 'text-blue-400' },
    { label: 'Accepted', value: totals.accepted, icon: <ArrowRight size={16} />, color: 'text-cyan-400' },
    { label: 'Active Interns', value: totals.active, icon: <TrendingUp size={16} />, color: 'text-green-400' },
    { label: 'Completed', value: totals.completed, icon: <Award size={16} />, color: 'text-brand-orange' },
    { label: 'Completion Rate', value: `${totals.completionRate}%`, icon: <BarChart3 size={16} />, color: 'text-amber-400' },
    {
      label: 'Avg Attendance',
      value: totals.avgAttendance != null ? `${Math.round(totals.avgAttendance * 10) / 10}%` : '—',
      icon: <CalendarRange size={16} />,
      color: 'text-teal-400',
    },
    { label: 'Emails Sent', value: totals.emails, icon: <Mail size={16} />, color: 'text-violet-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Program Analytics</h1>
          <p className="text-sm text-slate-400">Funnel and performance per cohort.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {summaryCards.map((c) => (
          <Card key={c.label} variant="glass" className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium">
              <span className={c.color}>{c.icon}</span>
              <span className="truncate">{c.label}</span>
            </div>
            <div className="text-2xl font-extrabold text-white">{c.value}</div>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
          <span className="animate-spin rounded-full h-6 w-6 border-t-2 border-brand-orange border-r-2 mr-3"></span>
          Loading analytics…
        </div>
      ) : oppStats.length === 0 ? (
        <Card variant="glass" className="p-12 text-center text-slate-500 text-sm">
          No programmes yet. Create an opportunity to see cohort analytics here.
        </Card>
      ) : (
        <Card variant="glass" className="p-6 space-y-4">
          <div className="border-b border-slate-900 pb-3">
            <h2 className="text-sm font-bold text-slate-200">Cohort Funnel — Applied → Accepted → Active → Completed</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 font-semibold text-[11px] uppercase tracking-wide border-b border-slate-900">
                  <th className="text-left py-2 pr-3">Programme</th>
                  <th className="text-center px-2 py-2">Applied</th>
                  <th className="text-center px-2 py-2">Accepted</th>
                  <th className="text-center px-2 py-2">Active</th>
                  <th className="text-center px-2 py-2">Completed</th>
                  <th className="text-center px-2 py-2">Completion %</th>
                  <th className="text-center px-2 py-2">Avg Attendance</th>
                  <th className="text-center px-2 py-2">Emails Sent</th>
                  <th className="text-right pl-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {oppStats.map((o) => (
                  <tr key={o.id} className="border-b border-slate-900/60 hover:bg-slate-900/40">
                    <td className="py-3 pr-3">
                      <div className="font-semibold text-slate-200">{o.title}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{o.status}</div>
                    </td>
                    <td className="text-center px-2 py-3 text-blue-400 font-semibold">{o.applied}</td>
                    <td className="text-center px-2 py-3 text-cyan-400 font-semibold">{o.accepted}</td>
                    <td className="text-center px-2 py-3 text-green-400 font-semibold">{o.active}</td>
                    <td className="text-center px-2 py-3 text-brand-orange font-semibold">{o.completed}</td>
                    <td className="text-center px-2 py-3">{o.completionRate != null ? `${o.completionRate}%` : '—'}</td>
                    <td className="text-center px-2 py-3">{o.avgAttendance != null ? `${Math.round(o.avgAttendance * 10) / 10}%` : '—'}</td>
                    <td className="text-center px-2 py-3 text-violet-400 font-medium">
                      {o.acceptanceSent + o.onboardingSent + o.completionSent}
                    </td>
                    <td className="text-right pl-3 py-3">
                      <Link
                        href={`/admin/dashboard/programme/${o.slug}`}
                        className="text-brand-orange hover:text-brand-orange/80 font-semibold text-[11px]"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 text-[11px] text-slate-500">
            Emails Sent = acceptance + onboarding + completion emails dispatched per programme (tracked on the student record).
          </div>
        </Card>
      )}
    </div>
  );
}