import { NextRequest, NextResponse } from 'next/server';
import { generateLetterPDF, generateLetterPDFFromTemplate } from '@/lib/generators/documents';

const sampleParams = {
  studentName: 'Sample Student',
  studentCode: 'UJT-SAMPLE-001',
  college: 'Sample University',
  programName: 'Web Development',
  batchName: 'UDP 2026',
  duration: '60 Days',
  startDate: '1 January 2026',
  endDate: '28 February 2026',
  dateStr: new Date().toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  }),
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentType, customText, backgroundUrl, fields, verificationUrl } = body;

    let pdfBytes: Uint8Array;

    if (fields) {
      pdfBytes = await generateLetterPDFFromTemplate({
        ...sampleParams,
        backgroundUrl,
        fields,
        verificationUrl: verificationUrl || 'https://verify.ujjwalit.co.in/sample',
        qrUrl: 'https://careers.ujjwalit.co.in',
      });
    } else {
      pdfBytes = await generateLetterPDF({
        ...sampleParams,
        documentType: documentType || 'acceptance',
        customText,
        backgroundUrl,
      });
    }

    const base64 = Buffer.from(pdfBytes).toString('base64');
    return NextResponse.json({ success: true, pdfBase64: base64 });
  } catch (err: any) {
    console.error('Transient document PDF generation error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
