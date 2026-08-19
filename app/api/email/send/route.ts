import { NextRequest, NextResponse } from 'next/server';
import { sendToStudent } from '@/lib/email/send-to-student';
import { requireAdmin } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { studentId, type, customSubject, customHtml, attachCertificate, attachLor } = await request.json();

    if (!studentId || !type) {
      return NextResponse.json({ error: 'Student ID and email type are required' }, { status: 400 });
    }

    const result = await sendToStudent({
      studentId,
      type,
      customSubject,
      customHtml,
      attachCertificate,
      attachLor,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Email dispatcher error:', err);
    const message = err instanceof Error && err.message === 'Unauthorized'
      ? 'Unauthorized'
      : (err?.message || 'Internal error');
    return NextResponse.json({ error: message }, { status: err instanceof Error && err.message === 'Unauthorized' ? 401 : 500 });
  }
}