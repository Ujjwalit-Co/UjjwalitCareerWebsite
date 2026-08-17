'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { PlaceholderGuide } from '@/components/admin/PlaceholderGuide';
import {
  Award,
  Layout,
  Plus,
  Trash2,
  Move,
  Upload,
  Eye,
  Check,
  Copy,
  Star,
  ArrowLeft,
  LayoutTemplate,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TemplateField {
  id: string;
  type: 'text' | 'qrcode' | 'image';
  label: string;
  placeholder: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: 'Sans' | 'Serif' | 'Mono' | 'Inter' | 'Montserrat' | 'Playfair Display' | 'Great Vibes' | 'Alex Brush';
  fontWeight: 'normal' | 'bold';
  color: string;
  textAlign: 'left' | 'center' | 'right';
}

type TemplateType = 'completion' | 'achievement' | 'participation' | 'custom';

const TYPE_CONFIG: Record<TemplateType, { label: string; short: string; badge: string }> = {
  completion: { label: 'Certificate of Completion', short: 'Completion', badge: 'text-teal-400 border-teal-500/20 bg-teal-500/10' },
  achievement: { label: 'Statement of Achievement', short: 'Achievement', badge: 'text-brand-orange border-brand-orange/20 bg-brand-orange/10' },
  participation: { label: 'Certificate of Participation', short: 'Participation', badge: 'text-green-400 border-green-500/20 bg-green-500/10' },
  custom: { label: 'Custom Template', short: 'Custom', badge: 'text-slate-300 border-slate-600/30 bg-slate-700/10' },
};

export default function CertificateTemplatesPage() {
  // View state: library list vs designer canvas
  const [view, setView] = useState<'library' | 'designer'>('library');
  const [activeType, setActiveType] = useState<'all' | TemplateType>('all');
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);

  // Designer States
  const [bgUrl, setBgUrl] = useState('');
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<TemplateType>('completion');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');

  // Copy-to-type modal state
  const [copyModal, setCopyModal] = useState<{ id: string; name: string } | null>(null);
  const [copyType, setCopyType] = useState<TemplateType>('completion');
  const [isCopying, setIsCopying] = useState(false);

  // Designer Canvas Dimensions (Standard ratio 1.414: A4 landscape, scaled down to fit viewport)
  const designerWidth = 800;
  const designerHeight = 566;
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTemplates = async () => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load certificate templates');
    } finally {
      setLoading(false);
    }
  };

  const loadOpportunities = async () => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('id, title, certificate_template_id')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setOpportunities(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTemplates();
    loadOpportunities();

    // Dynamically inject Google Fonts for visual designer preview
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Great+Vibes&family=Inter:wght@400;700&family=Montserrat:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const selectTemplateById = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setSelectedTemplateId(id);
    setNewTemplateName(t.name);
    setNewTemplateType(t.template_type || 'custom');
    setNewTemplateDescription(t.description || '');
    setBgUrl(t.background_url || '');
    setFields(t.fields || []);
    setSelectedFieldId(null);
  };

  const openNewTemplate = (type: TemplateType) => {
    setSelectedTemplateId('');
    setNewTemplateName('');
    setNewTemplateType(type);
    setNewTemplateDescription('');
    setBgUrl('');
    setFields([]);
    setSelectedFieldId(null);
    setView('designer');
  };

  const openEditTemplate = (id: string) => {
    selectTemplateById(id);
    setView('designer');
  };

  const copyTemplateToType = async (id: string, targetType: TemplateType) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    const supabase = createClient();
    setIsCopying(true);
    try {
      const { error } = await supabase.from('certificate_templates').insert({
        name: `${t.name} (${TYPE_CONFIG[targetType].short})`,
        template_type: targetType,
        description: t.description,
        background_url: t.background_url,
        fields: t.fields,
        width: t.width,
        height: t.height,
        is_default: false,
      });
      if (error) throw error;
      toast.success(`Copied to "${TYPE_CONFIG[targetType].label}"`);
      setCopyModal(null);
      loadTemplates();
    } catch (err: any) {
      toast.error(err.message || 'Failed to copy template');
    } finally {
      setIsCopying(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    const confirmDelete = window.confirm(
      'Delete this template permanently? Certificates and opportunities using it will fall back to the default layout.'
    );
    if (!confirmDelete) return;
    const supabase = createClient();
    try {
      const { error } = await supabase.from('certificate_templates').delete().eq('id', id);
      if (error) throw error;
      toast.success('Template deleted');
      if (selectedTemplateId === id) {
        setSelectedTemplateId('');
        setBgUrl('');
        setFields([]);
        setView('library');
      }
      loadTemplates();
      loadOpportunities();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete template');
    }
  };

  const setDefaultTemplate = async (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    const supabase = createClient();
    try {
      // Clear default for all templates of the same type, then set this one
      const { error: clearError } = await supabase
        .from('certificate_templates')
        .update({ is_default: false })
        .eq('template_type', t.template_type);
      if (clearError) throw clearError;

      const { error } = await supabase
        .from('certificate_templates')
        .update({ is_default: true })
        .eq('id', id);
      if (error) throw error;

      toast.success(`"${t.name}" is now the default for ${TYPE_CONFIG[t.template_type as TemplateType]?.short || t.template_type}`);
      loadTemplates();
    } catch (err: any) {
      toast.error(err.message || 'Failed to set default template');
    }
  };

  // Drag-and-drop mouse trigger
  const handleMouseDown = (e: React.MouseEvent, fieldId: string) => {
    e.preventDefault();
    setSelectedFieldId(fieldId);

    if (!canvasRef.current) return;
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialFieldX = field.x;
    const initialFieldY = field.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const newX = Math.round(Math.max(0, Math.min(designerWidth, initialFieldX + deltaX)));
      const newY = Math.round(Math.max(0, Math.min(designerHeight, initialFieldY + deltaY)));

      setFields((prev) =>
        prev.map((f) => (f.id === fieldId ? { ...f, x: newX, y: newY } : f))
      );
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleUpdateSelectedField = (key: keyof TemplateField, value: any) => {
    if (!selectedFieldId) return;
    setFields((prev) =>
      prev.map((f) => (f.id === selectedFieldId ? { ...f, [key]: value } : f))
    );
  };

  // Add custom template fields
  const handleAddField = (type: 'text' | 'qrcode') => {
    const newField: TemplateField = {
      id: `field-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type,
      label: type === 'text' ? 'Custom Text' : 'QR Code',
      placeholder: type === 'text' ? 'New Text Field' : 'QR_CODE_PLACEHOLDER',
      x: 300,
      y: 250,
      fontSize: type === 'text' ? 14 : 70,
      fontFamily: 'Sans',
      fontWeight: 'normal',
      color: '#000000',
      textAlign: 'center',
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  };

  // Delete selected template field
  const handleDeleteField = () => {
    if (!selectedFieldId) return;
    setFields((prev) => prev.filter((f) => f.id !== selectedFieldId));
    setSelectedFieldId(null);
  };

  // Upload background file to Supabase storage templates bucket
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const supabase = createClient();
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('templates')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('templates')
        .getPublicUrl(fileName);

      setBgUrl(publicUrl);
      toast.success('Template background uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplateId && !newTemplateName.trim()) {
      toast.error('Please provide a template name.');
      return;
    }

    setIsSavingTemplate(true);
    const supabase = createClient();
    try {
      if (selectedTemplateId) {
        // Update existing template
        const { error: tErr } = await supabase
          .from('certificate_templates')
          .update({
            name: newTemplateName.trim() || undefined,
            template_type: newTemplateType,
            background_url: bgUrl || null,
            fields: fields as any,
            width: designerWidth,
            height: designerHeight,
            description: newTemplateDescription.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedTemplateId);

        if (tErr) throw tErr;
      } else {
        // Insert new template into the library
        const { error: tErr } = await supabase
          .from('certificate_templates')
          .insert({
            name: newTemplateName.trim(),
            template_type: newTemplateType,
            description: newTemplateDescription.trim() || null,
            background_url: bgUrl || null,
            fields: fields as any,
            width: designerWidth,
            height: designerHeight,
            is_default: false,
          });

        if (tErr) throw tErr;
      }

      toast.success('Template saved!');
      await loadTemplates();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleGenerateSample = async () => {
    setIsGeneratingSample(true);
    try {
      const res = await fetch('/api/certificates/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateBackgroundUrl: bgUrl || undefined,
          templateFields: fields,
        }),
      });

      if (!res.ok) {
        let message = 'Sample generation failed';
        try {
          const errJson = await res.json();
          message = errJson.error || message;
        } catch {
          message = await res.text() || message;
        }
        throw new Error(message);
      }

      const { pdfBase64 } = await res.json();

      // Open base64 pdf in new tab for preview
      const pdfWindow = window.open();
      if (pdfWindow) {
        pdfWindow.document.write(
          `<iframe width='100%' height='100%' src='data:application/pdf;base64,${pdfBase64}'></iframe>`
        );
      } else {
        toast.error('Popup blocked. Please allow popups to view the sample PDF.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to generate sample PDF');
    } finally {
      setIsGeneratingSample(false);
    }
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const filteredTemplates = activeType === 'all'
    ? templates
    : templates.filter((t) => t.template_type === activeType);

  const typeSections = (activeType === 'all' ? Object.keys(TYPE_CONFIG) : [activeType]) as TemplateType[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-white flex items-center gap-2">
            <LayoutTemplate size={32} className="text-brand-orange" /> Certificate Templates
          </h1>
          <p className="text-slate-400 text-sm">
            Manage the design canvas for every certificate type — Completion and Participation.
          </p>
        </div>
      </div>

      {/* Library View */}
      {view === 'library' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Type filter tabs */}
          <div className="flex flex-wrap bg-slate-900 p-1 rounded-lg border border-slate-850 gap-1">
            {(['all', 'completion', 'participation', 'custom'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeType === type
                    ? 'bg-brand-orange text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type === 'all' ? 'All Types' : TYPE_CONFIG[type].short}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-orange border-r-2"></div>
              <p className="text-slate-400 text-xs">Loading templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Card variant="glass" className="p-10 text-center border-slate-900 space-y-4">
              <p className="text-slate-400 text-sm">
                No templates in this category yet.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openNewTemplate(activeType === 'all' ? 'completion' : activeType)}
                className="gap-1.5 text-xs font-bold mx-auto"
              >
                <Plus size={14} /> Create First Template
              </Button>
            </Card>
          ) : (
            <div className="space-y-8">
              {typeSections.map((type) => {
                const typeTemplates = templates.filter((t) => t.template_type === type);
                if (typeTemplates.length === 0) return null;
                return (
                  <div key={type}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-lg font-bold font-display text-slate-100 flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold rounded-full border px-2.5 py-0.5 ${TYPE_CONFIG[type].badge}`}>
                            {TYPE_CONFIG[type].short}
                          </span>
                          {TYPE_CONFIG[type].label}
                          <span className="text-xs font-medium text-slate-500">({typeTemplates.length})</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {type === 'achievement'
                            ? 'Issued to students who participated meaningfully but did not fully complete the program.'
                            : type === 'completion'
                              ? 'Issued to students who fully complete a Ujjwalit program.'
                              : type === 'participation'
                                ? 'Circulated to students who attended an event or workshop session.'
                                : 'Reusable templates for one-off events and workshops.'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openNewTemplate(type)}
                        className="gap-1.5 text-xs font-bold"
                      >
                        <Plus size={14} /> New {TYPE_CONFIG[type].short} Template
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {typeTemplates.map((t) => {
                        const linkedCount = opportunities.filter(o => o.certificate_template_id === t.id).length;
                        return (
                          <Card key={t.id} variant="glass" className="p-5 bg-slate-950/60 border-slate-800 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-100 truncate">{t.name}</h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                  {t.is_default ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-full border border-brand-teal/30 bg-teal-500/10 px-2 py-0.5 text-teal-400">
                                      <Star size={9} /> Default
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => setDefaultTemplate(t.id)}
                                      className="text-[10px] font-bold uppercase tracking-wider rounded-full border border-slate-700 px-2 py-0.5 text-slate-400 hover:border-brand-teal/40 hover:text-teal-400 transition-colors cursor-pointer"
                                      title={`Set as default for ${TYPE_CONFIG[type].short}`}
                                    >
                                      Set Default
                                    </button>
                                  )}
                                  <span className="text-[10px] text-slate-500">
                                    {linkedCount > 0 ? `${linkedCount} event${linkedCount > 1 ? 's' : ''} linked` : 'Library only'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 min-h-[2rem]">
                              {t.description || 'No description provided.'}
                            </p>

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditTemplate(t.id)}
                                className="flex-1 gap-1 text-xs font-bold py-1.5"
                              >
                                <Layout size={13} /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setCopyModal({ id: t.id, name: t.name })}
                                className="gap-1 text-xs text-slate-400 hover:text-slate-100 py-1.5 px-2"
                                title="Copy to another template type"
                              >
                                <Copy size={13} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteTemplate(t.id)}
                                className="gap-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 py-1.5 px-2"
                                title="Delete template"
                              >
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Designer View */}
      {view === 'designer' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Back button + template controls */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('library')}
              className="gap-1.5 text-xs font-bold text-slate-300 hover:text-white"
            >
              <ArrowLeft size={14} /> Back to Library
            </Button>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Template:</span>
            <select
              value={selectedTemplateId}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  selectTemplateById(val);
                } else {
                  setSelectedTemplateId('');
                  setNewTemplateName('');
                  setNewTemplateType('completion');
                  setNewTemplateDescription('');
                  setBgUrl('');
                  setFields([]);
                }
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 cursor-pointer focus:outline-none focus:border-brand-teal max-w-xs"
            >
              <option value="">— New Template —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({TYPE_CONFIG[t.template_type as TemplateType]?.short || t.template_type})
                </option>
              ))}
            </select>

            {!selectedTemplateId && (
              <>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Template name"
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-teal max-w-[190px]"
                />
                <select
                  value={newTemplateType}
                  onChange={(e) => setNewTemplateType(e.target.value as TemplateType)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 cursor-pointer focus:outline-none focus:border-brand-teal"
                >
                  <option value="completion">Completion</option>
                  <option value="participation">Participation</option>
                  <option value="custom">Custom</option>
                </select>
              </>
            )}

            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateSample}
                isLoading={isGeneratingSample}
                className="font-bold text-xs border-brand-orange text-brand-orange hover:bg-brand-orange/10"
              >
                <Eye size={14} className="mr-1.5" /> Sample PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveTemplate}
                isLoading={isSavingTemplate}
                className="font-bold text-xs"
              >
                <Check size={14} className="mr-1.5" /> {selectedTemplateId ? 'Save Template' : 'Create & Save Template'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Drag-and-drop Workspace */}
            <div className="lg:col-span-3 space-y-4">
              {selectedTemplateId && (
                <Card variant="solid" className="p-4 bg-slate-900 border-slate-800 space-y-3">
                  <div className="flex flex-col gap-2">
                    <Input
                      label="Template Name"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      label="Description (shown in library)"
                      value={newTemplateDescription}
                      onChange={(e) => setNewTemplateDescription(e.target.value)}
                      placeholder="What is this template used for?"
                      className="text-sm"
                    />
                  </div>
                </Card>
              )}

              {/* The Visual Canvas */}
              <div className="overflow-auto border border-slate-800 rounded-xl bg-slate-950 p-2 shadow-2xl flex items-center justify-center">
                <div
                  ref={canvasRef}
                  style={{
                    width: `${designerWidth}px`,
                    height: `${designerHeight}px`,
                    backgroundImage: bgUrl && !bgUrl.match(/\.pdf$/i) ? `url(${bgUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                  }}
                  className={`border rounded-lg select-none ${
                    !bgUrl ? 'bg-slate-900 border-dashed border-slate-700/50' : 'border-slate-850'
                  }`}
                >
                  {!bgUrl && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-2">
                      <Award size={48} />
                      <span className="text-xs font-semibold uppercase tracking-wider">Empty Canvas Frame</span>
                      <span className="text-[10px] text-slate-600">Upload background image or paste URL on the right panel</span>
                    </div>
                  )}

                  {bgUrl?.match(/\.pdf$/i) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-2 bg-slate-900/80 rounded-lg">
                      <Award size={48} />
                      <span className="text-xs font-semibold uppercase tracking-wider">PDF Background</span>
                      <span className="text-[10px] text-slate-600">Vector quality preserved — preview available via Sample PDF</span>
                    </div>
                  )}

                  {/* Render Fields absolutely */}
                  {fields.map((field) => {
                    const isSelected = selectedFieldId === field.id;
                    const isQr = field.type === 'qrcode';

                    const textAlignStyle = field.textAlign || 'left';
                    const alignmentShift =
                      textAlignStyle === 'center' ? '-50%' : textAlignStyle === 'right' ? '-100%' : '0%';

                    return (
                      <div
                        key={field.id}
                        onMouseDown={(e) => handleMouseDown(e, field.id)}
                        style={{
                          position: 'absolute',
                          left: `${field.x}px`,
                          top: `${field.y}px`,
                          transform: `translateX(${alignmentShift})`,
                          color: field.color || '#000000',
                          fontSize: `${field.fontSize}px`,
                          fontFamily: field.fontFamily === 'Serif' ? 'Georgia, serif' : field.fontFamily === 'Mono' ? 'monospace' : field.fontFamily === 'Sans' ? 'sans-serif' : `'${field.fontFamily}', sans-serif`,
                          fontWeight: field.fontWeight === 'bold' ? 'bold' : 'normal',
                          cursor: 'move',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                        className={`transition-shadow hover:bg-teal-500/10 group ${
                          isSelected
                            ? 'outline-2 outline-dashed outline-brand-teal bg-teal-500/10 shadow-lg'
                            : 'outline-1 outline-transparent'
                        }`}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-[10px] text-brand-teal px-1 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity flex items-center gap-1 font-bold">
                          <Move size={8} /> {field.label}
                        </div>

                        {isQr ? (
                          <div
                            style={{
                              width: `${field.fontSize || 75}px`,
                              height: `${field.fontSize || 75}px`,
                              backgroundColor: '#FFFFFF',
                            }}
                            className="border border-slate-350 rounded p-1 flex items-center justify-center text-slate-900"
                          >
                            <svg className="w-full h-full text-black" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M3 3h8v8H3zm2 2v4h4V5zm8-2h8v8h-8zm2 2v4h4V5zM3 13h8v8H3zm2 2v4h4v-4zm13-2h3v2h-3zm-2 2h2v2h-2zm2 2h3v2h-3zm-2 2h2v2h-2zm4-6h1v2h-1zm0 4h1v2h-1zm-6-2h1v2h-1zm0 4h1v2h-1z" />
                            </svg>
                          </div>
                        ) : (
                          <span
                            style={{
                              whiteSpace: 'pre-wrap',
                              maxWidth: `${Math.max(100, designerWidth - field.x - 20)}px`,
                              display: 'inline-block',
                            }}
                          >
                            {field.placeholder}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Designer Settings Panel */}
            <div className="lg:col-span-1 space-y-6">
              {/* Background Settings */}
              <Card variant="glass" className="p-5 bg-slate-950/70 border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Background Settings</h4>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Direct File Uploader</label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      isLoading={isUploading}
                      className="w-full text-xs font-bold flex gap-1.5 items-center justify-center py-2"
                    >
                      <Upload size={14} /> Upload image
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-3">
                  <Input
                    label="Or Image URL path"
                    placeholder="https://...png or base64"
                    value={bgUrl}
                    onChange={(e) => setBgUrl(e.target.value)}
                  />
                </div>
                <p className="text-[9px] text-slate-500 leading-normal">
                  Standard landscape templates recommended (A4 landscape ratios, ~1122x793px).
                </p>
              </Card>

              {/* Field Management / Creation */}
              <Card variant="glass" className="p-5 bg-slate-950/70 border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Design Fields</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddField('text')}
                    className="text-xs font-bold py-2"
                  >
                    + Add Text
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddField('qrcode')}
                    className="text-xs font-bold py-2"
                  >
                    + Add QR Code
                  </Button>
                </div>
              </Card>

              {/* Field Settings / Selection */}
              <Card variant="glass" className="p-5 bg-slate-950/70 border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Field Inspector</h4>

                {selectedField ? (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="p-2.5 bg-slate-900/60 border border-slate-850 rounded-lg">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Active Selection:</span>
                      <p className="text-sm font-bold text-slate-200 mt-0.5">{selectedField.label}</p>
                    </div>

                    {selectedField.type === 'text' && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold text-[#F5F5F5]">Template Text</label>
                          <PlaceholderGuide
                            placeholders={[
                              { key: '{{name}}', description: 'Student\'s full name' },
                              { key: '{{program}} / {{track}}', description: 'Program / track name' },
                              { key: '{{id}}', description: 'Certificate ID' },
                              { key: '{{date}}', description: 'Issue date' },
                              { key: '{{college}}', description: 'Student\'s college' },
                              { key: '{{batch}}', description: 'Batch name' },
                              { key: '{{student_code}} / {{code}}', description: 'Student code' },
                              { key: '{{attendance}}', description: 'Attendance %' },
                            ]}
                          />
                        </div>
                        <textarea
                          value={selectedField.placeholder}
                          onChange={(e) => handleUpdateSelectedField('placeholder', e.target.value)}
                          rows={4}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-[#F5F5F5] placeholder-[#71717A] focus:outline-none transition-all duration-200 text-sm focus:ring-2 focus:border-brand-blue focus:ring-brand-blue/20 resize-y font-mono"
                        />
                      </div>
                    )}

                    {/* Font Size */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400 font-medium">
                        Size: {selectedField.fontSize}px
                      </label>
                      <input
                        type="range"
                        min="8"
                        max="72"
                        value={selectedField.fontSize}
                        onChange={(e) =>
                          handleUpdateSelectedField('fontSize', parseInt(e.target.value))
                        }
                        className="w-full h-1 bg-slate-900 border border-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-teal"
                      />
                    </div>

                    {/* Font Family Selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400 font-medium">Font Family</label>
                      <select
                        value={selectedField.fontFamily}
                        onChange={(e) => handleUpdateSelectedField('fontFamily', e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 cursor-pointer"
                      >
                        <option value="Sans">Helvetica (Sans-Serif)</option>
                        <option value="Serif">Times-Roman (Serif)</option>
                        <option value="Mono">Courier (Monospace)</option>
                        <option value="Inter">Inter (Sans-Serif)</option>
                        <option value="Montserrat">Montserrat (Sans-Serif)</option>
                        <option value="Playfair Display">Playfair Display (Serif)</option>
                        <option value="Great Vibes">Great Vibes (Script)</option>
                        <option value="Alex Brush">Alex Brush (Script)</option>
                      </select>
                    </div>

                    {/* Font Weight */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400 font-medium">Weight</label>
                      <select
                        value={selectedField.fontWeight}
                        onChange={(e) => handleUpdateSelectedField('fontWeight', e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 cursor-pointer"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>

                    {/* Text Color */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400 font-medium">Text Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={selectedField.color}
                          onChange={(e) => handleUpdateSelectedField('color', e.target.value)}
                          className="w-8 h-8 rounded border border-slate-800 cursor-pointer bg-transparent"
                        />
                        <Input
                          value={selectedField.color}
                          onChange={(e) => handleUpdateSelectedField('color', e.target.value)}
                          className="py-1 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Text Alignment */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400 font-medium">Alignment</label>
                      <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-850">
                        {(['left', 'center', 'right'] as const).map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => handleUpdateSelectedField('textAlign', align)}
                            className={`py-1 text-[10px] font-bold rounded capitalize cursor-pointer transition-colors ${
                              selectedField.textAlign === align
                                ? 'bg-brand-teal text-slate-950'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Position display */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold bg-slate-950 p-2 rounded-lg border border-slate-900">
                      <span>X: {selectedField.x}px</span>
                      <span>Y: {selectedField.y}px</span>
                    </div>

                    {/* Delete Button */}
                    <div className="pt-2 border-t border-slate-900">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleDeleteField}
                        className="w-full gap-1.5 justify-center py-2 text-xs font-bold"
                      >
                        <Trash2 size={13} /> Remove Selected Field
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs italic text-center py-6">
                    No element selected. Click canvas element to edit properties.
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Copy-to-type modal */}
      {copyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card variant="solid" className="max-w-sm w-full p-6 space-y-4 bg-slate-950 border border-slate-900 text-slate-100">
            <h3 className="text-lg font-bold text-slate-100 border-b border-slate-900 pb-2 flex items-center gap-2">
              <Copy size={16} className="text-brand-orange" /> Copy Template
            </h3>

            <div className="space-y-1">
              <label className="text-slate-400 font-semibold block text-xs">Source</label>
              <p className="text-sm font-semibold text-slate-200">{copyModal.name}</p>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-semibold block text-xs">Copy into</label>
              <select
                value={copyType}
                onChange={(e) => setCopyType(e.target.value as TemplateType)}
                className="w-full bg-slate-950 border border-slate-900 rounded-lg p-2 text-slate-200 cursor-pointer"
              >
                <option value="completion">Completion</option>
                <option value="participation">Participation</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-900">
              <Button size="sm" variant="ghost" onClick={() => setCopyModal(null)} className="text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => copyTemplateToType(copyModal.id, copyType)}
                isLoading={isCopying}
                className="bg-brand-orange text-slate-950 font-bold hover:bg-brand-orange/90 text-xs"
              >
                <Copy size={12} /> Copy as {TYPE_CONFIG[copyType].short}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
