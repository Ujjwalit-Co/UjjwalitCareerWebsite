import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/api-auth';
import { generateLetterPDFFromTemplate } from '@/lib/generators/documents';
import { getTrackLabel } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the admin
    await requireAdmin();

    const { studentId, documentType, backgroundUrl, performanceSummary, recommendationText } = await request.json();

    if (!studentId || !documentType) {
      return NextResponse.json(
        { error: 'Student ID and document type are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 2. Fetch student details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        application:applications (
          full_name,
          college,
          branch,
          internship_track
        ),
        opportunity:opportunities (
          id,
          duration_label
        )
      `)
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const app = student.application;
    const startDate = new Date(student.joined_at).toLocaleDateString('en-IN');
    const endDate = new Date(
      new Date(student.joined_at).getTime() + 60 * 24 * 60 * 60 * 1000
    ).toLocaleDateString('en-IN');
    const dateStr = new Date().toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    const programName = getTrackLabel(app.internship_track);
    const durationLabel = student.opportunity?.duration_label || '6 Weeks';

    // 3. Fetch template from DB
    const { data: savedTemplate } = await supabase
      .from('certificate_templates')
      .select('fields, background_url')
      .eq('name', `doc-${documentType}`)
      .maybeSingle();

    const templateFields = (savedTemplate?.fields || []) as any[];

    // 4. Generate PDF from template
    const pdfBytes = await generateLetterPDFFromTemplate({
      studentName: app.full_name,
      studentCode: student.student_code,
      college: app.college,
      programName,
      batchName: student.batch_name || '',
      duration: durationLabel,
      startDate,
      endDate,
      dateStr,
      backgroundUrl: backgroundUrl || savedTemplate?.background_url || undefined,
      fields: templateFields,
      verificationUrl: `https://verify.ujjwalit.co.in/${student.student_code}`,
      qrUrl: 'https://careers.ujjwalit.co.in',
      performanceSummary: performanceSummary || '',
      recommendationText: recommendationText || '',
    });

    const fileName = `${studentId}/${documentType}.pdf`;

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const existing = buckets?.find((b) => b.name === 'letters');
    if (!existing) {
      await supabase.storage.createBucket('letters', { public: true });
    }

    // 5. Upload document (replace if exists)
    const { error: uploadError } = await supabase.storage
      .from('letters')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload error: ${uploadError.message}`);
    }

    // 6. Save or update database entry (idempotent unique constraint)
    const { error: dbError } = await supabase.from('documents').upsert({
      student_id: studentId,
      document_type: documentType,
      document_url: fileName,
      opportunity_id: student.opportunity?.id || null,
    });

    if (dbError) {
      throw new Error(`Database record save error: ${dbError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('letters')
      .getPublicUrl(fileName);

    return NextResponse.json({ success: true, fileName, publicUrl });
  } catch (err: any) {
    console.error('Letter generation error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
