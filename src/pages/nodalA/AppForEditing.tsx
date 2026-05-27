// Mirrors NodalFBOEditing from mock (App.jsx L14601).
// Wired to real API: fetchNodalAAll() filtered to QuerySent stage.
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, S } from '@/utils/colors';
import { fetchNodalAAll } from '@/services/officer.service';
import type { Application } from '@/services/application.service';

const TYPE_LABELS: Record<string, string> = {
  NSF:            'NSF',
  ClaimApproval:  'Claim Approval',
  AyurvedaAahara: 'Ayurveda Aahara',
  RPET:           'rPET',
  AnyOther:       'Any Other',
};

const FILTER_FIELDS = [
  { label: 'Application Ref. No.', placeholder: 'EPAAS-…', type: 'text'   },
  { label: 'Company / Org',        placeholder: 'Search…', type: 'text'   },
  { label: 'State',  type: 'select', options: ['All', 'Gujarat', 'Maharashtra', 'Delhi'] },
  { label: 'From Date', type: 'date' },
  { label: 'To Date',   type: 'date' },
];

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Btn({ label, variant = 'primary', onClick }: { label: string; variant?: 'primary' | 'outline'; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      style={{ background: variant === 'primary' ? COLORS.primary : 'transparent', color: variant === 'primary' ? '#fff' : COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  );
}

export default function AppForEditing() {
  const navigate = useNavigate();
  const [apps,    setApps]    = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await fetchNodalAAll();
      setApps(all.filter((a) => a.stage === 'QuerySent'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 16 }}>
        <div style={S.pageDesc}>Applications returned to the Applicant for corrections or additional information.</div>
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
            Applications with Editing / Clarification
            {!loading && (
              <span style={{ marginLeft: 8, background: COLORS.warning, color: '#fff', borderRadius: 10, fontSize: 10, padding: '1px 7px', fontWeight: 700 }}>{apps.length}</span>
            )}
          </span>
          <button style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Sr. No.', 'App. Ref. No.', 'App. Type', 'Application Name', 'Company / Org.', 'Forwarded On', 'Action'].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>
              )}
              {!loading && apps.length === 0 && (
                <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No applications pending editing / clarification.</td></tr>
              )}
              {apps.map((a, i) => (
                <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                  <td style={S.td}>{i + 1}</td>
                  <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                  <td style={S.td}>
                    <span style={{ background: COLORS.infoLight, color: COLORS.info, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                      {TYPE_LABELS[a.applicationType] ?? a.applicationType}
                    </span>
                  </td>
                  <td style={S.td}>{a.productName ?? '—'}</td>
                  <td style={S.td}>{a.companyName}</td>
                  <td style={S.td}>{fmtDate(a.updatedAt)}</td>
                  <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Btn label="View"                variant="outline" onClick={() => navigate(`/nodal/scrutiny/${a.id}`)} />
                      <Btn label="View Remarks"        onClick={() => navigate(`/nodal/scrutiny/${a.id}`)} />
                      <Btn label="Changes Recommended" variant="outline" />
                    </div>
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
