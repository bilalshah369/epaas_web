import { useState, useEffect, useCallback } from 'react';
import { COLORS, S } from '@/utils/colors';
import {
  fetchWithdrawalRequests, approveWithdrawalRequest, rejectWithdrawalRequest,
  type WithdrawalRequestRecord,
} from '@/services/officer.service';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

type TabKey = 'Pending' | 'Approved' | 'Rejected';

export default function WithdrawalOfApproval() {
  const [requests,  setRequests]  = useState<WithdrawalRequestRecord[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<TabKey>('Pending');
  const [actioning, setActioning] = useState(false);
  const [dialog,    setDialog]    = useState<{ msg: string; action: () => void; variant?: 'primary' | 'danger' | 'warning' } | null>(null);

  // Filter state
  const [company,   setCompany]   = useState('');
  const [fromDate,  setFromDate]  = useState('');
  const [toDate,    setToDate]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setRequests(await fetchWithdrawalRequests()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const byApplicant = requests.filter((r) => r.type === 'ByApplicant');

  const visible = byApplicant.filter((r) => {
    if (r.status !== tab) return false;
    if (company && !r.application.companyName.toLowerCase().includes(company.toLowerCase())) return false;
    if (fromDate && new Date(r.createdAt) < new Date(fromDate)) return false;
    if (toDate) {
      const to = new Date(toDate); to.setHours(23, 59, 59, 999);
      if (new Date(r.createdAt) > to) return false;
    }
    return true;
  });

  async function handleApprove(id: string) {
    setActioning(true);
    try {
      await approveWithdrawalRequest(id);
      toast.success('Withdrawal approved — application marked as Withdrawn.');
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to approve withdrawal');
    } finally { setActioning(false); }
  }

  async function handleReject(id: string) {
    setActioning(true);
    try {
      await rejectWithdrawalRequest(id);
      toast.success('Withdrawal request rejected.');
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to reject withdrawal');
    } finally { setActioning(false); }
  }

  const pendingCount = byApplicant.filter((r) => r.status === 'Pending').length;
  const iStyle = { border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11, outline: 'none' } as const;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={S.pageDesc}>Withdrawal requests submitted by applicants for their applications.</div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 14 }}>
        {(['Pending', 'Approved', 'Rejected'] as TabKey[]).map((t) => (
          <div key={t} onClick={() => setTab(t)}
            style={{ padding: '6px 18px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              color: tab === t ? COLORS.primary : COLORS.textMuted,
              borderBottom: tab === t ? `2px solid ${COLORS.primary}` : '2px solid transparent',
              marginBottom: -1 }}>
            {t}
            {t === 'Pending' && pendingCount > 0 && (
              <span style={{ marginLeft: 5, background: COLORS.primary, color: '#fff', borderRadius: 8, fontSize: 10, padding: '1px 5px', fontWeight: 700 }}>{pendingCount}</span>
            )}
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160, flex: '1 1 160px' }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Company / Org Name</label>
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Search…" style={iStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130, flex: '1 1 130px' }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>From Date</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={iStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130, flex: '1 1 130px' }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>To Date</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={iStyle} />
        </div>
        <button onClick={() => { setCompany(''); setFromDate(''); setToDate(''); }}
          style={{ background: 'none', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer', alignSelf: 'flex-end' }}>
          Reset
        </button>
      </div>

      {/* Table */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Withdrawal Requests — {tab}
            {!loading && (
              <span style={{ marginLeft: 8, background: tab === 'Pending' ? COLORS.warningLight : tab === 'Approved' ? COLORS.successLight : COLORS.dangerLight, color: tab === 'Pending' ? COLORS.warning : tab === 'Approved' ? COLORS.success : COLORS.danger, borderRadius: 10, fontSize: 10, padding: '1px 7px', fontWeight: 700 }}>{visible.length}</span>
            )}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Sr. No.', 'App. Ref. No.', 'Company / Org.', 'App. Type', 'Request Date', 'Justification', 'Status', ...(tab === 'Pending' ? ['Action'] : [])].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>
              )}
              {!loading && visible.length === 0 && (
                <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No {tab.toLowerCase()} withdrawal requests.</td></tr>
              )}
              {visible.map((r, i) => {
                const bg = r.status === 'Approved' ? COLORS.successLight : r.status === 'Rejected' ? COLORS.dangerLight : COLORS.warningLight;
                const fg = r.status === 'Approved' ? COLORS.success      : r.status === 'Rejected' ? COLORS.danger      : COLORS.warning;
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{r.application.referenceNumber}</td>
                    <td style={S.td}>{r.application.companyName}</td>
                    <td style={S.td}>{r.application.applicationType}</td>
                    <td style={S.td}>{fmtDate(r.createdAt)}</td>
                    <td style={{ ...S.td, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.justification}>{r.justification || '—'}</td>
                    <td style={S.td}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: bg, color: fg }}>{r.status}</span>
                    </td>
                    {tab === 'Pending' && (
                      <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            disabled={actioning}
                            onClick={() => setDialog({ msg: `Are you sure you want to approve the withdrawal request from ${r.application.companyName}? The application will be marked as Withdrawn.`, action: () => handleApprove(r.id) })}
                            style={{ padding: '4px 12px', background: COLORS.success, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: actioning ? 'wait' : 'pointer', opacity: actioning ? 0.7 : 1 }}>
                            Approve
                          </button>
                          <button
                            disabled={actioning}
                            onClick={() => setDialog({ msg: `Are you sure you want to reject the withdrawal request from ${r.application.companyName}?`, action: () => handleReject(r.id), variant: 'danger' })}
                            style={{ padding: '4px 12px', background: 'transparent', color: COLORS.danger, border: `1px solid ${COLORS.danger}`, borderRadius: 6, fontSize: 11, cursor: actioning ? 'wait' : 'pointer', opacity: actioning ? 0.7 : 1 }}>
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {dialog && <ConfirmDialog message={dialog.msg} variant={dialog.variant} onConfirm={() => { setDialog(null); dialog.action(); }} onCancel={() => setDialog(null)} />}
    </div>
  );
}
