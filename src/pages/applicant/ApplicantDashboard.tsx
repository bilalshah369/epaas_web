// Mirrors ApplicantDashboard from mock (App.jsx L8176).
// Bins, welcome banner, alert banner, and table — data from real API.
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { COLORS } from '@/utils/colors';
import BinCard from '@/components/ui/BinCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { fetchMyApplications, getBin, type Application, type Bin } from '@/services/application.service';

// ── Static bin definitions ────────────────────────────────────────────────────
const BINS: Array<{ key: Bin; icon: string; label: string; color: string; alert?: boolean }> = [
  { key: 'all',        icon: '📂', label: 'Click to View All Applications',              color: COLORS.primary },
  { key: 'incomplete', icon: '📋', label: 'Incomplete Application',                       color: COLORS.warning },
  { key: 'submitted',  icon: '✅', label: 'Submitted Applications with Successful Payment', color: COLORS.info },
  { key: 'reverted',   icon: '🔄', label: 'Reverted Application by Authority',             color: COLORS.accent, alert: true },
  { key: 'rejected',   icon: '❌', label: 'Rejected Application',                           color: COLORS.danger },
  { key: 'approved',   icon: '🏅', label: 'Approval Issued',                                color: COLORS.success },
];

// ── Column definitions per bin ────────────────────────────────────────────────
const BIN_COLS: Record<Bin, string[]> = {
  all:        ['Sr. No.', 'Company Name', 'Reference No.', 'Application Type', 'Status', 'Last Updated On', 'Action'],
  incomplete: ['Sr. No.', 'Company Name', 'Reference No.', 'Address', 'Application Type', 'Food Category', 'Last Updated On', 'Action'],
  submitted:  ['Sr. No.', 'Company Name', 'Reference No.', 'Address', 'Application Type', 'Food Category', 'Last Updated On', 'Status', 'Action'],
  reverted:   ['Sr. No.', 'Company Name', 'Reference No.', 'Address', 'Application Type', 'Food Category', 'Last Updated On', 'Status', 'Action', 'Query / Ext. Time'],
  rejected:   ['Sr. No.', 'Company Name', 'Reference No.', 'Address', 'Application Type', 'Food Category', 'Rejected Date', 'Status', 'Action'],
  approved:   ['Sr. No.', 'Company Name', 'Reference No.', 'Address', 'Application Type', 'Food Category', 'Issued Date', 'Status', 'Action'],
};

// ── Shared table styles ───────────────────────────────────────────────────────
const td: React.CSSProperties = { padding: '9px 10px', borderBottom: `1px solid ${COLORS.border}`, fontSize: 12 };
const th: React.CSSProperties = { textAlign: 'left', padding: '9px 10px', background: COLORS.bg, borderBottom: `2px solid ${COLORS.border}`, fontSize: 11, fontWeight: 700, color: COLORS.textMuted, whiteSpace: 'nowrap' };

