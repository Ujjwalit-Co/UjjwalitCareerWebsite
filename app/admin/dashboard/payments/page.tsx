'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { getTrackLabel, formatDate } from '@/lib/utils';
import {
  CreditCard,
  Search,
  Check,
  X,
  Clock,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentsManagement() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState('all');

  const fetchPayments = async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      // Query applications that have some payment activity or are accepted
      let query = supabase
        .from('applications')
        .select('*')
        .order('updated_at', { ascending: false });

      if (filterPayment !== 'all') {
        query = query.eq('payment_status', filterPayment);
      } else {
        // Show everything except unpaid applications that haven't been accepted yet
        // or just show all applications to be safe
      }

      const { data, error } = await query;
      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load payment tracking records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filterPayment]);

  const handleApprovePayment = async (appId: string) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('applications')
        .update({ payment_status: 'paid' })
        .eq('id', appId);

      if (error) throw error;
      toast.success('Payment approved and marked as Paid');
      fetchPayments();
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve payment');
    }
  };

  const handleRejectPayment = async (appId: string) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('applications')
        .update({ payment_status: 'unpaid', payment_tx_id: null })
        .eq('id', appId);

      if (error) throw error;
      toast.success('Payment rejected');
      fetchPayments();
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject payment');
    }
  };

  const filteredPayments = payments.filter((app) => {
    const term = search.toLowerCase();
    const name = app.full_name.toLowerCase();
    const tx = (app.payment_tx_id || '').toLowerCase();
    const email = app.email.toLowerCase();

    return name.includes(term) || tx.includes(term) || email.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-display tracking-tight text-white">
          Payment Verification
        </h1>
        <p className="text-slate-400 text-sm">
          Manually review UPI/Bank transaction IDs submitted by accepted candidates to confirm enrollments.
        </p>
      </div>

      {/* Controls Bar */}
      <Card variant="solid" className="p-4 bg-slate-900 border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
          <Input
            placeholder="Search candidate, transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 py-2"
          />
        </div>

        {/* Filter status */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-sm text-slate-450 shrink-0">Payment:</span>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="all">All Payments</option>
            <option value="pending">Pending Verification</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </Card>

      {/* Table grid */}
      <Card variant="glass" className="overflow-hidden border-slate-900 p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-orange border-r-2"></div>
            <p className="text-slate-450 text-xs">Querying transaction log...</p>
          </div>
        ) : filteredPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/40 border-b border-slate-900 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Track</th>
                  <th className="px-6 py-4">Fee Amount</th>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredPayments.map((app) => {
                  const isWeb = app.internship_track === 'web-development';
                  const amount = isWeb ? 'â‚¹299' : 'â‚¹499';
                  
                  return (
                    <tr key={app.id} className="hover:bg-slate-900/10">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-200">{app.full_name}</span>
                          <span className="text-xs text-slate-500">{app.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] ${
                          isWeb
                            ? 'bg-cyan-500/5 text-cyan-400 border-cyan-500/10'
                            : 'bg-brand-orange/5 text-brand-orange border-brand-orange/10'
                        }`}>
                          {isWeb ? 'Web Dev' : 'Fullstack AI'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-200 font-bold">{amount}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">
                        {app.payment_tx_id ? (
                          <span className="bg-slate-900 border border-slate-850 px-2 py-1 rounded text-slate-350 select-all">
                            {app.payment_tx_id}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic">No TX ID submitted</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          app.payment_status === 'paid'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : app.payment_status === 'pending'
                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                            : 'bg-slate-900 text-slate-500 border-slate-850'
                        }`}>
                          {app.payment_status === 'paid' ? (
                            <>
                              <ShieldCheck size={12} /> Approved
                            </>
                          ) : app.payment_status === 'pending' ? (
                            <>
                              <Clock size={12} /> Pending Verification
                            </>
                          ) : (
                            'Unpaid'
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {app.payment_status === 'pending' && (
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectPayment(app.id)}
                              className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/5 p-2"
                              title="Reject Transaction ID"
                            >
                              <X size={14} />
                            </Button>
                            <Button
                              variant="teal"
                              size="sm"
                              onClick={() => handleApprovePayment(app.id)}
                              className="text-xs text-slate-950 font-bold p-2"
                              title="Approve & Mark Paid"
                            >
                              <Check size={14} />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">
            No payments matched selected filters.
          </div>
        )}
      </Card>
    </div>
  );
}

