import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Search } from 'lucide-react';
import { customerApi } from '../api/resourceApi.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

export default function CustomersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customerApi.list({ limit: 50, search: search || undefined }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (values) => customerApi.create(values),
    onSuccess: () => {
      toast.success('Customer added');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      reset();
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create customer'),
  });

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'phone', header: 'Phone' },
    { key: 'email', header: 'Email', render: (r) => r.email || '—' },
    { key: 'city', header: 'City', render: (r) => r.city || '—' },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Search by name, phone, or email."
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Add customer
          </button>
        }
      />

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers…"
          className="w-full text-sm outline-none"
        />
      </div>

      <DataTable columns={columns} rows={data?.data?.customers || []} isLoading={isLoading} emptyMessage="No customers yet." />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add customer">
        <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-3">
          <div>
            <input placeholder="Full name" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('name')} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <input placeholder="Phone" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('phone')} />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
          </div>
          <div>
            <input placeholder="Email (optional)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('email')} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : 'Save customer'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
