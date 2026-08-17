'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import {
  BriefcaseBusiness,
  Users,
  ArrowRight,
  Inbox,
  UserCheck,
  UserPlus,
  GraduationCap,
  Archive,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProgrammesPage() {
  const [loading, setLoading] = useState(true);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');

  const fetchProgrammes = async () => {
    const supabase = createClient();
    try {
      const { data: opps } = await supabase
        .from('opportunities')
        .select('id, title, slug, status, type, starts_on, duration_label, cohort_label')
        .order('display_order', { ascending: true });

      if (opps) {
        const hydrated = await Promise.all(
          opps.map(async (opp) => {
            const [
              { count: accepted },
              { count: active },
              { count: completed },
              { count: archived },
              { count: pendingApps },
            ] = await Promise.all([
              supabase.from('students').select('*', { count: 'exact', head: true }).eq('opportunity_id', opp.id).eq('stage', 'accepted'),
              supabase.from('students').select('*', { count: 'exact', head: true }).eq('opportunity_id', opp.id).eq('stage', 'active'),
              supabase.from('students').select('*', { count: 'exact', head: true }).eq('opportunity_id', opp.id).eq('stage', 'completed'),
              supabase.from('students').select('*', { count: 'exact', head: true }).eq('opportunity_id', opp.id).eq('stage', 'archived'),
              supabase.from('applications').select('*', { count: 'exact', head: true }).eq('opportunity_id', opp.id).eq('application_status', 'pending'),
            ]);

            return {
              ...opp,
              counts: {
                accepted: accepted || 0,
                active: active || 0,
                completed: completed || 0,
                archived: archived || 0,
                pendingApps: pendingApps || 0,
              },
            };
          })
        );
        setProgrammes(hydrated);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load programmes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgrammes();
  }, []);

  const filtered = filter === 'all' ? programmes : programmes.filter(p => p.status === filter);

  const stageChips = (p: any) => [
    { label: 'Pending Apps', value: p.counts.pendingApps, icon: <Inbox size={12} />, color: 'text-amber-400' },
    { label: 'Accepted', value: p.counts.accepted, icon: <UserCheck size={12} />, color: 'text-blue-400' },
    { label: 'Active', value: p.counts.active, icon: <Users size={12} />, color: 'text-green-400' },
    { label: 'Completed', value: p.counts.completed, icon: <GraduationCap size={12} />, color: 'text-brand-orange' },
    { label: 'Archived', value: p.counts.archived, icon: <Archive size={12} />, color: 'text-slate-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-white flex items-center gap-2">
            <BriefcaseBusiness className="text-brand-orange" size={28} /> Programmes
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Every programme with its live student pipeline. Open one to manage its interns.
          </p>
        </div>
        <Link href="/admin/dashboard/opportunities">
          <Button className="gap-2"><BriefcaseBusiness size={16} /> Manage Opportunities</Button>
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'open', 'closed', 'archived'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              filter === s
                ? 'bg-brand-orange/15 text-brand-orange border-brand-orange/10 font-bold'
                : 'text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-orange border-r-2" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center" hoverEffect={false}>
          <Search size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">No programmes in this state.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((p) => (
            <Card key={p.id} variant="glass" className="p-6 flex flex-col justify-between space-y-4 border border-slate-900/60 hover:border-slate-800 transition-all hover:translate-y-[-1px] duration-300">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-100 text-base leading-tight">
                      <Link href={`/admin/dashboard/programme/${p.slug}`} className="hover:underline">
                        {p.title}
                      </Link>
                    </h4>
                    <span className="text-xs text-slate-500 font-mono mt-1 block">
                      {p.cohort_label || p.duration_label || '—'}
                    </span>
                  </div>
                  <Badge variant={p.status}>{p.status}</Badge>
                </div>

                <div className="grid grid-cols-5 gap-1.5 bg-slate-950/40 p-3 rounded-lg border border-slate-900 text-center text-xs">
                  {stageChips(p).map((c) => (
                    <div key={c.label} className="min-w-0">
                      <span className={`${c.color} block font-bold`}>{c.value}</span>
                      <span className="text-slate-500 block text-[9px] uppercase mt-0.5 leading-tight">{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link href={`/admin/dashboard/programme/${p.slug}`} className="block">
                <Button className="w-full gap-2">
                  <UserPlus size={15} /> Manage Students <ArrowRight size={14} />
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}