import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { COLORS, S } from '@/utils/colors';
import StatusBadge from '@/components/ui/StatusBadge';
import { fetchNodalBPending, fetchNodalBAll, nodalBForwardCEO } from '@/services/nodal-b.service';
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

const NOTIFICATIONS = [
  { id: 1, title: 'Application forwarded from EC — EPAAS-2025-007', desc: 'Expert Committee has recommended approval. Awaiting Nodal B dispatch.', time: '2h ago', read: false },
  { id: 2, title: 'Pending dispatch — EPAAS-2025-002', desc: 'Nestlé India Ltd. application requires forwarding to CEO.', time: '4h ago', read: false },
  { id: 3, title: 'Reminder: EPAAS-2025-004 — action required', desc: 'Application pending with Nodal B for more than 7 days.', time: '1d ago', read: true },
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

export default function NodalBDashboard() {
  const navigate = useNavigate();
  const [activeBin, setActiveBin] = useState('dashboard');
  const [apps, setApps]           = useState<Application[]>([]);
  const [allApps, setAllApps]     = useState<Application[]>([]);
  const [loading, setLoading]     = useState(true);
  const [forwarding, setForwarding] = useState<string | null>(null);

  // Pending tab filter state
  const [fRef,      setFRef]      = useState('');
  const [fCompany,  setFCompany]  = useState('');
  const [fFromDate, setFFromDate] = useState('');
  const [fToDate,   setFToDate]   = useState('');
  const [fType,     setFType]     = useState('All');
  const [pendingDisplay, setPendingDisplay] = useState<Application[]>([]);
  const [filterApplied,  setFilterApplied]  = useState(false);

  function loadData() {
    setLoading(true);
    Promise.all([fetchNodalBPending(), fetchNodalBAll()])
      .then(([pending, all]) => {
        setApps(pending); setPendingDisplay(pending); setAllApps(all);
      })
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  function applyPendingFilter() {
    let r = [...apps];
    if (fRef.trim())     r = r.filter((a) => a.referenceNumber.toLowerCase().includes(fRef.trim().toLowerCase()));
    if (fCompany.trim()) r = r.filter((a) => a.companyName.toLowerCase().includes(fCompany.trim().toLowerCase()));
    if (fType !== 'All') r = r.filter((a) => a.applicationType === (TYPE_VALUES[fType] ?? fType));
    if (fFromDate)       r = r.filter((a) => a.submittedAt && new Date(a.submittedAt) >= new Date(fFromDate));
    if (fToDate)         r = r.filter((a) => a.submittedAt && new Date(a.submittedAt) <= new Date(fToDate + 'T23:59:59'));
    setPendingDisplay(r); setFilterApplied(true);
  }
  function resetPendingFilter() {
    setFRef(''); setFCompany(''); setFFromDate(''); setFToDate(''); setFType('All');
    setPendingDisplay(apps); setFilterApplied(false);
  }

  async function handleForwardCEO(id: string) {
    setForwarding(id);
    try {
      await nodalBForwardCEO(id);
      toast.success('Application forwarded to CEO for final approval');
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Could not forward to CEO');
    } finally { setForwarding(null); }
  }

  const pending       = apps.length;
  const unread        = NOTIFICATIONS.filter((n) => !n.read).length;
  const forwardedCount= allApps.filter((a) => ['WithCEO', 'WithChairperson', 'Approved', 'Closed'].includes(a.stage)).length;
  const rejectedCount = allApps.filter((a) => a.stage === 'Rejected').length;
  const pendingCount  = allApps.filter((a) => !['Approved', 'Closed', 'Rejected', 'Withdrawn', 'Draft'].includes(a.stage)).length;

  const iStyle: React.CSSProperties = { padding: '7px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, background: COLORS.bg, width: '100%', boxSizing: 'border-box' };
  const lStyle: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 4 };

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { icon: '⏳', label: 'Pending with Me',    count: pending,       color: '#B45309'       },
          { icon: '📤', label: 'Forwarded to CEO',   count: forwardedCount, color: COLORS.primary  },
          { icon: '📊', label: 'Total Received',     count: allApps.length, color: COLORS.info     },
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

      {/* Work Queue */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>Nodal Point B — Work Queue</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => exportCSV(apps, 'nodalb_pending')} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
            <button onClick={() => setActiveBin('pending')} style={{ fontSize: 11, color: COLORS.primary, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View pending →</button>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: COLORS.textMuted }}>Loading…</div>
        ) : apps.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>All clear!</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>No applications pending Nodal B review.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['App. No.', 'Company', 'Product', 'App. Type', 'Food Category', 'EC Decision', 'Received', 'Days Elapsed', 'Status', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {apps.map((a, i) => {
                  const days = daysSince(a.submittedAt);
                  return (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                      <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                      <td style={S.td}>{a.companyName}</td>
                      <td style={{ ...S.td, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.productName ?? '—'}</td>
                      <td style={S.td}><span style={{ background: COLORS.primaryLight, color: COLORS.primary, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{TYPE_LABELS[a.applicationType] ?? a.applicationType}</span></td>
                      <td style={{ ...S.td, fontSize: 11 }}>{a.foodCategory ?? '—'}</td>
                      <td style={{ ...S.td, fontSize: 11 }}><span style={{ color: COLORS.success, fontWeight: 600 }}>EC Recommended</span></td>
                      <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                      <td style={{ ...S.td, color: (days ?? 0) > 7 ? COLORS.danger : COLORS.text, fontWeight: (days ?? 0) > 7 ? 700 : 400 }}>{days !== null ? `${days}d` : '—'}</td>
                      <td style={S.td}><StatusBadge status={a.stage} /></td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => navigate(`/nodalb/queue/${a.id}`)}
                            style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            View Details
                          </button>
                          <button onClick={() => handleForwardCEO(a.id)} disabled={forwarding === a.id}
                            style={{ background: 'transparent', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: forwarding === a.id ? 'not-allowed' : 'pointer', opacity: forwarding === a.id ? 0.55 : 1 }}>
                            {forwarding === a.id ? 'Forwarding…' : 'Forward to CEO'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Application Summary */}
      <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 16, paddingBottom: 12, borderBottom: `2px solid ${COLORS.border}` }}>APPLICATION SUMMARY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Total applications received',         value: allApps.length  },
                { label: 'Forwarded to CEO',                    value: forwardedCount  },
                { label: 'Applications Rejected',               value: rejectedCount   },
                { label: 'Applications Pending / With Nodal B', value: pendingCount    },
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
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 13, color: COLORS.primary, fontWeight: 600 }}>Nodal Point B Role</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 8, lineHeight: 1.6 }}>Review EC-approved dossiers and dispatch to CEO for final approval</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPendingActions = () => (
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
        <button onClick={applyPendingFilter} style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontSize: 11, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-end' }}>Search</button>
        <button onClick={resetPendingFilter} style={{ background: 'none', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer', alignSelf: 'flex-end' }}>Reset</button>
      </div>

      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Nodal B Queue — Pending Dispatch ({pendingDisplay.length}{filterApplied && pendingDisplay.length !== apps.length ? ` of ${apps.length}` : ''} records)
          </span>
          <button onClick={() => exportCSV(pendingDisplay, 'nodalb_pending')} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['Sr. No.', 'App. Ref. No.', 'App. Type', 'Food Category', 'Company / Org.', 'Product Applied For', 'Received', 'Days Elapsed', 'Status', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ ...S.td, textAlign: 'center', padding: '40px 0', color: COLORS.textMuted }}>Loading…</td></tr>
              ) : pendingDisplay.length === 0 ? (
                <tr><td colSpan={10} style={{ ...S.td, textAlign: 'center', padding: '48px 0', color: COLORS.textMuted }}>{filterApplied ? 'No matching applications.' : 'No applications pending.'}</td></tr>
              ) : pendingDisplay.map((a, i) => {
                const days = daysSince(a.submittedAt);
                return (
                  <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg, cursor: 'pointer' }}
                    onClick={() => navigate(`/nodalb/queue/${a.id}`)}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                    <td style={S.td}><span style={{ background: COLORS.primaryLight, color: COLORS.primary, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{TYPE_LABELS[a.applicationType] ?? a.applicationType}</span></td>
                    <td style={{ ...S.td, fontSize: 11 }}>{a.foodCategory ?? '—'}</td>
                    <td style={S.td}>{a.companyName}</td>
                    <td style={{ ...S.td, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.productName ?? '—'}</td>
                    <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                    <td style={{ ...S.td, color: (days ?? 0) > 7 ? COLORS.danger : COLORS.text, fontWeight: (days ?? 0) > 7 ? 700 : 400 }}>{days !== null ? `${days}d` : '—'}</td>
                    <td style={S.td}><StatusBadge status={a.stage} /></td>
                    <td style={S.td} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => navigate(`/nodalb/queue/${a.id}`)}
                          style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>View Details</button>
                        <button onClick={() => handleForwardCEO(a.id)} disabled={forwarding === a.id}
                          style={{ background: 'transparent', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: forwarding === a.id ? 'not-allowed' : 'pointer', opacity: forwarding === a.id ? 0.55 : 1 }}>
                          {forwarding === a.id ? '…' : 'Forward CEO'}
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
        <div style={S.roleLabel}>NODAL POINT B</div>
        <div style={S.pageTitle}>Dashboard</div>
        <div style={S.pageDesc}>Review EC-approved dossiers and forward to CEO for final approval.</div>
      </div>
      <OfficerBins activeBin={activeBin} onSelect={setActiveBin} pendingCount={pending} notifCount={unread} />
      {activeBin === 'dashboard'     && renderDashboard()}
      {activeBin === 'pending'       && renderPendingActions()}
      {activeBin === 'notifications' && renderNotifications()}
    </div>
  );
}
