import { useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { storeApi } from '../api/resourceApi.js';
import PageHeader from '../components/PageHeader.jsx';

export default function StoreSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['store'], queryFn: () => storeApi.getMine() });
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    if (data?.data?.store) {
      const s = data.data.store;
      reset({
        storeName: s.storeName,
        phone: s.phone,
        email: s.email,
        address: s.address,
        city: s.city,
        state: s.state,
        pincode: s.pincode,
        gstin: s.gstin,
        invoicePrefix: s.invoicePrefix,
      });
    }
  }, [data, reset]);

  const updateMutation = useMutation({
    mutationFn: (values) => storeApi.updateMine(values),
    onSuccess: () => {
      toast.success('Store settings saved');
      queryClient.invalidateQueries({ queryKey: ['store'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save settings'),
  });

  if (isLoading) return null;

  const Field = ({ name, label }) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register(name)} />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <PageHeader title="Store Settings" subtitle="These details appear on every invoice and warranty document." />

      <form onSubmit={handleSubmit((v) => updateMutation.mutate(v))} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <Field name="storeName" label="Store name" />
        <div className="grid grid-cols-2 gap-4">
          <Field name="phone" label="Phone" />
          <Field name="email" label="Email" />
        </div>
        <Field name="address" label="Address" />
        <div className="grid grid-cols-3 gap-4">
          <Field name="city" label="City" />
          <Field name="state" label="State" />
          <Field name="pincode" label="Pincode" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field name="gstin" label="GSTIN" />
          <Field name="invoicePrefix" label="Invoice prefix" />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
