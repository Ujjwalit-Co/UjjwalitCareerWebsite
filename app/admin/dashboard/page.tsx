'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import {
  FileSpreadsheet,
  Users,
  Award,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Clock,
  BookOpen,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { getTrackLabel, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function AdminOverviewDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApps: 0,
    pendingApps: 0,
    activeStudents: 0,
    issuedCerts: 0,
  });
  const [recentApps, setRecentApps] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const supabase = createClient();
      try {
        // Fetch Counts
        const [
          { count: totalApps },
          { count: pendingApps },
          { count: activeStudents },
          { count: issuedCerts },
        ] = await Promise.all([
          supabase.from('applications').select('*', { count: 'exact', head: true }),
          supabase.from('applications').select('*', { count: 'exact', head: true }).eq('application_status', 'pending'),
          supabase.from('students').select('*', { count: 'exact', head: true }),
          supabase.from('certificates').select('*', { count: 'exact', head: true }),
        ]);

        setStats({
          totalApps: totalApps || 0,
          pendingApps: pendingApps || 0,
          activeStudents: activeStudents || 0,
          issuedCerts: issuedCerts || 0,
        });

        // Fetch 5 Recent Applications
        const { data: apps } = await supabase
          .from('applications')
          .select('id, full_name, college, internship_track, application_status, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentApps(apps || []);
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-orange border-r-2"></div>
        <p className="text-slate-400 text-sm">Compiling overview metrics...</p>
      </div>
    );
  }

  const metricCards = [
    {
      name: 'Total Applications',
      value: stats.totalApps,
      icon: <FileSpreadsheet className="text-blue-400" size={24} />,
      bg: 'bg-blue-500/10 border-blue-500/15',
    },
    {
      name: 'Pending Applications',
      value: stats.pendingApps,
      icon: <Clock className="text-yellow-400" size={24} />,
      bg: 'bg-yellow-500/10 border-yellow-500/15',
    },
    {
      name: 'Active Interns',
      value: stats.activeStudents,
      icon: <Users className="text-green-400" size={24} />,
      bg: 'bg-green-500/10 border-green-500/15',
    },
    {
      name: 'Certificates Issued',
      value: stats.issuedCerts,
      icon: <Award className="text-brand-orange" size={24} />,
      bg: 'bg-brand-orange/10 border-brand-orange/15',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-white">
            Dashboard
          </h1>
          <p className="text-slate-400 text-sm">
            Operational snapshot of internship programs and certificate registries.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card) => (
          <Card key={card.name} variant="solid" className={`${card.bg} border p-6 flex items-center justify-between`}>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {card.name}
              </span>
              <p className="text-3xl font-bold font-display text-slate-100">{card.value}</p>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl">{card.icon}</div>
          </Card>
        ))}
      </div>

      {/* Detailed panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Applications list */}
        <Card variant="glass" className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-900 pb-4">
            <h3 className="text-lg font-bold font-display text-slate-100 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-orange" /> Recent Applications
            </h3>
            <Link href="/admin/dashboard/applications">
              <Button variant="ghost" size="sm" className="text-xs text-brand-orange hover:text-brand-orange/80 gap-1 pr-0">
                View All <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 font-semibold text-xs uppercase tracking-wider pb-3">
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">College</th>
                  <th className="pb-3">Track</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {recentApps.length > 0 ? (
                  recentApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-900/10">
                      <td className="py-3.5 font-medium text-slate-200">{app.full_name}</td>
                      <td className="py-3.5 text-slate-400 max-w-[150px] truncate">{app.college}</td>
                      <td className="py-3.5 text-xs">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] ${
                          app.internship_track === 'web-development'
                            ? 'bg-cyan-500/5 text-cyan-400 border-cyan-500/10'
                            : 'bg-brand-orange/5 text-brand-orange border-brand-orange/10'
                        }`}>
                          {app.internship_track === 'web-development' ? 'Web Dev' : 'Fullstack AI'}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <Badge variant={app.application_status}>
                          {app.application_status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick action items */}
        <Card variant="glass" className="space-y-6">
          <div className="border-b border-slate-900 pb-4">
            <h3 className="text-lg font-bold font-display text-slate-100 flex items-center gap-2">
              <AlertCircle size={18} className="text-brand-orange" /> Action Items
            </h3>
          </div>
          <div className="space-y-4 text-sm">
            {stats.pendingApps > 0 ? (
              <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-4 flex gap-3 items-start">
                <Clock className="text-yellow-400 mt-0.5 flex-shrink-0" size={16} />
                <div>
                  <h4 className="font-semibold text-slate-200">Review Applications</h4>
                  <p className="text-slate-400 text-xs mt-1">
                    There are {stats.pendingApps} pending candidate profiles awaiting verification & review.
                  </p>
                  <Link href="/admin/dashboard/applications" className="inline-block text-xs font-semibold text-yellow-400 hover:underline mt-2">
                    Start Reviewing
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-xs text-center py-6">All caught up! No critical pending items.</p>
            )}
          </div>
        </Card>
      </div>

      {/* UDP Portal Operator Guide */}
      <Card variant="glass" className="p-8 border-slate-800 bg-slate-950/40 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-900 pb-4">
          <div className="h-10 w-10 bg-brand-orange/10 border border-brand-orange/20 text-brand-orange rounded-xl flex items-center justify-center shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold font-display text-white">UDP Portal Operator Guide</h3>
            <p className="text-slate-400 text-xs mt-0.5">Instructions and system design highlights for portal administrators.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-300">
          {/* Guide Item 1 */}
          <div className="space-y-3 bg-slate-950/60 p-5 rounded-xl border border-slate-900">
            <div className="flex items-center gap-2 text-brand-orange font-bold">
              <Award size={16} />
              <span>1. Certificate Customization</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use the <strong>Design Template</strong> canvas under the Certificates tab to position text items and QR security keys. 
              The layout is scaled to standard A4 landscape points (841.89 x 595.28 pt) at runtime.
            </p>
            <ul className="text-[11px] text-slate-500 space-y-1 list-disc pl-4 leading-normal">
              <li>Upload background templates directly to the Supabase templates bucket.</li>
              <li>Select Google Fonts (Montserrat, Inter, Great Vibes, etc.) for names.</li>
              <li>Link template configurations to specific job/internship listings.</li>
            </ul>
          </div>

          {/* Guide Item 2 */}
          <div className="space-y-3 bg-slate-950/60 p-5 rounded-xl border border-slate-900">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <HelpCircle size={16} />
              <span>2. Trust & Cryptographic Hashes</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              When a certificate is issued, the system generates a secure URL pointing to the verification subdomain.
            </p>
            <ul className="text-[11px] text-slate-500 space-y-1 list-disc pl-4 leading-normal">
              <li>ID format: <code>UJ-[TrackCode]-[Year]-[Index]</code> (e.g. UJ-WD-2026-004).</li>
              <li>Every ID maps to a unique cryptographic sha256-equivalent verification hash.</li>
              <li>Any database edits or status modifications (e.g., revoking a certificate due to audit failures) update the live check immediately.</li>
            </ul>
          </div>

          {/* Guide Item 3 */}
          <div className="space-y-3 bg-slate-950/60 p-5 rounded-xl border border-slate-900">
            <div className="flex items-center gap-2 text-brand-blue font-bold">
              <FileText size={16} />
              <span>3. Candidate Lifecycle & Documents</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Review and manage incoming application profiles. Mark candidate records as certificate-eligible once graduation criteria are satisfied.
            </p>
            <ul className="text-[11px] text-slate-500 space-y-1 list-disc pl-4 leading-normal">
              <li>Click <strong>Issue Certificate</strong> in the registry to instantly generate the PDF.</li>
              <li>Generate offer/acceptance letters, LORs, and onboarding info via the Document Generator.</li>
              <li>Manage public job openings, details, location mode, and price points.</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}


