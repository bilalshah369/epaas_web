// Mirrors AppReportDetail from mock (App.jsx L14864).
// Single component for all 5 Application Based Report screens.
// Report type is derived from the last URL path segment.
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { COLORS, S } from '@/utils/colors';
import {
  fetchNodalAAll,
  fetchNodalAAppealsReport,
  fetchNodalAReviewsReport,
} from '@/services/officer.service';
import type { Application } from '@/services/application.service';

type ReportKey = 'approved' | 'rejected' | 'withdrawn' | 'appeal' | 'review';

interface ReportConfig {
  title: string;
  desc: string;
  tableTitle: string;
  emptyMsg: string;
  badgeBg: string;
  badgeColor: string;
  statusLabel: string;
}

const CONFIGS: Record<ReportKey, ReportConfig> = {
  approved: {
    title:       'Approved Applications',
    desc:        'All applications that received final product approval.',
    tableTitle:  'Approved Applications',
    emptyMsg:    'No approved applications found.',
    badgeBg:     COLORS.successLight,
    badgeColor:  COLORS.success,
    statusLabel: 'Approved',
  },
  rejected: {
    title:       'Rejected Applications',
    desc:        'Applications that were rejected during evaluation.',
    tableTitle:  'Rejected Applications',
    emptyMsg:    'No rejected applications found.',
    badgeBg:     COLORS.dangerLight,
    badgeColor:  COLORS.danger,
    statusLabel: 'Rejected',
  },
  withdrawn: {
    title:       'Withdrawn by Applicant',
    desc:        'Applications voluntarily withdrawn by the applicant.',
    tableTitle:  'Withdrawn Applications',
    emptyMsg:    'No withdrawn applications found.',
    badgeBg:     COLORS.warningLight,
    badgeColor:  COLORS.warning,
    statusLabel: 'Withdrawn',
  },
  appeal: {
    title:       'Application for Appeal',
    desc:        'Rejected applications for which an appeal has been filed.',
    tableTitle:  'Appeal Applications',
    emptyMsg:    'No appeal applications found.',
    badgeBg:     COLORS.infoLight,
    badgeColor:  COLORS.info,
    statusLabel: 'Appeal Filed',
  },
  review: {
    title:       'Application for Review',
    desc:        'Applications for which a review petition has been filed.',
    tableTitle:  'Review Applications',
    emptyMsg:    'No review applications found.',
    badgeBg:     COLORS.infoLight,
    badgeColor:  COLORS.info,
    statusLabel: 'Review Filed',
  },
};

const TYPE_LABELS: Record<string, string> = {
  NSF:            'NSF',
  ClaimApproval:  'Claim Approval',
  AyurvedaAahara: 'Ayurveda Aahara',
  RPET:           'rPET',
  AnyOther:       'Any Other',
};

