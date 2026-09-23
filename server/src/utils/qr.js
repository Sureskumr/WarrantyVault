import QRCode from 'qrcode';

/**
 * Renders a QR code (as a data: URL PNG) that encodes the public
 * verification URL for an invoice/warranty — never a raw Mongo id.
 */
export async function generateQrDataUrl(verificationUrl) {
  return QRCode.toDataURL(verificationUrl, { errorCorrectionLevel: 'M', margin: 1, width: 300 });
}

export async function generateQrBuffer(verificationUrl) {
  return QRCode.toBuffer(verificationUrl, { errorCorrectionLevel: 'M', margin: 1, width: 300 });
}
