import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rows: { student_code: string; attendance_percentage?: string | number; project_score?: string | number; project_submitted?: boolean | string }[] =
      body.rows || [];

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: students, error: listErr } = await supabase
      .from('students')
      .select('id, student_code, opportunity_id, opportunity:opportunities(slug, title)');

    if (listErr) throw listErr;

    const byCode = new Map((students || []).map((s) => [s.student_code.toLowerCase(), s]));
    const patches: { id: string; patch: Record<string, unknown> }[] = [];
    const unmatched: string[] = [];
    const skipped: string[] = [];

    const parsePct = (v: string | number) => {
      const n = Math.min(100, Math.max(0, parseFloat(String(v)) || 0));
      return Math.round(n * 100) / 100;
    };

    for (const row of rows) {
      const code = (row.student_code || '').trim();
      if (!code) continue;
      const student = byCode.get(code.toLowerCase());
      if (!student) {
        unmatched.push(code);
        continue;
      }

      const hasAttendance = row.attendance_percentage !== undefined && row.attendance_percentage !== null && String(row.attendance_percentage).trim() !== '';
      const hasScore = row.project_score !== undefined && row.project_score !== null && String(row.project_score).trim() !== '';
      const hasSubmitted = row.project_submitted !== undefined && row.project_submitted !== null && String(row.project_submitted).trim() !== '';

      if (!hasAttendance && !hasScore && !hasSubmitted) {
        skipped.push(code);
        continue;
      }

      const patch: Record<string, unknown> = {};
      if (hasAttendance) patch.attendance_percentage = parsePct(row.attendance_percentage!);
      if (hasScore) patch.project_score = parsePct(row.project_score!);
      if (hasSubmitted) {
        patch.project_submitted = String(row.project_submitted).toLowerCase().trim() === 'true' || String(row.project_submitted) === '1';
      }
      patches.push({ id: student.id, patch });
    }

    let updatedCount = 0;
    for (const { id, patch } of patches) {
      const { error } = await supabase.from('students').update(patch).eq('id', id);
      if (error) {
        console.error('Bulk import update failed', id, error);
      } else {
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      total: rows.length,
      updated: updatedCount,
      unmatched,
      skipped,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to import CSV rows' }, { status: 500 });
  }
}