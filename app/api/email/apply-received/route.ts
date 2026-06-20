import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getApplyReceivedEmailHtml } from '@/lib/email/resend';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { name, email, programTitle } = await request.json();

    if (!name || !email || !programTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const html = getApplyReceivedEmailHtml(name, programTitle);
    const result = await sendEmail({
      to: email,
      subject: `Application Received - ${programTitle}`,
      html,
    });

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to dispatch email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Email dispatched successfully' });
  } catch (err: any) {
    console.error('Email route error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
