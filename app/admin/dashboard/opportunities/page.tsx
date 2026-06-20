'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { formatFee } from '@/lib/opportunities.shared';
import { Archive, CheckCircle2, Edit3, Plus, Save, XCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

type OpportunityRow = any;

const blankForm = {
  slug: '',
  type: 'internship',
  title: '',
  short_title: '',
  tagline: '',
  description: '',
  details_markdown: '',
  status: 'draft',
  visibility: 'public',
  price_inr: 0,
  stipend_label: 'No stipend',
  duration_label: '',
  location_label: 'Remote',
  cohort_label: '',
  apply_by: '',
  capacity: '',
  display_order: 100,
  accent: 'teal',
  features_text: '',
  outcomes_text: '',
  eligibility_text: '',
  project_links_text: '',
};

function lines(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function links(value: string) {
  return lines(value).map((line) => {
    const [label, ...urlParts] = line.split('|');
    return { label: (label || '').trim(), url: urlParts.join('|').trim() };
  }).filter((item) => item.label && item.url);
}

function toForm(row: OpportunityRow) {
  return {
    ...blankForm,
    ...row,
    price_inr: row.price_inr || 0,
    capacity: row.capacity || '',
    apply_by: row.apply_by || '',
    features_text: Array.isArray(row.features) ? row.features.join('\n') : '',
    outcomes_text: Array.isArray(row.outcomes) ? row.outcomes.join('\n') : '',
    eligibility_text: Array.isArray(row.eligibility) ? row.eligibility.join('\n') : '',
    project_links_text: Array.isArray(row.project_links) ? row.project_links.map((item: any) => `${item.label}|${item.url}`).join('\n') : '',
  };
}

export default function OpportunitiesManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<OpportunityRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(blankForm);

  const fetchRows = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('opportunities').select('*').order('display_order', { ascending: true });
    if (error) toast.error('Failed to load opportunities');
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, []);

  const updateField = (name: string, value: any) => setForm((prev: any) => ({ ...prev, [name]: value }));

  const editRow = (row: OpportunityRow) => {
    setEditingId(row.id);
    setForm(toForm(row));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(blankForm);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug || !form.title || !form.tagline || !form.description || !form.duration_label) {
      toast.error('Slug, title, tagline, description, and duration are required');
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      slug: form.slug.trim().toLowerCase(),
      type: form.type,
      title: form.title.trim(),
      short_title: form.short_title.trim() || null,
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      details_markdown: form.details_markdown.trim() || null,
      status: form.status,
      visibility: form.visibility,
      price_inr: Number(form.price_inr) || 0,
      stipend_label: form.stipend_label.trim() || 'No stipend',
      duration_label: form.duration_label.trim(),
      location_label: form.location_label.trim() || 'Remote',
      cohort_label: form.cohort_label.trim() || null,
      apply_by: form.apply_by || null,
      capacity: form.capacity ? Number(form.capacity) : null,
      display_order: Number(form.display_order) || 100,
      accent: form.accent,
      features: lines(form.features_text),
      outcomes: lines(form.outcomes_text),
      eligibility: lines(form.eligibility_text),
      project_links: links(form.project_links_text),
    };

    const result = editingId
      ? await supabase.from('opportunities').update(payload).eq('id', editingId)
      : await supabase.from('opportunities').insert(payload);

    if (result.error) toast.error(result.error.message);
    else {
      toast.success(editingId ? 'Opportunity updated' : 'Opportunity created');
      resetForm();
      fetchRows();
    }
    setSaving(false);
  };

  const setStatus = async (id: string, status: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('opportunities').update({ status }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success(`Marked ${status}`); fetchRows(); }
  };

  const deleteRow = async (id: string) => {
    const confirmDelete = window.confirm('Are you absolutely sure you want to permanently delete this opportunity? This action is irreversible.');
    if (!confirmDelete) return;

    const supabase = createClient();
    const { error } = await supabase.from('opportunities').delete().eq('id', id);

    if (error) {
      toast.error(`Delete failed: ${error.message}`);
    } else {
      toast.success('Opportunity deleted successfully');
      fetchRows();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-white">Opportunities</h1>
          <p className="text-slate-400 text-sm">Publish internships, events, and project showcases for careers.ujjwalit.co.in.</p>
        </div>
        <Button onClick={resetForm} className="gap-2"><Plus size={16} /> New item</Button>
      </div>

      <form onSubmit={save} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Slug" value={form.slug} onChange={(e) => updateField('slug', e.target.value)} placeholder="web-development-internship" />
          <Input label="Title" value={form.title} onChange={(e) => updateField('title', e.target.value)} />
          <Input label="Short title" value={form.short_title} onChange={(e) => updateField('short_title', e.target.value)} />
        </div>
        <Input label="Tagline" value={form.tagline} onChange={(e) => updateField('tagline', e.target.value)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Description" rows={4} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-teal" />
          <textarea value={form.details_markdown} onChange={(e) => updateField('details_markdown', e.target.value)} placeholder="Markdown details" rows={4} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-teal" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <select value={form.type} onChange={(e) => updateField('type', e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-3 text-slate-100"><option value="internship">Internship</option><option value="event">Event</option><option value="project">Project</option></select>
          <select value={form.status} onChange={(e) => updateField('status', e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-3 text-slate-100"><option value="draft">Draft</option><option value="open">Open</option><option value="closed">Closed</option><option value="archived">Archived</option></select>
          <select value={form.accent} onChange={(e) => updateField('accent', e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-3 text-slate-100"><option value="teal">Teal</option><option value="orange">Orange</option><option value="blue">Blue</option><option value="amber">Amber</option></select>
          <Input label="Fee INR" type="number" value={form.price_inr} onChange={(e) => updateField('price_inr', e.target.value)} />
          <Input label="Capacity" type="number" value={form.capacity} onChange={(e) => updateField('capacity', e.target.value)} />
          <Input label="Order" type="number" value={form.display_order} onChange={(e) => updateField('display_order', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input label="Duration" value={form.duration_label} onChange={(e) => updateField('duration_label', e.target.value)} />
          <Input label="Location" value={form.location_label} onChange={(e) => updateField('location_label', e.target.value)} />
          <Input label="Cohort" value={form.cohort_label} onChange={(e) => updateField('cohort_label', e.target.value)} />
          <Input label="Apply by" type="date" value={form.apply_by} onChange={(e) => updateField('apply_by', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <textarea value={form.features_text} onChange={(e) => updateField('features_text', e.target.value)} placeholder="Features, one per line" rows={5} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500" />
          <textarea value={form.outcomes_text} onChange={(e) => updateField('outcomes_text', e.target.value)} placeholder="Outcomes, one per line" rows={5} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500" />
          <textarea value={form.project_links_text} onChange={(e) => updateField('project_links_text', e.target.value)} placeholder="Links as Label|https://url" rows={5} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500" />
        </div>
        <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={resetForm}>Cancel</Button><Button type="submit" isLoading={saving} className="gap-2"><Save size={16} /> {editingId ? 'Save changes' : 'Publish item'}</Button></div>
      </form>

      <div className="rounded-xl border border-slate-900 bg-slate-950 overflow-hidden">
        {loading ? <div className="p-8 text-slate-400">Loading opportunities...</div> : rows.map((row) => (
          <div key={row.id} className="grid lg:grid-cols-[1fr_auto] gap-4 p-5 border-b border-slate-900 last:border-b-0">
            <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-extrabold text-white">{row.title}</h3><span className="text-xs rounded-full border border-slate-700 px-2 py-0.5 text-slate-300">{row.type}</span><span className="text-xs rounded-full border border-slate-700 px-2 py-0.5 text-slate-300">{row.status}</span></div><p className="mt-1 text-sm text-slate-400">/{row.slug} • {row.duration_label} • {formatFee(row.price_inr)}</p></div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => editRow(row)} className="gap-1"><Edit3 size={14} /> Edit</Button>
              <Button size="sm" variant="teal" onClick={() => setStatus(row.id, 'open')} className="gap-1"><CheckCircle2 size={14} /> Open</Button>
              <Button size="sm" variant="outline" onClick={() => setStatus(row.id, 'closed')} className="gap-1"><XCircle size={14} /> Close</Button>
              <Button size="sm" variant="ghost" onClick={() => setStatus(row.id, 'archived')} className="gap-1"><Archive size={14} /> Archive</Button>
              <Button size="sm" variant="danger" onClick={() => deleteRow(row.id)} className="gap-1"><Trash2 size={14} /> Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


