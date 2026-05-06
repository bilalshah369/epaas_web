import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, S } from '@/utils/colors';
import { fetchNodalBAll } from '@/services/nodal-b.service';
import type { Application } from '@/services/application.service';

const STAGE_PENDING_WITH: Record<string, string> = {
  WithNodalOfficerA: 'Nodal Officer A', WithTechnicalOfficer: 'Technical Officer',
  WithExpertCommittee: 'Expert Committee', WithNodalPointB: 'Nodal Point B',
  WithCEO: 'CEO', WithChairperson: 'Chairperson',
  Approved: '—', Rejected: '—', Closed: '—',
};

const TYPE_LABELS: Record<string, string> = {
  NSF: 'NSF', ClaimApproval: 'Claim Approval',
  AyurvedaAahara: 'Ayurveda Aahara', RPET: 'rPET', AnyOther: 'Any Other',
};

const STAGE_OPTIONS: Record<string, string> = {
  'All Stages':                  '',
  'With Nodal Point B':          'WithNodalPointB',
  'Forwarded to CEO':            'WithCEO',
  'With Chairperson':            'WithChairperson',
  'Approved':                    'Approved',
  'Rejected':                    'Rejected',
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function exportCSV(rows: Application[], filename: string) {
  if (!rows.length) return;
  const cols: (keyof Application)[] = ['referenceNumber', 'applicationType', 'foodCategory', 'companyName', 'productName', 'stage', 'submittedAt'];
  const header = ['Ref No.', 'App Type', 'Food Category', 'Company', 'Product', 'Stage', 'Submitted On'];
  const lines  = [header.join(','), ...rows.map((r) => cols.map((k) => JSON.stringify(r[k] ?? '')).join(','))];
  const blob   = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

const iStyle: React.CSSProperties = { padding: '7px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, background: COLORS.bg, width: '100%', boxSizing: 'border-box' };
const lStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: COLORS.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 };

const SUMMARY_LABELS = [
  { label: 'Total Applications',     fn: (_a: Application) => true },
  { label: 'Approved',               fn: (a: Application) => ['Approved', 'Closed'].includes(a.stage) },
  { label: 'Rejected',               fn: (a: Application) => a.stage === 'Rejected' },
  { label: 'Pending / Under Review', fn: (a: Application) => !['Approved', 'Closed', 'Rejected', 'Withdrawn', 'Draft'].includes(a.stage) },
  { label: 'Forwarded to CEO',       fn: (a: Application) => a.stage === 'WithCEO' },
];

export default function NodalBSearchConsole() {
  const navigate = useNavigate();
  const [searched, setSearched] = useState(false);
  const [results,  setResults]  = useState<Application[]>([]);
  const [allApps,  setAllApps]  = useState<Application[]>([]);
  const [loading,  setLoading]  = useState(false);

  const [company,  setCompany]  = useState('');
  const [stageKey, setStageKey] = useState('All Stages');
  const [refNo,    setRefNo]    = useState('');
  const [subFrom,  setSubFrom]  = useState('');
  const [subTo,    setSubTo]    = useState('');

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNodalBAll();
      setAllApps(data);
      let r = [...data];
      if (company.trim()) r = r.filter((a) => a.companyName.toLowerCase().includes(company.trim().toLowerCase()));
      if (refNo.trim())   r = r.filter((a) => a.referenceNumber.toLowerCase().includes(refNo.trim().toLowerCase()));
      const stageVal = STAGE_OPTIONS[stageKey] ?? '';
      if (stageVal)       r = r.filter((a) => a.stage === stageVal);
      if (subFrom)        r = r.filter((a) => a.submittedAt && new Date(a.submittedAt) >= new Date(subFrom));
      if (subTo)          r = r.filter((a) => a.submittedAt && new Date(a.submittedAt) <= new Date(subTo + 'T23:59:59'));
      setResults(r); setSearched(true);
    } finally { setLoading(false); }
  }, [company, stageKey, refNo, subFrom, subTo]);

  function handleReset() {
    setCompany(''); setStageKey('All Stages'); setRefNo('');
    setSubFrom(''); setSubTo('');
    setSearched(false); setResults([]); setAllApps([]);
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={S.roleLabel}>NODAL POINT B</div>
        <div style={S.pageTitle}>Search Console</div>
        <div style={S.pageDesc}>Search across all applications handled by Nodal Point B.</div>
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
          <div><label style={lStyle}>Company / Organization</label><input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Search company…" style={iStyle} /></div>
          <div>
            <label style={lStyle}>Application Status</label>
            <select value={stageKey} onChange={(e) => setStageKey(e.target.value)} style={{ ...iStyle, cursor: 'pointer' }}>
              {Object.keys(STAGE_OPTIONS).map((k) => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div><label style={lStyle}>Reference No.</label><input value={refNo} onChange={(e) => setRefNo(e.target.value)} placeholder="EPAAS-…" style={iStyle} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div><label style={lStyle}>Submitted From</label><input type="date" value={subFrom} onChange={(e) => setSubFrom(e.target.value)} style={iStyle} /></div>
          <div><label style={lStyle}>Submitted To</label>  <input type="date" value={subTo}   onChange={(e) => setSubTo(e.target.value)}   style={iStyle} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={doSearch} disabled={loading} style={{ padding: '7px 24px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Searching…' : 'Search'}
          </button>
          <button onClick={handleReset} style={{ padding: '7px 16px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>Reset</button>
        </div>
      </div>

      {searched && (
        <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Search Results — {results.length} Record{results.length !== 1 ? 's' : ''} Found
            </div>
            <button onClick={() => exportCSV(results, 'nodalb_search_results')} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['Sr.', 'App. No.', 'Company', 'Product', 'App. Type', 'Received On', 'Pending With', 'Stage'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {results.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No applications match the filters.</td></tr>}
                {results.map((a, i) => {
                  const isApproved = ['Approved', 'Closed', 'WithCEO'].includes(a.stage);
                  const isRejected = a.stage === 'Rejected';
                  const bg = isApproved ? COLORS.successLight : isRejected ? COLORS.dangerLight : COLORS.warningLight;
                  const fg = isApproved ? COLORS.success       : isRejected ? COLORS.danger      : COLORS.warning;
                  return (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg, cursor: 'pointer' }}
                      onClick={() => navigate(`/nodalb/queue/${a.id}`)}>
                      <td style={S.td}>{i + 1}</td>
                      <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                      <td style={S.td}>{a.companyName}</td>
                      <td style={S.td}>{a.productName ?? '—'}</td>
                      <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: COLORS.primaryLight, color: COLORS.primary }}>{TYPE_LABELS[a.applicationType] ?? a.applicationType}</span></td>
                      <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                      <td style={S.td}><span style={{ fontSize: 11, color: COLORS.primary, fontWeight: 600 }}>{STAGE_PENDING_WITH[a.stage] ?? a.stage}</span></td>
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
