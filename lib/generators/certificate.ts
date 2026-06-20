import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generateQRCode } from './qrcode';

interface FieldConfig {
  id: string;
  type: 'text' | 'qrcode' | 'image';
  placeholder: string;
  x: number; // in px
  y: number; // in px
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string; // hex, e.g. #0B1D3F
  textAlign: 'left' | 'center' | 'right';
}

interface GenerateParams {
  studentName: string;
  programName: string;
  certificateId: string;
  issueDate: string;
  verificationUrl: string;
  templateBackgroundUrl?: string; // base64 or public url to fetch image from
  templateFields?: FieldConfig[];
}

/**
 * Generates a verified certificate PDF
 */
export async function generateCertificatePDF({
  studentName,
  programName,
  certificateId,
  issueDate,
  verificationUrl,
  templateBackgroundUrl,
  templateFields,
}: GenerateParams): Promise<Uint8Array> {
  // 1. Create a new PDF document or load existing template background
  const pdfDoc = await PDFDocument.create();
  
  // Standard A4 landscape dimensions (in points): 841.89 x 595.28
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Screen designer coordinates are relative to the canvas size.
  // We need to scale designer coordinates to A4 points.
  const designerWidth = 800;
  const designerHeight = 566;
  const scaleX = pageWidth / designerWidth;
  const scaleY = pageHeight / designerHeight;

  // Helper to parse hex color to rgb
  const hexToRgb = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
  };

  // Cache for loaded custom fonts to avoid fetching the same font multiple times
  const customFontsCache: Record<string, any> = {};

  const embedCustomFont = async (fontName: string) => {
    if (customFontsCache[fontName]) return customFontsCache[fontName];

    let fontUrl = '';
    if (fontName === 'Inter') {
      fontUrl = 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp5GP37T.ttf';
    } else if (fontName === 'Montserrat') {
      fontUrl = 'https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459Wlhyw.ttf';
    } else if (fontName === 'Playfair Display') {
      fontUrl = 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZ2xE2vV2oOp3VfeFMR2S7dmGWQ36qEL.ttf';
    } else if (fontName === 'Great Vibes') {
      fontUrl = 'https://fonts.gstatic.com/s/greatvibes/v14/RWmMoKCc1SVt4YhKm20B32M.ttf';
    } else if (fontName === 'Alex Brush') {
      fontUrl = 'https://fonts.gstatic.com/s/alexbrush/v22/SZuzQZILZZ3WnS2_46937A.ttf';
    }

    if (!fontUrl) return null;

    try {
      const res = await fetch(fontUrl);
      if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const embeddedFont = await pdfDoc.embedFont(arrayBuffer);
      customFontsCache[fontName] = embeddedFont;
      return embeddedFont;
    } catch (err) {
      console.error(`Error loading custom font ${fontName} from ${fontUrl}:`, err);
      return null;
    }
  };

  // 2. Embed background image if provided
  if (templateBackgroundUrl) {
    try {
      const response = await fetch(templateBackgroundUrl);
      const imageBytes = await response.arrayBuffer();
      
      let bgImage;
      if (templateBackgroundUrl.toLowerCase().endsWith('.png')) {
        bgImage = await pdfDoc.embedPng(imageBytes);
      } else {
        bgImage = await pdfDoc.embedJpg(imageBytes);
      }
      
      page.drawImage(bgImage, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      });
    } catch (err) {
      console.error('Failed to embed background template image:', err);
      // Fallback: draw a nice background border in brand navy
      page.drawRectangle({
        x: 20,
        y: 20,
        width: pageWidth - 40,
        height: pageHeight - 40,
        borderColor: hexToRgb('#0B1D3F'),
        borderWidth: 3,
      });
    }
  } else {
    // Default fallback background style if no template is present
    page.drawRectangle({
      x: 15,
      y: 15,
      width: pageWidth - 30,
      height: pageHeight - 30,
      borderColor: hexToRgb('#1A8BA6'),
      borderWidth: 2,
    });
    
    // Draw top branding
    const fontHelvetica = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    page.drawText('UJJWALIT TECHNOLOGIES', {
      x: pageWidth / 2 - 130,
      y: pageHeight - 60,
      size: 20,
      font: fontHelvetica,
      color: hexToRgb('#0B1D3F'),
    });
  }

  // 3. Draw QR Code pointing to verification URL (Only if not explicitly removed from template)
  const hasQrField = !templateFields || templateFields.some((f) => f.type === 'qrcode');
  if (hasQrField) {
    try {
      const qrDataUrl = await generateQRCode(verificationUrl);
      const qrClean = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBytes = Buffer.from(qrClean, 'base64');
      const qrImage = await pdfDoc.embedPng(qrBytes);

      // Default QR Code position if template doesn't specify one
      let qrX = pageWidth - 110;
      let qrY = 40;
      let qrSize = 75;

      // Check if designer template has a custom position for QR code
      const qrField = templateFields?.find((f) => f.type === 'qrcode');
      if (qrField) {
        qrX = qrField.x * scaleX;
        // In PDF coordinates, (0,0) is bottom-left, but designer is top-left
        qrY = pageHeight - (qrField.y * scaleY) - (qrField.fontSize * scaleY || 75);
        qrSize = (qrField.fontSize || 75) * scaleY;
      }

      page.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrSize,
        height: qrSize,
      });
    } catch (err) {
      console.error('Failed to embed QR code in certificate PDF:', err);
    }
  }

  // 4. Draw text fields
  const standardFonts = {
    Serif: await pdfDoc.embedFont(StandardFonts.TimesRoman),
    SerifBold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
    Sans: await pdfDoc.embedFont(StandardFonts.Helvetica),
    SansBold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    Mono: await pdfDoc.embedFont(StandardFonts.Courier),
  };

  const fields = templateFields || [
    // Default text layout if no custom template config is passed
    { id: '1', type: 'text', placeholder: 'CERTIFICATE OF COMPLETION', x: 250, y: 180, fontSize: 32, fontFamily: 'SerifBold', fontWeight: 'bold', color: '#E8822A', textAlign: 'center' },
    { id: '2', type: 'text', placeholder: 'This is proudly presented to', x: 380, y: 260, fontSize: 16, fontFamily: 'Serif', fontWeight: 'normal', color: '#555555', textAlign: 'center' },
    { id: '3', type: 'text', placeholder: '{{name}}', x: 200, y: 330, fontSize: 36, fontFamily: 'SerifBold', fontWeight: 'bold', color: '#0B1D3F', textAlign: 'center' },
    { id: '4', type: 'text', placeholder: 'for successfully completing the {{program}} program', x: 240, y: 400, fontSize: 16, fontFamily: 'Sans', fontWeight: 'normal', color: '#555555', textAlign: 'center' },
    { id: '5', type: 'text', placeholder: 'Certificate ID: {{id}}', x: 60, y: 530, fontSize: 10, fontFamily: 'Mono', fontWeight: 'normal', color: '#888888', textAlign: 'left' },
    { id: '6', type: 'text', placeholder: 'Issued Date: {{date}}', x: 60, y: 550, fontSize: 10, fontFamily: 'Mono', fontWeight: 'normal', color: '#888888', textAlign: 'left' },
  ];

  for (const field of fields) {
    if (field.type === 'qrcode') continue; // Handled separately

    // Replace text tokens
    let text = field.placeholder
      .replace('{{name}}', studentName)
      .replace('{{program}}', programName)
      .replace('{{id}}', certificateId)
      .replace('{{date}}', issueDate);

    // Choose font
    let font = standardFonts.Sans;
    if (['Inter', 'Montserrat', 'Playfair Display', 'Great Vibes', 'Alex Brush'].includes(field.fontFamily)) {
      const loadedFont = await embedCustomFont(field.fontFamily);
      if (loadedFont) {
        font = loadedFont;
      }
    } else if (field.fontFamily.includes('Serif')) {
      font = field.fontWeight === 'bold' ? standardFonts.SerifBold : standardFonts.Serif;
    } else if (field.fontFamily.includes('Mono')) {
      font = standardFonts.Mono;
    } else if (field.fontWeight === 'bold') {
      font = standardFonts.SansBold;
    }

    const size = field.fontSize * scaleY;
    const color = hexToRgb(field.color || '#000000');

    // Calculate final PDF coordinates
    let x = field.x * scaleX;
    // PDF coordinates start at bottom-left, but designer starts at top-left.
    // pdf-lib uses a bottom-left origin and text is drawn from its baseline.
    // We subtract the text size so the top of the text aligns with the designer's y-coordinate.
    const y = pageHeight - (field.y * scaleY) - size;

    // Adjust x coordinate for text alignment if centered
    if (field.textAlign === 'center') {
      const textWidth = font.widthOfTextAtSize(text, size);
      // Center the text around the designer x point
      x = x - (textWidth / 2);
    } else if (field.textAlign === 'right') {
      const textWidth = font.widthOfTextAtSize(text, size);
      x = x - textWidth;
    }

    page.drawText(text, {
      x,
      y,
      size,
      font,
      color,
    });
  }

  // 5. Save and return bytes
  return await pdfDoc.save();
}