// Map display label → applicationType value
const TYPE_VALUE_MAP: Record<string, string> = {
  'NSF':             'NSF',
  'Claim Approval':  'ClaimApproval',
  'Ayurveda Aahara': 'AyurvedaAahara',
  'rPET':            'RPET',
  'Any Other':       'AnyOther',
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const BLANK = { refNo: '', approvalNo: '', company: '', appType: 'All', fromDate: '', toDate: '' };

export default function ApplicationReports() {
  const location = useLocation();
  const navigate = useNavigate();

  const segment = location.pathname.split('/').pop() as ReportKey;
  const cfg = CONFIGS[segment] ?? CONFIGS.approved;

  const showApprNum = segment === 'approved' || segment === 'rejected';

  const [apps,    setApps]    = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter input state (draft — not yet applied)
  const [draft,   setDraft]   = useState(BLANK);
  // Active filter state (applied on Search click)
  const [active,  setActive]  = useState(BLANK);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let data: Application[];
      if (segment === 'appeal') {
        data = await fetchNodalAAppealsReport();
      } else if (segment === 'review') {
        data = await fetchNodalAReviewsReport();
      } else {
        const all = await fetchNodalAAll();
        if (segment === 'approved')       data = all.filter((a) => ['Approved', 'Closed'].includes(a.stage));
        else if (segment === 'rejected')  data = all.filter((a) => a.stage === 'Rejected');
        else                              data = all.filter((a) => a.stage === 'Withdrawn');
      }
      setApps(data);
    } finally { setLoading(false); }
  }, [segment]);

  useEffect(() => { load(); setDraft(BLANK); setActive(BLANK); }, [load]);

  // Apply filters
  const displayed = apps.filter((a) => {
    if (active.refNo     && !a.referenceNumber.toLowerCase().includes(active.refNo.toLowerCase()))            return false;
    if (active.approvalNo && !(a.approvalNumber ?? '').toLowerCase().includes(active.approvalNo.toLowerCase())) return false;
    if (active.company   && !a.companyName.toLowerCase().includes(active.company.toLowerCase()))        return false;
    if (active.appType !== 'All' && a.applicationType !== TYPE_VALUE_MAP[active.appType])               return false;
    if (active.fromDate) {
      const from = new Date(active.fromDate); from.setHours(0, 0, 0, 0);
      if (!a.submittedAt || new Date(a.submittedAt) < from) return false;
    }
    if (active.toDate) {
      const to = new Date(active.toDate); to.setHours(23, 59, 59, 999);
      if (!a.submittedAt || new Date(a.submittedAt) > to) return false;
    }
    return true;
  });

  function handleSearch() { setActive({ ...draft }); }
  function handleReset()  { setDraft(BLANK); setActive(BLANK); }

  const iStyle = { border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11 } as const;

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 16 }}>
        <div style={S.roleLabel}>NODAL OFFICER — APPLICATION BASED REPORTS</div>
        <div style={S.pageTitle}>{cfg.title}</div>
        <div style={S.pageDesc}>{cfg.desc}</div>
      </div>

      {/* Filter bar */}
      <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>

        {/* Application Ref. No. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140, flex: '1 1 140px' }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Application Ref. No.</label>
          <input value={draft.refNo} onChange={(e) => setDraft((d) => ({ ...d, refNo: e.target.value }))} placeholder="EPAAS-…" style={iStyle} />
        </div>

        {/* Approval / Rejection No. — only for approved & rejected pages */}
        {showApprNum && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140, flex: '1 1 140px' }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {segment === 'approved' ? 'Approval No.' : 'Rejection No.'}
            </label>
            <input
              value={draft.approvalNo}
              onChange={(e) => setDraft((d) => ({ ...d, approvalNo: e.target.value }))}
              placeholder="YY SS AA CC NNNNNN"
              style={iStyle}
            />
          </div>
        )}

        {/* Company / Org Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140, flex: '1 1 140px' }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Company / Org Name</label>
          <input value={draft.company} onChange={(e) => setDraft((d) => ({ ...d, company: e.target.value }))} placeholder="Search…" style={iStyle} />
        </div>

        {/* Application Type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140, flex: '1 1 140px' }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Application Type</label>
          <select value={draft.appType} onChange={(e) => setDraft((d) => ({ ...d, appType: e.target.value }))} style={{ ...iStyle, background: '#fff', cursor: 'pointer' }}>
            {['All', 'NSF', 'Claim Approval', 'Ayurveda Aahara', 'rPET', 'Any Other'].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>

        {/* From Date */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130, flex: '1 1 130px' }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>From Date</label>
          <input type="date" value={draft.fromDate} onChange={(e) => setDraft((d) => ({ ...d, fromDate: e.target.value }))} style={iStyle} />
        </div>

        {/* To Date */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130, flex: '1 1 130px' }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>To Date</label>
          <input type="date" value={draft.toDate} onChange={(e) => setDraft((d) => ({ ...d, toDate: e.target.value }))} style={iStyle} />
        </div>

        <button onClick={handleSearch} style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontSize: 11, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-end' }}>Search</button>
        <button onClick={handleReset}  style={{ background: 'none', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer', alignSelf: 'flex-end' }}>Reset</button>
      </div>

      {/* Table card */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {cfg.tableTitle}
            {!loading && (
              <span style={{ marginLeft: 8, background: cfg.badgeBg, color: cfg.badgeColor, borderRadius: 10, fontSize: 10, padding: '1px 7px', fontWeight: 700 }}>{displayed.length}</span>
            )}
          </span>
          <button style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {[
                  'Sr. No.', 'App. No.',
                  ...(showApprNum ? [segment === 'approved' ? 'Approval No.' : 'Rejection No.'] : []),
                  'Company / Org.', 'Product', 'App. Type', 'Received',
                  'EC Number', 'EC Status', 'Date of Issue of Form 2', 'Final Status', 'Action',
                ].map((h) => <th key={h} style={S.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={12} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>
              )}
              {!loading && displayed.length === 0 && (
                <tr><td colSpan={12} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>{cfg.emptyMsg}</td></tr>
              )}
              {displayed.map((a, i) => {
                return (
                  <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                    {showApprNum && <td style={{ ...S.td, fontWeight: 700 }}>{a.approvalNumber ?? '—'}</td>}
                    <td style={S.td}>{a.companyName}</td>
                    <td style={S.td}>{a.productName ?? '—'}</td>
                    <td style={S.td}>
                      <span style={{ background: COLORS.infoLight, color: COLORS.info, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                        {TYPE_LABELS[a.applicationType] ?? a.applicationType}
                      </span>
                    </td>
                    <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                    <td style={{ ...S.td, fontWeight: 700 }}>{a.approvalNumber ?? '—'}</td>
                    <td style={S.td}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: cfg.badgeBg, color: cfg.badgeColor }}>
                        {segment === 'approved' ? 'EC Approved' : segment === 'rejected' ? 'EC Rejected' : '—'}
                      </span>
                    </td>
                    <td style={S.td}>{segment === 'approved' ? fmtDate(a.updatedAt) : '—'}</td>
                    <td style={S.td}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: cfg.badgeBg, color: cfg.badgeColor }}>
                        {cfg.statusLabel}
                      </span>
                    </td>
                    <td style={S.td}>
                      <button onClick={() => navigate(`/nodal/scrutiny/${a.id}`)} style={{ padding: '4px 12px', background: 'transparent', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>View</button>
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
