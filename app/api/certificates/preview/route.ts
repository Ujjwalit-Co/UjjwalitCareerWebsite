import { NextRequest, NextResponse } from 'next/server';
import { generateCertificatePDF } from '@/lib/generators/certificate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateBackgroundUrl, templateFields } = body;

    // Generate transient PDF without storing to db
    const pdfBytes = await generateCertificatePDF({
      studentName: 'John Doe',
      programName: 'Sample Program',
      certificateId: 'SAMPLE-12345',
      issueDate: new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      verificationUrl: 'https://verify.ujjwalit.co.in/SAMPLE-12345',
      templateBackgroundUrl,
      templateFields,
    });

    // Return the PDF as base64 so it can be previewed seamlessly
    const base64 = Buffer.from(pdfBytes).toString('base64');

    return NextResponse.json({ success: true, pdfBase64: base64 });
  } catch (err: any) {
    console.error('Transient PDF generation error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
