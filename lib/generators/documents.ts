import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generateQRCode } from './qrcode';
import { isCustomFont, loadCustomFont, fontkit } from './fonts';

export interface DocFieldConfig {
  id: string;
  type: 'text' | 'qrcode' | 'image';
  placeholder: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
}

interface LetterParams {
  studentName: string;
  studentCode: string;
  college: string;
  programName: string;
  startDate: string;
  endDate: string;
  documentType: 'acceptance' | 'onboarding' | 'completion' | 'recommendation';
  dateStr: string;
  customText?: string;
  backgroundUrl?: string;
}

interface TemplateLetterParams {
  studentName: string;
  studentCode: string;
  college: string;
  programName: string;
  batchName: string;
  duration: string;
  startDate: string;
  endDate: string;
  dateStr: string;
  backgroundUrl?: string;
  fields?: DocFieldConfig[];
  verificationUrl?: string;
  qrUrl?: string;
  performanceSummary?: string;
  recommendationText?: string;
  documentType?: 'acceptance' | 'onboarding' | 'completion' | 'recommendation';
}

const toTitleCase = (str: string): string => {
  return str.replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
};

const wrapText = (text: string, font: any, fontSize: number, maxWidth: number): string[] => {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    if (paragraph === '') {
      lines.push('');
      continue;
    }
    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) lines.push(currentLine);
  }

  return lines;
};

const hexToRgb = (hex: string) => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
};

const embedCustomFont = async (
  pdfDoc: PDFDocument,
  fontName: string,
  fontWeight: string,
  customFontsCache: Record<string, any>
) => {
  const cacheKey = `${fontName}:${fontWeight}`;
  if (customFontsCache[cacheKey]) return customFontsCache[cacheKey];

  const fontBytes = loadCustomFont(fontName, fontWeight);
  if (!fontBytes) return null;

  try {
    const embeddedFont = await pdfDoc.embedFont(fontBytes);
    customFontsCache[cacheKey] = embeddedFont;
    return embeddedFont;
  } catch (err) {
    console.error(`Error embedding custom font ${fontName}:`, err);
    return null;
  }
};

export async function generateLetterPDFFromTemplate({
  studentName,
  studentCode,
  college,
  programName,
  batchName = '',
  duration = '',
  startDate,
  endDate,
  dateStr,
  backgroundUrl,
  fields,
  verificationUrl,
  qrUrl,
  performanceSummary = '',
  recommendationText = '',
  documentType,
}: TemplateLetterParams): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit as any);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  const designerWidth = 500;
  const designerHeight = 707;
  const scaleX = pageWidth / designerWidth;
  const scaleY = pageHeight / designerHeight;

  if (backgroundUrl) {
    try {
      const bgResponse = await fetch(backgroundUrl);
      const bgBytes = await bgResponse.arrayBuffer();
      if (backgroundUrl.match(/\.pdf$/i)) {
        const sourceDoc = await PDFDocument.load(bgBytes);
        const embeddedPage = await pdfDoc.embedPage(sourceDoc.getPage(0));
        page.drawPage(embeddedPage, {
          x: 0, y: 0, width: pageWidth, height: pageHeight,
        });
      } else {
        let bgImage;
        if (backgroundUrl.match(/\.png$/i)) {
          bgImage = await pdfDoc.embedPng(bgBytes);
        } else {
          bgImage = await pdfDoc.embedJpg(bgBytes);
        }
        page.drawImage(bgImage, {
          x: 0, y: 0, width: pageWidth, height: pageHeight,
        });
      }
    } catch (e) {
      console.warn('Failed to load background, proceeding without it');
    }
  }

  const standardFonts = {
    Serif: await pdfDoc.embedFont(StandardFonts.TimesRoman),
    SerifBold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
    Sans: await pdfDoc.embedFont(StandardFonts.Helvetica),
    SansBold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    Mono: await pdfDoc.embedFont(StandardFonts.Courier),
  };
  const customFontsCache: Record<string, any> = {};

