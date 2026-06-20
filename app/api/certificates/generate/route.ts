import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateCertificatePDF } from '@/lib/generators/certificate';
import { generateCertificateId, generateVerificationHash, getTrackLabel } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    const { studentId, forceRegenerate } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // 1. Check if student already has a certificate
    const { data: existingCert } = await supabase
      .from('certificates')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (existingCert && !forceRegenerate) {
      return NextResponse.json(
        { error: `Certificate already issued: ${existingCert.certificate_id}` },
        { status: 400 }
      );
    }

    // 2. Query student, eligibility, track, and associated opportunity templates
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        opportunity_id,
        opportunity:opportunities (
          id,
          certificate_template_id
        ),
        application:applications (
          full_name,
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

    if (!student.certificate_eligible) {
      return NextResponse.json(
        { error: 'Student is not marked as certificate eligible' },
        { status: 400 }
      );
    }

    const app = student.application;
    const currentYear = new Date().getFullYear();

    let certificateId = '';
    let verificationHash = '';

    if (existingCert && forceRegenerate) {
      // Use existing credentials
      certificateId = existingCert.certificate_id;
      verificationHash = existingCert.verification_hash;
    } else {
      // Generate new credentials
      const { count, error: countError } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      const nextIndex = (count || 0) + 1;
      certificateId = generateCertificateId(app.internship_track, currentYear, nextIndex);
      verificationHash = generateVerificationHash();
    }

    // Verification URL format pointing to subdomain
    const verificationUrl = `https://verify.ujjwalit.co.in/${certificateId}`;

    // 4. Fetch custom template linked to this opportunity, otherwise use latest config fallback
    let template = null;
    const templateId = (student as any)?.opportunity?.certificate_template_id;
    if (templateId) {
      const { data: t } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('id', templateId)
        .maybeSingle();
      template = t;
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
    const pdfBytes = await generateCertificatePDF({
      studentName: app.full_name,
      programName: getTrackLabel(app.internship_track),
      certificateId,
      issueDate: new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      verificationUrl,
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
      certificate_id: certificateId,
      verification_hash: verificationHash,
      certificate_pdf_url: fileName,
      qr_code_url: verificationUrl,
      status: 'active',
    };

    const result = existingCert && forceRegenerate
      ? await supabase.from('certificates').update(dbPayload).eq('id', existingCert.id)
      : await supabase.from('certificates').insert(dbPayload);

    if (result.error) {
      throw new Error(`Registry database save error: ${result.error.message}`);
    }

    return NextResponse.json({ success: true, certificateId });
  } catch (err: any) {
    console.error('Certificate generation error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
