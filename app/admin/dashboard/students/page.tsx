'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { getTrackLabel } from '@/lib/utils';
import {
  Users,
  Search,
  Edit2,
  Save,
  CheckCircle,
  XCircle,
  Award,
  Mail,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentsManagement() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
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
            internship_track
          )
        `)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load student list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleEditOpen = (student: any) => {
    setEditingStudent({
      ...student,
      attendance: student.attendance_percentage || 0,
      projectSubmitted: student.project_submitted || false,
      projectScore: student.project_score || 0,
      batchName: student.batch_name || '',
      eligible: student.certificate_eligible || false,
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setIsSaving(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('students')
        .update({
          attendance_percentage: parseFloat(editingStudent.attendance),
          project_submitted: editingStudent.projectSubmitted,
          project_score: parseFloat(editingStudent.projectScore),
          batch_name: editingStudent.batchName,
          certificate_eligible: editingStudent.eligible,
        })
        .eq('id', editingStudent.id);

      if (error) throw error;

      toast.success('Student record updated successfully');
      setEditingStudent(null);
      fetchStudents();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update student');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendEmail = async (type: string) => {
    if (!editingStudent) return;
    setSendingEmail(type);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: editingStudent.id, type }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Email failed');
      toast.success(`Email dispatched: ${type}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send email');
    } finally {
      setSendingEmail(null);
    }
  };

  const filteredStudents = students.filter((student) => {
    const term = search.toLowerCase();
    const name = student.application?.full_name?.toLowerCase() || '';
    const code = student.student_code.toLowerCase();
    const college = student.application?.college?.toLowerCase() || '';
    const batch = student.batch_name.toLowerCase();

    return (
      name.includes(term) ||
      code.includes(term) ||
      college.includes(term) ||
      batch.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-display tracking-tight text-white">
          Manage Students
        </h1>
        <p className="text-slate-400 text-sm">
          Track student engagement metrics, grading scores, and certificate issuance status.
        </p>
      </div>

      {/* Controls Bar */}
      <Card variant="solid" className="p-4 bg-slate-900 border-slate-800 flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
          <Input
            placeholder="Search code, name, batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 py-2"
          />
        </div>
      </Card>

      {/* Table grid */}
      <Card variant="glass" className="overflow-hidden border-slate-900 p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-orange border-r-2"></div>
            <p className="text-slate-450 text-xs">Querying student records...</p>
          </div>
        ) : filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/40 border-b border-slate-900 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Intern</th>
                  <th className="px-6 py-4">Batch</th>
                  <th className="px-6 py-4">Attendance</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Certificate</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredStudents.map((st) => {
                  const app = st.application;
                  return (
                    <tr key={st.id} className="hover:bg-slate-900/10">
                      <td className="px-6 py-4 font-mono font-bold text-slate-200 text-xs">{st.student_code}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-200">{app?.full_name}</span>
                          <span className="text-xs text-slate-500">{getTrackLabel(app?.internship_track || '')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-medium">{st.batch_name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-850">
                            <div
                              className="bg-brand-teal h-full transition-all duration-300"
                              style={{ width: `${st.attendance_percentage}%` }}
                            />
                          </div>
                          <span className="font-semibold text-xs text-slate-300">
                            {st.attendance_percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {st.project_submitted ? (
                          <div className="flex items-center gap-1.5 text-green-400 font-medium text-xs">
                            <CheckCircle size={14} /> Submitted ({st.project_score})
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                            <XCircle size={14} /> Pending
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {st.certificate_eligible ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
                            <Award size={10} /> Eligible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-full">
                            Not Eligible
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditOpen(st)}
                          className="text-xs text-slate-450 hover:text-white hover:bg-slate-900 p-2 rounded-lg"
                        >
                          <Edit2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">
            No active students found matching criteria.
          </div>
        )}
      </Card>

      {/* Edit Student Modal */}
      <Modal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        title="Edit Student Record"
      >
        {editingStudent && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-1.5 border-b border-slate-900 pb-3 mb-2">
              <h4 className="font-bold text-slate-100">{editingStudent.application?.full_name}</h4>
              <p className="text-xs text-slate-500">
                Student Code: <span className="font-mono font-bold text-slate-350">{editingStudent.student_code}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Batch Name"
                value={editingStudent.batchName}
                onChange={(e) => setEditingStudent({ ...editingStudent, batchName: e.target.value })}
                required
              />
              <Input
                label="Attendance Percentage (%)"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={editingStudent.attendance}
                onChange={(e) => setEditingStudent({ ...editingStudent, attendance: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-900 pt-4">
              {/* Project submitted checkbox */}
              <div className="flex items-center gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-900">
                <input
                  type="checkbox"
                  id="projectSubmitted"
                  checked={editingStudent.projectSubmitted}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, projectSubmitted: e.target.checked })
                  }
                  className="h-4 w-4 bg-slate-950 border border-slate-800 rounded text-brand-teal focus:ring-brand-teal cursor-pointer"
                />
                <label htmlFor="projectSubmitted" className="text-sm font-medium text-slate-300 cursor-pointer select-none">
                  Project Submitted
                </label>
              </div>

              <Input
                label="Project Score (out of 100)"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={editingStudent.projectScore}
                disabled={!editingStudent.projectSubmitted}
                onChange={(e) => setEditingStudent({ ...editingStudent, projectScore: e.target.value })}
                required
              />
            </div>

            {/* Certificate eligibility status checkbox */}
            <div className="border-t border-slate-900 pt-4">
              <div className="flex items-center gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-900">
                <input
                  type="checkbox"
                  id="eligible"
                  checked={editingStudent.eligible}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, eligible: e.target.checked })
                  }
                  className="h-4 w-4 bg-slate-950 border border-slate-800 rounded text-brand-orange focus:ring-brand-orange cursor-pointer"
                />
                <div className="flex flex-col cursor-pointer select-none">
                  <label htmlFor="eligible" className="text-sm font-bold text-slate-200">
                    Eligible for Completion Certificate
                  </label>
                  <span className="text-[10px] text-slate-550">
                    Checking this enables certificate generation for the student under Registry page.
                  </span>
                </div>
              </div>
            </div>

            {/* Email Triggers Section */}
            <div className="border-t border-slate-900 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-3">Send Email</p>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSendEmail('acceptance')}
                  disabled={!!sendingEmail}
                  isLoading={sendingEmail === 'acceptance'}
                  className="gap-2 justify-start text-brand-orange border-brand-orange/20 hover:bg-brand-orange/5"
                >
                  <Mail size={14} /> Send Offer / Acceptance Email
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSendEmail('onboarding')}
                  disabled={!!sendingEmail}
                  isLoading={sendingEmail === 'onboarding'}
                  className="gap-2 justify-start text-brand-blue border-brand-blue/20 hover:bg-brand-blue/5"
                >
                  <FileText size={14} /> Send Onboarding Email
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSendEmail('completion')}
                  disabled={!!sendingEmail}
                  isLoading={sendingEmail === 'completion'}
                  className="gap-2 justify-start text-green-400 border-green-500/20 hover:bg-green-500/5"
                >
                  <ShieldCheck size={14} /> Send Completion Email
                </Button>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingStudent(null)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSaving} className="gap-1.5 bg-brand-orange font-bold">
                <Save size={16} /> Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

