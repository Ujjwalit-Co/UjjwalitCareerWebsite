import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateLetterPDFFromTemplate } from '@/lib/generators/documents';
import { getTrackLabel } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    const { studentId, documentType, backgroundUrl } = await request.json();

    if (!studentId || !documentType) {
      return NextResponse.json(
        { error: 'Student ID and document type are required' },
        { status: 400 }
      );
    }

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

    // Always fetch the saved template from DB — never rely on client state
    const { data: savedTemplate } = await supabase
      .from('certificate_templates')
      .select('fields, background_url')
      .eq('name', `doc-${documentType}`)
      .maybeSingle();
    const templateFields = (savedTemplate?.fields || []) as any[];

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
      verificationUrl: `${process.env.NEXT_PUBLIC_VERIFY_URL || 'https://verify.ujjwalit.co.in'}/${student.student_code}`,
      qrUrl: 'https://careers.ujjwalit.co.in',
    });

    const fileName = `${studentId}/${documentType}.pdf`;

    const ensureBucket = async () => {
      const { data: buckets } = await supabase.storage.listBuckets();
      const existing = buckets?.find((b) => b.name === 'letters');
      if (!existing) {
        await supabase.storage.createBucket('letters', { public: true });
      } else if (!existing.public) {
        await supabase.storage.updateBucket('letters', { public: true });
      }
    };

    let { error: uploadError } = await supabase.storage
      .from('letters')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError?.message?.includes('Bucket not found')) {
      await ensureBucket();
      const { error: retryError } = await supabase.storage
        .from('letters')
        .upload(fileName, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true,
        });
      if (retryError) throw new Error(`Upload error: ${retryError.message}`);
    } else if (uploadError) {
      throw new Error(`Upload error: ${uploadError.message}`);
    }

    const { error: dbError } = await supabase.from('documents').insert({
      student_id: studentId,
      document_type: documentType,
      document_url: fileName,
    });

    if (dbError) {
      throw new Error(`Database record insert error: ${dbError.message}`);
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
