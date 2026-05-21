// Mirrors TechnicalDashboard from mock (App.jsx L13489).
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, S } from '@/utils/colors';
import { resolveFoodCategory } from '@/utils/docResolver';
import StatusBadge from '@/components/ui/StatusBadge';
import { fetchTechnicalPending, fetchTechnicalAll } from '@/services/technical.service';
import type { Application } from '@/services/application.service';

const TYPE_LABELS: Record<string, string> = {
  NSF: 'NSF', ClaimApproval: 'Claim Approval',
  AyurvedaAahara: 'Ayurveda Aahara', RPET: 'rPET', AnyOther: 'Any Other',
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysSince(iso: string | null) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

// ── Shared sub-components (same pattern as NodalADashboard) ──────────────────

function ScreenHeading({ role, title }: { role: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${COLORS.border}` }}>
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 2 }}>{role}</div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", margin: 0 }}>{title}</h2>
      </div>
    </div>
  );
}

function OfficerBins({ activeBin, onSelect, pendingCount, notifCount }: { activeBin: string; onSelect: (k: string) => void; pendingCount: number; notifCount: number }) {
  const bins = [
    { key: 'dashboard',     icon: '🏛️', label: 'Click to View Dashboard',       count: null,        color: COLORS.primary },
    { key: 'pending',       icon: '⚡',  label: 'Click to View Pending Actions', count: pendingCount, color: '#B45309'      },
    { key: 'notifications', icon: '🔔', label: 'Click to View Notifications',   count: notifCount,  color: COLORS.info    },
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
              <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, marginBottom: 6, color: active ? '#fff' : b.color, fontFamily: "'Libre Baskerville',Georgia,serif" }}>
                {b.count}
              </div>
            )}
            <div style={{ fontSize: 12, fontWeight: 600, color: active ? 'rgba(255,255,255,0.92)' : COLORS.text, lineHeight: 1.3 }}>{b.label}</div>
          </div>
        );
      })}
    </div>
  );
}


interface FilterField { label: string; type?: string; options?: string[]; placeholder?: string }
function OfficerFilterBar({ fields }: { fields: FilterField[] }) {
  return (
    <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
      {fields.map((f) => (
        <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140, flex: '1 1 140px' }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.label}</label>
          {f.type === 'select' ? (
            <select style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11, background: '#fff' }}>
              {(f.options ?? []).map((o) => <option key={o}>{o}</option>)}
            </select>
          ) : f.type === 'date' ? (
            <input type="date" style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11 }} />
          ) : (
            <input placeholder={f.placeholder ?? ''} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11 }} />
          )}
        </div>
      ))}
      <button style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontSize: 11, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-end' }}>Search</button>
      <button style={{ background: 'none', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer', alignSelf: 'flex-end' }}>Reset</button>
    </div>
  );
}

function Btn({ label, variant = 'primary', onClick }: { label: string; variant?: 'primary' | 'outline'; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      style={{ background: variant === 'primary' ? COLORS.primary : 'transparent', color: variant === 'primary' ? '#fff' : COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  );
}

// ── Filter definitions ─────────────────────────────────────────────────────────
const DOC_SCRUTINY_FILTERS: FilterField[] = [
  { label: 'Application Ref. No.', placeholder: 'EPAAS-…' },
  { label: 'Company / Org Name',   placeholder: 'Search…' },
  { label: 'State',                type: 'select', options: ['All', 'Gujarat', 'Maharashtra', 'Delhi', 'Karnataka'] },
  { label: 'From Date',            type: 'date' },
  { label: 'To Date',              type: 'date' },
  { label: 'Application Type',     type: 'select', options: ['All', 'New', 'Appeal', 'Review'] },
  { label: 'Application Filter',   type: 'select', options: ['All', 'Edited by Applicant', 'Recommended by TO', 'Recommended by EC', 'Extension of Additional Time'] },
];
const FBO_EDIT_FILTERS: FilterField[] = [
  { label: 'Application Ref. No.', placeholder: 'EPAAS-…' },
  { label: 'Company / Org',        placeholder: 'Search…' },
  { label: 'From Date',            type: 'date' },
  { label: 'To Date',              type: 'date' },
];
const WITHDRAWAL_FILTERS: FilterField[] = [
  { label: 'Approval No.',       placeholder: 'APPR-…' },
  { label: 'Company',            placeholder: 'Search…' },
  { label: 'From Date',          type: 'date' },
  { label: 'To Date',            type: 'date' },
];

// PENDING_SECTIONS counts are derived dynamically inside the component


const NOTIFICATIONS = [
  { id: 1, title: 'New application assigned — EPAAS-2025-007', desc: 'Mother Dairy NSF application forwarded from Nodal Officer. Awaiting technical review.', time: '1h ago', read: false },
  { id: 2, title: 'Query response received — EPAAS-2025-002', desc: 'Nestlé India Ltd. has responded to the stability data query.', time: '4h ago', read: false },
  { id: 3, title: 'Application forwarded to EC — EPAAS-2025-001', desc: 'Amul Dairy application recommended for Expert Committee review.', time: '2d ago', read: true },
  { id: 4, title: 'Reminder: EPAAS-2025-003 — 5 days remaining', desc: 'Dabur Chyawanprash application deadline approaching. Action required.', time: '2d ago', read: false },
];

// ── Main component ─────────────────────────────────────────────────────────────
export default function TechDashboard() {
  const navigate = useNavigate();
  const [activeBin, setActiveBin] = useState('dashboard');
const [pendingSection, setPendingSection] = useState('docscrutiny');

const [apps, setApps] = useState<Application[]>([]);
const [allApps, setAllApps] = useState<Application[]>([]);

const [loading, setLoading] = useState(true);

/* ADD THESE */
const [dashboardSection, setDashboardSection] = useState<string | null>(null);
const [dashSubTab, setDashSubTab] = useState<'category' | 'yearwise'>('category');
const [statusSheet, setStatusSheet] = useState<1 | 2>(1);
const [appealType, setAppealType] = useState('Appeal');

  useEffect(() => {
    fetchTechnicalPending().then(setApps).finally(() => setLoading(false));
    fetchTechnicalAll().then(setAllApps);
  }, []);

  const pending       = apps.length;

  const PENDING_SECTIONS = [
    { key: 'docscrutiny', label: 'Document Scrutinization',  count: apps.length },
    { key: 'fboedit',     label: 'Application with Editing', count: 0 },
    { key: 'withdrawal',  label: 'Withdrawal of Approval',   count: 0 },
  ];
  const unread        = NOTIFICATIONS.filter((n) => !n.read).length;
  const approvedCount = allApps.filter((a) => ['Approved', 'Closed'].includes(a.stage)).length;
  const rejectedCount = allApps.filter((a) => a.stage === 'Rejected').length;
  const withdrawnCount= allApps.filter((a) => a.stage === 'Withdrawn').length;
  const pendingCount  = allApps.filter((a) => !['Approved', 'Closed', 'Rejected', 'Withdrawn', 'Draft'].includes(a.stage)).length;

  const DASH_CARDS = [
    { key: 'approved',     icon: '✅', label: 'Applications Approved',           count: approvedCount,  color: COLORS.success },
    { key: 'rejected',     icon: '❌', label: 'Application Rejected',            count: rejectedCount,  color: COLORS.danger  },
    { key: 'pms',          icon: '📋', label: 'Application Approved with PMS',   count: null,           color: COLORS.info    },
    { key: 'withdrawn',    icon: '🔄', label: 'Application Withdrawn / Closed',  count: withdrawnCount, color: COLORS.warning },
    { key: 'status',       icon: '📊', label: 'Application Status',              count: null,           color: COLORS.primary },
    { key: 'appealreview', icon: '⚖️', label: 'Application for Appeal / Review', count: null,           color: '#2C5282'      },
  ];

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const renderDashboard = () => {
    const approvedApps  = allApps.filter((a) => ['Approved', 'Closed'].includes(a.stage));
    const rejectedApps  = allApps.filter((a) => a.stage === 'Rejected');
    const closedApps    = allApps.filter((a) => a.stage === 'Withdrawn');
    const pendingApps   = allApps.filter((a) => !['Approved', 'Closed', 'Rejected', 'Withdrawn', 'Draft'].includes(a.stage));

    const REPORT_COLS = ['Sr. No.', 'Application No.', 'Name & Address of Applicant', 'Name of Product', 'Date of Receipt', 'Date of Receipt of Appeal', 'Date of Appellate Order', 'Date of Receipt of Review', 'Date of Review Order', 'EC Number', 'EC Status', 'Date of Issue of Form 2', 'Final Status'];

    const YEAR_WISE_FILTERS: FilterField[] = [
      { label: 'Category',            type: 'select', options: ['All', 'NSF', 'Claim Approval', 'Ayurveda Aahara', 'rPET', 'Any Other'] },
      { label: 'Quarter / Month',     type: 'select', options: ['All', 'Q1', 'Q2', 'Q3', 'Q4', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] },
      { label: 'Year',                type: 'select', options: ['All', '2025', '2024', '2023', '2022'] },
      { label: 'Date From',           type: 'date' },
      { label: 'Date To',             type: 'date' },
      { label: 'Type of Application', type: 'select', options: ['All', 'New', 'Appeal', 'Review'] },
    ];

    const finalBadge = (stage: string) => {
      const isApproved = ['Approved', 'Closed'].includes(stage);
      const isRejected = stage === 'Rejected';
      const bg = isApproved ? COLORS.successLight : isRejected ? COLORS.dangerLight : COLORS.warningLight;
      const fg = isApproved ? COLORS.success      : isRejected ? COLORS.danger      : COLORS.warning;
      return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: bg, color: fg }}>{stage}</span>;
    };

    const reportTable = (rows: Application[]) => (
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>{rows.length} Records</span>
          <button style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr>{REPORT_COLS.map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={13} style={{ ...S.td, textAlign: 'center', padding: 32, color: COLORS.textMuted }}>No records found.</td></tr>}
              {rows.map((a, i) => (
                <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                  <td style={S.td}>{i + 1}</td>
                  <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                  <td style={S.td}>{a.companyName}{a.address ? `, ${a.address}` : ''}</td>
                  <td style={S.td}>{a.productName ?? '—'}</td>
                  <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                  <td style={S.td}>—</td>
                  <td style={S.td}>—</td>
                  <td style={S.td}>—</td>
                  <td style={S.td}>—</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{a.approvalNumber ?? '—'}</td>
                  <td style={S.td}>—</td>
                  <td style={S.td}>—</td>
                  <td style={S.td}>{finalBadge(a.stage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );

    const subPageLayout = (title: string, rows: Application[], statCards: { label: string; value: number; color: string }[]) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <button onClick={() => setDashboardSection(null)} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer', color: COLORS.textMuted }}>← Back</button>
          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{title}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${statCards.length},1fr)`, gap: 10 }}>
          {statCards.map((sc) => (
            <div key={sc.label} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${sc.color}`, borderRadius: 8, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: sc.color, fontFamily: "'Libre Baskerville',Georgia,serif" }}>{sc.value}</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4, lineHeight: 1.4 }}>{sc.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
          {(['category', 'yearwise'] as const).map((t) => (
            <button key={t} onClick={() => setDashSubTab(t)}
              style={{ padding: '5px 16px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: `1px solid ${dashSubTab === t ? COLORS.primary : COLORS.border}`, background: dashSubTab === t ? COLORS.primary : 'transparent', color: dashSubTab === t ? '#fff' : COLORS.textMuted }}>
              {t === 'category' ? 'Category-wise' : 'Year-wise'}
            </button>
          ))}
        </div>
        <OfficerFilterBar fields={YEAR_WISE_FILTERS} />
        {reportTable(rows)}
      </div>
    );

    // ── Sub-page routing ──────────────────────────────────────────────────────
    if (dashboardSection === 'approved') {
      return subPageLayout('Applications Approved', approvedApps, [
        { label: 'Total Received',   value: allApps.length,      color: COLORS.primary },
        { label: 'Approved',         value: approvedApps.length, color: COLORS.success },
        { label: 'Rejected',         value: rejectedApps.length, color: COLORS.danger  },
        { label: 'Withdrawn/Closed', value: closedApps.length,   color: COLORS.warning },
      ]);
    }
    if (dashboardSection === 'rejected') {
      return subPageLayout('Application Rejected', rejectedApps, [
        { label: 'Total Received',   value: allApps.length,      color: COLORS.primary },
        { label: 'Approved',         value: approvedApps.length, color: COLORS.success },
        { label: 'Rejected',         value: rejectedApps.length, color: COLORS.danger  },
        { label: 'Withdrawn/Closed', value: closedApps.length,   color: COLORS.warning },
      ]);
    }
    if (dashboardSection === 'withdrawn') {
      return subPageLayout('Application Withdrawn / Closed', closedApps, [
        { label: 'Total Received',   value: allApps.length,      color: COLORS.primary },
        { label: 'Approved',         value: approvedApps.length, color: COLORS.success },
        { label: 'Rejected',         value: rejectedApps.length, color: COLORS.danger  },
        { label: 'Withdrawn/Closed', value: closedApps.length,   color: COLORS.warning },
      ]);
    }
    if (dashboardSection === 'pms') {
      return subPageLayout('Application Approved with PMS', approvedApps, [
        { label: 'Total Received',   value: allApps.length,      color: COLORS.primary },
        { label: 'Approved',         value: approvedApps.length, color: COLORS.success },
        { label: 'Rejected',         value: rejectedApps.length, color: COLORS.danger  },
        { label: 'Withdrawn/Closed', value: closedApps.length,   color: COLORS.warning },
      ]);
    }
    if (dashboardSection === 'status') {
      const buckets = [
        { label: 'Authority Pending ≤ 45 Days',   filter: (a: Application) => (daysSince(a.submittedAt) ?? 0) <= 45  },
        { label: 'Authority Pending 46–75 Days',  filter: (a: Application) => { const d = daysSince(a.submittedAt) ?? 0; return d >= 46 && d <= 75; } },
        { label: 'Authority Pending > 75 Days',   filter: (a: Application) => (daysSince(a.submittedAt) ?? 0) > 75   },
      ];
      const sheet2Cols = ['Total Pending', 'Pending with TO', 'Pending with Nodal', 'Pending with EC', 'Ready for EC', 'Applicant ≤ 30d', 'Applicant 31–45d', 'Applicant > 45d', 'Long Outstanding (>75d)'];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <button onClick={() => setDashboardSection(null)} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer', color: COLORS.textMuted }}>← Back</button>
            <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>Application Status</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11 }}>
              <option>Year-wise</option><option>Category-wise</option>
            </select>
            <select style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11 }}>
              <option>New</option><option>Appeal</option><option>Review</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {([1, 2] as const).map((n) => (
              <button key={n} onClick={() => setStatusSheet(n)}
                style={{ padding: '5px 16px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: `1px solid ${statusSheet === n ? COLORS.primary : COLORS.border}`, background: statusSheet === n ? COLORS.primary : 'transparent', color: statusSheet === n ? '#fff' : COLORS.textMuted }}>
                Sheet {n}
              </button>
            ))}
          </div>
          {statusSheet === 1 && (
            <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>{['Summary', 'TO', 'Nodal', 'EC', 'Applicant Authority'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {buckets.map((b, i) => {
                    const rows = pendingApps.filter(b.filter);
                    return (
                      <tr key={b.label} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                        <td style={{ ...S.td, fontWeight: 600 }}>{b.label}</td>
                        <td style={S.td}>{rows.filter((a) => a.stage === 'WithTechnicalOfficer').length}</td>
                        <td style={S.td}>{rows.filter((a) => a.stage === 'WithNodalOfficerA').length}</td>
                        <td style={S.td}>{rows.filter((a) => a.stage === 'WithEC').length}</td>
                        <td style={S.td}>{rows.filter((a) => a.stage === 'QuerySent').length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {statusSheet === 2 && (
            <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>{sheet2Cols.map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  <tr>
                    <td style={S.td}>{pendingApps.length}</td>
                    <td style={S.td}>{pendingApps.filter((a) => a.stage === 'WithTechnicalOfficer').length}</td>
                    <td style={S.td}>{pendingApps.filter((a) => a.stage === 'WithNodalOfficerA').length}</td>
                    <td style={S.td}>{pendingApps.filter((a) => a.stage === 'WithEC').length}</td>
                    <td style={S.td}>{pendingApps.filter((a) => a.stage === 'WithNodalOfficerA').length}</td>
                    <td style={S.td}>{pendingApps.filter((a) => a.stage === 'QuerySent' && (daysSince(a.submittedAt) ?? 0) <= 30).length}</td>
                    <td style={S.td}>{pendingApps.filter((a) => { const d = daysSince(a.submittedAt) ?? 0; return a.stage === 'QuerySent' && d >= 31 && d <= 45; }).length}</td>
                    <td style={S.td}>{pendingApps.filter((a) => a.stage === 'QuerySent' && (daysSince(a.submittedAt) ?? 0) > 45).length}</td>
                    <td style={S.td}>{pendingApps.filter((a) => (daysSince(a.submittedAt) ?? 0) > 75).length}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }
    if (dashboardSection === 'appealreview') {
      const filteredApps = allApps;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <button onClick={() => setDashboardSection(null)} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer', color: COLORS.textMuted }}>← Back</button>
            <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>Application for Appeal / Review</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {['Appeal', 'Review'].map((t) => (
              <button key={t} onClick={() => setAppealType(t)}
                style={{ padding: '5px 16px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: `1px solid ${appealType === t ? COLORS.primary : COLORS.border}`, background: appealType === t ? COLORS.primary : 'transparent', color: appealType === t ? '#fff' : COLORS.textMuted }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
            {(['category', 'yearwise'] as const).map((t) => (
              <button key={t} onClick={() => setDashSubTab(t)}
                style={{ padding: '5px 16px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: `1px solid ${dashSubTab === t ? COLORS.primary : COLORS.border}`, background: dashSubTab === t ? COLORS.primary : 'transparent', color: dashSubTab === t ? '#fff' : COLORS.textMuted }}>
                {t === 'category' ? 'Category-wise' : 'Year-wise'}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {[
              { label: 'Total Received',   value: allApps.length,      color: COLORS.primary },
              { label: 'Approved',         value: approvedApps.length, color: COLORS.success },
              { label: 'Rejected',         value: rejectedApps.length, color: COLORS.danger  },
              { label: 'Withdrawn/Closed', value: closedApps.length,   color: COLORS.warning },
            ].map((sc) => (
              <div key={sc.label} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${sc.color}`, borderRadius: 8, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: sc.color, fontFamily: "'Libre Baskerville',Georgia,serif" }}>{sc.value}</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4, lineHeight: 1.4 }}>{sc.label}</div>
              </div>
            ))}
          </div>
          {reportTable(filteredApps)}
        </div>
      );
    }

    return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 2×3 stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {DASH_CARDS.map((c) => (
          <div key={c.key} onClick={() => setDashboardSection(c.key)}
            style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${c.color}`, borderRadius: 8, padding: '12px 16px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: COLORS.textMuted, lineHeight: 1.35, maxWidth: '75%' }}>{c.label}</span>
              <span style={{ fontSize: 15, opacity: 0.55, flexShrink: 0 }}>{c.icon}</span>
            </div>
            {c.count !== null ? (
              <div style={{ fontSize: 26, fontWeight: 700, color: c.color, fontFamily: "'Libre Baskerville',Georgia,serif", lineHeight: 1 }}>{c.count}</div>
            ) : (
              <div style={{ fontSize: 12, color: c.color, fontWeight: 600 }}>View details →</div>
            )}
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 5, fontWeight: 500 }}>Click to view details</div>
          </div>
        ))}
      </div>

      {/* Assigned Applications table */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>Assigned Applications</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
            <button onClick={() => setActiveBin('pending')} style={{ fontSize: 11, color: COLORS.primary, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View pending →</button>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: COLORS.textMuted }}>Loading…</div>
        ) : apps.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>All clear!</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>No applications assigned for technical review.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['App. No.', 'Company', 'Product', 'App. Type',  'State', 'Received', 'Days Left', 'Status', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {apps.map((a, i) => {
                  const days = daysSince(a.submittedAt);
                  return (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                      <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                      <td style={S.td}>{a.companyName}</td>
                      <td style={{ ...S.td, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(a.formData as Record<string, unknown> | null) ? String((a.formData as Record<string, Record<string, unknown>> | null)?.step2?.productName ?? '—') : '—'}</td>
                      <td style={S.td}><span style={{ background: COLORS.primaryLight, color: COLORS.primary, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>New</span></td>
                      <td style={S.td}>—</td>
                      <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                      <td style={{ ...S.td, color: (days ?? 0) > 14 ? COLORS.danger : COLORS.text, fontWeight: (days ?? 0) > 14 ? 700 : 400 }}>{days !== null ? `${days}d` : '—'}</td>
                      <td style={S.td}><StatusBadge status={a.stage} /></td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Btn label="Open"    onClick={() => navigate(`/technical/assessment/${a.id}`)} />
                          <Btn label="Forward" variant="outline" onClick={() => navigate(`/technical/assessment/${a.id}?tab=recommendation`)} />
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
                { label: 'Total applications received',         value: allApps.length },
                { label: 'Applications Approved',               value: approvedCount  },
                { label: 'Applications Rejected',               value: rejectedCount  },
                { label: 'Applications Pending / Under Review', value: pendingCount   },
                { label: 'Applications Withdrawn / Closed',     value: withdrawnCount },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: COLORS.bg, borderRadius: 6 }}>
                  <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.primary }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: COLORS.primaryLight, border: `1px solid ${COLORS.primary}22`, borderRadius: 8, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              <div style={{ fontSize: 13, color: COLORS.primary, fontWeight: 600 }}>Category-wise Breakdown</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 8, lineHeight: 1.6 }}>Select specific categories to view detailed statistics and filters</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  // ── Pending Actions ────────────────────────────────────────────────────────
  const renderPendingActions = () => (
    <>
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 14 }}>
        {PENDING_SECTIONS.map((s) => (
          <div key={s.key} onClick={() => setPendingSection(s.key)}
            style={{ padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: pendingSection === s.key ? COLORS.primary : COLORS.textMuted, borderBottom: pendingSection === s.key ? `2px solid ${COLORS.primary}` : '2px solid transparent', marginBottom: -1, display: 'flex', gap: 5, alignItems: 'center' }}>
            {s.label}
            {s.count > 0 && (
              <span style={{ background: pendingSection === s.key ? COLORS.primary : COLORS.border, color: pendingSection === s.key ? '#fff' : COLORS.text, borderRadius: 8, fontSize: 10, padding: '0 5px', fontWeight: 700 }}>{s.count}</span>
            )}
          </div>
        ))}
      </div>

      {/* Document Scrutinization */}
      {pendingSection === 'docscrutiny' && (
        <>
          <OfficerFilterBar fields={DOC_SCRUTINY_FILTERS} />
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
              <button style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>{['Sr. No.', 'App. Ref. No.', 'App. Type', 'Food Category', 'Company / Org.', 'Product Applied For', 'Pending With', 'Received On', 'Edited', 'Days Remaining', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={11} style={{ ...S.td, textAlign: 'center', padding: '40px 0', color: COLORS.textMuted }}>Loading…</td></tr>
                  ) : apps.length === 0 ? (
                    <tr><td colSpan={11} style={{ ...S.td, textAlign: 'center', padding: '48px 0', color: COLORS.textMuted }}>No pending applications.</td></tr>
                  ) : apps.map((a, i) => {
                    const days = daysSince(a.submittedAt);
                    return (
                      <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                        <td style={S.td}>{i + 1}</td>
                        <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                        <td style={S.td}><span style={{ background: COLORS.primaryLight, color: COLORS.primary, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>New</span></td>
                        <td style={{ ...S.td, fontSize: 11 }}>{resolveFoodCategory(a)}</td>
                        <td style={S.td}>{a.companyName}</td>
                        <td style={S.td}>{TYPE_LABELS[a.applicationType] ?? a.applicationType}</td>
                        <td style={{ ...S.td, fontSize: 11, color: COLORS.primary, fontWeight: 600 }}>Technical Officer</td>
                        <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                        <td style={S.td}>No</td>
                        <td style={{ ...S.td, color: (days ?? 0) > 14 ? COLORS.danger : COLORS.text, fontWeight: (days ?? 0) > 14 ? 700 : 400 }}>{days !== null ? `${days}d` : '—'}</td>
                        <td style={S.td}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <Btn label="Proceed"     onClick={() => navigate(`/technical/assessment/${a.id}`)} />
                            <Btn label="Draft Query" variant="outline" onClick={() => navigate(`/technical/assessment/${a.id}?tab=query`)} />
                            <Btn label="Forward"     variant="outline" onClick={() => navigate(`/technical/assessment/${a.id}?tab=recommendation`)} />
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
      )}

      {/* Application with Editing */}
      {pendingSection === 'fboedit' && (
        <>
          <OfficerFilterBar fields={FBO_EDIT_FILTERS} />
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['Sr. No.', 'App. Ref. No.', 'App. Type', 'Product', 'Company', 'Forwarded On', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {apps.slice(0, 3).map((a, i) => (
                  <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                    <td style={S.td}>New</td>
                    <td style={S.td}>{TYPE_LABELS[a.applicationType] ?? a.applicationType}</td>
                    <td style={S.td}>{a.companyName}</td>
                    <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                    <td style={S.td}><Btn label="View Remarks" onClick={() => navigate(`/technical/assessment/${a.id}`)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Withdrawal of Approval */}
      {pendingSection === 'withdrawal' && (
        <>
          <OfficerFilterBar fields={WITHDRAWAL_FILTERS} />
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['Sr. No.', 'Approval No.', 'Company', 'Issue Date', 'Request Date', 'Status', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {[
                  { apprNo: 'APPR-2024-0112', company: 'Amul Dairy Ltd.',  issueDate: '15 Mar 2024', reqDate: '10 Jan 2025', status: 'pending' },
                ].map((r, i) => (
                  <tr key={r.apprNo} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{r.apprNo}</td>
                    <td style={S.td}>{r.company}</td>
                    <td style={S.td}>{r.issueDate}</td>
                    <td style={S.td}>{r.reqDate}</td>
                    <td style={S.td}><StatusBadge status={r.status} /></td>
                    <td style={S.td}><Btn label="Proceed" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );

  // ── Notifications ──────────────────────────────────────────────────────────
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
      <ScreenHeading role="Technical Officer" title="Dashboard" />
      <OfficerBins
        activeBin={activeBin}
        onSelect={setActiveBin}
        pendingCount={pending}
        notifCount={unread}
      />
      {activeBin === 'dashboard'     && renderDashboard()}
      {activeBin === 'pending'       && renderPendingActions()}
      {activeBin === 'notifications' && renderNotifications()}
    </div>
  );
}