const offerLetterFields: DocFieldConfig[] = [
    { id: '1', type: 'text', placeholder: 'UJJWALIT TECHNOLOGIES PVT. LTD.', x: 60, y: 30, fontSize: 14, fontFamily: 'Sans', fontWeight: 'bold', color: '#0B1D3F', textAlign: 'left' },
    { id: '2', type: 'text', placeholder: 'UJJWALIT DEVELOPERS PROGRAM (UDP) 2026', x: 250, y: 52, fontSize: 11, fontFamily: 'Sans', fontWeight: 'bold', color: '#1A8BA6', textAlign: 'center' },
    { id: '3', type: 'text', placeholder: 'INTERNSHIP OFFER LETTER', x: 250, y: 68, fontSize: 10, fontFamily: 'Sans', fontWeight: 'bold', color: '#0B1D3F', textAlign: 'center' },
    { id: '4', type: 'text', placeholder: `Offer Letter ID: {{offer_id}}\nDate of Issue: {{issue_date}}\n\nDear {{student_name}},\n\nWe are pleased to inform you that, following the review of your application, you have been selected to participate as a {{internship_title}} under the Ujjwalit Developers Program (UDP) 2026, an industry-oriented training and internship initiative conducted by Ujjwalit Technologies Pvt. Ltd.\n\nProgram Details\n\n• Internship Role: {{internship_title}}\n• Batch: {{batch_name}}\n• Mode: Remote\n• Duration: {{duration}}\n• Expected Weekly Commitment: 4-6 Hours\n• Start Date: {{start_date}}\n\nAs a participant in the program, you will gain practical exposure to industry-oriented development workflows through project-based learning, mentorship, and guided implementation.\n\nDuring the internship, you will:\n\n• Work on one Major Project under mentor guidance\n• Complete one Minor Project as part of self-assessment\n• Participate in mentorship and learning sessions\n• Learn modern development tools, workflows, and best practices\n• Build portfolio-ready projects and practical technical skills\n\nUpon successful completion of the program requirements, participants will be eligible to receive a Verifiable Internship Completion Certificate issued by Ujjwalit Technologies Pvt. Ltd.\n\nOutstanding participants may additionally be considered for:\n\n• Letter of Recommendation\n• Project Excellence Recognition\n• Future Opportunities with Ujjwalit Technologies\n• Performance-Based Stipends and Rewards (Limited Selection)\n\nImportant Terms\n\n1. Participation in the program does not guarantee employment with Ujjwalit Technologies Pvt. Ltd.\n2. Successful completion of assigned projects and participation requirements is mandatory for certification.\n3. Participation does not guarantee any stipend, compensation, employment, or monetary benefit.\n4. A limited number of outstanding participants may be considered for performance-based stipends, rewards, and incentives.\n5. Your candidature is subject to all applicable program guidelines, training requirements, and evaluation criteria.\n\nWe look forward to working with you and are excited to have you as part of the Ujjwalit Developers Program.\n\n\nWarm regards,\n\nAuthorized Signatory\nUjjwalit Technologies Pvt. Ltd.`, x: 60, y: 90, fontSize: 8.5, fontFamily: 'Sans', fontWeight: 'normal', color: '#1e293b', textAlign: 'left' },
    { id: '5', type: 'qrcode', placeholder: 'QR_CODE_PLACEHOLDER', x: 410, y: 630, fontSize: 55, fontFamily: 'Sans', fontWeight: 'normal', color: '#000000', textAlign: 'left' },
  ];

  const recommendationFields: DocFieldConfig[] = [
    { id: '1', type: 'text', placeholder: 'UJJWALIT TECHNOLOGIES PVT. LTD.', x: 60, y: 30, fontSize: 14, fontFamily: 'Sans', fontWeight: 'bold', color: '#0B1D3F', textAlign: 'left' },
    { id: '2', type: 'text', placeholder: 'ujjwalit.co.in | Aligarh, Uttar Pradesh, India', x: 60, y: 46, fontSize: 9, fontFamily: 'Sans', fontWeight: 'normal', color: '#64748B', textAlign: 'left' },
    { id: '3', type: 'text', placeholder: 'LETTER OF RECOMMENDATION', x: 250, y: 72, fontSize: 14, fontFamily: 'Sans', fontWeight: 'bold', color: '#1A8BA6', textAlign: 'center' },
    { id: '4', type: 'text', placeholder: `Date: {{issue_date}}\nRef: UT-LOR-{{code}}\n\nTO WHOM IT MAY CONCERN\n\nDear Sir/Madam,\n\nWe are pleased to recommend {{student_name}}, a student of {{college}}, who successfully completed their software engineering training internship at Ujjwalit Technologies in the {{track_name}} track.\n\nThe internship commenced on {{start_date}} and concluded on {{end_date}}.\n\nThroughout the internship, the candidate demonstrated strong technical aptitude, consistent dedication, and a professional approach to their work. They actively participated in mentorship sessions, delivered their project assignments on schedule, and maintained excellent standards of quality and discipline.\n\nWe are confident that {{student_name}}'s technical skills, work ethic, and professional attitude make them an excellent addition to any engineering organization.\n\nWe recommend {{student_name}} without reservation for future academic or professional opportunities.\n\n\nAuthorized Signatory\nTechnology Lead\nUjjwalit Technologies Pvt. Ltd.`, x: 60, y: 95, fontSize: 10.5, fontFamily: 'Sans', fontWeight: 'normal', color: '#0B1D3F', textAlign: 'left' },
    { id: '5', type: 'text', placeholder: 'Secure Credential Verification: https://verify.ujjwalit.co.in', x: 250, y: 685, fontSize: 8, fontFamily: 'Mono', fontWeight: 'normal', color: '#64748B', textAlign: 'center' },
  ];

  const defaultFields: DocFieldConfig[] = fields && fields.length > 0 ? fields : (
    documentType === 'recommendation' ? recommendationFields : offerLetterFields
  );

  const hasQrField = defaultFields.some((f) => f.type === 'qrcode');
  const qrTargetUrl = qrUrl || verificationUrl;
  if (hasQrField && qrTargetUrl) {
    try {
      const qrDataUrl = await generateQRCode(qrTargetUrl);
      const qrClean = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBytes = Buffer.from(qrClean, 'base64');
      const qrImage = await pdfDoc.embedPng(qrBytes);

      let qrX = pageWidth - 110;
      let qrY = 40;
      let qrSize = 75;

      const qrField = defaultFields.find((f) => f.type === 'qrcode');
      if (qrField) {
        qrX = qrField.x * scaleX;
        qrY = pageHeight - (qrField.y * scaleY) - (qrField.fontSize * scaleY || 75);
        qrSize = (qrField.fontSize || 75) * scaleY;
      }

      page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
    } catch (err) {
      console.error('Failed to embed QR code:', err);
    }
  }

  const lineHeightRatio = 1.4;

  for (const field of defaultFields) {
    if (field.type === 'qrcode') continue;

    let text = field.placeholder
      .replace(/\{\{name\}\}/g, toTitleCase(studentName))
      .replace(/\{\{student_name\}\}/g, toTitleCase(studentName))
      .replace(/\{\{college\}\}/g, toTitleCase(college))
      .replace(/\{\{program\}\}/g, programName)
      .replace(/\{\{track_name\}\}/g, programName)
      .replace(/\{\{code\}\}/g, studentCode)
      .replace(/\{\{offer_id\}\}/g, batchName)
      .replace(/\{\{batch_name\}\}/g, batchName)
      .replace(/\{\{duration\}\}/g, duration)
      .replace(/\{\{date\}\}/g, dateStr)
      .replace(/\{\{issue_date\}\}/g, dateStr)
      .replace(/\{\{internship_title\}\}/g, programName)
      .replace(/\{\{startDate\}\}/g, startDate)
      .replace(/\{\{start_date\}\}/g, startDate)
      .replace(/\{\{endDate\}\}/g, endDate)
      .replace(/\{\{performance_summary\}\}/g, performanceSummary)
      .replace(/\{\{recommendation_text\}\}/g, recommendationText);

    let font = standardFonts.Sans;
    if (isCustomFont(field.fontFamily)) {
      const loadedFont = await embedCustomFont(pdfDoc, field.fontFamily, field.fontWeight, customFontsCache);
      if (loadedFont) font = loadedFont;
    } else if (field.fontFamily.includes('Serif')) {
      font = field.fontWeight === 'bold' ? standardFonts.SerifBold : standardFonts.Serif;
    } else if (field.fontFamily.includes('Mono')) {
      font = standardFonts.Mono;
    } else if (field.fontWeight === 'bold') {
      font = standardFonts.SansBold;
    }

    const size = field.fontSize * scaleY;
    const lineHeight = size * lineHeightRatio;
    const color = hexToRgb(field.color || '#000000');

    const getMaxWidth = () => {
      const rightPad = 20;
      if (field.textAlign === 'left') return (designerWidth - field.x - rightPad) * scaleX;
      if (field.textAlign === 'center') return (Math.min(field.x, designerWidth - field.x) - 10) * 2 * scaleX;
      return (field.x - rightPad) * scaleX;
    };

    const wrappedLines = wrapText(text, font, size, getMaxWidth());
    let baseY = pageHeight - (field.y * scaleY) - size;

    for (const line of wrappedLines) {
      if (line === '') {
        baseY -= lineHeight;
        continue;
      }

      let x = field.x * scaleX;
      if (field.textAlign === 'center') {
        const textWidth = font.widthOfTextAtSize(line, size);
        x = x - (textWidth / 2);
      } else if (field.textAlign === 'right') {
        const textWidth = font.widthOfTextAtSize(line, size);
        x = x - textWidth;
      }

      page.drawText(line, { x, y: baseY, size, font, color });
      baseY -= lineHeight;
    }
  }

  return await pdfDoc.save();
}

