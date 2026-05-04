// Technical Officer — Search Console (/technical/search)
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, S } from '@/utils/colors';
import { fetchTechnicalAll } from '@/services/technical.service';
import type { Application } from '@/services/application.service';

const STAGE_PENDING_WITH: Record<string, string> = {
  WithNodalOfficerA: 'Nodal Officer A', WithTechnicalOfficer: 'Technical Officer',
  WithEC: 'Expert Committee', WithNodalOfficerB: 'Nodal Officer B',
  WithCEO: 'CEO', WithChairperson: 'Chairperson',
  Approved: '—', Rejected: '—', Closed: '—', Withdrawn: '—', QuerySent: 'Applicant',
};

const TYPE_LABELS: Record<string, string> = { NSF: 'NSF', ClaimApproval: 'Claim Approval', AyurvedaAahara: 'Ayurveda Aahara', RPET: 'rPET', AnyOther: 'Any Other' };

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const iStyle: React.CSSProperties = { padding: '7px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, background: COLORS.bg, width: '100%', boxSizing: 'border-box' };
const lStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: COLORS.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 };

function DatePair({ fromLabel, toLabel }: { fromLabel: string; toLabel: string }) {
  return (
    <>
      <div><label style={lStyle}>{fromLabel}</label><input type="date" style={iStyle} /></div>
      <div><label style={lStyle}>{toLabel}</label><input type="date" style={iStyle} /></div>
    </>
  );
}

const SUMMARY_LABELS = [
  { label: 'Total applications received',          fn: (_a: Application) => true },
  { label: 'Applications Approved',                fn: (a: Application) => ['Approved', 'Closed'].includes(a.stage) },
  { label: 'Applications Rejected',                fn: (a: Application) => a.stage === 'Rejected' },
  { label: 'Applications Pending / Under Review',  fn: (a: Application) => !['Approved', 'Closed', 'Rejected', 'Withdrawn', 'Draft'].includes(a.stage) },
  { label: 'Applications Withdrawn / Closed',      fn: (a: Application) => a.stage === 'Withdrawn' },
];

export default function TechSearchConsole() {
  const navigate  = useNavigate();
  const [searched, setSearched] = useState(false);
  const [results,  setResults]  = useState<Application[]>([]);
  const [allApps,  setAllApps]  = useState<Application[]>([]);
  const [loading,  setLoading]  = useState(false);

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTechnicalAll();
      setAllApps(data);
      setResults(data);
      setSearched(true);
    } finally { setLoading(false); }
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={S.roleLabel}>TECHNICAL OFFICER</div>
        <div style={S.pageTitle}>Search Console</div>
        <div style={S.pageDesc}>Comprehensive search across all applications, approvals, and lifecycle events.</div>
      </div>

      {searched && allApps.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 16 }}>
          {SUMMARY_LABELS.map((s) => (
            <div key={s.label} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${COLORS.primary}`, borderRadius: 8, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.primary, fontFamily: "'Libre Baskerville',Georgia,serif" }}>{allApps.filter(s.fn).length}</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4, lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 18 }}>Search Filters</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label style={lStyle}>Name of Company / Organization</label><input placeholder="Search company..." style={iStyle} /></div>
          <div>
            <label style={lStyle}>Application Status</label>
            <select style={{ ...iStyle, cursor: 'pointer' }}>
              <option>All Stages</option><option>Document Scrutinization</option><option>Forwarded to Technical Officer</option>
              <option>Forwarded to EC</option><option>Approved</option><option>Rejected</option>
              <option>Conditionally Approved</option><option>Withdrawn</option><option>Under Appeal</option><option>Under Review</option>
            </select>
          </div>
          <div><label style={lStyle}>Reference No. / Approval No.</label><input placeholder="Enter ref. or approval no." style={iStyle} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <DatePair fromLabel="Application Submitted Date (From)" toLabel="Application Submitted Date (To)" />
          <DatePair fromLabel="Approval Issued Date (From)"       toLabel="Approval Issued Date (To)"       />
          <DatePair fromLabel="Rejection Issued Date (From)"      toLabel="Rejection Issued Date (To)"      />
          <DatePair fromLabel="Provisionally Approved Date (From)" toLabel="Provisionally Approved Date (To)" />
          <DatePair fromLabel="Withdrawn / Closure Date (From)"   toLabel="Withdrawn / Closure Date (To)"   />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={doSearch} disabled={loading}
            style={{ padding: '7px 24px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Searching…' : 'Search'}
          </button>
          <button onClick={() => { setSearched(false); setResults([]); setAllApps([]); }}
            style={{ padding: '7px 16px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
            Reset
          </button>
        </div>
      </div>

      {searched && (
        <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>Search Results — {results.length} Records Found</div>
            <button style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['Sr. No.', 'Application No.', 'Company / Applicant', 'Product', 'App. Type', 'Food Category', 'Received On', 'Pending With', 'EC No.', 'Final Status'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {results.length === 0 && <tr><td colSpan={10} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No applications match the filters.</td></tr>}
                {results.map((a, i) => {
                  const isApproved = ['Approved', 'Closed'].includes(a.stage);
                  const isRejected = a.stage === 'Rejected';
                  const bg = isApproved ? COLORS.successLight : isRejected ? COLORS.dangerLight : COLORS.warningLight;
                  const fg = isApproved ? COLORS.success       : isRejected ? COLORS.danger      : COLORS.warning;
                  return (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg, cursor: 'pointer' }} onClick={() => navigate(`/technical/assessment/${a.id}`)}>
                      <td style={S.td}>{i + 1}</td>
                      <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                      <td style={S.td}>{a.companyName}</td>
                      <td style={S.td}>{a.productName ?? '—'}</td>
                      <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: COLORS.infoLight, color: COLORS.info }}>{TYPE_LABELS[a.applicationType] ?? a.applicationType}</span></td>
                      <td style={S.td}>{a.foodCategory}</td>
                      <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                      <td style={S.td}><span style={{ fontSize: 11, color: COLORS.primary, fontWeight: 600 }}>{STAGE_PENDING_WITH[a.stage] ?? a.stage}</span></td>
                      <td style={S.td}>—</td>
                      <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: bg, color: fg }}>{a.stage}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
