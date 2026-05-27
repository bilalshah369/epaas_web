import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { COLORS, S } from '@/utils/colors';
import StatusBadge from '@/components/ui/StatusBadge';
import AppViewModal from '@/components/admin/AppViewModal';
import { fetchAdminAll } from '@/services/admin.service';
import type { Application } from '@/services/application.service';

const TYPE_LABELS: Record<string, string> = {
  NSF: 'NSF', ClaimApproval: 'Claim Approval',
  AyurvedaAahara: 'Ayurveda Aahara', RPET: 'rPET', AnyOther: 'Any Other',
};
const STAGE_PENDING_WITH: Record<string, string> = {
  WithNodalOfficerA: 'Nodal Officer', WithTechnicalOfficer: 'Technical Officer',
  WithExpertCommittee: 'Expert Committee', WithNodalPointB: 'Nodal Point B',
  WithCEO: 'CEO', WithChairperson: 'Chairperson',
  QuerySent: 'Applicant', AppealPending: 'CEO', ReviewPending: 'Chairperson',
  Approved: '—', Rejected: '—', Closed: '—', Withdrawn: '—',
};
const STATUS_LEVEL_OPTIONS = ['All', 'Nodal Officer', 'Technical Officer', 'Expert Committee', 'Nodal Point B', 'CEO', 'Chairperson', 'Applicant'];
const TYPE_OPTIONS = ['All', 'NSF', 'ClaimApproval', 'AyurvedaAahara', 'RPET', 'AnyOther'];
const STAGE_STATUS_OPTIONS = ['All', 'WithNodalOfficerA', 'WithTechnicalOfficer', 'WithExpertCommittee', 'WithNodalPointB', 'WithCEO', 'WithChairperson', 'QuerySent', 'Approved', 'Rejected', 'AppealPending', 'ReviewPending', 'Withdrawn'];

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

const iStyle: React.CSSProperties = { padding: '7px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, background: COLORS.bg, width: '100%', boxSizing: 'border-box' };
const lStyle: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 4 };

