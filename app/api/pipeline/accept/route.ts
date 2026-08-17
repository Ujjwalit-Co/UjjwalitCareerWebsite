import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/api-auth';
import { generateLetterPDFFromTemplate } from '@/lib/generators/documents';
import { getTrackLabel } from '@/lib/utils';
import { sendEmail, getAcceptanceEmailHtml } from '@/lib/email/resend';

export async function POST(request: NextRequest) {
  try {
    // 1. Authorize admin
    await requireAdmin();

    const { applicationId, opportunityId } = await request.json();
    if (!applicationId || !opportunityId) {
      return NextResponse.json({ error: 'Application ID and Opportunity ID are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 2. Fetch application and opportunity details
    const { data: app, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const { data: opp, error: oppError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (oppError || !opp) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    // 3. Upsert student profile
    const profileSlug = `UJP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: profile, error: profileError } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('email', app.email)
      .maybeSingle();

    let finalProfile = profile;
    if (profileError) throw profileError;

    if (!profile) {
      const { data: newProfile, error: createProfileError } = await supabase
        .from('student_profiles')
        .insert({
          email: app.email,
          full_name: app.full_name,
          slug: profileSlug,
        })
        .select()
        .single();

      if (createProfileError) throw createProfileError;
      finalProfile = newProfile;
    }

    // 4. Generate Student Code and Create Student Record
    const studentCode = `STU-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        application_id: app.id,
        opportunity_id: opp.id,
        profile_id: finalProfile.id,
        student_code: studentCode,
        batch_name: opp.cohort_label || 'Cohort ' + new Date().getFullYear(),
        stage: 'accepted',
      })
      .select()
      .single();

    if (studentError) {
      // If student creation fails, delete profile if we just created it
      if (!profile) {
        await supabase.from('student_profiles').delete().eq('id', finalProfile.id);
      }
      throw studentError;
    }

    // 5. Update application status
    const { error: appStatusError } = await supabase
      .from('applications')
      .update({ application_status: 'accepted' })
      .eq('id', app.id);

    if (appStatusError) throw appStatusError;

    // 6. Generate Offer Letter
    const startDate = new Date().toLocaleDateString('en-IN');
    const endDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN');
    const dateStr = new Date().toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    const programName = getTrackLabel(app.internship_track);
    const durationLabel = opp.duration_label || '6 Weeks';

    // Fetch acceptance letter template from DB
    const { data: savedTemplate } = await supabase
      .from('certificate_templates')
      .select('fields, background_url')
      .eq('name', 'doc-acceptance')
      .maybeSingle();

    const templateFields = (savedTemplate?.fields || []) as any[];

    const pdfBytes = await generateLetterPDFFromTemplate({
      studentName: app.full_name,
      studentCode: studentCode,
      college: app.college,
      programName,
      batchName: student.batch_name,
      duration: durationLabel,
      startDate,
      endDate,
      dateStr,
      backgroundUrl: savedTemplate?.background_url || undefined,
      fields: templateFields,
      verificationUrl: `https://verify.ujjwalit.co.in/${studentCode}`,
      qrUrl: 'https://careers.ujjwalit.co.in',
    });

    const fileName = `${student.id}/acceptance.pdf`;

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const existing = buckets?.find((b) => b.name === 'letters');
    if (!existing) {
      await supabase.storage.createBucket('letters', { public: true });
    }

    // Upload offer letter
    const { error: uploadError } = await supabase.storage
      .from('letters')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Save document reference with upsert capability
    await supabase.from('documents').upsert({
      student_id: student.id,
      document_type: 'acceptance',
      document_url: fileName,
      opportunity_id: opp.id,
    });

    // Acceptance email is opt-in — admin sends it manually from the pipeline UI
    // Offer letter PDF is already uploaded and linked above

    return NextResponse.json({ success: true, student });
  } catch (err: any) {
    console.error('Error accepting candidate:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
