import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface ProfileRow {
  id: string;
  full_name: string;
  slug: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const identifier = (slug || '').trim();

  if (!identifier) {
    return NextResponse.json({ error: 'Student code or profile slug is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    // 1. Resolve the profile by slug, student code, or email
    let profile: ProfileRow | null = null;

    const { data: bySlug } = await supabase
      .from('student_profiles')
      .select('id, full_name, slug')
      .eq('slug', identifier)
      .maybeSingle();
    if (bySlug) profile = bySlug;

    if (!profile) {
      const { data: byEmail } = await supabase
        .from('student_profiles')
        .select('id, full_name, slug')
        .eq('email', identifier.toLowerCase())
        .maybeSingle();
      if (byEmail) profile = byEmail;
    }

    if (!profile) {
      const { data: studentByCode } = await supabase
        .from('students')
        .select('profile_id')
        .eq('student_code', identifier.toUpperCase())
        .maybeSingle();
      if (studentByCode?.profile_id) {
        const { data: byProfile } = await supabase
          .from('student_profiles')
          .select('id, full_name, slug')
          .eq('id', studentByCode.profile_id)
          .maybeSingle();
        if (byProfile) profile = byProfile;
      }
    }

    if (!profile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Remarks column may not exist yet if the remarks migration hasn't been
    // applied, so fetch it in a guarded query that degrades to null.
    let remarks: string | null = null;
    try {
      const { data: remarksRow } = await supabase
        .from('student_profiles')
        .select('remarks')
        .eq('id', profile.id)
        .maybeSingle();
      remarks = remarksRow?.remarks ?? null;
    } catch {
      // column not present yet — remarks stay null
    }

    // 2. All student records linked to this profile
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        id,
        student_code,
        batch_name,
        attendance_percentage,
        project_submitted,
        project_score,
        certificate_type,
        joined_at,
        application:applications (
          full_name,
          college,
          branch,
          internship_track
        ),
        achievement_statements:student_achievement_statements (
          statement:achievement_statements (
            id,
            label,
            body_markdown,
            display_order
          )
        )
      `)
      .eq('profile_id', profile.id)
      .order('joined_at', { ascending: false });

    if (studentsError) {
      console.error('Students query error:', studentsError);
      return NextResponse.json({ error: 'Failed to load student records' }, { status: 500 });
    }

    const normalizedStudents = (students || []).map((s: any) => ({
      ...s,
      achievement_statements: (s.achievement_statements || [])
        .map((j: any) => j.statement)
        .filter(Boolean)
        .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)),
    }));

    const studentIds = normalizedStudents.map((s: { id: string }) => s.id);

    // 3. Active certificates across all their enrollments
    const { data: certificates } = studentIds.length
      ? await supabase
          .from('certificates')
          .select(`
            id,
            certificate_id,
            certificate_type,
            verification_hash,
            certificate_pdf_url,
            status,
            issued_at,
            student:students (student_code, batch_name),
            opportunity:opportunities (title)
          `)
          .in('student_id', studentIds)
          .eq('status', 'active')
          .order('issued_at', { ascending: false })
      : { data: [] };

    return NextResponse.json({
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        slug: profile.slug,
        remarks,
      },
      students: normalizedStudents || [],
      certificates: certificates || [],
    });
  } catch (err) {
    console.error('Student profile API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
