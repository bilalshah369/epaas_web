import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, S } from '@/utils/colors';
import { fetchCEOAll } from '@/services/ceo.service';
import type { Application } from '@/services/application.service';

type ReportSection = 'approved' | 'status' | 'track' | null;

const REPORTS = [
  { key: 'approved' as const, icon: '📈', title: 'CEO Approved Applications Report',     desc: 'Complete list of all CEO-approved applications with dates.' },
  { key: 'status'   as const, icon: '📊', title: 'Applications Status Report',           desc: 'Stage-wise and ageing status of all active applications handled by CEO.' },
  { key: 'track'    as const, icon: '🔍', title: 'Track Application / CEO Decision',     desc: 'Full lifecycle tracking for a specific application by reference number.' },
];

const TYPE_LABELS: Record<string, string> = { NSF: 'NSF', ClaimApproval: 'Claim Approval', AyurvedaAahara: 'Ayurveda Aahara', RPET: 'rPET', AnyOther: 'Any Other' };
const CATEGORY_OPTIONS = ['All', 'Dairy & Products', 'Beverages', 'NSF', 'Claim Approval', 'Ayurveda Aahara', 'Any Other'];

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function exportCSV(rows: Application[], filename: string) {
  if (!rows.length) return;
  const cols: (keyof Application)[] = ['referenceNumber', 'applicationType', 'foodCategory', 'companyName', 'productName', 'stage', 'submittedAt', 'updatedAt'];
  const header = ['Ref No.', 'App Type', 'Food Category', 'Company', 'Product', 'Stage', 'Submitted On', 'Updated On'];
  const lines  = [header.join(','), ...rows.map((r) => cols.map((k) => JSON.stringify(r[k] ?? '')).join(','))];
  const blob   = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

const iStyle: React.CSSProperties = { padding: '6px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, background: COLORS.white };
const lStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 4 };

export default function CEOReports() {
  const navigate = useNavigate();
  const [active,  setActive]  = useState<ReportSection>(null);
  const [apps,    setApps]    = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [track,   setTrack]   = useState('');

  const [apprRef,     setApprRef]     = useState('');
  const [apprCompany, setApprCompany] = useState('');
  const [apprProduct, setApprProduct] = useState('');
  const [apprCat,     setApprCat]     = useState('All');
  const [apprFrom,    setApprFrom]    = useState('');
  const [apprTo,      setApprTo]      = useState('');
  const [apprFiltered,setApprFiltered]= useState<Application[]>([]);
  const [apprApplied, setApprApplied] = useState(false);

  const isApprovedStage = (a: Application) => ['Approved', 'Closed', 'WithChairperson'].includes(a.stage);

  const load = useCallback(async () => {
    if (active === 'approved' || active === 'status') {
      setLoading(true);
      try {
        const data = await fetchCEOAll();
        setApps(data);
        setApprFiltered(data.filter(isApprovedStage));
        setApprApplied(false);
      } finally { setLoading(false); }
    }
  }, [active]);

  useEffect(() => { load(); }, [load]);

  function applyApprFilter() {
    let r = apps.filter(isApprovedStage);
    if (apprRef.trim())     r = r.filter((a) => a.referenceNumber.toLowerCase().includes(apprRef.trim().toLowerCase()));
    if (apprCompany.trim()) r = r.filter((a) => a.companyName.toLowerCase().includes(apprCompany.trim().toLowerCase()));
    if (apprProduct.trim()) r = r.filter((a) => (a.productName ?? '').toLowerCase().includes(apprProduct.trim().toLowerCase()));
    if (apprCat !== 'All')  r = r.filter((a) => a.applicationType === apprCat || (a.foodCategory ?? '').toLowerCase().includes(apprCat.toLowerCase()));
    if (apprFrom)           r = r.filter((a) => new Date(a.updatedAt) >= new Date(apprFrom));
    if (apprTo)             r = r.filter((a) => new Date(a.updatedAt) <= new Date(apprTo + 'T23:59:59'));
    setApprFiltered(r); setApprApplied(true);
  }

  function resetApprFilter() {
    setApprRef(''); setApprCompany(''); setApprProduct(''); setApprCat('All'); setApprFrom(''); setApprTo('');
    setApprFiltered(apps.filter(isApprovedStage)); setApprApplied(false);
  }

  if (active === 'approved') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setActive(null)} style={{ ...iStyle, color: COLORS.primary, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", margin: 0 }}>CEO Approved Applications</h3>
        </div>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 14 }}>Filter by</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><label style={lStyle}>Reference No.</label><input value={apprRef} onChange={(e) => setApprRef(e.target.value)} placeholder="EPAAS-…" style={{ ...iStyle, minWidth: 140 }} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><label style={lStyle}>Company</label><input value={apprCompany} onChange={(e) => setApprCompany(e.target.value)} placeholder="Search…" style={{ ...iStyle, minWidth: 140 }} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><label style={lStyle}>Product</label><input value={apprProduct} onChange={(e) => setApprProduct(e.target.value)} placeholder="Keyword…" style={{ ...iStyle, minWidth: 140 }} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><label style={lStyle}>Category</label><select value={apprCat} onChange={(e) => setApprCat(e.target.value)} style={{ ...iStyle, minWidth: 130, cursor: 'pointer' }}>{CATEGORY_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><label style={lStyle}>From Date</label><input type="date" value={apprFrom} onChange={(e) => setApprFrom(e.target.value)} style={iStyle} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><label style={lStyle}>To Date</label><input type="date" value={apprTo} onChange={(e) => setApprTo(e.target.value)} style={iStyle} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={applyApprFilter} style={{ padding: '7px 20px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Search</button>
            <button onClick={resetApprFilter} style={{ padding: '7px 14px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Reset</button>
          </div>
        </div>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {apprFiltered.length}{apprApplied ? ` of ${apps.filter(isApprovedStage).length}` : ''} records
            </span>
            <button onClick={() => exportCSV(apprFiltered, 'ceo_approved_applications')} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Sr.', 'Reference No.', 'Company', 'App. Type', 'Product', 'CEO Decision', 'Date', 'Stage'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {loading && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>}
                {!loading && apprFiltered.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No records match the filter.</td></tr>}
                {apprFiltered.map((a, i) => (
                  <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg, cursor: 'pointer' }} onClick={() => navigate(`/ceo/appeals/${a.id}`)}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                    <td style={S.td}>{a.companyName}</td>
                    <td style={S.td}>{TYPE_LABELS[a.applicationType] ?? a.applicationType}</td>
                    <td style={S.td}>{a.productName ?? '—'}</td>
                    <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: COLORS.successLight, color: COLORS.success }}>Forwarded / Approved</span></td>
                    <td style={S.td}>{fmtDate(a.updatedAt)}</td>
                    <td style={S.td}>{a.stage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (active === 'status') {
    const allFiltered = apps.filter((a) => a.stage !== 'Draft');
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setActive(null)} style={{ ...iStyle, color: COLORS.primary, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", margin: 0 }}>Applications Status Report</h3>
          <button onClick={() => exportCSV(allFiltered, 'ceo_status_report')} style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
        </div>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Sr.', 'App. No.', 'Company', 'Product', 'Date of Receipt', 'CEO Status', 'Final Stage'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {loading && <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>}
                {allFiltered.map((a, i) => {
                  const isApproved = ['Approved', 'Closed', 'WithChairperson'].includes(a.stage);
                  const isRejected = a.stage === 'Rejected';
                  const bg = isApproved ? COLORS.successLight : isRejected ? COLORS.dangerLight : COLORS.warningLight;
                  const fg = isApproved ? COLORS.success       : isRejected ? COLORS.danger      : COLORS.warning;
                  return (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg, cursor: 'pointer' }} onClick={() => navigate(`/ceo/appeals/${a.id}`)}>
                      <td style={S.td}>{i + 1}</td>
                      <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                      <td style={S.td}>{a.companyName}</td>
                      <td style={S.td}>{a.productName ?? '—'}</td>
                      <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                      <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: bg, color: fg }}>{isApproved ? 'Forwarded/Approved' : isRejected ? 'Rejected' : 'Pending'}</span></td>
                      <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: bg, color: fg }}>{a.stage}</span></td>
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

  if (active === 'track') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setActive(null)} style={{ ...iStyle, color: COLORS.primary, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", margin: 0 }}>Track Application / CEO Decision</h3>
        </div>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 20, maxWidth: 500 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 14 }}>Enter Application Ref No.</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <label style={lStyle}>Application Ref No.</label>
              <input value={track} onChange={(e) => setTrack(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && track.trim()) navigate('/ceo/appeals'); }}
                placeholder="EPAAS-…" style={{ ...iStyle, fontSize: 13, padding: '8px 12px' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => track.trim() && navigate('/ceo/appeals')} style={{ padding: '8px 22px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Search</button>
              <button onClick={() => setActive(null)} style={{ padding: '8px 16px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Back</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={S.pageDesc}>Standard reports for CEO monitoring and decisions.</div>
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
