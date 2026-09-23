import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { serviceApi, technicianApi } from '../api/opsApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';

export default function ServiceRequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [assignModal, setAssignModal] = useState(null); // requestId
  const [technicianId, setTechnicianId] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['service-requests'], queryFn: () => serviceApi.list({ limit: 50 }) });
  const { data: techData } = useQuery({ queryKey: ['technicians'], queryFn: () => technicianApi.list(), enabled: ['OWNER', 'MANAGER'].includes(user.role) });

  const verifyMutation = useMutation({
    mutationFn: ({ id, approve }) => serviceApi.verify(id, { approve }),
    onSuccess: () => {
      toast.success('Verification recorded');
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const assignMutation = useMutation({
    mutationFn: () => serviceApi.assign(assignModal, { technicianId }),
    onSuccess: () => {
      toast.success('Technician assigned');
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      setAssignModal(null);
      setTechnicianId('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const canManage = ['OWNER', 'MANAGER'].includes(user.role);

  const columns = [
    { key: 'product', header: 'Product', render: (r) => r.productId?.name || '—' },
    { key: 'customer', header: 'Customer', render: (r) => r.customerId?.name || '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'technician', header: 'Technician', render: (r) => r.technicianId?.name || '—' },
    { key: 'created', header: 'Created', render: (r) => new Date(r.createdAt).toLocaleDateString() },
    {
      key: 'actions',
      header: '',
      render: (r) =>
        canManage ? (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {r.status === 'VERIFICATION_PENDING' && (
              <>
                <button onClick={() => verifyMutation.mutate({ id: r._id, approve: true })} className="text-xs font-medium text-green-600 hover:underline">
                  Verify
                </button>
                <button onClick={() => verifyMutation.mutate({ id: r._id, approve: false })} className="text-xs font-medium text-red-600 hover:underline">
                  Reject
                </button>
              </>
            )}
            {r.status === 'VERIFIED' && (
              <button onClick={() => setAssignModal(r._id)} className="text-xs font-medium text-brand-600 hover:underline">
                Assign
              </button>
            )}
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader title="Service Requests" subtitle="Verify warranty coverage, then assign a technician." />
      <DataTable
        columns={columns}
        rows={data?.data?.requests || []}
        isLoading={isLoading}
        emptyMessage="No service requests yet."
        onRowClick={(row) => navigate(`/app/service-requests/${row._id}`)}
      />

      <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title="Assign technician">
        <div className="space-y-3">
          <select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select a technician…</option>
            {(techData?.data?.technicians || []).map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            disabled={!technicianId || assignMutation.isPending}
            onClick={() => assignMutation.mutate()}
            className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {assignMutation.isPending ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
