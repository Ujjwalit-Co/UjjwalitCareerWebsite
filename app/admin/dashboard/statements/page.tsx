'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { PlaceholderGuide } from '@/components/admin/PlaceholderGuide';
import {
  TextQuote,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Statement {
  id: string;
  label: string;
  body_markdown: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function StatementsManagementPage() {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit form
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [bodyMarkdown, setBodyMarkdown] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchStatements = async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('achievement_statements')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setStatements(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load statements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setLabel('');
    setBodyMarkdown('');
    setFormOpen(true);
  };

  const openEdit = (stmt: Statement) => {
    setEditingId(stmt.id);
    setLabel(stmt.label);
    setBodyMarkdown(stmt.body_markdown);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setLabel('');
    setBodyMarkdown('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      toast.error('Please enter a label');
      return;
    }
    if (!bodyMarkdown.trim()) {
      toast.error('Please enter the statement text');
      return;
    }

    const supabase = createClient();
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('achievement_statements')
          .update({
            label: label.trim(),
            body_markdown: bodyMarkdown.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Statement updated');
      } else {
        const { error } = await supabase.from('achievement_statements').insert({
          label: label.trim(),
          body_markdown: bodyMarkdown.trim(),
          display_order: statements.length > 0 ? statements[statements.length - 1].display_order + 10 : 10,
          is_active: true,
        });
        if (error) throw error;
        toast.success('Statement added');
      }
      closeForm();
      fetchStatements();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save statement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (stmt: Statement) => {
    const supabase = createClient();
    setDeletingId(stmt.id);
    try {
      const { error } = await supabase
        .from('achievement_statements')
        .delete()
        .eq('id', stmt.id);
      if (error) throw error;
      toast.success('Statement deleted');
      fetchStatements();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to delete statement');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (stmt: Statement) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('achievement_statements')
        .update({ is_active: !stmt.is_active, updated_at: new Date().toISOString() })
        .eq('id', stmt.id);
      if (error) throw error;
      fetchStatements();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update statement');
    }
  };

  const handleMove = async (stmt: Statement, direction: -1 | 1) => {
    const sorted = [...statements];
    const idx = sorted.findIndex((s) => s.id === stmt.id);
    const swapIdx = idx + direction;
    if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return;

    const [a, b] = [sorted[idx], sorted[swapIdx]];
    const supabase = createClient();
    try {
      const { error } = await supabase.from('achievement_statements').upsert(
        [
          { id: a.id, display_order: b.display_order },
          { id: b.id, display_order: a.display_order },
        ],
        { onConflict: 'id' }
      );
      if (error) throw error;
      fetchStatements();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to reorder statements');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-white flex items-center gap-2">
            <TextQuote size={32} className="text-brand-orange" /> Achievement Statements
          </h1>
          <p className="text-slate-400 text-sm">
            A library of skill/achievement snippets that admins toggle per student. Selected snippets are
            composed on each student&apos;s public profile.
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus size={16} /> Add Statement
        </Button>
      </div>

      {/* Add/Edit form */}
      {formOpen && (
        <Card className="p-6" hoverEffect={false}>
          <h3 className="mb-4 text-lg font-bold font-display text-white">
            {editingId ? 'Edit Statement' : 'New Statement'}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-200 block mb-1.5">Label</label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Technical Skills"
              />
              <p className="text-[10px] text-slate-500 mt-1.5">
                Short name shown as the checkbox label when selecting snippets for a student.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold text-slate-200 block">Statement (markdown)</label>
                <PlaceholderGuide
                  placeholders={[
                    { key: '{{attendance}}', description: 'Student\'s attendance % (e.g. 92)' },
                    { key: '{{batch}}', description: 'Student\'s batch name (e.g. UDP 2026)' },
                  ]}
                />
              </div>
              <textarea
                value={bodyMarkdown}
                onChange={(e) => setBodyMarkdown(e.target.value)}
                rows={4}
                placeholder={'e.g. Demonstrated strong skills in **Frontend Development** and **React**.\n\nUse {{attendance}} to inject the student\'s attendance percentage.'}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-orange resize-y font-mono text-xs"
              />
              <p className="text-[10px] text-slate-500 mt-1.5">
                Markdown supported. Hover the Keys icon to see available placeholders.
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Add Statement'}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* List */}
      <Card className="p-0 overflow-hidden" hoverEffect={false}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-blue border-r-2"></div>
          </div>
        ) : statements.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <TextQuote size={32} className="mx-auto mb-3 text-slate-600" />
            <p className="text-sm">No statements yet. Add your first snippet to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-900">
            {statements.map((stmt) => (
              <div
                key={stmt.id}
                className={`flex items-start gap-4 p-5 ${stmt.is_active ? '' : 'opacity-50'}`}
              >
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    onClick={() => handleMove(stmt, -1)}
                    disabled={statements[0]?.id === stmt.id}
                    className="text-slate-500 hover:text-slate-300 disabled:opacity-30 cursor-pointer"
                    title="Move up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => handleMove(stmt, 1)}
                    disabled={statements[statements.length - 1]?.id === stmt.id}
                    className="text-slate-500 hover:text-slate-300 disabled:opacity-30 cursor-pointer"
                    title="Move down"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-brand-blue">{stmt.label}</span>
                    {!stmt.is_active && (
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-slate-400 whitespace-pre-line">{stmt.body_markdown}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant={stmt.is_active ? 'outline' : 'primary'}
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => handleToggleActive(stmt)}
                    title={stmt.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {stmt.is_active ? <Check size={14} /> : <Eye size={14} />}
                    {stmt.is_active ? 'Active' : 'Inactive'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => openEdit(stmt)}
                  >
                    <Pencil size={14} /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs text-red-400 hover:text-red-300"
                    onClick={() => handleDelete(stmt)}
                    disabled={deletingId === stmt.id}
                  >
                    {deletingId === stmt.id ? '...' : <Trash2 size={14} />}
                    {deletingId === stmt.id ? '' : 'Delete'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
