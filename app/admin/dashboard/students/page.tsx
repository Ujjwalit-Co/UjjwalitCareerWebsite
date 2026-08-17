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
  Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function GlobalStudentsRegistry() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadStudents = async () => {
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
        `)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load students registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

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
      loadStudents();
    } catch (err) {
      toast.error('Failed to delete student');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-orange border-r-2"></div>
        <p className="text-slate-400 text-sm">Loading global student registry...</p>
      </div>
    );
  }

  // Filter students based on search query
  const filteredStudents = students.filter(s =>
    s.application?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.student_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.application?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.opportunity?.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      </div>

      {/* Registry Table */}
      <Card variant="glass" className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500 font-semibold text-xs uppercase tracking-wider pb-3">
                <th className="pb-3">Code & Intern</th>
                <th className="pb-3">Program & Cohort</th>
                <th className="pb-3">Lifecycle Stage</th>
                <th className="pb-3">Credentials</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60">
              {filteredStudents.map((s) => {
                const activeCert = s.certificates?.find((c: any) => c.status === 'active');
                return (
                  <tr key={s.id} className="hover:bg-slate-900/5">
                    <td className="py-4">
                      <span className="text-xs font-mono text-cyan-400 block font-semibold">
                        {s.student_code}
                      </span>
                      <span className="font-semibold text-slate-200 mt-0.5 block">
                        {s.application?.full_name}
                      </span>
                      <span className="text-xs text-slate-500 block">
                        {s.application?.email}
                      </span>
                    </td>
                    <td className="py-4 text-xs text-slate-300">
                      <div>{s.opportunity?.title || 'Unknown Program'}</div>
                      <div className="text-slate-500 mt-0.5 font-mono text-[10px]">
                        {s.opportunity?.cohort_label || s.batch_name}
                      </div>
                    </td>
                    <td className="py-4 text-xs">
                      <Badge variant={s.stage === 'completed' ? 'success' : s.stage === 'active' ? 'primary' : 'default'}>
                        {s.stage}
                      </Badge>
                    </td>
                    <td className="py-4 text-xs">
                      {activeCert ? (
                        <span className="text-green-400 font-semibold flex items-center gap-1.5" title={activeCert.certificate_id}>
                          <Award size={14} /> Certified
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <FileText size={14} /> No Certificate
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteStudent(s.id, s.application?.full_name)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer text-xs"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                    No matching student records found in registry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
