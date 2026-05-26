import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, S } from '@/utils/colors';
import AppViewModal from '@/components/admin/AppViewModal';
import { fetchAdminAll, fetchAdminAppeals, fetchAdminExtensions } from '@/services/admin.service';
import type { Application } from '@/services/application.service';

type ReportSection = 'approved' | 'status' | 'ageing' | 'appeals' | 'extensions' | null;

const REPORTS = [
  { key: 'approved'   as const, icon: '✅', title: 'Approved Applications Report',       desc: 'Full list of all approved applications with decision dates.' },
  { key: 'status'     as const, icon: '📊', title: 'Applications Status Report',          desc: 'Stage-wise status of all active applications across the workflow.' },
  { key: 'ageing'     as const, icon: '⏱️', title: 'Application Ageing Report',          desc: 'Applications sorted by days elapsed — identify overdue cases.' },
  { key: 'appeals'    as const, icon: '⚖️', title: 'Appeals & Reviews Report',            desc: 'All appeal and review petitions with current status.' },
  { key: 'extensions' as const, icon: '📅', title: 'Extension of Time Report',            desc: 'All extension requests filed by applicants.' },
];

const TYPE_LABELS: Record<string, string> = { NSF: 'NSF', ClaimApproval: 'Claim Approval', AyurvedaAahara: 'Ayurveda Aahara', RPET: 'rPET', AnyOther: 'Any Other' };
const CATEGORY_OPTIONS = ['All', 'Dairy & Products', 'Beverages', 'NSF', 'Claim Approval', 'Ayurveda Aahara', 'Any Other'];

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function daysSince(iso: string | null | undefined) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
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

