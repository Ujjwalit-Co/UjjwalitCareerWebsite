import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateCertificatePDF } from '@/lib/generators/certificate';
import { generateCertificateId, generateVerificationHash, getTrackLabel } from '@/lib/utils';
import { getNextCertificateIndex } from '@/lib/certificates.server';
import type { CertificateType } from '@/lib/database.types';
import { requireAdmin } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    // 1. Authenticate the admin
    await requireAdmin();

    const { studentId, forceRegenerate, templateId } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // 2. Query student, eligibility, profile, and associated opportunity templates
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        opportunity:opportunities (
          id,
          certificate_template_id
        ),
        profile:student_profiles (
          id,
          slug
        ),
        application:applications (
          full_name,
          email,
          college,
          branch,
          internship_track
        )
      `)
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (student.certificate_type === 'none' || !student.certificate_type) {
      return NextResponse.json(
        { error: 'Student is not marked as certificate eligible' },
        { status: 400 }
      );
    }

    const app = student.application;
    const certificateType: CertificateType = student.certificate_type;
    const currentYear = new Date().getFullYear();

    // 1. Check if the student already holds a certificate of this type
    const { data: existingCert } = await supabase
      .from('certificates')
      .select('*')
      .eq('student_id', studentId)
      .eq('certificate_type', certificateType)
      .maybeSingle();

    if (existingCert && !forceRegenerate) {
      return NextResponse.json(
        { error: `Certificate already issued: ${existingCert.certificate_id}` },
        { status: 400 }
      );
    }

    // On regeneration, preserve the original certificate ID, verification hash,
    // and verification URL so any link already shared keeps working. Only the
    // PDF is re-rendered with the student's current data.
    const nextIndex = await getNextCertificateIndex(supabase, app.internship_track, currentYear, certificateType);
    const certificateId =
      existingCert && forceRegenerate
        ? existingCert.certificate_id
        : generateCertificateId(app.internship_track, currentYear, nextIndex, certificateType);

    const verificationHash =
      existingCert && forceRegenerate
        ? existingCert.verification_hash
        : generateVerificationHash();

    // Verification URL points to the individual certificate registry page
    const verificationUrl = `https://verify.ujjwalit.co.in/${certificateId}`;
    // QR encodes the stable student profile URL (same across all of a person's certificates)
    const profileSlug = student.profile?.slug;
    const qrTargetUrl = profileSlug
      ? `https://verify.ujjwalit.co.in/student/${profileSlug}`
      : verificationUrl;

    // 4. Fetch custom template: explicit selection → opportunity-linked → matching type → default fallback
    let template = null;

    if (templateId) {
      const { data: t } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('id', templateId)
        .maybeSingle();
      if (t) template = t;
    }

    if (!template) {
      const oppTemplateId = student.opportunity?.certificate_template_id;
      if (oppTemplateId) {
        const { data: t } = await supabase
          .from('certificate_templates')
          .select('*')
          .eq('id', oppTemplateId)
          .maybeSingle();
        if (t) template = t;
      }
    }

    if (!template) {
      const { data: t } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('template_type', certificateType)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (t) template = t;
    }

    if (!template) {
      const { data: t } = await supabase
        .from('certificate_templates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      template = t;
    }

    // 5. Generate PDF
    const issueDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const pdfBytes = await generateCertificatePDF({
      studentName: app.full_name,
      programName: getTrackLabel(app.internship_track),
      certificateId,
      issueDate,
      verificationUrl,
      qrTargetUrl,
      college: app.college,
      batchName: student.batch_name,
      studentCode: student.student_code,
      attendance: student.attendance_percentage,
      templateBackgroundUrl: template?.background_url || undefined,
      templateFields: template?.fields || undefined,
    });

    // 6. Upload certificate PDF to Supabase Storage 'certificates' bucket (public)
    const fileName = `${certificateId}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload error: ${uploadError.message}`);
    }

    // 7. Save or update certificate details in certificates table
    const dbPayload = {
      student_id: studentId,
      opportunity_id: student.opportunity_id || null,
      template_id: template?.id || null,
      certificate_id: certificateId,
      certificate_type: certificateType,
      verification_hash: verificationHash,
      certificate_pdf_url: fileName,
      qr_code_url: qrTargetUrl,
      verification_url: verificationUrl,
      status: 'active',
    };

    const result = existingCert && forceRegenerate
      ? await supabase.from('certificates').update(dbPayload).eq('id', existingCert.id)
      : await supabase.from('certificates').insert(dbPayload);

    if (result.error) {
      throw new Error(`Registry database save error: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, certificateId });
  } catch (err) {
    console.error('Certificate generation error:', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
