import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/api-auth';
import { generateCertificatePDF } from '@/lib/generators/certificate';
import { generateCertificateId, generateVerificationHash, getTrackLabel } from '@/lib/utils';
import { getNextCertificateIndex } from '@/lib/certificates.server';
import type { CertificateType } from '@/lib/database.types';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the admin
    await requireAdmin();

    const { opportunityId, studentIds, forceRegenerate, templateId } = await request.json();

    if (!opportunityId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'Opportunity ID and non-empty student IDs array are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 2. Fetch the opportunity details & template ID
    const { data: opp, error: oppError } = await supabase
      .from('opportunities')
      .select('id, certificate_template_id')
      .eq('id', opportunityId)
      .single();

    if (oppError || !opp) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    // 3. Fetch students details
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        *,
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
      .in('id', studentIds);

    if (studentsError || !students || students.length === 0) {
      return NextResponse.json({ error: 'No valid students found' }, { status: 404 });
    }

    // 4. Fetch the templates. Map by certificate_type.
    const { data: templates } = await supabase
      .from('certificate_templates')
      .select('*');

    // If an explicit template was chosen in the admin UI, apply it to every student.
    let explicitTemplate = null;
    if (templateId) {
      const { data: t } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('id', templateId)
        .maybeSingle();
      if (t) explicitTemplate = t;
    }

    const getTemplateForStudent = (student: any) => {
      const type = student.certificate_type;
      // 1. Explicit selection from admin UI
      if (explicitTemplate) return explicitTemplate;
      // 2. Opportunity template
      const oppTemplate = templates?.find(t => t.id === opp.certificate_template_id);
      if (oppTemplate) return oppTemplate;

      // 3. Type template
      const typeTemplate = templates?.find(t => t.template_type === type && t.is_default);
      if (typeTemplate) return typeTemplate;

      const anyTypeTemplate = templates?.find(t => t.template_type === type);
      if (anyTypeTemplate) return anyTypeTemplate;

      // 4. Global template
      return templates?.[0] || null;
    };

    const currentYear = new Date().getFullYear();
    const issueDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const results = [];

    // 5. Generate certificates in parallel (with simple concurrency or sequential map)
    for (const student of students) {
      try {
        if (student.certificate_type === 'none' || !student.certificate_type) {
          results.push({ studentId: student.id, success: false, error: 'Student is not marked as certificate eligible' });
          continue;
        }

        const app = student.application;
        const certType: CertificateType = student.certificate_type;

        // Check if certificate already exists
        const { data: existingCert } = await supabase
          .from('certificates')
          .select('*')
          .eq('student_id', student.id)
          .eq('certificate_type', certType)
          .maybeSingle();

        if (existingCert && !forceRegenerate) {
          results.push({ studentId: student.id, success: true, alreadyExists: true, certificateId: existingCert.certificate_id });
          continue;
        }

        // Always issue a fresh certificate ID + verification hash, even on regeneration.
        const nextIndex = await getNextCertificateIndex(supabase, app.internship_track, currentYear, certType);
        const certId = generateCertificateId(app.internship_track, currentYear, nextIndex, certType);
        const verifHash = generateVerificationHash();

        const verificationUrl = `https://verify.ujjwalit.co.in/${certId}`;
        const profileSlug = student.profile?.slug;
        const qrTargetUrl = profileSlug
          ? `https://verify.ujjwalit.co.in/student/${profileSlug}`
          : verificationUrl;

        const template = getTemplateForStudent(student);

        // Generate PDF
        const pdfBytes = await generateCertificatePDF({
          studentName: app.full_name,
          programName: getTrackLabel(app.internship_track),
          certificateId: certId,
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

        // Upload to Storage
        const fileName = `${certId}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('certificates')
          .upload(fileName, pdfBytes, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Upsert DB record
        const dbPayload = {
          student_id: student.id,
          opportunity_id: opportunityId,
          template_id: template?.id || null,
          certificate_id: certId,
          certificate_type: certType,
          verification_hash: verifHash,
          certificate_pdf_url: fileName,
          qr_code_url: qrTargetUrl,
          verification_url: verificationUrl,
          status: 'active',
        };

        const saveResult = existingCert
          ? await supabase.from('certificates').update(dbPayload).eq('id', existingCert.id)
          : await supabase.from('certificates').insert(dbPayload);

        if (saveResult.error) throw saveResult.error;

        results.push({ studentId: student.id, success: true, certificateId: certId });
      } catch (err: any) {
        console.error(`Failed to generate certificate for student ${student.id}:`, err);
        results.push({ studentId: student.id, success: false, error: err.message || 'Internal generation error' });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error('Batch certificate generation root error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
