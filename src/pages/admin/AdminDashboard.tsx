import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { COLORS, S } from '@/utils/colors';
import StatusBadge from '@/components/ui/StatusBadge';
import AppViewModal from '@/components/admin/AppViewModal';
import { fetchAdminAll, fetchAdminAppeals } from '@/services/admin.service';
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [apps,    setApps]    = useState<Application[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewApp, setViewApp] = useState<Application | null>(null);

  useEffect(() => {
    Promise.all([fetchAdminAll(), fetchAdminAppeals()])
      .then(([a, ap]) => { setApps(a); setAppeals(ap); })
      .catch(() => toast.error('Failed to load admin data'))
      .finally(() => setLoading(false));
  }, []);

  const active    = apps.filter((a) => !['Approved', 'Closed', 'Rejected', 'Withdrawn', 'Draft'].includes(a.stage));
  const approved  = apps.filter((a) => ['Approved', 'Closed'].includes(a.stage));
  const rejected  = apps.filter((a) => a.stage === 'Rejected');
  const withEC    = apps.filter((a) => a.stage === 'WithExpertCommittee');
  const appeals_  = appeals.filter((a) => a.status === 'AppealPending');

  const healthPct = apps.length > 0
    ? Math.round(((approved.length + active.length) / apps.length) * 100)
    : 100;

  const statCards = [
    { icon: '📋', label: 'Open Applications',  value: active.length,   color: COLORS.primary  },
    { icon: '🔬', label: 'Under Scrutiny',      value: apps.filter((a) => ['WithNodalOfficerA', 'WithTechnicalOfficer', 'QuerySent'].includes(a.stage)).length, color: COLORS.info },
    { icon: '⚖️', label: 'With EC',             value: withEC.length,   color: '#B45309'       },
    { icon: '❤️', label: 'Workflow Health',     value: `${healthPct}%`, color: COLORS.success  },
  ];

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
        <div style={S.roleLabel}>SYSTEM ADMIN</div>
        <div style={S.pageTitle}>Admin Dashboard</div>
        <div style={S.pageDesc}>System-wide monitoring — read-only view of all applications and workflow health.</div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
        {statCards.map((c) => (
          <div key={c.label} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${c.color}`, borderRadius: 8, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: COLORS.textMuted, lineHeight: 1.35 }}>{c.label}</span>
              <span style={{ fontSize: 15, opacity: 0.55 }}>{c.icon}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color, fontFamily: "'Libre Baskerville',Georgia,serif", lineHeight: 1 }}>{loading ? '—' : c.value}</div>
          </div>
        ))}
      </div>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 18 }}>
        {[
          { label: 'Total Received',  value: apps.length },
          { label: 'Approved',        value: approved.length },
          { label: 'Rejected',        value: rejected.length },
          { label: 'Active / Pending', value: active.length },
          { label: 'Open Appeals',    value: appeals_.length },
        ].map((s) => (
          <div key={s.label} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.primary, fontFamily: "'Libre Baskerville',Georgia,serif" }}>{loading ? '—' : s.value}</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Work queue table */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>All Applications Monitor ({apps.length} total)</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => exportCSV(apps, 'admin_all_applications')} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
            <button onClick={() => navigate('/admin/monitor')} style={{ fontSize: 11, color: COLORS.primary, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View full monitor →</button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['App. No.', 'Company', 'Product', 'Type', 'Pending With', 'Received', 'Days', 'Status', 'Actions'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', padding: '40px 0', color: COLORS.textMuted }}>Loading…</td></tr>}
              {!loading && apps.length === 0 && <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', padding: '48px 0', color: COLORS.textMuted }}>No applications found.</td></tr>}
              {apps.slice(0, 20).map((a, i) => {
                const days = daysSince(a.submittedAt);
                return (
                  <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                    <td style={S.td}>{a.companyName}</td>
                    <td style={{ ...S.td, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.productName ?? '—'}</td>
                    <td style={S.td}><span style={{ background: COLORS.primaryLight, color: COLORS.primary, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{TYPE_LABELS[a.applicationType] ?? a.applicationType}</span></td>
                    <td style={S.td}><span style={{ fontSize: 11, color: COLORS.primary, fontWeight: 600 }}>{STAGE_PENDING_WITH[a.stage] ?? a.stage}</span></td>
                    <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                    <td style={{ ...S.td, color: (days ?? 0) > 75 ? COLORS.danger : (days ?? 0) > 45 ? COLORS.warning : COLORS.text, fontWeight: (days ?? 0) > 45 ? 700 : 400 }}>
                      {days !== null ? `${days}d` : '—'}
                    </td>
                    <td style={S.td}><StatusBadge status={a.stage} /></td>
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
        {apps.length > 20 && (
          <div style={{ padding: '10px 14px', borderTop: `1px solid ${COLORS.border}`, background: COLORS.bg, fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }}>
            Showing 20 of {apps.length} — <button onClick={() => navigate('/admin/monitor')} style={{ color: COLORS.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 11 }}>View all in App Monitor →</button>
          </div>
        )}
      </div>
    </div>
  );
}
