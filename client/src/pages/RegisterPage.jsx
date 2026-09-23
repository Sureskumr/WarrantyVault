import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldCheck } from 'lucide-react';

const schema = z.object({
  storeName: z.string().min(2, 'Store name is required'),
  name: z.string().min(2, 'Your name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[0-9]/, 'Include a number'),
});

export default function RegisterPage() {
  const { register: doRegister } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      await doRegister(values);
      toast.success('Store created!');
      navigate('/app', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const Field = ({ name, label, type = 'text' }) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        {...register(name)}
      />
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name].message}</p>}
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-brand-600" />
          <span className="text-lg font-semibold">DigiWarranty</span>
        </div>
        <h1 className="mb-1 text-xl font-semibold text-slate-900">Set up your store</h1>
        <p className="mb-6 text-sm text-slate-500">
          "Bill once. Register warranty automatically. Manage every service claim from one dashboard."
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field name="storeName" label="Store name" />
          <Field name="name" label="Your name" />
          <Field name="email" label="Email" type="email" />
          <Field name="phone" label="Phone" />
          <Field name="password" label="Password" type="password" />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Creating store…' : 'Create store & continue'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
