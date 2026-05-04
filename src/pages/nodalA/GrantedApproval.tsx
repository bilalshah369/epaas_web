// Mirrors NodalGrantedApproval from mock (App.jsx L14516).
// Wired to real API: fetchNodalAAll() filtered to Approved/Closed stage.
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, S } from '@/utils/colors';
import { fetchNodalAAll } from '@/services/officer.service';
import type { Application } from '@/services/application.service';

const FILTER_FIELDS = [
  { label: 'Application Ref. No.', placeholder: 'EPAAS-…', type: 'text'   },
  { label: 'Approval No.',         placeholder: 'APPR-…',  type: 'text'   },
  { label: 'Company / Org Name',   placeholder: 'Search…', type: 'text'   },
  { label: 'Application Type',     type: 'select', options: ['All', 'New', 'Appeal', 'Review'] },
  { label: 'From Date',            type: 'date'   },
  { label: 'To Date',              type: 'date'   },
];

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function GrantedApproval() {
  const navigate = useNavigate();
  const [apps,    setApps]    = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await fetchNodalAAll();
      setApps(all.filter((a) => ['Approved', 'Closed'].includes(a.stage)));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 16 }}>
        <div style={S.roleLabel}>NODAL OFFICER A</div>
        <div style={S.pageTitle}>Granted Approval</div>
        <div style={S.pageDesc}>Applications where approval has been issued and Form II dispatched.</div>
      </div>

      {/* Filter bar */}
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

      {/* Table card */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Granted Approvals
            {!loading && (
              <span style={{ marginLeft: 8, background: COLORS.success, color: '#fff', borderRadius: 10, fontSize: 10, padding: '1px 7px', fontWeight: 700 }}>{apps.length}</span>
            )}
          </span>
          <button style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Sr. No.', 'Application No.', 'Approval No.', 'Company / Org.', 'Product', 'EC Number', 'EC Status', 'Date of Issue of Form 2', 'Final Status', 'Action'].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>
              )}
              {!loading && apps.length === 0 && (
                <tr><td colSpan={10} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No approved applications found.</td></tr>
              )}
              {apps.map((a, i) => (
                <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                  <td style={S.td}>{i + 1}</td>
                  <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                  <td style={S.td}>APPR-{new Date(a.updatedAt).getFullYear()}-{String(i + 100).padStart(4, '0')}</td>
                  <td style={S.td}>{a.companyName}</td>
                  <td style={S.td}>{a.productName ?? '—'}</td>
                  <td style={S.td}>—</td>
                  <td style={S.td}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: COLORS.successLight, color: COLORS.success }}>EC Approved</span>
                  </td>
                  <td style={S.td}>{fmtDate(a.updatedAt)}</td>
                  <td style={S.td}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: COLORS.successLight, color: COLORS.success }}>Approved</span>
                  </td>
                  <td style={S.td}>
                    <button onClick={() => navigate(`/nodal/scrutiny/${a.id}`)} style={{ padding: '4px 12px', background: 'transparent', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>View</button>
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
