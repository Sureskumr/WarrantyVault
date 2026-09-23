import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, UserX } from 'lucide-react';
import { staffApi } from '../api/resourceApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[0-9]/, 'Include a number'),
  role: z.enum(['MANAGER', 'CASHIER', 'TECHNICIAN']),
});

export default function EmployeesPage() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.list({ limit: 50 }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { role: 'CASHIER' } });

  const createMutation = useMutation({
    mutationFn: (values) => staffApi.create(values),
    onSuccess: () => {
      toast.success('Employee account created');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      reset();
      setModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create employee'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => staffApi.deactivate(id),
    onSuccess: () => {
      toast.success('Employee deactivated');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to deactivate'),
  });

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          {r.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) =>
        r.role !== 'OWNER' && r.isActive ? (
          <button
            onClick={() => deactivateMutation.mutate(r._id)}
            className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
          >
            <UserX className="h-3.5 w-3.5" /> Deactivate
          </button>
        ) : null,
    },
  ];

  const availableRoles = user.role === 'OWNER' ? ['MANAGER', 'CASHIER', 'TECHNICIAN'] : ['CASHIER', 'TECHNICIAN'];

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Manage store staff and their roles."
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Add employee
          </button>
        }
      />

      <DataTable columns={columns} rows={data?.data?.users || []} isLoading={isLoading} emptyMessage="No employees yet." />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add employee">
        <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-3">
          <div>
            <input placeholder="Full name" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('name')} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <input placeholder="Email" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('email')} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <input placeholder="Phone" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('phone')} />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
          </div>
          <div>
            <input type="password" placeholder="Temporary password" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('password')} />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>
          <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('role')}>
            {availableRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Creating…' : 'Create employee'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
