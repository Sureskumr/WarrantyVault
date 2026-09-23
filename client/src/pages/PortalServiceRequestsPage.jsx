import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { portalApi } from '../api/opsApi.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';

const schema = z.object({
  productId: z.string().min(1, 'Select a product'),
  problemDescription: z.string().min(5, 'Please describe the issue'),
  contactPhone: z.string().min(7, 'Enter a valid phone number'),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
});

export default function PortalServiceRequestsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['portal-service-requests'], queryFn: () => portalApi.serviceRequests({ limit: 50 }) });
  const { data: warranties } = useQuery({ queryKey: ['portal-warranties-for-request'], queryFn: () => portalApi.warranties({ limit: 50 }) });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (values) => portalApi.createServiceRequest(values),
    onSuccess: () => {
      toast.success('Service request submitted');
      queryClient.invalidateQueries({ queryKey: ['portal-service-requests'] });
      reset();
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit request'),
  });

  const columns = [
    { key: 'product', header: 'Product', render: (r) => r.productId?.name || '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'technician', header: 'Technician', render: (r) => r.technicianId?.name || '—' },
    { key: 'created', header: 'Submitted', render: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  const products = [...new Map((warranties?.data?.warranties || []).map((w) => [w.productId?._id, w.productId])).values()].filter(Boolean);

  return (
    <div>
      <PageHeader
        title="Service Requests"
        subtitle="Track repairs and raise a new request."
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Request service
          </button>
        }
      />

      <DataTable columns={columns} rows={data?.data?.requests || []} isLoading={isLoading} emptyMessage="No service requests yet." />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Request service">
        <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-3">
          <div>
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('productId')}>
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.productId && <p className="mt-1 text-xs text-red-600">{errors.productId.message}</p>}
          </div>
          <div>
            <textarea
              placeholder="Describe the problem…"
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              {...register('problemDescription')}
            />
            {errors.problemDescription && <p className="mt-1 text-xs text-red-600">{errors.problemDescription.message}</p>}
          </div>
          <div>
            <input placeholder="Contact phone" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('contactPhone')} />
            {errors.contactPhone && <p className="mt-1 text-xs text-red-600">{errors.contactPhone.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('preferredDate')} />
            <input placeholder="Preferred time" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('preferredTime')} />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting…' : 'Submit request'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
