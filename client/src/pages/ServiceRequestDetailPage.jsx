import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { serviceApi } from '../api/opsApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const NEXT_STEPS = {
  ASSIGNED: [{ label: 'Start visit', next: 'TECHNICIAN_VISIT' }],
  TECHNICIAN_VISIT: [{ label: 'Record diagnosis', next: 'DIAGNOSIS', needsNote: 'diagnosis' }],
  DIAGNOSIS: [
    { label: 'Begin repair', next: 'REPAIR_IN_PROGRESS' },
    { label: 'Waiting for part', next: 'WAITING_FOR_PART' },
  ],
  REPAIR_IN_PROGRESS: [
    { label: 'Mark completed', next: 'COMPLETED', needsNote: 'repairNotes' },
    { label: 'Waiting for part', next: 'WAITING_FOR_PART' },
  ],
  WAITING_FOR_PART: [
    { label: 'Resume repair', next: 'REPAIR_IN_PROGRESS' },
    { label: 'Mark completed', next: 'COMPLETED', needsNote: 'repairNotes' },
  ],
};

export default function ServiceRequestDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['service-request', id], queryFn: () => serviceApi.get(id) });

  const updateMutation = useMutation({
    mutationFn: ({ nextStatus, needsNote }) => serviceApi.updateStatus(id, { nextStatus, ...(needsNote ? { [needsNote]: note } : {}) }),
    onSuccess: () => {
      toast.success('Updated');
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['service-request', id] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  if (isLoading) return null;
  const request = data?.data?.request;
  const history = data?.data?.history || [];
  if (!request) return <p className="text-sm text-slate-500">Service request not found.</p>;

  const isMyAssignment = user.role === 'TECHNICIAN' && request.technicianId?._id === user.id;
  const options = isMyAssignment ? NEXT_STEPS[request.status] || [] : [];

  return (
    <div className="max-w-2xl">
      <PageHeader title={request.productId?.name || 'Service request'} subtitle={`Customer: ${request.customerId?.name || '—'}`} />

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-2 flex items-center justify-between">
          <StatusBadge status={request.status} />
          <span className="text-xs text-slate-400">{new Date(request.createdAt).toLocaleString()}</span>
        </div>
        <p className="text-sm text-slate-700">{request.problemDescription}</p>
        {request.diagnosis && (
          <p className="mt-2 text-sm text-slate-600">
            <span className="font-medium">Diagnosis:</span> {request.diagnosis}
          </p>
        )}
        {request.repairNotes && (
          <p className="mt-1 text-sm text-slate-600">
            <span className="font-medium">Repair notes:</span> {request.repairNotes}
          </p>
        )}
        {request.technicianId && <p className="mt-2 text-xs text-slate-500">Technician: {request.technicianId.name}</p>}
      </div>

      {options.length > 0 && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5">
          <p className="mb-2 text-sm font-medium text-slate-900">Update status</p>
          {options.some((o) => o.needsNote) && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (diagnosis / repair notes)…"
              className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={3}
            />
          )}
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
              <button
                key={opt.next}
                disabled={updateMutation.isPending || (opt.needsNote && !note)}
                onClick={() => updateMutation.mutate(opt)}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="mb-3 text-sm font-medium text-slate-900">History</p>
        <ol className="space-y-3 border-l border-slate-200 pl-4">
          {history.map((h) => (
            <li key={h._id}>
              <p className="text-sm font-medium text-slate-800">
                <StatusBadge status={h.status} /> <span className="ml-2 text-xs text-slate-400">{new Date(h.timestamp).toLocaleString()}</span>
              </p>
              {h.note && <p className="text-sm text-slate-600">{h.note}</p>}
              <p className="text-xs text-slate-400">by {h.performedBy?.name || 'system'}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
