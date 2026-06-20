import { NextRequest, NextResponse } from 'next/server';
import { generateLetterPDF } from '@/lib/generators/documents';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentType, customText, backgroundUrl } = body;

    const pdfBytes = await generateLetterPDF({
      studentName: 'Sample Student',
      studentCode: 'UJT-SAMPLE-001',
      college: 'Sample University',
      programName: 'Web Development',
      startDate: '1 January 2026',
      endDate: '28 February 2026',
      documentType: documentType || 'acceptance',
      dateStr: new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      customText,
      backgroundUrl,
    });

    const base64 = Buffer.from(pdfBytes).toString('base64');
    return NextResponse.json({ success: true, pdfBase64: base64 });
  } catch (err: any) {
    console.error('Transient document PDF generation error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