export default function AdminAppMonitor() {
  const navigate = useNavigate();
  const [allApps,  setAllApps]  = useState<Application[]>([]);
  const [display,  setDisplay]  = useState<Application[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filtered, setFiltered] = useState(false);
  const [viewApp,  setViewApp]  = useState<Application | null>(null);

  const [fRef,     setFRef]     = useState('');
  const [fCompany, setFCompany] = useState('');
  const [fType,    setFType]    = useState('All');
  const [fProduct, setFProduct] = useState('');
  const [fLevel,   setFLevel]   = useState('All');
  const [fStatus,  setFStatus]  = useState('All');
  const [fFrom,    setFFrom]    = useState('');
  const [fTo,      setFTo]      = useState('');

  useEffect(() => {
    fetchAdminAll()
      .then((data) => { setAllApps(data); setDisplay(data); })
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false));
  }, []);

  function applyFilter() {
    let r = [...allApps];
    if (fRef.trim())     r = r.filter((a) => a.referenceNumber.toLowerCase().includes(fRef.trim().toLowerCase()));
    if (fCompany.trim()) r = r.filter((a) => a.companyName.toLowerCase().includes(fCompany.trim().toLowerCase()));
    if (fProduct.trim()) r = r.filter((a) => (a.productName ?? '').toLowerCase().includes(fProduct.trim().toLowerCase()));
    if (fType !== 'All') r = r.filter((a) => a.applicationType === fType);
    if (fStatus !== 'All') r = r.filter((a) => a.stage === fStatus);
    if (fLevel !== 'All') r = r.filter((a) => STAGE_PENDING_WITH[a.stage] === fLevel);
    if (fFrom)           r = r.filter((a) => a.submittedAt && new Date(a.submittedAt) >= new Date(fFrom));
    if (fTo)             r = r.filter((a) => a.submittedAt && new Date(a.submittedAt) <= new Date(fTo + 'T23:59:59'));
    setDisplay(r); setFiltered(true);
  }
  function resetFilter() {
    setFRef(''); setFCompany(''); setFType('All'); setFProduct(''); setFLevel('All'); setFStatus('All'); setFFrom(''); setFTo('');
    setDisplay(allApps); setFiltered(false);
  }

  const active   = allApps.filter((a) => !['Approved', 'Closed', 'Rejected', 'Withdrawn', 'Draft'].includes(a.stage));
  const approved = allApps.filter((a) => ['Approved', 'Closed'].includes(a.stage));
  const withEC   = allApps.filter((a) => a.stage === 'WithExpertCommittee');
  const appeals  = allApps.filter((a) => ['AppealPending', 'ReviewPending'].includes(a.stage));

  return (
    <div>
      {viewApp && (
        <AppViewModal
          app={viewApp}
          onClose={() => setViewApp(null)}
          onAuditTrail={() => { navigate(`/admin/audit?appId=${viewApp.id}`); setViewApp(null); }}
        />
      )}
      <div style={{ marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={S.pageDesc}>Real-time read-only view of every application across all stages.</div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, background: COLORS.bg, padding: '4px 10px', borderRadius: 4, border: `1px solid ${COLORS.border}` }}>READ-ONLY</span>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total',       value: allApps.length },
          { label: 'Active',      value: active.length },
          { label: 'Completed',   value: approved.length },
          { label: 'With EC',     value: withEC.length },
          { label: 'Appeals / Reviews', value: appeals.length },
        ].map((s) => (
          <div key={s.label} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${COLORS.primary}`, borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.primary, fontFamily: "'Libre Baskerville',Georgia,serif" }}>{loading ? '—' : s.value}</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter panel */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Search & Filter</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
          <div><label style={lStyle}>Reference No.</label><input value={fRef} onChange={(e) => setFRef(e.target.value)} placeholder="EPAAS-…" style={iStyle} /></div>
          <div><label style={lStyle}>Applicant / Company</label><input value={fCompany} onChange={(e) => setFCompany(e.target.value)} placeholder="Company name" style={iStyle} /></div>
          <div><label style={lStyle}>Product Name</label><input value={fProduct} onChange={(e) => setFProduct(e.target.value)} placeholder="Keyword…" style={iStyle} /></div>
          <div>
            <label style={lStyle}>Application Type</label>
            <select value={fType} onChange={(e) => setFType(e.target.value)} style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 6, padding: '8px 34px 8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'Noto Sans', 'Segoe UI', sans-serif", backgroundColor: '#f7f8fc', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23555' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat' as const, backgroundPosition: 'right 10px center', backgroundSize: '12px', color: 'var(--color-text)', cursor: 'pointer', appearance: 'none' as const, transition: 'border-color 0.15s, box-shadow 0.15s' }}>
              {TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={lStyle}>Current Level</label>
            <select value={fLevel} onChange={(e) => setFLevel(e.target.value)} style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 6, padding: '8px 34px 8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'Noto Sans', 'Segoe UI', sans-serif", backgroundColor: '#f7f8fc', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23555' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat' as const, backgroundPosition: 'right 10px center', backgroundSize: '12px', color: 'var(--color-text)', cursor: 'pointer', appearance: 'none' as const, transition: 'border-color 0.15s, box-shadow 0.15s' }}>
              {STATUS_LEVEL_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={lStyle}>Stage / Status</label>
            <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 6, padding: '8px 34px 8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'Noto Sans', 'Segoe UI', sans-serif", backgroundColor: '#f7f8fc', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23555' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat' as const, backgroundPosition: 'right 10px center', backgroundSize: '12px', color: 'var(--color-text)', cursor: 'pointer', appearance: 'none' as const, transition: 'border-color 0.15s, box-shadow 0.15s' }}>
              {STAGE_STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div><label style={lStyle}>Received From</label><input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} style={iStyle} /></div>
          <div><label style={lStyle}>Received To</label><input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} style={iStyle} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={applyFilter} style={{ padding: '7px 22px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Apply</button>
          <button onClick={resetFilter} style={{ padding: '7px 14px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Clear</button>
          <button onClick={() => exportCSV(display, 'admin_monitor')} style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
        </div>
      </div>

      {/* Results table */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {display.length}{filtered && display.length !== allApps.length ? ` of ${allApps.length}` : ''} applications
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['Sr.', 'App. Ref No.', 'Company', 'Product', 'Type', 'Status', 'Pending Level', 'Received', 'Days', 'Actions'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={10} style={{ ...S.td, textAlign: 'center', padding: '40px 0', color: COLORS.textMuted }}>Loading…</td></tr>}
              {!loading && display.length === 0 && <tr><td colSpan={10} style={{ ...S.td, textAlign: 'center', padding: '48px 0', color: COLORS.textMuted }}>No applications match the filter.</td></tr>}
              {display.map((a, i) => {
                const days = daysSince(a.submittedAt);
                const daysColor = (days ?? 0) > 75 ? COLORS.danger : (days ?? 0) > 45 ? COLORS.warning : COLORS.text;
                return (
                  <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                    <td style={{ ...S.td, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.companyName}</td>
                    <td style={{ ...S.td, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.productName ?? '—'}</td>
                    <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: COLORS.primaryLight, color: COLORS.primary }}>{TYPE_LABELS[a.applicationType] ?? a.applicationType}</span></td>
                    <td style={S.td}><StatusBadge status={a.stage} /></td>
                    <td style={S.td}><span style={{ fontSize: 11, color: COLORS.primary, fontWeight: 600 }}>{STAGE_PENDING_WITH[a.stage] ?? a.stage}</span></td>
                    <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                    <td style={{ ...S.td, color: daysColor, fontWeight: (days ?? 0) > 45 ? 700 : 400 }}>{days !== null ? `${days}d` : '—'}</td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={() => setViewApp(a)}
                          style={{ background: COLORS.primaryLight, color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 5, padding: '3px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                          View
                        </button>
                        <button onClick={() => navigate(`/admin/audit?appId=${a.id}`)}
                          style={{ background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>
                          Audit
                        </button>
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
