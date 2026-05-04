// Technical Officer — Withdrawal of Approval (/technical/withdrawal)
import { COLORS, S } from '@/utils/colors';

const FILTER_FIELDS = [
  { label: 'Approval No.',       placeholder: 'APPR-…',  type: 'text' },
  { label: 'Company / Org Name', placeholder: 'Search…', type: 'text' },
  { label: 'From Date',          type: 'date' },
  { label: 'To Date',            type: 'date' },
  { label: 'Reason',             type: 'select', options: ['All', 'PMS', 'Any Other'] },
];

export default function TechWithdrawal() {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={S.roleLabel}>TECHNICAL OFFICER</div>
        <div style={S.pageTitle}>Application for Withdrawal of Approval Granted</div>
        <div style={S.pageDesc}>Requests received from Applicants to withdraw a previously granted approval.</div>
      </div>

      <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
        {FILTER_FIELDS.map((f) => (
          <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140, flex: '1 1 140px' }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.label}</label>
            {f.type === 'select' ? (
              <select style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11, background: '#fff', cursor: 'pointer' }}>
                {(f.options ?? []).map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : f.type === 'date' ? (
              <input type="date" style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11 }} />
            ) : (
              <input placeholder={f.placeholder ?? ''} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11 }} />
            )}
          </div>
        ))}
        <button style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontSize: 11, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-end' }}>Search</button>
        <button style={{ background: 'none', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer', alignSelf: 'flex-end' }}>Reset</button>
      </div>

      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>Withdrawal Requests</span>
          <button style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>{['Sr. No.', 'Approval No.', 'Company / Org.', 'Issue Date', 'Request Date', 'Status', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No withdrawal requests pending.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