function ActionBtn({ label, variant = 'primary', onClick }: { label: string; variant?: string; onClick?: () => void }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: COLORS.primary, color: '#fff', border: 'none' },
    outline:  { background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}` },
    warning:  { background: COLORS.warning, color: '#fff', border: 'none' },
    info:     { background: COLORS.info,    color: '#fff', border: 'none' },
    danger:   { background: COLORS.danger,  color: '#fff', border: 'none' },
  };
  return (
    <button
      onClick={onClick}
      style={{ ...styles[variant] ?? styles.primary, display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s', marginRight: 4, marginBottom: 2 }}
    >
      {label}
    </button>
  );
}

function MiniTable({ cols, rows, renderRow }: { cols: string[]; rows: Application[]; renderRow: (r: Application, i: number) => React.ReactNode }) {
  if (rows.length === 0) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>
        No records found.
      </div>
    );
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>{cols.map((c) => <th key={c} style={th}>{c}</th>)}</tr>
        </thead>
        <tbody>{rows.map((r, i) => renderRow(r, i))}</tbody>
      </table>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ApplicantDashboard() {
  const { user }   = useAuthStore();
  const navigate   = useNavigate();
  const [activeBin, setActiveBin] = useState<Bin>('incomplete');
  const [search, setSearch]           = useState('');
  const [filterType, setFilterType]   = useState('');
  const [filterCat,  setFilterCat]    = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRef,  setFilterRef]    = useState('');
  const [filterFrom, setFilterFrom]   = useState('');
  const [filterTo,   setFilterTo]     = useState('');
  const [apps, setApps]               = useState<Application[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetchMyApplications()
      .then(setApps)
      .finally(() => setLoading(false));
  }, []);

  const binned = useMemo(() => {
    const groups: Record<Bin, Application[]> = { all: apps, incomplete: [], submitted: [], reverted: [], rejected: [], approved: [] };
    for (const a of apps) groups[getBin(a.stage)].push(a);
    return groups;
  }, [apps]);

  const displayed = useMemo(() => {
    let list = activeBin === 'all' ? apps : binned[activeBin];
    if (search)       list = list.filter((a) =>
      a.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      a.companyName.toLowerCase().includes(search.toLowerCase())
    );
    if (filterRef)    list = list.filter((a) => a.referenceNumber.toLowerCase().includes(filterRef.toLowerCase()));
    if (filterType)   list = list.filter((a) => a.applicationType === filterType);
    if (filterCat)    list = list.filter((a) => (a.foodCategory ?? '').toLowerCase().includes(filterCat.toLowerCase()));
    if (filterStatus) list = list.filter((a) => a.stage === filterStatus);
    if (filterFrom)   list = list.filter((a) => a.submittedAt && new Date(a.submittedAt) >= new Date(filterFrom));
    if (filterTo)     list = list.filter((a) => a.submittedAt && new Date(a.submittedAt) <= new Date(filterTo + 'T23:59:59'));
    return list;
  }, [activeBin, binned, apps, search, filterRef, filterType, filterCat, filterStatus, filterFrom, filterTo]);

  const activeBinDef  = BINS.find((b) => b.key === activeBin)!;
  const revertedCount = binned.reverted.length;
  const appTypes      = [...new Set(apps.map((a) => a.applicationType))];
  const foodCats      = [...new Set(apps.map((a) => a.foodCategory).filter(Boolean))] as string[];
  const hasFilters    = !!(search || filterRef || filterType || filterCat || filterStatus || filterFrom || filterTo);
  function clearFilters() { setSearch(''); setFilterRef(''); setFilterType(''); setFilterCat(''); setFilterStatus(''); setFilterFrom(''); setFilterTo(''); }

  function fmtDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function renderRow(bin: Bin) {
    return (r: Application, i: number) => {
      const rowBg = i % 2 === 0 ? '#fff' : COLORS.bg;
      return (
        <tr key={r.id} style={{ background: rowBg }}>
          <td style={td}>{i + 1}</td>
          <td style={td}><span style={{ fontWeight: 600 }}>{r.companyName}</span></td>
          <td style={td}><span style={{ color: COLORS.primary, fontWeight: 600 }}>{r.referenceNumber}</span></td>
          {bin !== 'all' && <td style={td}><span style={{ color: COLORS.textMuted }}>{r.address}</span></td>}
          <td style={td}>{r.applicationType}</td>
          {bin !== 'all' && <td style={td}>{r.foodCategory}</td>}
          {bin === 'all' && <td style={td}><StatusBadge status={r.stage} /></td>}
          <td style={td}>{fmtDate(bin === 'rejected' || bin === 'approved' ? r.submittedAt : r.updatedAt)}</td>
          {(bin === 'submitted' || bin === 'reverted' || bin === 'rejected' || bin === 'approved') && (
            <td style={td}><StatusBadge status={r.stage} /></td>
          )}
          <td style={td}>
            {bin === 'incomplete' && <ActionBtn label="Edit Draft" onClick={() => navigate(`/app/apply/form?id=${r.id}`)} />}
            {bin === 'submitted'  && <ActionBtn label="View" variant="outline" onClick={() => navigate(`/app/applications/${r.id}`)} />}
            {bin === 'reverted'   && <>
              <ActionBtn label="Respond"        onClick={() => navigate(`/app/applications/${r.id}?tab=2`)} />
              <ActionBtn label="View Query"     variant="info"    onClick={() => navigate(`/app/applications/${r.id}?tab=2`)} />
              <ActionBtn label="Req. Extension" variant="warning" onClick={() => navigate('/app/requests/extension')} />
            </>}
            {bin === 'rejected'   && <>
              <ActionBtn label="View"         variant="outline" onClick={() => navigate(`/app/applications/${r.id}`)} />
              <ActionBtn label="View History" variant="outline" onClick={() => navigate(`/app/applications/${r.id}`)} />
              <ActionBtn label="Appeal"       variant="warning" onClick={() => navigate('/app/requests/appeal')} />
              <ActionBtn label="Review"       variant="danger"  onClick={() => navigate('/app/requests/review')} />
            </>}
            {bin === 'approved'   && <>
              <ActionBtn label="View Receipt"  variant="outline" onClick={() => navigate(`/app/applications/${r.id}`)} />
              <ActionBtn label="View History"  variant="outline" onClick={() => navigate(`/app/applications/${r.id}`)} />
              <ActionBtn label="Tax Invoice"   variant="info"    onClick={() => navigate('/app/tax-invoice')} />
            </>}
            {bin === 'all'        && <ActionBtn label="View" variant="outline" onClick={() => navigate(`/app/applications/${r.id}`)} />}
          </td>
          {bin === 'reverted' && <td style={td}>—</td>}
        </tr>
      );
    };
  }

  return (
    <div>
      {/* ── Welcome Banner ───────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(130deg, ${COLORS.primary} 0%, #0e2419 100%)`, borderRadius: 12, padding: '22px 28px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            FSSAI E-PAAS · Applicant Portal
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: "'Libre Baskerville', Georgia, serif", marginBottom: 4 }}>
            Welcome back, {user?.username}
          </div>
          {user?.licenseNumber && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)' }}>
              FSSAI License: <strong style={{ color: '#fff' }}>{user.licenseNumber}</strong>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => navigate('/app/apply')}
            style={{ background: COLORS.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            + New Application
          </button>
          <button
            onClick={() => navigate('/app/profile')}
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '10px 16px', fontSize: 12, cursor: 'pointer' }}
          >
            My Profile
          </button>
        </div>
      </div>

      {/* ── Alert Banner ─────────────────────────────────────────────── */}
      {revertedCount > 0 && (
        <div style={{ background: COLORS.warningLight, border: '1px solid rgba(246,173,85,0.44)', borderLeft: `4px solid ${COLORS.accent}`, borderRadius: 8, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#7C2D12' }}>
              Action Required on {revertedCount} Application(s)
            </div>
            <div style={{ fontSize: 11, color: '#92400E', marginTop: 2 }}>
              The authority has reverted your application(s) with queries. Please respond before the deadline to avoid rejection.
            </div>
          </div>
          <button
            onClick={() => setActiveBin('reverted')}
            style={{ background: COLORS.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Respond Now →
          </button>
        </div>
      )}

      {/* ── Applications Table Card ───────────────────────────────────── */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {/* Bin cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
          {BINS.map((b) => (
            <BinCard
              key={b.key}
              icon={b.icon}
              label={b.label}
              count={b.key === 'all' ? apps.length : binned[b.key].length}
              color={b.color}
              active={activeBin === b.key}
              onClick={() => setActiveBin(b.key)}
            />
          ))}
        </div>

        {/* Title + search + export */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, marginBottom: 0, borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 4, height: 22, borderRadius: 2, background: activeBinDef.color }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                {activeBinDef.label}
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>
                {displayed.length} record{displayed.length !== 1 ? 's' : ''}
                {activeBinDef.alert && revertedCount > 0 && (
                  <span style={{ marginLeft: 8, color: COLORS.accent, fontWeight: 600 }}>⚠ Response required</span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, company…"
              style={{ border: `1.5px solid ${COLORS.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 11, outline: 'none', background: COLORS.bg, width: 210 }}
            />
            <button style={{ background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 6, fontSize: 11, padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              ⬇ Export
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0 12px', borderBottom: `1px solid ${COLORS.border}`, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>Filters:</span>

          {/* Bin / View */}
          <select value={activeBin} onChange={(e) => setActiveBin(e.target.value as Bin)}
            style={{ border: `1.5px solid ${COLORS.primary}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, color: COLORS.primary, fontWeight: 600, background: '#fff', cursor: 'pointer' }}>
            {BINS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
          </select>

          {/* Application Type */}
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            style={{ border: `1px solid ${filterType ? COLORS.primary : COLORS.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, background: '#fff', cursor: 'pointer', color: filterType ? COLORS.primary : 'inherit', fontWeight: filterType ? 600 : 400 }}>
            <option value="">All App. Types</option>
            <option value="NSF">NSF</option>
            <option value="ClaimApproval">Claim Approval (CA)</option>
            <option value="AyurvedaAahara">Ayurveda Aahara (AA)</option>
            <option value="RPET">rPET</option>
            <option value="AnyOther">Any Other</option>
            {appTypes.filter((t) => !['NSF','ClaimApproval','AyurvedaAahara','RPET','AnyOther'].includes(t)).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Food Category */}
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
            style={{ border: `1px solid ${filterCat ? COLORS.primary : COLORS.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, background: '#fff', cursor: 'pointer', color: filterCat ? COLORS.primary : 'inherit', fontWeight: filterCat ? 600 : 400 }}>
            <option value="">All Food Categories</option>
            {foodCats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Status */}
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            style={{ border: `1px solid ${filterStatus ? COLORS.primary : COLORS.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, background: '#fff', cursor: 'pointer', color: filterStatus ? COLORS.primary : 'inherit', fontWeight: filterStatus ? 600 : 400 }}>
            <option value="">All Statuses</option>
            <option value="Draft">Draft / Incomplete</option>
            <option value="WithNodalOfficerA">Document Scrutiny</option>
            <option value="WithTechnicalOfficer">Technical Review</option>
            <option value="WithExpertCommittee">Expert Committee</option>
            <option value="QuerySent">Query Raised</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>

          {/* Reference No. */}
          <input value={filterRef} onChange={(e) => setFilterRef(e.target.value)}
            placeholder="Reference No."
            style={{ border: `1px solid ${filterRef ? COLORS.primary : COLORS.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, width: 130, outline: 'none', background: '#fff' }} />

          {/* Date From */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600 }}>From</span>
            <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)}
              style={{ border: `1px solid ${filterFrom ? COLORS.primary : COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11, outline: 'none' }} />
          </div>

          {/* Date To */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600 }}>To</span>
            <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)}
              style={{ border: `1px solid ${filterTo ? COLORS.primary : COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11, outline: 'none' }} />
          </div>

          {/* Clear */}
          {hasFilters && (
            <button onClick={clearFilters}
              style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, color: COLORS.primary, cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>Loading applications…</div>
        ) : (
          <MiniTable
            cols={BIN_COLS[activeBin]}
            rows={displayed}
            renderRow={renderRow(activeBin)}
          />
        )}
      </div>
    </div>
  );
}

// Tell TypeScript about React.CSSProperties in this file
import type React from 'react';
