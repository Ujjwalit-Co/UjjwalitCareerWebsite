import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface LetterParams {
  studentName: string;
  studentCode: string;
  college: string;
  programName: string;
  startDate: string;
  endDate: string;
  documentType: 'acceptance' | 'onboarding' | 'completion' | 'recommendation';
  dateStr: string;
}

/**
 * Generates administrative letters in PDF format (A4 Portrait)
 */
export async function generateLetterPDF({
  studentName,
  studentCode,
  college,
  programName,
  startDate,
  endDate,
  documentType,
  dateStr,
}: LetterParams): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  // A4 Portrait dimensions: 595.28 x 841.89
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontCourier = await pdfDoc.embedFont(StandardFonts.Courier);

  // Helper colors
  const colorNavy = rgb(11/255, 29/255, 63/255);
  const colorTeal = rgb(26/255, 139/255, 166/255);
  const colorGray = rgb(100/255, 116/255, 139/255);

  // 1. Draw Letterhead Border and Logo Bar
  page.drawRectangle({
    x: 40,
    y: pageHeight - 65,
    width: pageWidth - 80,
    height: 3,
    color: colorNavy,
  });

  page.drawText('UJJWALIT TECHNOLOGIES', {
    x: 40,
    y: pageHeight - 50,
    size: 16,
    font: fontHelveticaBold,
    color: colorNavy,
  });

  page.drawText('ujjwalit.co.in | Pune, Maharashtra, India', {
    x: pageWidth - 260,
    y: pageHeight - 50,
    size: 9,
    font: fontHelvetica,
    color: colorGray,
  });

  // 2. Add Meta info (Date, Recipient)
  let yPos = pageHeight - 110;
  
  page.drawText(`Date: ${dateStr}`, { x: 40, y: yPos, size: 10, font: fontHelvetica });
  page.drawText(`Ref: UT-${documentType.toUpperCase()}-${new Date().getFullYear()}-${studentCode.split('-')[2]}`, { x: 40, y: yPos - 15, size: 10, font: fontHelvetica });

  yPos -= 50;
  page.drawText('TO WHOM IT MAY CONCERN', {
    x: 40,
    y: yPos,
    size: 11,
    font: fontHelveticaBold,
    color: colorNavy,
  });

  yPos -= 25;
  page.drawText('Candidate Details:', { x: 40, y: yPos, size: 10, font: fontHelveticaBold });
  page.drawText(`Name: ${studentName}`, { x: 40, y: yPos - 15, size: 10, font: fontHelvetica });
  page.drawText(`Student Code: ${studentCode}`, { x: 40, y: yPos - 30, size: 10, font: fontHelvetica });
  page.drawText(`College: ${college}`, { x: 40, y: yPos - 45, size: 10, font: fontHelvetica });
  page.drawText(`Track: ${programName}`, { x: 40, y: yPos - 60, size: 10, font: fontHelvetica });

  // 3. Document Title
  yPos -= 105;
  const titles = {
    acceptance: 'OFFER OF INTERNSHIP',
    onboarding: 'INTERNSHIP JOINING & ONBOARDING LETTER',
    completion: 'INTERNSHIP COMPLETION CERTIFICATION',
    recommendation: 'LETTER OF RECOMMENDATION',
  };

  const titleText = titles[documentType];
  const titleWidth = fontHelveticaBold.widthOfTextAtSize(titleText, 13);
  
  page.drawText(titleText, {
    x: pageWidth / 2 - titleWidth / 2,
    y: yPos,
    size: 13,
    font: fontHelveticaBold,
    color: colorTeal,
  });

  // 4. Document Body Texts
  yPos -= 35;
  
  const writeParagraph = (text: string, size = 10.5, leading = 15) => {
    const words = text.split(' ');
    let line = '';
    const maxWidth = pageWidth - 90; // margin left/right = 45

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

  if (documentType === 'acceptance') {
    writeParagraph(`Dear ${studentName},`);
    yPos -= 10;
    writeParagraph(`Following your application and review process, we are pleased to offer you an internship position as a Software Engineering Intern specializing in ${programName} with Ujjwalit Technologies.`);
    yPos -= 10;
    writeParagraph(`Your internship training is scheduled to begin on ${startDate} and complete on ${endDate}. During this tenure, you will work on production-level projects under direct developer guidance, participating in periodic performance evaluations.`);
    yPos -= 10;
    writeParagraph('Please note that this is a remote, unpaid training internship. The goal of this program is to foster real practical development habits. Upon successful submission of capstone project guidelines, you will receive a cryptographically verifiable completion certificate.');
    yPos -= 10;
    writeParagraph('We look forward to having you work with our technology group.');
  } 
  
  else if (documentType === 'onboarding') {
    writeParagraph(`Dear ${studentName},`);
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
  } 
  
  else if (documentType === 'completion') {
    writeParagraph('TO WHOM IT MAY CONCERN');
    yPos -= 15;
    writeParagraph(`This is to certify that ${studentName}, a student of ${college}, has successfully completed their software engineering training internship at Ujjwalit Technologies in the ${programName} track.`);
    yPos -= 10;
    writeParagraph(`The internship commenced on ${startDate} and concluded on ${endDate}.`);
    yPos -= 10;
    writeParagraph(`During this tenure, the candidate worked on full-stack architecture implementations, database operations, and API integrations. They demonstrated consistency in their project deliverables and achieved a project score of 85%+ in their final evaluation.`);
    yPos -= 10;
    writeParagraph('We wish the candidate success in all their future software engineering endeavors.');
  } 
  
  else {
    // recommendation
    writeParagraph('TO WHOM IT MAY CONCERN');
    yPos -= 15;
    writeParagraph(`I am writing to highly recommend ${studentName} for software engineering roles. They interned with the engineering department at Ujjwalit Technologies as a specialized ${programName} developer from ${startDate} to ${endDate}.`);
    yPos -= 10;
    writeParagraph('During the training tenure, the candidate demonstrated outstanding coding capabilities, modular architecture implementation habits, and quick adoption of Next.js, Supabase, and TypeScript features.');
    yPos -= 10;
    writeParagraph('They took total ownership of building complex project features, demonstrating leadership qualities and an agile developer mindset. I am confident they will prove to be an invaluable asset to any engineering organization.');
  }

  // 5. Signatures
  yPos -= 70;
  page.drawText('Authorized Signatory,', { x: 45, y: yPos, size: 10, font: fontHelveticaBold, color: colorNavy });
  page.drawText('Technology Lead', { x: 45, y: yPos - 15, size: 9, font: fontHelvetica, color: colorGray });
  page.drawText('Ujjwalit Technologies', { x: 45, y: yPos - 30, size: 9, font: fontHelvetica, color: colorGray });

  // 6. Security Footer
  page.drawRectangle({
    x: 40,
    y: 75,
    width: pageWidth - 80,
    height: 1,
    color: colorGray,
  });

  page.drawText('Secure Credential Verification:', { x: 40, y: 55, size: 8, font: fontHelveticaBold, color: colorNavy });
  page.drawText(`Scan QR code on certificate copies or navigate to https://verify.ujjwalit.co.in to check code: ${studentCode}`, {
    x: 40,
    y: 43,
    size: 7.5,
    font: fontCourier,
    color: colorGray,
  });

  return await pdfDoc.save();
}
