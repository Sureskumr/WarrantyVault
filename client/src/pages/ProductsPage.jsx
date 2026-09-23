import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { productApi } from '../api/resourceApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  brand: z.string().optional(),
  sku: z.string().min(1, 'Required'),
  price: z.coerce.number().min(0, 'Must be 0 or more'),
  stockQuantity: z.coerce.number().min(0).optional(),
  warrantyDuration: z.coerce.number().min(0).default(12),
  warrantyDurationUnit: z.enum(['DAYS', 'MONTHS', 'YEARS']).default('MONTHS'),
});

export default function ProductsPage() {
  const { user } = useAuth();
  const canManage = ['OWNER', 'MANAGER'].includes(user.role);
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.list({ limit: 50 }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { warrantyDuration: 12, warrantyDurationUnit: 'MONTHS' } });

  const createMutation = useMutation({
    mutationFn: (values) =>
      productApi.create({
        name: values.name,
        brand: values.brand,
        sku: values.sku,
        price: values.price,
        stockQuantity: values.stockQuantity,
        warrantyTemplate: {
          duration: values.warrantyDuration,
          durationUnit: values.warrantyDurationUnit,
          startType: 'PURCHASE_DATE',
        },
      }),
    onSuccess: () => {
      toast.success('Product added');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      reset();
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create product'),
  });

  const columns = [
    { key: 'name', header: 'Product' },
    { key: 'brand', header: 'Brand' },
    { key: 'sku', header: 'SKU' },
    { key: 'price', header: 'Price', render: (r) => `₹${r.price.toLocaleString()}` },
    { key: 'stockQuantity', header: 'Stock' },
    {
      key: 'warranty',
      header: 'Warranty',
      render: (r) => `${r.warrantyTemplate?.duration ?? '—'} ${r.warrantyTemplate?.durationUnit?.toLowerCase() ?? ''}`,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Configure products and their warranty rules."
        action={
          canManage && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Add product
            </button>
          )
        }
      />

      <DataTable columns={columns} rows={data?.data?.products || []} isLoading={isLoading} emptyMessage="No products yet — add your first one." />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add product">
        <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-3">
          <div>
            <input placeholder="Product name" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('name')} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <input placeholder="Brand" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('brand')} />
          <div>
            <input placeholder="SKU" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('sku')} />
            {errors.sku && <p className="mt-1 text-xs text-red-600">{errors.sku.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="0.01" placeholder="Price" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('price')} />
            <input type="number" placeholder="Stock qty" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('stockQuantity')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Warranty duration" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('warrantyDuration')} />
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('warrantyDurationUnit')}>
              <option value="DAYS">Days</option>
              <option value="MONTHS">Months</option>
              <option value="YEARS">Years</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : 'Save product'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
