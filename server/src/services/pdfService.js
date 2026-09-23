import PDFDocument from 'pdfkit';

/**
 * Streams a professional-looking invoice PDF into a Buffer.
 * Kept dependency-free of any specific HTTP framework so it can be reused
 * by an email-attachment job later (Phase 5) as well as the download route.
 */
export function generateInvoicePdfBuffer({ store, customer, invoice }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text(store.storeName, { continued: false });
    doc.fontSize(9).font('Helvetica').fillColor('#555')
      .text([store.address, store.city, store.state, store.pincode].filter(Boolean).join(', '))
      .text(`Phone: ${store.phone}  •  Email: ${store.email}`)
      .text(store.gstin ? `GSTIN: ${store.gstin}` : '');
    doc.moveDown(1.5);

    doc.fillColor('#000').fontSize(14).font('Helvetica-Bold').text('TAX INVOICE', { align: 'right' });
    doc.fontSize(10).font('Helvetica').text(`Invoice #: ${invoice.invoiceNumber}`, { align: 'right' });
    doc.text(`Date: ${new Date(invoice.purchaseDate).toLocaleDateString('en-IN')}`, { align: 'right' });
    doc.moveDown(1);

    // Bill to
    doc.font('Helvetica-Bold').text('Bill To:');
    doc.font('Helvetica').text(customer.name);
    if (customer.phone) doc.text(`Phone: ${customer.phone}`);
    if (customer.email) doc.text(`Email: ${customer.email}`);
    doc.moveDown(1);

    // Table header
    const tableTop = doc.y;
    const cols = { name: 50, qty: 260, price: 310, disc: 370, tax: 430, total: 490 };
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Item', cols.name, tableTop);
    doc.text('Qty', cols.qty, tableTop);
    doc.text('Price', cols.price, tableTop);
    doc.text('Disc', cols.disc, tableTop);
    doc.text('Tax%', cols.tax, tableTop);
    doc.text('Total', cols.total, tableTop);
    doc.moveTo(50, tableTop + 14).lineTo(545, tableTop + 14).strokeColor('#ccc').stroke();

    let y = tableTop + 20;
    doc.font('Helvetica').fontSize(9);
    invoice.items.forEach((item) => {
      doc.text(`${item.name}${item.serialNumber ? ` (SN: ${item.serialNumber})` : ''}`, cols.name, y, { width: 200 });
      doc.text(String(item.quantity), cols.qty, y);
      doc.text(item.unitPrice.toFixed(2), cols.price, y);
      doc.text(item.discount.toFixed(2), cols.disc, y);
      doc.text(`${item.taxRate}%`, cols.tax, y);
      doc.text(item.lineTotal.toFixed(2), cols.total, y);
      y += 20;
    });

    doc.moveTo(50, y).lineTo(545, y).strokeColor('#ccc').stroke();
    y += 10;

    const summaryX = 380;
    doc.font('Helvetica').text('Subtotal:', summaryX, y);
    doc.text(invoice.subtotal.toFixed(2), 490, y);
    y += 16;
    doc.text('Discount:', summaryX, y);
    doc.text(invoice.totalDiscount.toFixed(2), 490, y);
    y += 16;
    doc.text('Tax:', summaryX, y);
    doc.text(invoice.totalTax.toFixed(2), 490, y);
    y += 16;
    doc.font('Helvetica-Bold').fontSize(11).text('Grand Total:', summaryX, y);
    doc.text(`Rs. ${invoice.grandTotal.toFixed(2)}`, 490, y);
    y += 20;

    doc.font('Helvetica').fontSize(9).text(`Payment method: ${invoice.paymentMethod}`, 50, y);
    y += 30;

    // QR code + warranty note
    if (invoice.qrCodeDataUrl) {
      const base64 = invoice.qrCodeDataUrl.split(',')[1];
      doc.image(Buffer.from(base64, 'base64'), 50, y, { width: 90 });
      doc.fontSize(8).fillColor('#555').text(
        'Scan to verify this invoice and check warranty status.',
        150,
        y + 30,
        { width: 300 }
      );
    }

    doc.fontSize(8).fillColor('#888').text(
      'This document is a digital proof of purchase. Warranty terms are governed by the manufacturer/store policy shown at verification.',
      50,
      760,
      { width: 495, align: 'center' }
    );

    doc.end();
  });
}
