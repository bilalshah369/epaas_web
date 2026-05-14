import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, S } from '@/utils/colors';
import { resolveFoodCategory } from '@/utils/docResolver';
import StatusBadge from '@/components/ui/StatusBadge';
import { fetchECPending } from '@/services/ec.service';
import type { Application } from '@/services/application.service';

const TYPE_LABELS: Record<string, string> = {
  NSF: 'NSF', ClaimApproval: 'Claim Approval',
  AyurvedaAahara: 'Ayurveda Aahara', RPET: 'rPET', AnyOther: 'Any Other',
};
const TYPE_VALUES: Record<string, string> = {
  'NSF': 'NSF', 'Claim Approval': 'ClaimApproval',
  'Ayurveda Aahara': 'AyurvedaAahara', 'Any Other': 'AnyOther',
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysSince(iso: string | null | undefined) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function exportCSV(rows: Application[], filename: string) {
  if (!rows.length) { return; }
  const cols: (keyof Application)[] = ['referenceNumber', 'applicationType', 'foodCategory', 'companyName', 'productName', 'stage', 'submittedAt'];
  const header = ['Ref No.', 'App Type', 'Food Category', 'Company', 'Product', 'Stage', 'Submitted On'];
  const lines  = [header.join(','), ...rows.map((r) => cols.map((k) => JSON.stringify(r[k] ?? '')).join(','))];
  const blob   = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

const iStyle: React.CSSProperties = { padding: '7px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, background: COLORS.bg, width: '100%', boxSizing: 'border-box' };

export default function ECCaseDockets() {
  const navigate = useNavigate();

  const [apps,    setApps]    = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [refFilter,     setRefFilter]     = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [fromDate,      setFromDate]      = useState('');
  const [toDate,        setToDate]        = useState('');
  const [typeFilter,    setTypeFilter]    = useState('All');
  const [applied,       setApplied]       = useState(false);
  const [filtered,      setFiltered]      = useState<Application[]>([]);

  useEffect(() => {
    fetchECPending().then((data) => { setApps(data); setFiltered(data); }).finally(() => setLoading(false));
  }, []);

  function applyFilters() {
    let result = [...apps];
    if (refFilter.trim())     result = result.filter((a) => a.referenceNumber.toLowerCase().includes(refFilter.trim().toLowerCase()));
    if (companyFilter.trim()) result = result.filter((a) => a.companyName.toLowerCase().includes(companyFilter.trim().toLowerCase()));
    if (typeFilter !== 'All') result = result.filter((a) => a.applicationType === (TYPE_VALUES[typeFilter] ?? typeFilter));
    if (fromDate)             result = result.filter((a) => a.submittedAt && new Date(a.submittedAt) >= new Date(fromDate));
    if (toDate)               result = result.filter((a) => a.submittedAt && new Date(a.submittedAt) <= new Date(toDate + 'T23:59:59'));
    setFiltered(result);
    setApplied(true);
  }

  function resetFilters() {
    setRefFilter(''); setCompanyFilter(''); setFromDate(''); setToDate(''); setTypeFilter('All');
    setFiltered(apps); setApplied(false);
  }

  const display = applied ? filtered : apps;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={S.roleLabel}>EXPERT COMMITTEE</div>
        <div style={S.pageTitle}>Case Docket View</div>
        <div style={S.pageDesc}>Review application dossiers assigned to the Expert Committee for evaluation.</div>
      </div>

      {/* Filters */}
      <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160, flex: '1 1 160px' }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Application Ref. No.</label>
          <input value={refFilter} onChange={(e) => setRefFilter(e.target.value)} placeholder="EPAAS-…" style={iStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160, flex: '1 1 160px' }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Company / Org Name</label>
          <input value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} placeholder="Search…" style={iStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130, flex: '1 1 130px' }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>From Date</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={iStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130, flex: '1 1 130px' }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>To Date</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={iStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Application Type</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ ...iStyle, cursor: 'pointer' }}>
            {['All', 'NSF', 'Claim Approval', 'Ayurveda Aahara', 'Any Other'].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <button onClick={applyFilters} style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontSize: 11, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-end' }}>Search</button>
        <button onClick={resetFilters} style={{ background: 'none', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer', alignSelf: 'flex-end' }}>Reset</button>
      </div>

      {/* Dockets table */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            EC Case Dockets ({display.length}{applied && display.length !== apps.length ? ` of ${apps.length}` : ''} records)
          </span>
          <button onClick={() => exportCSV(display, 'ec_case_dockets')} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['Sr. No.', 'App. Ref. No.', 'App. Type', 'Food Category', 'Company / Org.', 'Product Applied For', 'Forwarded On', 'Days Elapsed', 'EC Status', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ ...S.td, textAlign: 'center', padding: '40px 0', color: COLORS.textMuted }}>Loading…</td></tr>
              ) : display.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ ...S.td, textAlign: 'center', padding: '56px 0' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>{applied ? 'No matching dockets' : 'No dockets pending'}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>{applied ? 'Try clearing the filters.' : 'No applications are currently in the EC review stage.'}</div>
                  </td>
                </tr>
              ) : display.map((a, i) => {
                const days = daysSince(a.submittedAt);
                return (
                  <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg, cursor: 'pointer' }}
                    onClick={() => navigate(`/ec/dockets/${a.id}`)}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                    <td style={S.td}><span style={{ background: COLORS.primaryLight, color: COLORS.primary, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{TYPE_LABELS[a.applicationType] ?? a.applicationType}</span></td>
                    <td style={{ ...S.td, fontSize: 11 }}>{resolveFoodCategory(a)}</td>
                    <td style={S.td}>{a.companyName}</td>
                    <td style={{ ...S.td, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.productName ?? '—'}</td>
                    <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                    <td style={{ ...S.td, color: (days ?? 0) > 14 ? COLORS.danger : COLORS.text, fontWeight: (days ?? 0) > 14 ? 700 : 400 }}>{days !== null ? `${days}d` : '—'}</td>
                    <td style={S.td}><StatusBadge status={a.stage} /></td>
                    <td style={S.td} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                          onClick={() => navigate(`/ec/dockets/${a.id}`)}>View Docket</button>
                        <button style={{ background: 'transparent', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                          onClick={() => navigate(`/ec/dockets/${a.id}?tab=decision`)}>Record Decision</button>
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
