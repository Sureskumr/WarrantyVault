import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { invoiceApi } from '../api/opsApi.js';
import { downloadAuthenticatedFile } from '../api/download.js';
import PageHeader from '../components/PageHeader.jsx';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ['invoice', id], queryFn: () => invoiceApi.get(id) });

  if (isLoading) return null;
  const invoice = data?.data?.invoice;
  if (!invoice) return <p className="text-sm text-slate-500">Invoice not found.</p>;

  const handleDownload = async () => {
    try {
      await downloadAuthenticatedFile(`/invoices/${id}/pdf`, `${invoice.invoiceNumber}.pdf`);
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={invoice.invoiceNumber}
        subtitle={new Date(invoice.purchaseDate).toLocaleString()}
        action={
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Download className="h-4 w-4" /> Download PDF
          </button>
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-6 flex justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Bill to</p>
            <p className="text-sm text-slate-600">{invoice.customerId?.name}</p>
            <p className="text-sm text-slate-600">{invoice.customerId?.phone}</p>
          </div>
          {invoice.qrCodeDataUrl && <img src={invoice.qrCodeDataUrl} alt="Verification QR" className="h-24 w-24" />}
        </div>

        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">Item</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Price</th>
              <th className="py-2">Tax</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-2">
                  {item.name}
                  {item.serialNumber && <span className="ml-1 text-xs text-slate-400">SN: {item.serialNumber}</span>}
                </td>
                <td className="py-2">{item.quantity}</td>
                <td className="py-2">₹{item.unitPrice.toLocaleString()}</td>
                <td className="py-2">{item.taxRate}%</td>
                <td className="py-2 text-right font-medium">₹{item.lineTotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-56 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Discount</span>
              <span>-₹{invoice.totalDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax</span>
              <span>₹{invoice.totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-semibold text-slate-900">
              <span>Grand Total</span>
              <span>₹{invoice.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
