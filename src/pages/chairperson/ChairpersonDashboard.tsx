import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { COLORS, S } from '@/utils/colors';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  fetchChairpersonPending, fetchChairpersonAll,
  fetchChairpersonReviews, fetchChairpersonExtensions,
  type Review,
} from '@/services/chairperson.service';
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
  if (!rows.length) return;
  const cols: (keyof Application)[] = ['referenceNumber', 'applicationType', 'foodCategory', 'companyName', 'productName', 'stage', 'submittedAt'];
  const header = ['Ref No.', 'App Type', 'Food Category', 'Company', 'Product', 'Stage', 'Submitted On'];
  const lines  = [header.join(','), ...rows.map((r) => cols.map((k) => JSON.stringify(r[k] ?? '')).join(','))];
  const blob   = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}
function exportReviewsCSV(rows: Review[], filename: string) {
  if (!rows.length) return;
  const header = ['App No.', 'Company', 'Product', 'Grounds', 'Filed On', 'Status'];
  const lines  = [header.join(','), ...rows.map((r) => [
    JSON.stringify(r.application?.referenceNumber ?? ''),
    JSON.stringify(r.application?.companyName ?? ''),
    JSON.stringify(r.application?.productName ?? ''),
    JSON.stringify(r.grounds ?? ''),
    JSON.stringify(fmtDate(r.filedAt)),
    JSON.stringify(r.status),
  ].join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

const NOTIFICATIONS = [
  { id: 1, title: 'Application for final decision — EPAAS-2025-007', desc: 'Forwarded by CEO. Awaiting Chairperson final approval.', time: '1h ago', read: false },
  { id: 2, title: 'Review petition filed — EPAAS-2025-003', desc: 'Applicant has filed a review petition. Requires hearing.', time: '5h ago', read: false },
  { id: 3, title: 'Reminder: EPAAS-2025-006 — 3 days remaining', desc: 'Review petition hearing deadline approaching.', time: '2d ago', read: true },
];

function OfficerBins({ activeBin, onSelect, pendingCount, notifCount }: { activeBin: string; onSelect: (k: string) => void; pendingCount: number; notifCount: number }) {
  const bins = [
    { key: 'dashboard',     icon: '🏛️', label: 'Click to View Dashboard',       count: null,         color: COLORS.primary },
    { key: 'pending',       icon: '⚡',  label: 'Click to View Pending Actions', count: pendingCount, color: '#B45309'      },
    { key: 'notifications', icon: '🔔', label: 'Click to View Notifications',   count: notifCount,   color: COLORS.info    },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
      {bins.map((b) => {
        const active = activeBin === b.key;
        return (
          <div key={b.key} onClick={() => onSelect(b.key)}
            style={{ background: active ? b.color : COLORS.white, border: `1.5px solid ${active ? b.color : COLORS.border}`, borderRadius: 8, padding: '14px 16px', cursor: 'pointer', textAlign: 'center', boxShadow: active ? `0 3px 12px ${b.color}38` : '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.18s' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: active ? 'rgba(255,255,255,0.18)' : b.color + '14', border: `1px solid ${active ? 'rgba(255,255,255,0.18)' : b.color + '28'}` }}>
              {b.icon}
            </div>
            {b.count !== null && b.count !== undefined && (
              <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, marginBottom: 6, color: active ? '#fff' : b.color, fontFamily: "'Libre Baskerville',Georgia,serif" }}>{b.count}</div>
            )}
            <div style={{ fontSize: 12, fontWeight: 600, color: active ? 'rgba(255,255,255,0.92)' : COLORS.text, lineHeight: 1.3 }}>{b.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function ChairpersonDashboard() {
  const navigate = useNavigate();
  const [activeBin, setActiveBin]       = useState('dashboard');
  const [pendingSubTab, setPendingSubTab] = useState<'reviews' | 'decisions' | 'extensions'>('reviews');
  const [apps, setApps]                 = useState<Application[]>([]);
  const [allApps, setAllApps]           = useState<Application[]>([]);
  const [reviews, setReviews]           = useState<Review[]>([]);
  const [extensions, setExtensions]     = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);

  // filter state
  const [fRef,      setFRef]      = useState('');
  const [fCompany,  setFCompany]  = useState('');
  const [fFromDate, setFFromDate] = useState('');
  const [fToDate,   setFToDate]   = useState('');
  const [fType,     setFType]     = useState('All');
  const [pendingDisplay, setPendingDisplay] = useState<Application[]>([]);
  const [filterApplied,  setFilterApplied]  = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchChairpersonPending(),
      fetchChairpersonAll(),
      fetchChairpersonReviews(),
      fetchChairpersonExtensions(),
    ])
      .then(([pending, all, revs, exts]) => {
        setApps(pending); setPendingDisplay(pending); setAllApps(all); setReviews(revs); setExtensions(exts);
      })
      .catch(() => toast.error('Failed to load Chairperson data'))
      .finally(() => setLoading(false));
  }, []);

  function applyFilter() {
    let r = [...apps];
    if (fRef.trim())     r = r.filter((a) => a.referenceNumber.toLowerCase().includes(fRef.trim().toLowerCase()));
    if (fCompany.trim()) r = r.filter((a) => a.companyName.toLowerCase().includes(fCompany.trim().toLowerCase()));
    if (fType !== 'All') r = r.filter((a) => a.applicationType === (TYPE_VALUES[fType] ?? fType));
    if (fFromDate)       r = r.filter((a) => a.submittedAt && new Date(a.submittedAt) >= new Date(fFromDate));
    if (fToDate)         r = r.filter((a) => a.submittedAt && new Date(a.submittedAt) <= new Date(fToDate + 'T23:59:59'));
    setPendingDisplay(r); setFilterApplied(true);
  }
  function resetFilter() {
    setFRef(''); setFCompany(''); setFFromDate(''); setFToDate(''); setFType('All');
    setPendingDisplay(apps); setFilterApplied(false);
  }

  const unread        = NOTIFICATIONS.filter((n) => !n.read).length;
  const approvedCount = allApps.filter((a) => ['Approved', 'Closed'].includes(a.stage)).length;
  const rejectedCount = allApps.filter((a) => a.stage === 'Rejected').length;
  const pendingCount  = allApps.filter((a) => !['Approved', 'Closed', 'Rejected', 'Withdrawn', 'Draft'].includes(a.stage)).length;

  const iStyle: React.CSSProperties = { padding: '7px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, background: COLORS.bg, width: '100%', boxSizing: 'border-box' };
  const lStyle: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 4 };

  function AppWorkQueueTable({ rows, emptyMsg }: { rows: Application[]; emptyMsg: string }) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>{['App. No.', 'Company', 'Product', 'App. Type', 'Received', 'Days Elapsed', 'Status', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: '40px 0', color: COLORS.textMuted }}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: '48px 0', color: COLORS.textMuted }}>{emptyMsg}</td></tr>
            ) : rows.map((a, i) => {
              const days = daysSince(a.submittedAt);
              return (
                <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                  <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                  <td style={S.td}>{a.companyName}</td>
                  <td style={{ ...S.td, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.productName ?? '—'}</td>
                  <td style={S.td}><span style={{ background: COLORS.primaryLight, color: COLORS.primary, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{TYPE_LABELS[a.applicationType] ?? a.applicationType}</span></td>
                  <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                  <td style={{ ...S.td, color: (days ?? 0) > 14 ? COLORS.danger : COLORS.text, fontWeight: (days ?? 0) > 14 ? 700 : 400 }}>{days !== null ? `${days}d` : '—'}</td>
                  <td style={S.td}><StatusBadge status={a.stage} /></td>
                  <td style={S.td}>
                    <button onClick={() => navigate(`/chairperson/reviews/${a.id}`)}
                      style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      Final Decision
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { icon: '⏳', label: 'Pending Final Decision', count: apps.length,    color: '#B45309'      },
          { icon: '✅', label: 'Applications Approved',  count: approvedCount,  color: COLORS.success  },
          { icon: '❌', label: 'Applications Rejected',  count: rejectedCount,  color: COLORS.danger   },
          { icon: '📋', label: 'Pending Reviews',        count: reviews.filter((r) => r.status === 'ReviewPending').length, color: COLORS.info },
          { icon: '📊', label: 'Total Handled',          count: allApps.length, color: COLORS.primary  },
          { icon: '🔄', label: 'Under Review',           count: pendingCount,   color: COLORS.warning  },
        ].map((c) => (
          <div key={c.label} onClick={() => setActiveBin('pending')}
            style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${c.color}`, borderRadius: 8, padding: '12px 16px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: COLORS.textMuted, lineHeight: 1.35 }}>{c.label}</span>
              <span style={{ fontSize: 15, opacity: 0.55 }}>{c.icon}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: c.color, fontFamily: "'Libre Baskerville',Georgia,serif", lineHeight: 1 }}>{c.count}</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 5, fontWeight: 500 }}>Click to view details</div>
          </div>
        ))}
      </div>

      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>Chairperson Work Queue</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => exportCSV(apps, 'chairperson_pending')} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
            <button onClick={() => setActiveBin('pending')} style={{ fontSize: 11, color: COLORS.primary, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View pending →</button>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: COLORS.textMuted }}>Loading…</div>
        ) : apps.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>All clear!</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>No applications pending Chairperson decision.</div>
          </div>
        ) : <AppWorkQueueTable rows={apps} emptyMsg="No pending applications." />}
      </div>

      <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 16, paddingBottom: 12, borderBottom: `2px solid ${COLORS.border}` }}>APPLICATION SUMMARY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Total applications handled',          value: allApps.length  },
                { label: 'Applications Approved',               value: approvedCount   },
                { label: 'Applications Rejected',               value: rejectedCount   },
                { label: 'Applications Pending / Under Review', value: pendingCount    },
                { label: 'Pending Review Petitions',            value: reviews.filter((r) => r.status === 'ReviewPending').length },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: COLORS.bg, borderRadius: 6 }}>
                  <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.primary }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: COLORS.primaryLight, border: `1px solid ${COLORS.primary}22`, borderRadius: 8, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>👑</div>
              <div style={{ fontSize: 13, color: COLORS.primary, fontWeight: 600 }}>Final Authority</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 8, lineHeight: 1.6 }}>Chairperson has final authority for review petitions and application approvals</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPendingActions = () => (
    <>
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 14 }}>
        {(['reviews', 'decisions', 'extensions'] as const).map((t) => (
          <div key={t} onClick={() => setPendingSubTab(t)}
            style={{ padding: '7px 18px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: pendingSubTab === t ? COLORS.primary : COLORS.textMuted, borderBottom: pendingSubTab === t ? `2px solid ${COLORS.primary}` : '2px solid transparent', marginBottom: -1 }}>
            {t === 'reviews' ? 'Pending Reviews' : t === 'decisions' ? 'Pending Decisions' : 'Extension of Time'}
          </div>
        ))}
      </div>

      {pendingSubTab === 'reviews' && (
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>Pending Reviews ({reviews.length} records)</span>
            <button onClick={() => exportReviewsCSV(reviews, 'chairperson_reviews')} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['Sr.', 'App No.', 'Company', 'Product', 'Review Grounds', 'Filed On', 'Status', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: '40px 0', color: COLORS.textMuted }}>Loading…</td></tr>
                ) : reviews.length === 0 ? (
                  <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: '40px 0', color: COLORS.textMuted }}>No review petitions pending.</td></tr>
                ) : reviews.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{r.application?.referenceNumber ?? '—'}</td>
                    <td style={S.td}>{r.application?.companyName ?? '—'}</td>
                    <td style={{ ...S.td, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.application?.productName ?? '—'}</td>
                    <td style={{ ...S.td, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.grounds}>{r.grounds?.slice(0, 60)}{(r.grounds?.length ?? 0) > 60 ? '…' : ''}</td>
                    <td style={S.td}>{fmtDate(r.filedAt)}</td>
                    <td style={S.td}><StatusBadge status={r.status} label={r.status.replace('Review', '')} /></td>
                    <td style={S.td}>
                      <button onClick={() => navigate(`/chairperson/reviews/${r.application?.id ?? r.applicationId}`)}
                        style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        Hear Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pendingSubTab === 'decisions' && (
        <>
          <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160, flex: '1 1 160px' }}>
              <label style={lStyle}>Application Ref. No.</label>
              <input value={fRef} onChange={(e) => setFRef(e.target.value)} placeholder="EPAAS-…" style={iStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160, flex: '1 1 160px' }}>
              <label style={lStyle}>Company / Org Name</label>
              <input value={fCompany} onChange={(e) => setFCompany(e.target.value)} placeholder="Search…" style={iStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130, flex: '1 1 130px' }}>
              <label style={lStyle}>From Date</label>
              <input type="date" value={fFromDate} onChange={(e) => setFFromDate(e.target.value)} style={iStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130, flex: '1 1 130px' }}>
              <label style={lStyle}>To Date</label>
              <input type="date" value={fToDate} onChange={(e) => setFToDate(e.target.value)} style={iStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
              <label style={lStyle}>Application Type</label>
              <select value={fType} onChange={(e) => setFType(e.target.value)} style={{ ...iStyle, cursor: 'pointer' }}>
                {['All', 'NSF', 'Claim Approval', 'Ayurveda Aahara', 'Any Other'].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <button onClick={applyFilter} style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontSize: 11, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-end' }}>Search</button>
            <button onClick={resetFilter} style={{ background: 'none', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer', alignSelf: 'flex-end' }}>Reset</button>
          </div>
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Pending Decisions ({pendingDisplay.length}{filterApplied && pendingDisplay.length !== apps.length ? ` of ${apps.length}` : ''} records)
              </span>
              <button onClick={() => exportCSV(pendingDisplay, 'chairperson_decisions')} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
            </div>
            <AppWorkQueueTable rows={pendingDisplay} emptyMsg={filterApplied ? 'No matching applications.' : 'No pending decisions.'} />
          </div>
        </>
      )}

      {pendingSubTab === 'extensions' && (
        <div>
          <div style={{ background: COLORS.infoLight, border: `1px solid ${COLORS.info}33`, borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: COLORS.info, lineHeight: 1.6 }}>
            <strong>ℹ View Only</strong> — Extension of Time requests are handled by the Nodal Officer. This list is provided for reference purposes only.
          </div>
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>Extension of Time Requests ({extensions.length} records)</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>{['Sr.', 'Ref No.', 'Company', 'Product', 'Category', 'Extension Days', 'Reason', 'Status'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: '40px 0', color: COLORS.textMuted }}>Loading…</td></tr>
                  ) : extensions.length === 0 ? (
                    <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: '40px 0', color: COLORS.textMuted }}>No extension requests on record.</td></tr>
                  ) : extensions.map((e: any, i) => (
                    <tr key={e.id ?? i} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                      <td style={S.td}>{i + 1}</td>
                      <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{e.referenceNumber ?? e.application?.referenceNumber ?? '—'}</td>
                      <td style={S.td}>{e.companyName ?? e.application?.companyName ?? '—'}</td>
                      <td style={S.td}>{e.productName ?? e.application?.productName ?? '—'}</td>
                      <td style={S.td}>{e.foodCategory ?? e.application?.foodCategory ?? '—'}</td>
                      <td style={S.td}>{e.extensionDays ?? e.days ?? '—'}</td>
                      <td style={{ ...S.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.reason}>{e.reason ?? '—'}</td>
                      <td style={S.td}><StatusBadge status={e.status ?? 'pending'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderNotifications = () => (
    <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '9px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>Notifications</span>
      </div>
      <div style={{ padding: '0 16px' }}>
        {NOTIFICATIONS.map((n) => (
          <div key={n.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: `1px solid ${COLORS.border}`, alignItems: 'flex-start' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.read ? COLORS.border : COLORS.primary, marginTop: 5, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 700, color: COLORS.text, marginBottom: 2 }}>{n.title}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5 }}>{n.desc}</div>
            </div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, flexShrink: 0 }}>{n.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={S.pageDesc}>Final authority for review petitions and application approvals.</div>
      </div>
      <OfficerBins activeBin={activeBin} onSelect={setActiveBin} pendingCount={apps.length} notifCount={unread} />
      {activeBin === 'dashboard'     && renderDashboard()}
      {activeBin === 'pending'       && renderPendingActions()}
      {activeBin === 'notifications' && renderNotifications()}
    </div>
  );
}
