import { useState, useEffect, useCallback } from 'react';
import { COLORS, S } from '@/utils/colors';
import { fetchECAppealReview } from '@/services/ec.service';
import type { AppealReviewRecord } from '@/services/officer.service';

type TypeFilter = 'All' | 'Appeal' | 'Review';

const FILTERS = [
  { label: 'Application No.', placeholder: 'EPAAS-…', type: 'text' },
  { label: 'Company / Org Name', placeholder: 'Search…', type: 'text' },
  { label: 'From Date', type: 'date' },
  { label: 'To Date',   type: 'date' },
];

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ECAppealReview() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [records,    setRecords]    = useState<AppealReviewRecord[]>([]);
  const [loading,    setLoading]    = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRecords(await fetchECAppealReview()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = typeFilter === 'All' ? records : records.filter((r) => r.type === typeFilter);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={S.roleLabel}>EXPERT COMMITTEE</div>
        <div style={S.pageTitle}>Appeal and Review</div>
        <div style={S.pageDesc}>Applications filed for appeal or review that have EC involvement.</div>
      </div>

      {/* Type tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 14 }}>
        {(['All', 'Appeal', 'Review'] as TypeFilter[]).map((t) => (
          <div key={t} onClick={() => setTypeFilter(t)}
            style={{ padding: '6px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: typeFilter === t ? COLORS.primary : COLORS.textMuted, borderBottom: typeFilter === t ? `2px solid ${COLORS.primary}` : '2px solid transparent', marginBottom: -1 }}>
            {t}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
        {FILTERS.map((f) => (
          <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150, flex: '1 1 150px' }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.label}</label>
            <input type={f.type === 'date' ? 'date' : 'text'} placeholder={f.placeholder ?? ''} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11 }} />
          </div>
        ))}
        <button style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontSize: 11, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-end' }}>Search</button>
      </div>

      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>Appeal &amp; Review Records ({visible.length})</span>
          <button style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['Sr. No.', 'Application No.', 'Type', 'Company / Applicant', 'Product', 'Filed On', 'Days Left', 'Status'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: '40px 0', color: COLORS.textMuted }}>Loading…</td></tr>}
              {!loading && visible.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: '48px 0', color: COLORS.textMuted }}>No records found.</td></tr>}
              {visible.map((r, i) => {
                const deadline = new Date(r.filedAt).getTime() + 30 * 24 * 60 * 60 * 1000;
                const dLeft = Math.max(0, Math.ceil((deadline - Date.now()) / (24 * 60 * 60 * 1000)));
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{r.application?.referenceNumber ?? '—'}</td>
                    <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: r.type === 'Appeal' ? '#FEF3C7' : '#EDE9FE', color: r.type === 'Appeal' ? '#B45309' : '#5B21B6' }}>{r.type}</span></td>
                    <td style={S.td}>{r.application?.companyName ?? '—'}</td>
                    <td style={S.td}>{r.application?.productName ?? '—'}</td>
                    <td style={S.td}>{fmtDate(r.filedAt)}</td>
                    <td style={{ ...S.td, color: dLeft <= 5 ? COLORS.danger : COLORS.text, fontWeight: dLeft <= 5 ? 700 : 400 }}>{dLeft}d</td>
                    <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: COLORS.warningLight, color: COLORS.warning }}>{r.status}</span></td>
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
