// Mirrors OfficerReports from mock (App.jsx L14971).
// 3-section reports page: Approved Applications, Status Report, Track Application.
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, S } from '@/utils/colors';
import { fetchNodalAAll } from '@/services/officer.service';
import type { Application } from '@/services/application.service';

type ReportSection = 'approved' | 'status' | 'track' | null;

const REPORTS = [
  { key: 'approved' as const, icon: '📈', title: 'Approved Applications Report', desc: 'Complete list of all approved applications with Form II dates and EC details.' },
  { key: 'status'   as const, icon: '📊', title: 'Status Report',                desc: 'Ageing-wise and stage-wise status of all active applications.'          },
  { key: 'track'    as const, icon: '🔍', title: 'Track Application / Approved',  desc: 'Full lifecycle tracking for a specific application or approval number.'  },
];

const STATUS_COLS = [
  'Sr. No.', 'Application No.', 'Name and Address of Applicant', 'Name of Product',
  'Date of Receipt of Application', 'E.C Number', 'E.C Status',
  'Date of Receipt of Appeal', 'Date of Appellate Order',
  'Date of Receipt of Review', 'Date of Review Order',
  'Date of Issue of Form II', 'Final Status',
];

const TYPE_LABELS: Record<string, string> = {
  NSF: 'NSF', ClaimApproval: 'Claim Approval', AyurvedaAahara: 'Ayurveda Aahara', RPET: 'rPET', AnyOther: 'Any Other',
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const iStyle: React.CSSProperties = { padding: '6px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, background: COLORS.white };
const lStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 4 };

export default function NodalReports() {
  const navigate  = useNavigate();
  const [active,  setActive]  = useState<ReportSection>(null);
  const [apps,    setApps]    = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [track,   setTrack]   = useState('');

  const load = useCallback(async () => {
    if (active === 'approved' || active === 'status') {
      setLoading(true);
      try { setApps(await fetchNodalAAll()); } finally { setLoading(false); }
    }
  }, [active]);

  useEffect(() => { load(); }, [load]);

  // ── Approved Applications sub-report ─────────────────────────────────────────
  if (active === 'approved') {
    const approved = apps.filter((a) => ['Approved', 'Closed'].includes(a.stage));
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setActive(null)} style={{ ...iStyle, color: COLORS.primary, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", margin: 0 }}>Approved Applications</h3>
        </div>

        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 14 }}>List of Approved Applications</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            {[
              { label: 'Approval No.',            placeholder: 'APPR-…',   type: 'text' },
              { label: 'Reference No.',            placeholder: 'EPAAS-…',  type: 'text' },
              { label: 'Company / Organization',  placeholder: 'Search…',  type: 'text' },
              { label: 'Product Name',             placeholder: 'Keyword…', type: 'text' },
            ].map((f) => (
              <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={lStyle}>{f.label}</label>
                <input placeholder={f.placeholder} style={{ ...iStyle, minWidth: 140 }} />
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={lStyle}>Approved Application</label>
              <select style={{ ...iStyle, minWidth: 140, cursor: 'pointer' }}>
                {['Approved', 'Rejected', 'Withdrawn', 'Closed'].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={lStyle}>Category</label>
              <select style={{ ...iStyle, minWidth: 130, cursor: 'pointer' }}>
                {['All', 'Dairy & Products', 'Beverages', 'NSF', 'Claim Approval'].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            {['From (dd/mm/yyyy)', 'To (dd/mm/yyyy)'].map((l) => (
              <div key={l} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={lStyle}>{l}</label>
                <input type="date" style={iStyle} />
              </div>
            ))}
          </div>
          <button style={{ padding: '7px 20px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Search</button>
        </div>

        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Sr. No.', 'Approval No.', 'Reference No.', 'Company / Org.', 'Category', 'Product Name', 'Status', 'Issue Date'].map((h) => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>}
                {!loading && approved.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No approved applications found.</td></tr>}
                {approved.map((a, i) => (
                  <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg, cursor: 'pointer' }} onClick={() => navigate(`/nodal/scrutiny/${a.id}`)}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>APPR-{new Date(a.updatedAt).getFullYear()}-{String(i + 100).padStart(4, '0')}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                    <td style={S.td}>{a.companyName}</td>
                    <td style={S.td}>{TYPE_LABELS[a.applicationType] ?? a.applicationType}</td>
                    <td style={S.td}>{a.productName ?? '—'}</td>
                    <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: COLORS.successLight, color: COLORS.success }}>Approved</span></td>
                    <td style={S.td}>{fmtDate(a.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── Status Report sub-report ──────────────────────────────────────────────────
  if (active === 'status') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setActive(null)} style={{ ...iStyle, color: COLORS.primary, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", margin: 0 }}>Applications Status</h3>
        </div>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{STATUS_COLS.map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={STATUS_COLS.length} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>}
                {!loading && apps.length === 0 && <tr><td colSpan={STATUS_COLS.length} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No applications found.</td></tr>}
                {apps.map((a, i) => {
                  const isApproved = ['Approved', 'Closed'].includes(a.stage);
                  const isRejected = a.stage === 'Rejected';
                  const badgeBg    = isApproved ? COLORS.successLight : isRejected ? COLORS.dangerLight : COLORS.warningLight;
                  const badgeFg    = isApproved ? COLORS.success       : isRejected ? COLORS.danger      : COLORS.warning;
                  return (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg, cursor: 'pointer' }} onClick={() => navigate(`/nodal/scrutiny/${a.id}`)}>
                      <td style={S.td}>{i + 1}</td>
                      <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                      <td style={S.td}>{a.companyName}</td>
                      <td style={S.td}>{a.productName ?? '—'}</td>
                      <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                      <td style={S.td}>—</td>
                      <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: badgeBg, color: badgeFg }}>{a.stage}</span></td>
                      <td style={S.td}>—</td>
                      <td style={S.td}>—</td>
                      <td style={S.td}>—</td>
                      <td style={S.td}>—</td>
                      <td style={S.td}>{isApproved ? fmtDate(a.updatedAt) : '—'}</td>
                      <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: badgeBg, color: badgeFg }}>{a.stage}</span></td>
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

  // ── Track Application sub-report ──────────────────────────────────────────────
  if (active === 'track') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setActive(null)} style={{ ...iStyle, color: COLORS.primary, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", margin: 0 }}>Track Application / Approved</h3>
        </div>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 16, marginBottom: 16, maxWidth: 480 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 14 }}>Enter Application Ref No. / Approval No.</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <label style={lStyle}>Application Ref No. / Approval No.</label>
              <input value={track} onChange={(e) => setTrack(e.target.value)} placeholder="EPAAS-… or APPR-…" style={{ ...iStyle, fontSize: 13, padding: '8px 12px' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ padding: '8px 22px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Submit</button>
              <button onClick={() => setActive(null)} style={{ padding: '8px 16px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Back</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Landing: report list ──────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={S.roleLabel}>NODAL OFFICER A</div>
        <div style={S.pageTitle}>Reports</div>
        <div style={S.pageDesc}>Standard reports for monitoring and compliance.</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden', background: COLORS.white, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {REPORTS.map((r, i) => (
          <div key={r.key} onClick={() => setActive(r.key)}
            style={{ padding: '11px 16px', cursor: 'pointer', borderBottom: i < REPORTS.length - 1 ? `1px solid ${COLORS.border}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: COLORS.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 14 }}>{r.icon}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 1 }}>{r.title}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>{r.desc}</div>
            </div>
            <span style={{ fontSize: 11, color: COLORS.primary, fontWeight: 600, flexShrink: 0 }}>Open →</span>
          </div>
        ))}
      </div>
    </div>
  );
}
