import QRCode from 'qrcode';

/**
 * Generate a QR code base64 Data URL for a given value (URL or hash)
 * @param value The content of the QR code (typically the verification URL)
 * @returns Promise resolving to a base64 Data URL string
 */
export async function generateQRCode(value: string): Promise<string> {
  try {
    return await QRCode.toDataURL(value, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('QR Code Generation Error:', err);
    throw err;
  }
}
