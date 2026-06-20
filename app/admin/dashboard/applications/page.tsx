'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { generateStudentCode, formatDate, getTrackLabel } from '@/lib/utils';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Clock,
  Download,
  Linkedin,
  Github,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ApplicationsManagement() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modals
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [remarks, setRemarks] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      let query = supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('application_status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setApplications(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filterStatus]);

  const handleStatusChange = async (appId: string, newStatus: string, remarksText?: string) => {
    const supabase = createClient();
    try {
      const updateData: any = { application_status: newStatus };
      if (remarksText !== undefined) {
        updateData.remarks = remarksText;
      }

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', appId);

      if (error) throw error;
      
      toast.success(`Application updated to ${newStatus}`);
      fetchApplications();
      if (selectedApp?.id === appId) {
        setSelectedApp((prev: any) => ({ ...prev, ...updateData }));
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const handleAcceptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    if (!batchName.trim()) {
      toast.error('Please enter a batch name');
      return;
    }

    const supabase = createClient();
    setIsAccepting(true);

    try {
      // 1. Get next student index for the student code
      const currentYear = new Date().getFullYear();
      const { count, error: countError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      const nextIndex = (count || 0) + 1;
      const studentCode = generateStudentCode(currentYear, nextIndex);

      // 2. Insert Student record
      const { error: studentError } = await supabase.from('students').insert({
        application_id: selectedApp.id,
        student_code: studentCode,
        batch_name: batchName,
      });

      if (studentError) throw studentError;

      // 3. Update application status
      await handleStatusChange(selectedApp.id, 'accepted', remarks);

      setAcceptModalOpen(false);
      setBatchName('');
      setRemarks('');
      setSelectedApp(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to accept candidate');
    } finally {
      setIsAccepting(false);
    }
  };

  const [isAccepting, setIsAccepting] = useState(false);

  // Filter local applications array based on search text
  const filteredApps = applications.filter((app) => {
    const term = search.toLowerCase();
    return (
      app.full_name.toLowerCase().includes(term) ||
      app.email.toLowerCase().includes(term) ||
      app.college.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-display tracking-tight text-white">
          Manage Applications
        </h1>
        <p className="text-slate-400 text-sm">
          Review, accept, or reject candidate registrations for internship tracks.
        </p>
      </div>

      {/* Filters & Actions bar */}
      <Card variant="solid" className="p-4 bg-slate-900 border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
          <Input
            placeholder="Search candidate or college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 py-2"
          />
        </div>

        {/* Filter status */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter size={16} className="text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="waitlisted">Waitlisted</option>
          </select>
        </div>
      </Card>

      {/* Applications Table */}
      <Card variant="glass" className="overflow-hidden border-slate-900 p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-orange border-r-2"></div>
            <p className="text-slate-450 text-xs">Querying candidates...</p>
          </div>
        ) : filteredApps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/40 border-b border-slate-900 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">College</th>
                  <th className="px-6 py-4">Program Track</th>
                  <th className="px-6 py-4">Submitted Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-900/10">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200">{app.full_name}</span>
                        <span className="text-xs text-slate-500">{app.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-[180px] truncate">{app.college}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] ${
                        app.internship_track === 'web-development'
                          ? 'bg-cyan-500/5 text-cyan-400 border-cyan-500/10'
                          : 'bg-brand-orange/5 text-brand-orange border-brand-orange/10'
                      }`}>
                        {app.internship_track === 'web-development' ? 'Web Dev' : 'Fullstack AI'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{formatDate(app.created_at)}</td>
                    <td className="px-6 py-4">
                      <Badge variant={app.application_status}>{app.application_status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedApp(app)}
                        className="text-xs text-slate-450 hover:text-white hover:bg-slate-900 p-2 rounded-lg"
                      >
                        <Eye size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">
            No candidates matched search or filter rules.
          </div>
        )}
      </Card>

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title="Application Details"
      >
        {selectedApp && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-100">{selectedApp.full_name}</h3>
                <p className="text-slate-400 text-sm">{selectedApp.email} â€¢ {selectedApp.phone}</p>
              </div>
              <Badge variant={selectedApp.application_status}>{selectedApp.application_status}</Badge>
            </div>

            {/* Program Track */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex items-center justify-between text-sm">
              <span className="text-slate-400 font-medium">Selected Program Track:</span>
              <span className="font-semibold text-slate-200">{getTrackLabel(selectedApp.internship_track)}</span>
            </div>

            {/* Profile fields grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t border-slate-900 pt-4">
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">College / University</span>
                <span className="text-slate-200 mt-1 block">{selectedApp.college}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Branch & Year</span>
                <span className="text-slate-200 mt-1 block">{selectedApp.branch} (Year {selectedApp.year})</span>
              </div>
              {selectedApp.whatsapp && (
                <div>
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">WhatsApp</span>
                  <span className="text-slate-200 mt-1 block">{selectedApp.whatsapp}</span>
                </div>
              )}
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Profiles & Resumes</span>
                <div className="flex gap-2.5 mt-2">
                  {selectedApp.linkedin_url && (
                    <a href={selectedApp.linkedin_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-brand-blue p-2 bg-slate-900 rounded border border-slate-850">
                      <Linkedin size={16} />
                    </a>
                  )}
                  {selectedApp.github_url && (
                    <a href={selectedApp.github_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-brand-teal p-2 bg-slate-900 rounded border border-slate-850">
                      <Github size={16} />
                    </a>
                  )}
                  {selectedApp.resume_url && (
                    <a
                      href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resumes/${selectedApp.resume_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-xs font-semibold hover:bg-slate-850 rounded border border-slate-850 text-slate-300"
                    >
                      <Download size={12} /> Resume
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Remarks and Action panel */}
            <div className="border-t border-slate-900 pt-4 space-y-4">
              <div>
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-2">Administrative Remarks</label>
                <textarea
                  value={selectedApp.remarks || ''}
                  onChange={(e) => setSelectedApp({ ...selectedApp, remarks: e.target.value })}
                  placeholder="Enter interviewer notes or checklist comments..."
                  className="w-full h-20 px-3 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-650 focus:outline-none focus:border-brand-teal/40"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5 justify-between items-center bg-slate-900/20 p-3 rounded-lg border border-slate-900">
                <span className="text-xs text-slate-400 font-medium">Update Status:</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(selectedApp.id, 'reviewing', selectedApp.remarks)}
                    className="gap-1 text-xs"
                  >
                    <Clock size={12} /> Reviewing
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(selectedApp.id, 'rejected', selectedApp.remarks)}
                    className="gap-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/5 border-transparent hover:border-red-500/10"
                  >
                    <X size={12} /> Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setAcceptModalOpen(true)}
                    className="gap-1 text-xs bg-brand-orange hover:bg-brand-orange/95"
                  >
                    <Check size={12} /> Accept & Enroll
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Accept and Enroll Modal */}
      <Modal
        isOpen={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        title="Enroll Student"
      >
        {selectedApp && (
          <form onSubmit={handleAcceptSubmit} className="space-y-4">
            <div className="p-3 bg-brand-orange/5 border border-brand-orange/15 rounded-lg text-xs text-brand-orange leading-relaxed">
              Accepting <span className="font-bold">{selectedApp.full_name}</span> will automatically generate a custom student code and enroll them into the specified batch.
            </div>

            <Input
              label="Batch Name"
              placeholder="e.g. Winter 2026 Batch"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              required
            />

            <div className="pt-2 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAcceptModalOpen(false)}
                disabled={isAccepting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isAccepting} className="bg-brand-orange">
                Enroll & Accept
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}


