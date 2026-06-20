'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { formatDate, getTrackLabel } from '@/lib/utils';
import {
  Award,
  History,
  Settings,
  Download,
  AlertTriangle,
  Check,
  Layout,
  RefreshCw,
  Plus,
  Trash2,
  Move,
  Upload,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/modal';

interface TemplateField {
  id: string;
  type: 'text' | 'qrcode' | 'image';
  label: string;
  placeholder: string;
  x: number; // in px
  y: number; // in px
  fontSize: number;
  fontFamily: 'Sans' | 'Serif' | 'Mono' | 'Inter' | 'Montserrat' | 'Playfair Display' | 'Great Vibes' | 'Alex Brush';
  fontWeight: 'normal' | 'bold';
  color: string;
  textAlign: 'left' | 'center' | 'right';
}

export default function CertificatesDashboard() {
  const [activeTab, setActiveTab] = useState<'registry' | 'designer'>('registry');
  const [loading, setLoading] = useState(true);
  
  // Registry States
  const [eligibleStudents, setEligibleStudents] = useState<any[]>([]);
  const [issuedCerts, setIssuedCerts] = useState<any[]>([]);
  const [isIssuing, setIsIssuing] = useState<string | null>(null);
  
  // Designer States
  const [bgUrl, setBgUrl] = useState('');
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);

  // Opportunities state for template-to-event association
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>('');

  // Preview Modal States
  const [previewCert, setPreviewCert] = useState<any | null>(null);
  const [previewTimestamp, setPreviewTimestamp] = useState(Date.now());

  // Designer Canvas Dimensions (Standard ratio 1.414: A4 landscape, scaled down to fit viewport)
  const designerWidth = 800;
  const designerHeight = 566;
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);  const loadRegistryData = async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      // 1. Fetch eligible students who don't have a certificate yet
      const { data: stds } = await supabase
        .from('students')
        .select(`
          id,
          student_code,
          batch_name,
          application:applications (
            full_name,
            college,
            internship_track
          )
        `)
        .eq('certificate_eligible', true);

      // Fetch all certificates with student and application joins
      const { data: certs } = await supabase
        .from('certificates')
        .select(`
          id,
          student_id,
          certificate_id,
          verification_hash,
          qr_code_url,
          certificate_pdf_url,
          status,
          issued_at,
          student:students (
            id,
            student_code,
            batch_name,
            application:applications (
              full_name,
              internship_track
            )
          )
        `);

      const issuedStudentIds = new Set((certs || []).filter(c => c.status === 'active').map(c => c.student_id));
      
      setEligibleStudents((stds || []).filter(s => !issuedStudentIds.has(s.id)));
      setIssuedCerts(certs || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load certificates registry data');
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
      if (data) {
        setOpportunities(data);
        if (data.length > 0) {
          setSelectedOpportunityId(data[0].id);
          loadOpportunityTemplate(data[0].id, data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadOpportunityTemplate = async (oppId: string, currentOpps = opportunities) => {
    const opp = currentOpps.find(o => o.id === oppId);
    if (!opp) return;

    const supabase = createClient();
    try {
      if (opp.certificate_template_id) {
        const { data: template } = await supabase
          .from('certificate_templates')
          .select('*')
          .eq('id', opp.certificate_template_id)
          .maybeSingle();

        if (template) {
          setBgUrl(template.background_url || '');
          setFields(template.fields || []);
          setSelectedFieldId(null);
          return;
        }
      }

      // Default blank template config
      setBgUrl('');
      setFields([
        { id: '1', type: 'text', label: 'Title text', placeholder: 'CERTIFICATE OF TRAINING', x: 400, y: 140, fontSize: 28, fontFamily: 'Serif', fontWeight: 'bold', color: '#E8822A', textAlign: 'center' },
        { id: '2', type: 'text', label: 'Presenter line', placeholder: 'This is proudly presented to', x: 400, y: 220, fontSize: 14, fontFamily: 'Sans', fontWeight: 'normal', color: '#64748B', textAlign: 'center' },
        { id: '3', type: 'text', label: 'Intern Name', placeholder: '{{name}}', x: 400, y: 280, fontSize: 32, fontFamily: 'Serif', fontWeight: 'bold', color: '#0B1D3F', textAlign: 'center' },
        { id: '4', type: 'text', label: 'Description text', placeholder: 'for successfully completing the {{program}} program', x: 400, y: 340, fontSize: 13, fontFamily: 'Sans', fontWeight: 'normal', color: '#64748B', textAlign: 'center' },
        { id: '5', type: 'text', label: 'Certificate ID Info', placeholder: 'Certificate ID: {{id}}', x: 80, y: 490, fontSize: 10, fontFamily: 'Mono', fontWeight: 'normal', color: '#94A3B8', textAlign: 'left' },
        { id: '6', type: 'text', label: 'Issued Date Info', placeholder: 'Issued Date: {{date}}', x: 80, y: 515, fontSize: 10, fontFamily: 'Mono', fontWeight: 'normal', color: '#94A3B8', textAlign: 'left' },
        { id: '7', type: 'qrcode', label: 'Security QR Code', placeholder: 'QR CODE PLACEHOLDER', x: 650, y: 440, fontSize: 75, fontFamily: 'Mono', fontWeight: 'normal', color: '#000000', textAlign: 'left' },
      ]);
      setSelectedFieldId(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load opportunity certificate template');
    }
  };

  const handleOpportunityChange = (oppId: string) => {
    setSelectedOpportunityId(oppId);
    loadOpportunityTemplate(oppId);
  };

  useEffect(() => {
    loadRegistryData();
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

  const handleIssueCertificate = async (studentId: string, forceRegenerate = false) => {
    setIsIssuing(studentId);
    const supabase = createClient();
    try {
      const res = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId, forceRegenerate }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Issuance failed');
      }

      toast.success(forceRegenerate ? 'Certificate regenerated successfully!' : 'Certificate issued successfully!');
      await loadRegistryData();

      // Retrieve the newly created/updated certificate to open preview immediately
      const { data: newCert } = await supabase
        .from('certificates')
        .select(`
          id,
          student_id,
          certificate_id,
          verification_hash,
          qr_code_url,
          certificate_pdf_url,
          status,
          issued_at,
          student:students (
            id,
            student_code,
            batch_name,
            application:applications (
              full_name,
              internship_track
            )
          )
        `)
        .eq('student_id', studentId)
        .maybeSingle();

      if (newCert) {
        setPreviewCert(newCert);
        setPreviewTimestamp(Date.now());
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error processing certificate');
    } finally {
      setIsIssuing(null);
    }
  };

  const handleRevokeCertificate = async (certId: string) => {
    const supabase = createClient();
    const confirmRevoke = window.confirm('Are you absolutely sure you want to revoke this certificate? Revoked certificates will display warnings during verification searches.');
    if (!confirmRevoke) return;

    try {
      const { error } = await supabase
        .from('certificates')
        .update({ status: 'revoked' })
        .eq('certificate_id', certId);

      if (error) throw error;
      toast.success('Certificate marked as Revoked');
      loadRegistryData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to revoke certificate');
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
    if (!selectedOpportunityId) {
      toast.error('Please select an opportunity to link this template to.');
      return;
    }

    setIsSavingTemplate(true);
    const supabase = createClient();
    try {
      const opp = opportunities.find(o => o.id === selectedOpportunityId);
      const selectedOppName = opp?.title || 'Opportunity';
      let templateId = opp?.certificate_template_id;

      if (templateId) {
        // Update existing template
        const { error: tErr } = await supabase
          .from('certificate_templates')
          .update({
            background_url: bgUrl || null,
            fields: fields as any,
            width: designerWidth,
            height: designerHeight,
            updated_at: new Date().toISOString(),
          })
          .eq('id', templateId);

        if (tErr) throw tErr;
      } else {
        // Insert new template
        const { data: newTemplate, error: tErr } = await supabase
          .from('certificate_templates')
          .insert({
            name: `${selectedOppName} Certificate Template`,
            background_url: bgUrl || null,
            fields: fields as any,
            width: designerWidth,
            height: designerHeight,
          })
          .select('*')
          .single();

        if (tErr) throw tErr;
        templateId = newTemplate.id;

        // Link new template to opportunity record
        const { error: linkErr } = await supabase
          .from('opportunities')
          .update({ certificate_template_id: templateId })
          .eq('id', selectedOpportunityId);

        if (linkErr) throw linkErr;

        // Update local opportunities state with linked template
        setOpportunities(prev =>
          prev.map(o => o.id === selectedOpportunityId ? { ...o, certificate_template_id: templateId } : o)
        );
      }

      toast.success(`Designer template saved and updated for ${selectedOppName}!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save designer template');
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
        const errJson = await res.json();
        throw new Error(errJson.error || 'Sample generation failed');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-white flex items-center gap-2">
            <Award size={32} className="text-brand-orange" /> Certificate Registry
          </h1>
          <p className="text-slate-400 text-sm">
            Issue cryptographically verifiable certificates and edit design canvas layouts.
          </p>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-850">
          <button
            onClick={() => setActiveTab('registry')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'registry'
                ? 'bg-brand-orange text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History size={14} /> Registry & Issue
          </button>
          <button
            onClick={() => setActiveTab('designer')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'designer'
                ? 'bg-brand-orange text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layout size={14} /> Design Template
          </button>
        </div>
      </div>

      {/* Tab Contents: Registry */}
      {activeTab === 'registry' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Section 1: Eligible for Issuance */}
          <Card variant="glass" className="p-6 border-slate-900 bg-slate-950/40">
            <h3 className="text-lg font-bold font-display text-slate-100 border-b border-slate-900 pb-3 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-brand-teal" /> Pending Certificate Issuance
            </h3>

            {eligibleStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-350">
                  <thead>
                    <tr className="text-slate-500 font-semibold text-xs uppercase tracking-wider pb-3 border-b border-slate-900">
                      <th className="pb-3">Intern Code</th>
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Track</th>
                      <th className="pb-3">Batch</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {eligibleStudents.map((st) => {
                      const app = st.application;
                      return (
                        <tr key={st.id}>
                          <td className="py-3.5 font-mono text-xs text-slate-200 font-bold">{st.student_code}</td>
                          <td className="py-3.5 text-slate-200 font-medium">{app?.full_name}</td>
                          <td className="py-3.5 text-xs text-slate-400">{getTrackLabel(app?.internship_track || '')}</td>
                          <td className="py-3.5 text-slate-400">{st.batch_name}</td>
                          <td className="py-3.5 text-right">
                            <Button
                              variant="teal"
                              size="sm"
                              onClick={() => handleIssueCertificate(st.id)}
                              isLoading={isIssuing === st.id}
                              className="font-bold py-1.5 px-3 text-xs"
                            >
                              Issue Certificate
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-xs text-center py-6">No eligible candidates currently require certificate issuance.</p>
            )}
          </Card>

          {/* Section 2: Active Registry Log */}
          <Card variant="glass" className="p-6 border-slate-900 bg-slate-950/40">
            <h3 className="text-lg font-bold font-display text-slate-100 border-b border-slate-900 pb-3 mb-4 flex items-center gap-2">
              <History size={18} className="text-brand-orange" /> Issued Registry Database
            </h3>

            {issuedCerts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-350">
                  <thead>
                    <tr className="text-slate-500 font-semibold text-xs uppercase tracking-wider pb-3 border-b border-slate-900">
                      <th className="pb-3">Certificate ID</th>
                      <th className="pb-3">Issue Date</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Copy & Actions</th>
                      <th className="pb-3 text-right">Revoke</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {issuedCerts.map((cert) => {
                      const isActive = cert.status === 'active';
                      return (
                        <tr key={cert.certificate_id}>
                          <td className="py-3.5 font-mono text-xs text-slate-200 font-bold">{cert.certificate_id}</td>
                          <td className="py-3.5 text-slate-400">{formatDate(cert.issued_at)}</td>
                          <td className="py-3.5">
                            <Badge variant={cert.status}>{cert.status}</Badge>
                          </td>
                          <td className="py-3.5">
                            <div className="flex items-center gap-3">
                              {cert.certificate_pdf_url && (
                                <button
                                  onClick={() => {
                                    setPreviewCert(cert);
                                    setPreviewTimestamp(Date.now());
                                  }}
                                  className="inline-flex items-center gap-1 text-xs text-slate-300 hover:underline font-bold cursor-pointer"
                                >
                                  <Eye size={13} /> Preview
                                </button>
                              )}
                              {cert.certificate_pdf_url && (
                                <a
                                  href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/certificates/${cert.certificate_pdf_url}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-brand-teal hover:underline font-bold"
                                >
                                  <Download size={13} /> PDF
                                </a>
                              )}
                              {isActive && (
                                <button
                                  onClick={() => handleIssueCertificate(cert.student_id, true)}
                                  disabled={isIssuing === cert.student_id}
                                  className="inline-flex items-center gap-1 text-xs text-brand-orange hover:underline font-bold disabled:opacity-50 cursor-pointer"
                                  title="Regenerate Certificate PDF with latest design template layout"
                                >
                                  <RefreshCw size={12} className={isIssuing === cert.student_id ? 'animate-spin' : ''} />
                                  Regen
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 text-right">
                            {isActive ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevokeCertificate(cert.certificate_id)}
                                className="text-xs text-red-400 hover:bg-red-500/5 hover:text-red-300 border-transparent hover:border-red-500/10 p-1.5"
                              >
                                <AlertTriangle size={14} />
                              </Button>
                            ) : (
                              <span className="text-slate-655 text-xs italic">Revoked</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-xs text-center py-6">No certificates have been registered in the database log yet.</p>
            )}
          </Card>
        </div>
      )}

      {/* Tab Contents: Designer Canvas */}
      {activeTab === 'designer' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fadeIn">
          {/* Main Drag-and-drop Workspace */}
          <div className="lg:col-span-3 space-y-4">
            <Card variant="solid" className="p-4 bg-slate-900 border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Event:</span>
                <select
                  value={selectedOpportunityId}
                  onChange={(e) => handleOpportunityChange(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 cursor-pointer focus:outline-none focus:border-brand-teal max-w-xs"
                >
                  {opportunities.map((opp) => (
                    <option key={opp.id} value={opp.id}>
                      {opp.title} {opp.certificate_template_id ? '(linked)' : '(no template)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
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
                  Link & Save Layout Template
                </Button>
              </div>
            </Card>

            {/* The Visual Canvas */}
            <div className="overflow-auto border border-slate-800 rounded-xl bg-slate-950 p-2 shadow-2xl flex items-center justify-center">
              <div
                ref={canvasRef}
                style={{
                  width: `${designerWidth}px`,
                  height: `${designerHeight}px`,
                  backgroundImage: bgUrl ? `url(${bgUrl})` : 'none',
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
                        field.placeholder
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
                    accept="image/*"
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
                    <Input
                      label="Template Text"
                      value={selectedField.placeholder}
                      onChange={(e) => handleUpdateSelectedField('placeholder', e.target.value)}
                    />
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
                      className="px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-250 cursor-pointer"
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
                      className="px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-250 cursor-pointer"
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
      )}
      {/* Certificate Preview & Regeneration Modal */}
      <Modal
        isOpen={!!previewCert}
        onClose={() => setPreviewCert(null)}
        title="Certificate Preview"
        className="max-w-4xl h-[90vh]"
      >
        {previewCert && (
          <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-200">
                  {previewCert.student?.application?.full_name || 'Student Certificate'}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  ID: {previewCert.certificate_id}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/certificates/${previewCert.certificate_pdf_url}`}
                  download={`${previewCert.certificate_id}.pdf`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <Download size={14} /> Download PDF
                </a>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    await handleIssueCertificate(previewCert.student_id, true);
                    // Update preview timestamp to refresh iframe
                    setPreviewTimestamp(Date.now());
                  }}
                  isLoading={isIssuing === previewCert.student_id}
                  className="font-bold text-xs gap-1.5"
                >
                  <RefreshCw size={13} className={isIssuing === previewCert.student_id ? 'animate-spin' : ''} />
                  Regenerate PDF
                </Button>
              </div>
            </div>

            <div className="flex-1 border border-slate-850 rounded-lg overflow-hidden bg-slate-900 min-h-[500px]">
              <iframe
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/certificates/${previewCert.certificate_pdf_url}?t=${previewTimestamp}`}
                className="w-full h-full"
                title="Certificate PDF Preview"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
