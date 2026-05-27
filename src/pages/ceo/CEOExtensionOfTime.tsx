import { useState, useEffect, useCallback } from 'react';
import { COLORS, S } from '@/utils/colors';
import { fetchCEOExtensions } from '@/services/ceo.service';

type StatusFilter = 'Pending' | 'Completed';

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CEOExtensionOfTime() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Pending');
  const [requests,     setRequests]     = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRequests(await fetchCEOExtensions()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = statusFilter === 'Pending'
    ? requests.filter((r) => r.status === 'Pending')
    : requests.filter((r) => r.status !== 'Pending');

  const pendingCount = requests.filter((r) => r.status === 'Pending').length;

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
            {t === 'Pending' && pendingCount > 0 && (
              <span style={{ marginLeft: 5, background: COLORS.primary, color: '#fff', borderRadius: 8, fontSize: 10, padding: '1px 5px', fontWeight: 700 }}>{pendingCount}</span>
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
              <tr>{['Sr.', 'Application No.', 'Company', 'Product', 'Requested On', 'Extension Days', 'Reason', 'Status'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: '40px 0', color: COLORS.textMuted }}>Loading…</td></tr>}
              {!loading && visible.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: '48px 0', color: COLORS.textMuted }}>No {statusFilter.toLowerCase()} extension requests.</td></tr>}
              {visible.map((r, i) => (
                <tr key={r.id ?? i} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                  <td style={S.td}>{i + 1}</td>
                  <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{r.application?.referenceNumber ?? r.referenceNumber ?? '—'}</td>
                  <td style={S.td}>{r.application?.companyName ?? r.companyName ?? '—'}</td>
                  <td style={S.td}>{r.application?.productName ?? r.productName ?? '—'}</td>
                  <td style={S.td}>{fmtDate(r.createdAt)}</td>
                  <td style={S.td}>{r.extensionDays ?? r.days ?? '—'} days</td>
                  <td style={{ ...S.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason ?? r.justification ?? '—'}</td>
                  <td style={S.td}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: r.status === 'Approved' ? COLORS.successLight : r.status === 'Rejected' ? COLORS.dangerLight : COLORS.warningLight, color: r.status === 'Approved' ? COLORS.success : r.status === 'Rejected' ? COLORS.danger : COLORS.warning }}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
