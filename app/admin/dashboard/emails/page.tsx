'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { PlaceholderGuide } from '@/components/admin/PlaceholderGuide';
import { Mail, Save, Eye, EyeOff, ExternalLink, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const PLACEHOLDER_DESCRIPTIONS: Record<string, string> = {
  '{{name}}': 'Student\'s full name',
  '{{track}}': 'Program / track name',
  '{{code}}': 'Student code (e.g. STU-2026-001)',
  '{{certId}}': 'Certificate ID (e.g. UJ-AI-2026-001)',
};

const guideFor = (keys: string[]) => keys.map((k) => ({ key: k, description: PLACEHOLDER_DESCRIPTIONS[k] || 'Dynamic value' }));

const EMAIL_TYPES = [
  {
    key: 'acceptance',
    label: 'Acceptance / Offer Letter',
    description: 'Sent when an admin manually clicks "Send Acceptance Email" in the pipeline.',
    placeholders: ['{{name}}', '{{track}}', '{{code}}'],
  },
  {
    key: 'onboarding',
    label: 'Onboarding Credentials',
    description: 'Sent when an admin manually clicks "Send Onboarding Email" after marking payment as paid.',
    placeholders: ['{{name}}', '{{track}}', '{{code}}'],
  },
  {
    key: 'completion',
    label: 'Completion Certificate Dispatch',
    description: 'Sent when an admin clicks "Dispatch Email" on a completed intern with a generated certificate.',
    placeholders: ['{{name}}', '{{track}}', '{{certId}}'],
  },
  {
    key: 'recommendation',
    label: 'Recommendation Letter (LOR)',
    description: 'Sent when an admin generates and dispatches a Letter of Recommendation.',
    placeholders: ['{{name}}', '{{track}}'],
  },
];

// Sample values used to fill placeholders so the preview shows how a real email will render
const SAMPLE_DATA: Record<string, { name: string; track: string; code: string; certId: string }> = {
  acceptance: { name: 'Priyansh Sharma', track: 'Full Stack + AI Internship', code: 'STU-2026-001', certId: 'UJ-AI-2026-001' },
  onboarding: { name: 'Priyansh Sharma', track: 'Full Stack + AI Internship', code: 'STU-2026-001', certId: 'UJ-AI-2026-001' },
  completion: { name: 'Priyansh Sharma', track: 'Full Stack + AI Internship', code: 'STU-2026-001', certId: 'UJ-AI-2026-001' },
  recommendation: { name: 'Priyansh Sharma', track: 'Full Stack + AI Internship', code: 'STU-2026-001', certId: 'UJ-AI-2026-001' },
};

function fillPlaceholders(text: string, key: string) {
  const d = SAMPLE_DATA[key];
  return (text || '')
    .replaceAll('{{name}}', d?.name || 'Priyansh Sharma')
    .replaceAll('{{track}}', d?.track || 'Full Stack + AI Internship')
    .replaceAll('{{code}}', d?.code || 'STU-2026-001')
    .replaceAll('{{certId}}', d?.certId || 'UJ-AI-2026-001');
}

export default function EmailSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Record<string, { subject: string; body_html: string; is_enabled: boolean }>>({});
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [testingKey, setTestingKey] = useState<string | null>(null);

  const loadTemplates = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('email_templates')
      .select('template_key, subject, body_html, is_enabled')
      .order('template_key');

    if (data) {
      const map: Record<string, any> = {};
      data.forEach((t) => {
        map[t.template_key] = {
          subject: t.subject || '',
          body_html: t.body_html || '',
          is_enabled: t.is_enabled ?? true,
        };
      });
      setTemplates(map);
    }
    setLoading(false);
  };

  useEffect(() => { loadTemplates(); }, []);

  const handleSave = async (key: string) => {
    setSaving(key);
    const supabase = createClient();
    const tmpl = templates[key];
    if (!tmpl) return;

    const { error } = await supabase
      .from('email_templates')
      .upsert({
        template_key: key,
        subject: tmpl.subject,
        body_html: tmpl.body_html,
        is_enabled: tmpl.is_enabled,
      }, { onConflict: 'template_key' });

    if (error) {
      toast.error('Failed to save template');
    } else {
      toast.success(`"${key}" email template saved`);
    }
    setSaving(null);
  };

  const updateTemplate = (key: string, field: string, value: any) => {
    setTemplates(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { subject: '', body_html: '', is_enabled: true }), [field]: value },
    }));
  };

  const openPreviewInNewTab = (key: string) => {
    const tmpl = templates[key];
    const subject = fillPlaceholders(tmpl?.subject || '', key);
    const body = fillPlaceholders(tmpl?.body_html || '', key);
    const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${subject || 'Email Preview'}</title></head><body style="margin:0;background:#f0f0f0;padding:24px;">${body || '<p>No content</p>'}</body></html>`;
    const blob = new Blob([doc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const sendTestEmail = async (key: string) => {
    const tmpl = templates[key];
    if (!tmpl) return;
    setTestingKey(key);
    const toastId = toast.loading('Sending test email...');
    try {
      const res = await fetch('/api/email/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: key, subject: tmpl.subject, body_html: tmpl.body_html }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Test email sent to ${data.to}`, { id: toastId });
      } else {
        toast.error(data.error || 'Test email failed', { id: toastId });
      }
    } catch (err) {
      toast.error('Failed to connect to the mail API', { id: toastId });
    } finally {
      setTestingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-orange border-r-2" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold font-display tracking-tight text-white flex items-center gap-2">
          <Mail className="text-brand-orange" size={24} /> Email Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          All emails are <span className="text-brand-orange font-semibold">opt-in</span> — nothing is sent automatically.
          Customise templates and toggle each email type on or off.
        </p>
      </div>

      <div className="space-y-6">
        {EMAIL_TYPES.map((type) => {
          const tmpl = templates[type.key] || { subject: '', body_html: '', is_enabled: true };
          const isEnabled = tmpl.is_enabled;
          const isPreviewing = previewKey === type.key;

          return (
            <Card key={type.key} variant="glass" className={`p-6 space-y-4 border transition-all ${isEnabled ? 'border-slate-800' : 'border-slate-900 opacity-60'}`}>
              {/* Header row */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100">{type.label}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{type.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {type.placeholders.map(p => (
                      <code key={p} className="text-[10px] bg-slate-900 border border-slate-800 text-cyan-400 px-1.5 py-0.5 rounded font-mono">
                        {p}
                      </code>
                    ))}
                  </div>
                </div>

                {/* Enable/disable toggle */}
                <button
                  onClick={() => updateTemplate(type.key, 'is_enabled', !isEnabled)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                    isEnabled
                      ? 'bg-green-500/15 text-green-400 border-green-500/20 hover:bg-green-500/25'
                      : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {isEnabled ? <><Eye size={12} /> Enabled</> : <><EyeOff size={12} /> Disabled</>}
                </button>
              </div>

              {isEnabled && (
                <>
                  {/* Subject line */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-400 block">Subject Line</label>
                      <PlaceholderGuide placeholders={guideFor(type.placeholders)} />
                    </div>
                    <input
                      type="text"
                      value={tmpl.subject}
                      onChange={(e) => updateTemplate(type.key, 'subject', e.target.value)}
                      placeholder={`e.g. Ujjwalit — ${type.label}`}
                      className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-orange/40"
                    />
                  </div>

                  {/* Body HTML */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-400 block">Email Body (HTML)</label>
                      <div className="flex items-center gap-3">
                        <PlaceholderGuide placeholders={guideFor(type.placeholders)} />
                        <button
                          onClick={() => setPreviewKey(isPreviewing ? null : type.key)}
                          className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                        >
                          <Eye size={11} /> {isPreviewing ? 'Hide Preview' : 'Preview'}
                        </button>
                      </div>
                    </div>
                    {isPreviewing ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>Preview uses sample data — placeholders are filled in for a realistic look.</span>
                          <button
                            onClick={() => openPreviewInNewTab(type.key)}
                            className="text-brand-orange hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink size={10} /> Open in new tab
                          </button>
                        </div>
                        <div className="border border-slate-800 rounded-lg overflow-auto">
                          <div className="bg-slate-800/80 px-3 py-1.5 text-[10px] font-mono text-slate-400 border-b border-slate-700">
                            Subject: {fillPlaceholders(tmpl.subject || '', type.key)}
                          </div>
                          <div
                            className="w-full min-h-48 bg-white p-4 text-sm"
                            dangerouslySetInnerHTML={{
                              __html: tmpl.body_html
                                ? fillPlaceholders(tmpl.body_html, type.key)
                                : '<p class="text-gray-400">No content</p>',
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <textarea
                        rows={8}
                        value={tmpl.body_html}
                        onChange={(e) => updateTemplate(type.key, 'body_html', e.target.value)}
                        placeholder="<p>Dear {{name}},</p><p>Your email body here...</p>"
                        className="w-full bg-slate-950 border border-slate-900 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 font-mono resize-y focus:outline-none focus:border-brand-orange/40"
                      />
                    )}
                  </div>

                  <div className="flex justify-end pt-1 gap-2">
                    <Button
                      size="sm"
                      onClick={() => sendTestEmail(type.key)}
                      disabled={testingKey === type.key}
                      variant="ghost"
                      className="text-xs border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 gap-1.5"
                    >
                      <Send size={13} />
                      {testingKey === type.key ? 'Sending...' : 'Send Test Email'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSave(type.key)}
                      disabled={saving === type.key}
                      className="bg-brand-orange text-slate-950 font-bold hover:bg-brand-orange/90 text-xs gap-1.5"
                    >
                      <Save size={13} />
                      {saving === type.key ? 'Saving...' : 'Save Template'}
                    </Button>
                  </div>
                </>
              )}

              {/* Save disabled state too */}
              {!isEnabled && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => handleSave(type.key)}
                    disabled={saving === type.key}
                    variant="ghost"
                    className="text-xs border border-slate-800 text-slate-400"
                  >
                    <Save size={13} className="mr-1" />
                    Save (disabled)
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
