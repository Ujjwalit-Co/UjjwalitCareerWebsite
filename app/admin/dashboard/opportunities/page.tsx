'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { type Opportunity, formatFee } from '@/lib/opportunities.shared';
import { OpportunityCardPreview } from '@/components/admin/OpportunityCardPreview';
import { OpportunityPagePreview } from '@/components/admin/OpportunityPagePreview';
import { Archive, CheckCircle2, Edit3, FileText, LayoutGrid, Plus, Save, XCircle, Trash2, ClipboardList } from 'lucide-react';
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

const TABS = [
  { key: 'all', label: 'All', icon: LayoutGrid },
  { key: 'open', label: 'Active', icon: CheckCircle2 },
  { key: 'draft', label: 'Drafts', icon: FileText },
  { key: 'closed', label: 'Closed', icon: XCircle },
  { key: 'archived', label: 'Archived', icon: Archive },
] as const;

type TabKey = typeof TABS[number]['key'];

const SECTION_META: Record<string, { title: string; hint: string }> = {
  open: { title: 'Active Programs', hint: 'Live opportunities published on careers.ujjwalit.co.in under Open Programs.' },
  draft: { title: 'Drafts', hint: 'In progress and hidden from the public site until set to Open.' },
  closed: { title: 'Closed Programs', hint: 'Applications stopped. Still visible on the Previous Programs grid.' },
  archived: { title: 'Archived', hint: 'Hidden from the public site entirely.' },
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

function formToOpportunity(form: any, id: string | null): Opportunity {
  return {
    id: id || 'preview',
    slug: form.slug || 'preview-slug',
    type: form.type,
    title: form.title || 'Untitled Opportunity',
    short_title: form.short_title || null,
    tagline: form.tagline || '',
    description: form.description || '',
    details_markdown: form.details_markdown || null,
    status: form.status,
    visibility: form.visibility,
    price_inr: Number(form.price_inr) || 0,
    stipend_label: form.stipend_label || 'No stipend',
    duration_label: form.duration_label || '',
    location_label: form.location_label || 'Remote',
    cohort_label: form.cohort_label || null,
    starts_on: null,
    ends_on: null,
    apply_by: form.apply_by || null,
    capacity: form.capacity ? Number(form.capacity) : null,
    display_order: Number(form.display_order) || 100,
    accent: form.accent,
    cover_image_url: null,
    features: lines(form.features_text),
    outcomes: lines(form.outcomes_text),
    eligibility: lines(form.eligibility_text),
    project_links: links(form.project_links_text),
  };
}

export default function OpportunitiesManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<OpportunityRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(blankForm);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [previewTab, setPreviewTab] = useState<'card' | 'page'>('card');

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

    // Validate slug uniqueness on creation
    if (!editingId) {
      const { data: existing } = await supabase
        .from('opportunities')
        .select('id, title')
        .eq('slug', payload.slug)
        .maybeSingle();

      if (existing) {
        toast.error(`Slug "${payload.slug}" is already used by "${existing.title}". Choose a unique slug.`);
        setSaving(false);
        return;
      }
    }

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

  const counts = {
    open: rows.filter((r) => r.status === 'open').length,
    draft: rows.filter((r) => r.status === 'draft').length,
    closed: rows.filter((r) => r.status === 'closed').length,
    archived: rows.filter((r) => r.status === 'archived').length,
  };

  const visibleGroups = (activeTab === 'all' ? ['open', 'draft', 'closed', 'archived'] : [activeTab]).filter(
    (key) => key !== 'all'
  );

  const previewOpportunity = formToOpportunity(form, editingId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-white">Opportunities</h1>
          <p className="text-slate-400 text-sm">Publish internships, events, and project showcases for careers.ujjwalit.co.in.</p>
        </div>
        <Button onClick={resetForm} className="gap-2 bg-brand-orange text-slate-950 font-bold hover:bg-brand-orange/90"><Plus size={16} /> New item</Button>
      </div>

      {/* Status summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TABS.filter((t) => t.key !== 'all').map((tab) => {
          const Icon = tab.icon;
          const count = counts[tab.key as keyof typeof counts];
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(active ? 'all' : tab.key)}
              className={`cursor-pointer rounded-xl border p-4 text-left transition-all ${
                active
                  ? 'border-brand-orange/50 bg-brand-orange/10'
                  : 'border-slate-900 bg-slate-950/40 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg border ${active ? 'border-brand-orange/40 bg-brand-orange/10 text-brand-orange' : 'border-slate-800 text-slate-400'}`}>
                  <Icon size={15} />
                </span>
                <span className={`text-2xl font-extrabold ${active ? 'text-brand-orange' : 'text-white'}`}>{count}</span>
              </div>
              <p className={`mt-2 text-xs font-semibold uppercase tracking-wider ${active ? 'text-brand-orange' : 'text-slate-400'}`}>{tab.label}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8">
        {/* Creation/Edit Form */}
        <form onSubmit={save} className="rounded-xl border border-slate-900 bg-slate-950/40 p-6 space-y-6">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-slate-900 pb-2">
            {editingId ? 'Edit Program Details' : 'Create New Program'}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Unique Slug / URL Path *</label>
                <Input value={form.slug} onChange={(e) => updateField('slug', e.target.value)} placeholder="e.g. web-development-internship" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Program Title *</label>
                <Input value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="e.g. Fullstack AI Development" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Short Title (Dashboard label)</label>
                <Input value={form.short_title} onChange={(e) => updateField('short_title', e.target.value)} placeholder="e.g. AI-Web" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Short tagline *</label>
                <Input value={form.tagline} onChange={(e) => updateField('tagline', e.target.value)} placeholder="e.g. Build generative AI systems" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Short Description</label>
                <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Keep it short (1-2 sentences)" rows={3} className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-orange/40 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 block">Detailed Description (Markdown)</label>
                <textarea value={form.details_markdown} onChange={(e) => updateField('details_markdown', e.target.value)} placeholder="Full syllabus details, requirements, etc." rows={3} className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-orange/40 text-xs font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Type</label>
                <select value={form.type} onChange={(e) => updateField('type', e.target.value)} className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-xs text-slate-100">
                  <option value="internship">Internship</option>
                  <option value="event">Event</option>
                  <option value="project">Project</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Status</label>
                <select value={form.status} onChange={(e) => updateField('status', e.target.value)} className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-xs text-slate-100">
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Accent Color</label>
                <select value={form.accent} onChange={(e) => updateField('accent', e.target.value)} className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-xs text-slate-100">
                  <option value="teal">Teal</option>
                  <option value="orange">Orange</option>
                  <option value="blue">Blue</option>
                  <option value="amber">Amber</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Enrollment Fee *</label>
                <Input type="number" value={form.price_inr} onChange={(e) => updateField('price_inr', e.target.value)} placeholder="0 for Free" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Duration *</label>
                <Input value={form.duration_label} onChange={(e) => updateField('duration_label', e.target.value)} placeholder="e.g. 6 Weeks" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Cohort Batch Name</label>
                <Input value={form.cohort_label} onChange={(e) => updateField('cohort_label', e.target.value)} placeholder="e.g. Cohort AI-07" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Location Type</label>
                <Input value={form.location_label} onChange={(e) => updateField('location_label', e.target.value)} placeholder="Remote / Onsite" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Apply By Deadline</label>
                <Input type="date" value={form.apply_by} onChange={(e) => updateField('apply_by', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Key Features (one per line)</label>
                <textarea value={form.features_text} onChange={(e) => updateField('features_text', e.target.value)} placeholder="e.g. Real-world projects&#10;Industry mentor guidance" rows={4} className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-lg text-slate-100 placeholder-slate-600 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Learning Outcomes (one per line)</label>
                <textarea value={form.outcomes_text} onChange={(e) => updateField('outcomes_text', e.target.value)} placeholder="e.g. Build custom LLM agents&#10;Design clean database schemas" rows={4} className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-lg text-slate-100 placeholder-slate-600 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Project Links (Label|URL)</label>
                <textarea value={form.project_links_text} onChange={(e) => updateField('project_links_text', e.target.value)} placeholder="e.g. GitHub|https://github.com/..." rows={4} className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-lg text-slate-100 placeholder-slate-600 text-xs" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-900 pt-4">
            <Button type="button" variant="outline" onClick={resetForm} className="text-xs">Cancel</Button>
            <Button type="submit" isLoading={saving} className="bg-brand-orange text-slate-950 font-bold hover:bg-brand-orange/90 text-xs gap-1.5">
              <Save size={13} /> {editingId ? 'Save Changes' : 'Publish Program'}
            </Button>
          </div>
        </form>

        {/* Live Preview Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <ClipboardList size={14} /> Real-time Preview
            </h3>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-950/40 overflow-hidden">
            {/* Preview tabs */}
            <div className="flex items-center gap-1 border-b border-slate-900 px-3 py-2">
              {(['card', 'page'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPreviewTab(tab)}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                    previewTab === tab
                      ? 'bg-brand-orange/15 text-brand-orange border border-brand-orange/40'
                      : 'text-slate-400 border border-transparent hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  {tab === 'card' ? 'Card Preview' : 'Full Page Preview'}
                </button>
              ))}
              <span className="ml-auto font-mono text-[10px] text-slate-600">careers.ujjwalit.co.in</span>
            </div>

            {/* Browser frame */}
            <div className="p-3">
              <div className="rounded-lg border border-slate-800 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/60 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                  <span className="ml-2 flex-1 truncate rounded-md bg-slate-800 px-3 py-1 font-mono text-[10px] text-slate-500">
                    careers.ujjwalit.co.in/careers/opportunities/{form.slug || 'your-slug'}
                  </span>
                </div>
                <div className="bg-brand-bg max-h-[560px] overflow-y-auto p-4">
                  {previewTab === 'card'
                    ? <OpportunityCardPreview opportunity={previewOpportunity} />
                    : <OpportunityPagePreview opportunity={previewOpportunity} />}
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-600 leading-relaxed px-1">
            Preview updates live as you type. Card matches the homepage; page matches the detail page at /careers/opportunities/{form.slug || '...'}.
          </p>
        </div>
      </div>

      {/* Status tabs for list */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-900 bg-slate-950/40 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count = tab.key === 'all' ? rows.length : counts[tab.key as keyof typeof counts];
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`cursor-pointer inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                active ? 'bg-brand-orange/15 text-brand-orange border border-brand-orange/40' : 'text-slate-400 border border-transparent hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Icon size={13} /> {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${active ? 'bg-brand-orange/20' : 'bg-slate-900 text-slate-500'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grouped list sections */}
      <div className="space-y-6">
        {loading ? (
          <div className="rounded-xl border border-slate-900 bg-slate-950 p-8 text-slate-400">Loading opportunities...</div>
        ) : (
          visibleGroups.map((key) => {
            const meta = SECTION_META[key];
            const group = rows.filter((r) => r.status === key);
            return (
              <div key={key} className="rounded-xl border border-slate-900 bg-slate-950 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 px-5 py-4 bg-slate-950/60">
                  <div>
                    <h3 className="font-extrabold text-white flex items-center gap-2">
                      {meta.title}
                      <span className="rounded-full border border-slate-700 px-2 py-0.5 font-mono text-[10px] text-slate-400">{group.length}</span>
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">{meta.hint}</p>
                  </div>
                </div>
                {group.length === 0 ? (
                  <div className="p-5 text-sm text-slate-500">No {meta.title.toLowerCase()} right now.</div>
                ) : (
                  group.map((row) => (
                    <div key={row.id} className="grid lg:grid-cols-[1fr_auto] gap-4 p-5 border-b border-slate-900 last:border-b-0">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-white">{row.title}</h3>
                          <span className="text-xs rounded-full border border-slate-700 px-2 py-0.5 text-slate-300">{row.type}</span>
                          <span className="text-xs rounded-full border border-slate-700 px-2 py-0.5 text-slate-300">{row.status}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">/{row.slug} • {row.duration_label} • {formatFee(row.price_inr)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => editRow(row)} className="gap-1"><Edit3 size={14} /> Edit</Button>
                        {row.status !== 'open' && (
                          <Button size="sm" variant="teal" onClick={() => setStatus(row.id, 'open')} className="gap-1"><CheckCircle2 size={14} /> Open</Button>
                        )}
                        {row.status !== 'closed' && (
                          <Button size="sm" variant="outline" onClick={() => setStatus(row.id, 'closed')} className="gap-1"><XCircle size={14} /> Close</Button>
                        )}
                        {row.status !== 'archived' && (
                          <Button size="sm" variant="ghost" onClick={() => setStatus(row.id, 'archived')} className="gap-1"><Archive size={14} /> Archive</Button>
                        )}
                        <Button size="sm" variant="danger" onClick={() => deleteRow(row.id)} className="gap-1"><Trash2 size={14} /> Delete</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}