import { useState, useEffect, useCallback } from 'react';
import { COLORS, S } from '@/utils/colors';
import { fetchECExtensionRequests, ecGrantExtension, ecRejectExtension } from '@/services/ec.service';
import type { ExtensionRecord } from '@/services/officer.service';
import { API_BASE } from '@/services/api';
import toast from 'react-hot-toast';

type StatusFilter = 'Pending' | 'Completed';

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ECExtensionOfTime() {
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>('Pending');
  const [requests,      setRequests]      = useState<ExtensionRecord[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [actionModal,   setActionModal]   = useState<{ id: string; type: 'grant' | 'reject' } | null>(null);
  const [actionRemarks, setActionRemarks] = useState('');
  const [actioning,     setActioning]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRequests(await fetchECExtensionRequests()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = statusFilter === 'Pending'
    ? requests.filter((r) => r.status === 'Pending')
    : requests.filter((r) => r.status !== 'Pending');

  async function handleAction() {
    if (!actionModal) return;
    setActioning(true);
    try {
      if (actionModal.type === 'grant') {
        await ecGrantExtension(actionModal.id, actionRemarks || undefined);
        toast.success('Extension request granted.');
      } else {
        await ecRejectExtension(actionModal.id, actionRemarks || undefined);
        toast.success('Extension request rejected.');
      }
      setActionModal(null);
      setActionRemarks('');
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Action failed');
    } finally { setActioning(false); }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={S.pageDesc}>Applications where an extension of time has been requested by the applicant.</div>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 14 }}>
        {(['Pending', 'Completed'] as StatusFilter[]).map((t) => (
          <div key={t} onClick={() => setStatusFilter(t)}
            style={{ padding: '6px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: statusFilter === t ? COLORS.primary : COLORS.textMuted, borderBottom: statusFilter === t ? `2px solid ${COLORS.primary}` : '2px solid transparent', marginBottom: -1 }}>
            {t}
            {t === 'Pending' && requests.filter((r) => r.status === 'Pending').length > 0 && (
              <span style={{ marginLeft: 5, background: COLORS.primary, color: '#fff', borderRadius: 8, fontSize: 10, padding: '1px 5px', fontWeight: 700 }}>{requests.filter((r) => r.status === 'Pending').length}</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>Extension Requests — {statusFilter} ({visible.length})</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['Sr. No.', 'Application No.', 'Company', 'Product', 'Requested On', 'Extension Days', 'Reason', 'Supporting Doc', 'Status', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={10} style={{ ...S.td, textAlign: 'center', padding: '40px 0', color: COLORS.textMuted }}>Loading…</td></tr>}
              {!loading && visible.length === 0 && <tr><td colSpan={10} style={{ ...S.td, textAlign: 'center', padding: '48px 0', color: COLORS.textMuted }}>No {statusFilter.toLowerCase()} extension requests.</td></tr>}
              {visible.map((r, i) => {
                const isApproved = r.status === 'Approved';
                const bg = r.status === 'Pending' ? COLORS.warningLight : isApproved ? COLORS.successLight : COLORS.dangerLight;
                const fg = r.status === 'Pending' ? COLORS.warning      : isApproved ? COLORS.success      : COLORS.danger;
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{r.application?.referenceNumber ?? '—'}</td>
                    <td style={S.td}>{r.application?.companyName ?? '—'}</td>
                    <td style={S.td}>{r.application?.productName ?? '—'}</td>
                    <td style={S.td}>{fmtDate(r.createdAt)}</td>
                    <td style={S.td}>{r.extensionDays ?? '—'} days</td>
                    <td style={{ ...S.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason ?? r.justification ?? '—'}</td>
                    <td style={S.td}>
                      {r.supportingDocument ? (
                        <a href={`${API_BASE}/uploads/${r.supportingDocument}`} target="_blank" rel="noreferrer"
                          style={{ color: COLORS.primary, fontWeight: 600, textDecoration: 'none', fontSize: 12 }}>
                          📎 View
                        </a>
                      ) : <span style={{ color: COLORS.textMuted, fontSize: 11 }}>—</span>}
                    </td>
                    <td style={S.td}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: bg, color: fg }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                      {r.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => { setActionModal({ id: r.id, type: 'grant' }); setActionRemarks(''); }}
                            style={{ padding: '4px 10px', background: COLORS.success, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            Grant
                          </button>
                          <button
                            onClick={() => { setActionModal({ id: r.id, type: 'reject' }); setActionRemarks(''); }}
                            style={{ padding: '4px 10px', background: 'transparent', color: COLORS.danger, border: `1px solid ${COLORS.danger}`, borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>
                            Reject
                          </button>
                        </div>
                      ) : <span style={{ fontSize: 11, color: COLORS.textMuted }}>{isApproved ? 'Granted' : 'Rejected'}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grant / Reject action modal */}
      {actionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 24, maxWidth: 440, width: '90%' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>
              {actionModal.type === 'grant' ? '✅ Grant Extension' : '✗ Reject Extension'}
            </div>
            <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 14 }}>
              {actionModal.type === 'grant'
                ? 'The applicant will be notified that their extension request has been approved.'
                : 'The applicant will be notified that their extension request has been rejected.'}
            </p>
            <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
              Remarks (optional)
            </label>
            <textarea
              rows={3}
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder="Enter any remarks for the applicant…"
              style={{ width: '100%', fontSize: 12, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', resize: 'vertical', boxSizing: 'border-box', fontFamily: "'Noto Sans','Segoe UI',sans-serif", outline: 'none', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setActionModal(null)}
                style={{ padding: '7px 18px', background: 'transparent', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                disabled={actioning}
                onClick={handleAction}
                style={{ padding: '7px 18px', background: actionModal.type === 'grant' ? COLORS.success : COLORS.danger, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: actioning ? 'wait' : 'pointer', opacity: actioning ? 0.7 : 1 }}>
                {actioning ? 'Processing…' : actionModal.type === 'grant' ? 'Grant Extension' : 'Reject Extension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
