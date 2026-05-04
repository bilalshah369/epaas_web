// Technical Officer — Application Based Reports (5 routes share this component)
// Same as nodalA/ApplicationReports but uses fetchTechnicalAll / tech report endpoints.
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { COLORS, S } from '@/utils/colors';
import { fetchTechnicalAll, fetchTechnicalAppealsReport, fetchTechnicalReviewsReport } from '@/services/technical.service';
import type { Application } from '@/services/application.service';

type ReportKey = 'approved' | 'rejected' | 'withdrawn' | 'appeal' | 'review';

const CONFIGS: Record<ReportKey, { title: string; desc: string; tableTitle: string; emptyMsg: string; badgeBg: string; badgeColor: string; statusLabel: string }> = {
  approved:  { title: 'Approved Applications',    desc: 'All applications that received final product approval.',    tableTitle: 'Approved Applications',  emptyMsg: 'No approved applications found.',  badgeBg: COLORS.successLight, badgeColor: COLORS.success, statusLabel: 'Approved'      },
  rejected:  { title: 'Rejected Applications',    desc: 'Applications that were rejected during evaluation.',        tableTitle: 'Rejected Applications',  emptyMsg: 'No rejected applications found.',  badgeBg: COLORS.dangerLight,  badgeColor: COLORS.danger,  statusLabel: 'Rejected'      },
  withdrawn: { title: 'Withdrawn by Applicant',   desc: 'Applications voluntarily withdrawn by the applicant.',     tableTitle: 'Withdrawn Applications', emptyMsg: 'No withdrawn applications found.', badgeBg: COLORS.warningLight, badgeColor: COLORS.warning, statusLabel: 'Withdrawn'     },
  appeal:    { title: 'Application for Appeal',   desc: 'Rejected applications for which an appeal has been filed.',tableTitle: 'Appeal Applications',    emptyMsg: 'No appeal applications found.',    badgeBg: COLORS.infoLight,    badgeColor: COLORS.info,    statusLabel: 'Appeal Filed'  },
  review:    { title: 'Application for Review',   desc: 'Applications for which a review petition has been filed.', tableTitle: 'Review Applications',    emptyMsg: 'No review applications found.',    badgeBg: COLORS.infoLight,    badgeColor: COLORS.info,    statusLabel: 'Review Filed'  },
};

const TYPE_LABELS: Record<string, string> = {
  NSF: 'NSF', ClaimApproval: 'Claim Approval', AyurvedaAahara: 'Ayurveda Aahara', RPET: 'rPET', AnyOther: 'Any Other',
};

const FILTER_FIELDS = [
  { label: 'Application Ref. No.', placeholder: 'EPAAS-…', type: 'text' },
  { label: 'Company / Org Name',   placeholder: 'Search…', type: 'text' },
  { label: 'Application Type',     type: 'select', options: ['All', 'NSF', 'Claim Approval', 'Ayurveda Aahara', 'rPET', 'Any Other'] },
  { label: 'From Date',            type: 'date' },
  { label: 'To Date',              type: 'date' },
];

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TechApplicationReports() {
  const location = useLocation();
  const navigate = useNavigate();
  const segment  = location.pathname.split('/').pop() as ReportKey;
  const cfg      = CONFIGS[segment] ?? CONFIGS.approved;

  const [apps, setApps]       = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let data: Application[];
      if (segment === 'appeal')        data = await fetchTechnicalAppealsReport();
      else if (segment === 'review')   data = await fetchTechnicalReviewsReport();
      else {
        const all = await fetchTechnicalAll();
        if (segment === 'approved')    data = all.filter((a) => ['Approved', 'Closed'].includes(a.stage));
        else if (segment === 'rejected') data = all.filter((a) => a.stage === 'Rejected');
        else                           data = all.filter((a) => a.stage === 'Withdrawn');
      }
      setApps(data);
    } finally { setLoading(false); }
  }, [segment]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={S.roleLabel}>TECHNICAL OFFICER — APPLICATION BASED REPORTS</div>
        <div style={S.pageTitle}>{cfg.title}</div>
        <div style={S.pageDesc}>{cfg.desc}</div>
      </div>

      <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
        {FILTER_FIELDS.map((f) => (
          <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140, flex: '1 1 140px' }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.label}</label>
            {f.type === 'select' ? (
              <select style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11, background: '#fff', cursor: 'pointer' }}>
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

      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {cfg.tableTitle}
            {!loading && <span style={{ marginLeft: 8, background: cfg.badgeBg, color: cfg.badgeColor, borderRadius: 10, fontSize: 10, padding: '1px 7px', fontWeight: 700 }}>{apps.length}</span>}
          </span>
          <button style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['Sr. No.', 'App. No.', 'Company / Org.', 'Product', 'App. Type', 'Received', 'EC Number', 'EC Status', 'Date of Issue of Form 2', 'Final Status'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={10} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>}
              {!loading && apps.length === 0 && <tr><td colSpan={10} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>{cfg.emptyMsg}</td></tr>}
              {apps.map((a, i) => (
                <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg, cursor: 'pointer' }} onClick={() => navigate(`/technical/assessment/${a.id}`)}>
                  <td style={S.td}>{i + 1}</td>
                  <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                  <td style={S.td}>{a.companyName}</td>
                  <td style={S.td}>{a.productName ?? '—'}</td>
                  <td style={S.td}><span style={{ background: COLORS.infoLight, color: COLORS.info, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{TYPE_LABELS[a.applicationType] ?? a.applicationType}</span></td>
                  <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                  <td style={S.td}>—</td>
                  <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: cfg.badgeBg, color: cfg.badgeColor }}>{segment === 'approved' ? 'EC Approved' : segment === 'rejected' ? 'EC Rejected' : '—'}</span></td>
                  <td style={S.td}>{segment === 'approved' ? fmtDate(a.updatedAt) : '—'}</td>
                  <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: cfg.badgeBg, color: cfg.badgeColor }}>{cfg.statusLabel}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