export default function AdminReports() {
  const navigate = useNavigate();
  const [active,   setActive]   = useState<ReportSection>(null);
  const [apps,     setApps]     = useState<Application[]>([]);
  const [appeals,  setAppeals]  = useState<any[]>([]);
  const [exts,     setExts]     = useState<any[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [viewApp,  setViewApp]  = useState<Application | null>(null);

  // Approved filter state
  const [apprRef,      setApprRef]     = useState('');
  const [apprCompany,  setApprCompany] = useState('');
  const [apprProduct,  setApprProduct] = useState('');
  const [apprCat,      setApprCat]     = useState('All');
  const [apprFrom,     setApprFrom]    = useState('');
  const [apprTo,       setApprTo]      = useState('');
  const [apprFiltered, setApprFiltered]= useState<Application[]>([]);
  const [apprApplied,  setApprApplied] = useState(false);

  const isApproved = (a: Application) => ['Approved', 'Closed'].includes(a.stage);

  const load = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      if (active === 'approved' || active === 'status' || active === 'ageing') {
        const data = await fetchAdminAll();
        setApps(data);
        setApprFiltered(data.filter(isApproved));
        setApprApplied(false);
      } else if (active === 'appeals') {
        const data = await fetchAdminAppeals();
        setAppeals(data);
      } else if (active === 'extensions') {
        const data = await fetchAdminExtensions();
        setExts(data);
      }
    } finally { setLoading(false); }
  }, [active]);

  useEffect(() => { load(); }, [load]);

  function applyApprFilter() {
    let r = apps.filter(isApproved);
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
    setApprFiltered(apps.filter(isApproved)); setApprApplied(false);
  }

  if (active === 'approved') {
    return (
      <div>
        {viewApp && <AppViewModal app={viewApp} onClose={() => setViewApp(null)} onAuditTrail={() => { navigate(`/admin/audit?appId=${viewApp.id}`); setViewApp(null); }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setActive(null)} style={{ ...iStyle, color: COLORS.primary, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", margin: 0 }}>Approved Applications Report</h3>
        </div>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><label style={lStyle}>Reference No.</label><input value={apprRef} onChange={(e) => setApprRef(e.target.value)} placeholder="EPAAS-…" style={{ ...iStyle, minWidth: 140 }} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><label style={lStyle}>Company</label><input value={apprCompany} onChange={(e) => setApprCompany(e.target.value)} placeholder="Search…" style={{ ...iStyle, minWidth: 140 }} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><label style={lStyle}>Product</label><input value={apprProduct} onChange={(e) => setApprProduct(e.target.value)} placeholder="Keyword…" style={{ ...iStyle, minWidth: 140 }} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><label style={lStyle}>Category</label><select value={apprCat} onChange={(e) => setApprCat(e.target.value)} style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 6, padding: '8px 34px 8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'Noto Sans', 'Segoe UI', sans-serif", backgroundColor: '#f7f8fc', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23555' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat' as const, backgroundPosition: 'right 10px center', backgroundSize: '12px', color: 'var(--color-text)', cursor: 'pointer', appearance: 'none' as const, transition: 'border-color 0.15s, box-shadow 0.15s', minWidth: 130 }}>{CATEGORY_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><label style={lStyle}>Decision From</label><input type="date" value={apprFrom} onChange={(e) => setApprFrom(e.target.value)} style={iStyle} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><label style={lStyle}>Decision To</label><input type="date" value={apprTo} onChange={(e) => setApprTo(e.target.value)} style={iStyle} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={applyApprFilter} style={{ padding: '7px 20px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Search</button>
            <button onClick={resetApprFilter} style={{ padding: '7px 14px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Reset</button>
          </div>
        </div>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{apprFiltered.length}{apprApplied ? ` of ${apps.filter(isApproved).length}` : ''} records</span>
            <button onClick={() => exportCSV(apprFiltered, 'admin_approved_applications')} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Sr.', 'Reference No.', 'Company', 'Type', 'Product', 'Approved On', 'Stage', 'Actions'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {loading && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>}
                {!loading && apprFiltered.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No records match the filter.</td></tr>}
                {apprFiltered.map((a, i) => (
                  <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                    <td style={S.td}>{a.companyName}</td>
                    <td style={S.td}>{TYPE_LABELS[a.applicationType] ?? a.applicationType}</td>
                    <td style={S.td}>{a.productName ?? '—'}</td>
                    <td style={S.td}>{fmtDate(a.updatedAt)}</td>
                    <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: COLORS.successLight, color: COLORS.success }}>{a.stage}</span></td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={() => setViewApp(a)} style={{ background: COLORS.primaryLight, color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 5, padding: '3px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>View</button>
                        <button onClick={() => navigate(`/admin/audit?appId=${a.id}`)} style={{ background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Audit</button>
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

  if (active === 'status') {
    const statusRows = apps.filter((a) => a.stage !== 'Draft');
    return (
      <div>
        {viewApp && <AppViewModal app={viewApp} onClose={() => setViewApp(null)} onAuditTrail={() => { navigate(`/admin/audit?appId=${viewApp.id}`); setViewApp(null); }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setActive(null)} style={{ ...iStyle, color: COLORS.primary, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", margin: 0 }}>Applications Status Report</h3>
          <button onClick={() => exportCSV(statusRows, 'admin_status_report')} style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
        </div>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Sr.', 'App. No.', 'Company', 'Product', 'Type', 'Date of Receipt', 'Stage', 'Actions'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {loading && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>}
                {statusRows.map((a, i) => {
                  const appr = isApproved(a);
                  const rej  = a.stage === 'Rejected';
                  const bg   = appr ? COLORS.successLight : rej ? COLORS.dangerLight : COLORS.warningLight;
                  const fg   = appr ? COLORS.success : rej ? COLORS.danger : COLORS.warning;
                  return (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                      <td style={S.td}>{i + 1}</td>
                      <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                      <td style={S.td}>{a.companyName}</td>
                      <td style={S.td}>{a.productName ?? '—'}</td>
                      <td style={S.td}>{TYPE_LABELS[a.applicationType] ?? a.applicationType}</td>
                      <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                      <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: bg, color: fg }}>{a.stage}</span></td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => setViewApp(a)} style={{ background: COLORS.primaryLight, color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 5, padding: '3px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>View</button>
                          <button onClick={() => navigate(`/admin/audit?appId=${a.id}`)} style={{ background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Audit</button>
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

  if (active === 'ageing') {
    const sorted = apps.filter((a) => a.submittedAt && a.stage !== 'Draft').sort((a, b) => (daysSince(b.submittedAt) ?? 0) - (daysSince(a.submittedAt) ?? 0));
    return (
      <div>
        {viewApp && <AppViewModal app={viewApp} onClose={() => setViewApp(null)} onAuditTrail={() => { navigate(`/admin/audit?appId=${viewApp.id}`); setViewApp(null); }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setActive(null)} style={{ ...iStyle, color: COLORS.primary, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", margin: 0 }}>Application Ageing Report</h3>
          <button onClick={() => exportCSV(sorted, 'admin_ageing_report')} style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
        </div>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Sr.', 'App. No.', 'Company', 'Product', 'Stage', 'Submitted On', 'Days Elapsed', 'Status', 'Actions'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {loading && <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>}
                {sorted.map((a, i) => {
                  const days = daysSince(a.submittedAt) ?? 0;
                  const color = days > 75 ? COLORS.danger : days > 45 ? COLORS.warning : COLORS.text;
                  return (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                      <td style={S.td}>{i + 1}</td>
                      <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                      <td style={S.td}>{a.companyName}</td>
                      <td style={S.td}>{a.productName ?? '—'}</td>
                      <td style={S.td}>{a.stage}</td>
                      <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                      <td style={{ ...S.td, color, fontWeight: days > 45 ? 700 : 400 }}>{days}d</td>
                      <td style={S.td}>{isApproved(a) ? <span style={{ color: COLORS.success, fontWeight: 700 }}>✓ Approved</span> : a.stage === 'Rejected' ? <span style={{ color: COLORS.danger, fontWeight: 700 }}>✗ Rejected</span> : <span style={{ color: COLORS.warning, fontWeight: 600 }}>In Progress</span>}</td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => setViewApp(a)} style={{ background: COLORS.primaryLight, color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 5, padding: '3px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>View</button>
                          <button onClick={() => navigate(`/admin/audit?appId=${a.id}`)} style={{ background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Audit</button>
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

  if (active === 'appeals') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setActive(null)} style={{ ...iStyle, color: COLORS.primary, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", margin: 0 }}>Appeals &amp; Reviews Report</h3>
        </div>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Sr.', 'App. No.', 'Company', 'Grounds', 'Filed On', 'Status', 'Decision'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {loading && <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>}
                {!loading && appeals.length === 0 && <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No appeals found.</td></tr>}
                {appeals.map((a: any, i) => (
                  <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.application?.referenceNumber ?? '—'}</td>
                    <td style={S.td}>{a.application?.companyName ?? '—'}</td>
                    <td style={{ ...S.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.grounds}</td>
                    <td style={S.td}>{fmtDate(a.filedAt)}</td>
                    <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: a.status === 'AppealApproved' ? COLORS.successLight : a.status === 'AppealRejected' ? COLORS.dangerLight : COLORS.warningLight, color: a.status === 'AppealApproved' ? COLORS.success : a.status === 'AppealRejected' ? COLORS.danger : COLORS.warning }}>{a.status}</span></td>
                    <td style={{ ...S.td, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.decisionRemarks ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (active === 'extensions') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setActive(null)} style={{ ...iStyle, color: COLORS.primary, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", margin: 0 }}>Extension of Time Report</h3>
        </div>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Sr.', 'App. No.', 'Company', 'Days', 'Reason', 'Filed On', 'Status'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {loading && <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>}
                {!loading && exts.length === 0 && <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No extension requests found.</td></tr>}
                {exts.map((e: any, i) => (
                  <tr key={e.id ?? i} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{e.application?.referenceNumber ?? '—'}</td>
                    <td style={S.td}>{e.application?.companyName ?? '—'}</td>
                    <td style={S.td}>{e.extensionDays ?? '—'} days</td>
                    <td style={{ ...S.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.reason ?? '—'}</td>
                    <td style={S.td}>{fmtDate(e.createdAt)}</td>
                    <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: e.status === 'Approved' ? COLORS.successLight : e.status === 'Rejected' ? COLORS.dangerLight : COLORS.warningLight, color: e.status === 'Approved' ? COLORS.success : e.status === 'Rejected' ? COLORS.danger : COLORS.warning }}>{e.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={S.roleLabel}>SYSTEM ADMIN</div>
        <div style={S.pageTitle}>Reports</div>
        <div style={S.pageDesc}>System-wide reports for monitoring and compliance.</div>
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
