// Mirrors AppealReviewScreen from mock (App.jsx L15660).
// Wired to real API: fetchNodalAAppealReview() → combined appeal + review records.
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { COLORS, S } from '@/utils/colors';
import { fetchNodalAAppealReview, nodalADispatchAppealDecision, nodalADispatchReviewDecision } from '@/services/officer.service';
import type { AppealReviewRecord } from '@/services/officer.service';

type TypeFilter = 'All' | 'Appeal' | 'Review';

const FILTERS = [
  { label: 'Application No.',                       placeholder: 'EPAAS-…', type: 'text' },
  { label: 'Company / Org Name',                    placeholder: 'Search…', type: 'text' },
  { label: 'Date of Rejection / Appellate Order',   type: 'date' },
  { label: 'From Date',                             type: 'date' },
  { label: 'To Date',                               type: 'date' },
];

function daysLeft(filedAt: string): number {
  const deadline = new Date(filedAt).getTime() + 30 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((deadline - Date.now()) / (24 * 60 * 60 * 1000)));
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AppealReview() {
  const navigate = useNavigate();
  const [typeFilter,  setTypeFilter]  = useState<TypeFilter>('All');
  const [records,     setRecords]     = useState<AppealReviewRecord[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [dispatching, setDispatching] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRecords(await fetchNodalAAppealReview()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDispatch(r: AppealReviewRecord) {
    setDispatching(r.id);
    try {
      if (r.type === 'Appeal') {
        await nodalADispatchAppealDecision(r.id);
        toast.success('Appeal decision dispatched to applicant');
      } else {
        await nodalADispatchReviewDecision(r.id);
        toast.success('Review decision dispatched to applicant');
      }
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Dispatch failed');
    } finally { setDispatching(null); }
  }

  const visible = typeFilter === 'All' ? records : records.filter((r) => r.type === typeFilter);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 16 }}>
        <div style={S.roleLabel}>NODAL OFFICER A</div>
        <div style={S.pageTitle}>Applicant Request for Appeal and Review</div>
        <div style={S.pageDesc}>Appeal against rejection orders and review against appellate orders.</div>
      </div>

      {/* Type filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['All', 'Appeal', 'Review'] as TypeFilter[]).map((f) => (
          <button key={f} onClick={() => setTypeFilter(f)}
            style={{ padding: '6px 16px', background: typeFilter === f ? COLORS.primary : 'transparent', color: typeFilter === f ? '#fff' : COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
        {FILTERS.map((f) => (
          <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140, flex: '1 1 140px' }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.label}</label>
            {f.type === 'date' ? (
              <input type="date" style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11 }} />
            ) : (
              <input placeholder={f.placeholder ?? ''} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11 }} />
            )}
          </div>
        ))}
        <button style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontSize: 11, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-end' }}>Search</button>
        <button style={{ background: 'none', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer', alignSelf: 'flex-end' }}>Reset</button>
      </div>

      {/* Table card */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Appeal &amp; Review Requests
            {!loading && <span style={{ marginLeft: 8, background: COLORS.infoLight, color: COLORS.info, borderRadius: 10, fontSize: 10, padding: '1px 7px', fontWeight: 700 }}>{visible.length}</span>}
          </span>
          <button style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Sr. No.', 'Application No.', 'Company / Org.', 'Food Category', 'Product Name', 'Request Date', 'Days Remaining', 'Type', 'Action'].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>}
              {!loading && visible.length === 0 && <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No appeal or review requests found.</td></tr>}
              {visible.map((r, i) => {
                const left = daysLeft(r.filedAt);
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{r.application.referenceNumber}</td>
                    <td style={S.td}>{r.application.companyName}</td>
                    <td style={S.td}>{r.application.foodCategory}</td>
                    <td style={S.td}>{r.application.productName ?? '—'}</td>
                    <td style={S.td}>{fmtDate(r.filedAt)}</td>
                    <td style={{ ...S.td, color: left <= 5 ? COLORS.danger : COLORS.text, fontWeight: left <= 5 ? 700 : 400 }}>{left} days</td>
                    <td style={S.td}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: r.type === 'Appeal' ? COLORS.warningLight : COLORS.infoLight, color: r.type === 'Appeal' ? COLORS.warning : COLORS.info }}>
                        {r.type}
                      </span>
                    </td>
                    <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button onClick={() => navigate(`/nodal/scrutiny/${r.application.id}`)}
                          style={{ padding: '4px 12px', background: 'transparent', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                          View
                        </button>
                        {((r.type === 'Appeal' && (r.status === 'AppealApproved' || r.status === 'AppealRejected')) ||
                          (r.type === 'Review' && r.status === 'ReviewDisposed')) &&
                          r.application.stage === 'WithNodalOfficerA' && (
                          <button
                            onClick={() => handleDispatch(r)}
                            disabled={dispatching === r.id}
                            style={{ padding: '4px 12px', background: COLORS.success, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: dispatching === r.id ? 'not-allowed' : 'pointer', opacity: dispatching === r.id ? 0.6 : 1 }}>
                            {dispatching === r.id ? '…' : '📨 Dispatch'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