export async function generateLetterPDF({
  studentName,
  studentCode,
  college,
  programName,
  startDate,
  endDate,
  documentType,
  dateStr,
  customText,
  backgroundUrl,
}: LetterParams): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  if (backgroundUrl) {
    try {
      const bgResponse = await fetch(backgroundUrl);
      const bgBytes = await bgResponse.arrayBuffer();
      if (backgroundUrl.match(/\.pdf$/i)) {
        const sourceDoc = await PDFDocument.load(bgBytes);
        const embeddedPage = await pdfDoc.embedPage(sourceDoc.getPage(0));
        page.drawPage(embeddedPage, {
          x: 0, y: 0, width: pageWidth, height: pageHeight,
        });
      } else {
        let bgImage;
        if (backgroundUrl.match(/\.png$/i)) {
          bgImage = await pdfDoc.embedPng(bgBytes);
        } else {
          bgImage = await pdfDoc.embedJpg(bgBytes);
        }
        page.drawImage(bgImage, {
          x: 0, y: 0, width: pageWidth, height: pageHeight,
          opacity: 0.15,
        });
      }
    } catch (e) {
      console.warn('Failed to load background, proceeding without it');
    }
  }

  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontCourier = await pdfDoc.embedFont(StandardFonts.Courier);

  const colorNavy = rgb(11/255, 29/255, 63/255);
  const colorTeal = rgb(26/255, 139/255, 166/255);
  const colorGray = rgb(100/255, 116/255, 139/255);

  page.drawRectangle({
    x: 40, y: pageHeight - 65, width: pageWidth - 80, height: 3, color: colorNavy,
  });

  page.drawText('UJJWALIT TECHNOLOGIES', {
    x: 40, y: pageHeight - 50, size: 16, font: fontHelveticaBold, color: colorNavy,
  });

  page.drawText('ujjwalit.co.in | Aligarh, Uttar Pradesh, India', {
    x: pageWidth - 260, y: pageHeight - 50, size: 9, font: fontHelvetica, color: colorGray,
  });

  let yPos = pageHeight - 110;

  page.drawText(`Date: ${dateStr}`, { x: 40, y: yPos, size: 10, font: fontHelvetica });
  page.drawText(`Ref: UT-${documentType.toUpperCase()}-${new Date().getFullYear()}-${studentCode.split('-')[2]}`, { x: 40, y: yPos - 15, size: 10, font: fontHelvetica });

  yPos -= 50;
  page.drawText('TO WHOM IT MAY CONCERN', {
    x: 40, y: yPos, size: 11, font: fontHelveticaBold, color: colorNavy,
  });

  yPos -= 25;
  page.drawText('Candidate Details:', { x: 40, y: yPos, size: 10, font: fontHelveticaBold });
  page.drawText(`Name: ${toTitleCase(studentName)}`, { x: 40, y: yPos - 15, size: 10, font: fontHelvetica });
  page.drawText(`Student Code: ${studentCode}`, { x: 40, y: yPos - 30, size: 10, font: fontHelvetica });
  page.drawText(`College: ${toTitleCase(college)}`, { x: 40, y: yPos - 45, size: 10, font: fontHelvetica });
  page.drawText(`Track: ${programName}`, { x: 40, y: yPos - 60, size: 10, font: fontHelvetica });

  yPos -= 105;
  const titles: Record<string, string> = {
    acceptance: 'OFFER OF INTERNSHIP',
    onboarding: 'INTERNSHIP JOINING & ONBOARDING LETTER',
    completion: 'INTERNSHIP COMPLETION CERTIFICATION',
    recommendation: 'LETTER OF RECOMMENDATION',
  };

  const titleText = titles[documentType];
  const titleWidth = fontHelveticaBold.widthOfTextAtSize(titleText, 13);

  page.drawText(titleText, {
    x: pageWidth / 2 - titleWidth / 2, y: yPos, size: 13, font: fontHelveticaBold, color: colorTeal,
  });

  yPos -= 35;

  const writeParagraph = (text: string, size = 10.5, leading = 15) => {
    const words = text.split(' ');
    let line = '';
    const maxWidth = pageWidth - 90;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const testWidth = fontHelvetica.widthOfTextAtSize(testLine, size);
      if (testWidth > maxWidth && i > 0) {
        page.drawText(line, { x: 45, y: yPos, size, font: fontHelvetica });
        yPos -= leading;
        line = words[i] + ' ';
      } else {
        line = testLine;
      }
    }
    if (line) {
      page.drawText(line, { x: 45, y: yPos, size, font: fontHelvetica });
      yPos -= leading;
    }
  };

  if (customText) {
    const lines = customText.split('\n');
    for (const line of lines) {
      if (line.trim() === '') {
        yPos -= 10;
        continue;
      }
      const processedLine = line
        .replace(/\{\{name\}\}/g, toTitleCase(studentName))
        .replace(/\{\{college\}\}/g, toTitleCase(college))
        .replace(/\{\{program\}\}/g, programName)
        .replace(/\{\{startDate\}\}/g, startDate)
        .replace(/\{\{endDate\}\}/g, endDate);
      writeParagraph(processedLine);
      yPos -= 10;
    }
  } else if (documentType === 'acceptance') {
    writeParagraph(`Dear ${toTitleCase(studentName)},`);
    yPos -= 10;
    writeParagraph(`Following your application and review process, we are pleased to offer you an internship position as a Software Engineering Intern specializing in ${programName} with Ujjwalit Technologies.`);
    yPos -= 10;
    writeParagraph(`Your internship training is scheduled to begin on ${startDate} and complete on ${endDate}. During this tenure, you will work on production-level projects under direct developer guidance, participating in periodic performance evaluations.`);
    yPos -= 10;
    writeParagraph('Please note that this is a remote, unpaid training internship. The goal of this program is to foster real practical development habits. Upon successful submission of capstone project guidelines, you will receive a cryptographically verifiable completion certificate.');
    yPos -= 10;
    writeParagraph('We look forward to having you work with our technology group.');
  } else if (documentType === 'onboarding') {
    writeParagraph(`Dear ${toTitleCase(studentName)},`);
    yPos -= 10;
    writeParagraph(`We welcome you to Ujjwalit Technologies. We are excited to verify your registration fee payment and officially enroll you in our upcoming batch beginning ${startDate}.`);
    yPos -= 10;
    writeParagraph('To begin your onboarding workflow, please follow these steps:');
    yPos -= 8;
    writeParagraph('1. Join the official developer channels and Slack/WhatsApp groups shared in your confirmation email.');
    yPos -= 5;
    writeParagraph('2. Clone the sandbox boilerplate repository and read the developer setup instructions.');
    yPos -= 5;
    writeParagraph('3. Introduce yourself to your designated project lead and check-in to your first team scrum.');
    yPos -= 10;
    writeParagraph('Your training requirements include consistent check-ins, timely progress updates on task boards, and standard git commit habits.');
  } else if (documentType === 'completion') {
    writeParagraph('TO WHOM IT MAY CONCERN');
    yPos -= 15;
    writeParagraph(`This is to certify that ${toTitleCase(studentName)}, a student of ${toTitleCase(college)}, has successfully completed their software engineering training internship at Ujjwalit Technologies in the ${programName} track.`);
    yPos -= 10;
    writeParagraph(`The internship commenced on ${startDate} and concluded on ${endDate}.`);
    yPos -= 10;
    writeParagraph(`During this tenure, the candidate worked on full-stack architecture implementations, database operations, and API integrations. They demonstrated consistency in their project deliverables and achieved a project score of 85%+ in their final evaluation.`);
    yPos -= 10;
    writeParagraph('We wish the candidate success in all their future software engineering endeavors.');
  } else {
    writeParagraph('TO WHOM IT MAY CONCERN');
    yPos -= 15;
    writeParagraph(`I am writing to highly recommend ${toTitleCase(studentName)} for software engineering roles. They interned with the engineering department at Ujjwalit Technologies as a specialized ${programName} developer from ${startDate} to ${endDate}.`);
    yPos -= 10;
    writeParagraph('During the training tenure, the candidate demonstrated outstanding coding capabilities, modular architecture implementation habits, and quick adoption of Next.js, Supabase, and TypeScript features.');
    yPos -= 10;
    writeParagraph('They took total ownership of building complex project features, demonstrating leadership qualities and an agile developer mindset. I am confident they will prove to be an invaluable asset to any engineering organization.');
  }

  yPos -= 70;
  page.drawText('Authorized Signatory,', { x: 45, y: yPos, size: 10, font: fontHelveticaBold, color: colorNavy });
  page.drawText('Technology Lead', { x: 45, y: yPos - 15, size: 9, font: fontHelvetica, color: colorGray });
  page.drawText('Ujjwalit Technologies', { x: 45, y: yPos - 30, size: 9, font: fontHelvetica, color: colorGray });

  page.drawRectangle({
    x: 40, y: 75, width: pageWidth - 80, height: 1, color: colorGray,
  });

  page.drawText('Secure Credential Verification:', { x: 40, y: 55, size: 8, font: fontHelveticaBold, color: colorNavy });
  page.drawText(`Scan QR code on certificate copies or navigate to https://verify.ujjwalit.co.in to check code: ${studentCode}`, {
    x: 40, y: 43, size: 7.5, font: fontCourier, color: colorGray,
  });

  return await pdfDoc.save();
}
