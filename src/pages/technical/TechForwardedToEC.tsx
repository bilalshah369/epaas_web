// Technical Officer — Scrutiny Completed & Forwarded to EC (/technical/forwarded-ec)
import { useState, useEffect, useCallback } from 'react';
import { COLORS, S } from '@/utils/colors';
import { fetchTechnicalAll } from '@/services/technical.service';
import type { Application, AppFormData } from '@/services/application.service';

const TYPE_LABELS: Record<string, string> = {
  NSF: 'NSF', ClaimApproval: 'Claim Approval',
  AyurvedaAahara: 'Ayurveda Aahara', RPET: 'rPET', AnyOther: 'Any Other',
};

const EC_STAGES = ['WithEC', 'WithNodalOfficerB', 'WithCEO', 'WithChairperson', 'Approved', 'Closed', 'Rejected'];

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const card: React.CSSProperties = { background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '16px 18px', marginBottom: 16 };
const cardTitle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 };
const iStyle: React.CSSProperties = { padding: '6px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, background: '#fff', width: '100%', boxSizing: 'border-box' };
const lStyle: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: COLORS.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 };

function ecStatusBadge(stage: string) {
  const isApproved = ['Approved', 'Closed'].includes(stage);
  const isRejected = stage === 'Rejected';
  const isPending  = stage === 'WithEC';
  const bg = isApproved ? COLORS.successLight : isRejected ? COLORS.dangerLight : isPending ? COLORS.warningLight : COLORS.primaryLight;
  const fg = isApproved ? COLORS.success      : isRejected ? COLORS.danger      : isPending ? COLORS.warning      : COLORS.primary;
  const label = isApproved ? 'Approved' : isRejected ? 'Rejected' : isPending ? 'With EC' : 'In Progress';
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: bg, color: fg }}>{label}</span>;
}

function stageBadge(stage: string) {
  const isApproved = ['Approved', 'Closed'].includes(stage);
  const isRejected = stage === 'Rejected';
  const bg = isApproved ? COLORS.successLight : isRejected ? COLORS.dangerLight : COLORS.primaryLight;
  const fg = isApproved ? COLORS.success      : isRejected ? COLORS.danger      : COLORS.primary;
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: bg, color: fg }}>{stage}</span>;
}

function DetailView({ app, onClose }: { app: Application; onClose: () => void }) {
  const fd = app.formData as AppFormData | null;
  const step2 = fd?.step2;
  const step3 = fd?.step3;
  const DOCS = [
    { label: 'Certificate of Analysis',   val: step3?.certOfAnalysis },
    { label: 'Manufacturing Process',     val: step3?.manufacturingProcess },
    { label: 'Regulatory Status File',    val: step3?.regulatoryStatusFile },
    { label: 'Agreement Document',        val: step3?.agreementDoc },
    { label: 'Safety File 1',             val: step3?.safetyFile1 },
    { label: 'Safety File 2',             val: step3?.safetyFile2 },
    { label: 'Claim File 1',              val: step3?.claimFile1 },
    { label: 'Claim File 2',              val: step3?.claimFile2 },
    { label: 'Prototype Label',           val: step3?.prototypeLabel },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={onClose} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer', color: COLORS.textMuted }}>← Back to List</button>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.7 }}>READ-ONLY VIEW</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif" }}>{app.referenceNumber}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>{stageBadge(app.stage)}</div>
      </div>

      {/* Applicant Details */}
      <div style={card}>
        <div style={cardTitle}>Applicant Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[
            { label: 'Company / Organisation', value: app.companyName },
            { label: 'Applicant Name',          value: step2?.applicantName ?? '—' },
            { label: 'Authorised Person',        value: step2?.authorisedPerson ?? '—' },
            { label: 'Mobile No.',               value: step2?.mobileNo ?? '—' },
            { label: 'Email',                    value: step2?.email ?? '—' },
            { label: 'FSSAI Licence No.',        value: step2?.licenseNumber ?? '—' },
            { label: 'GST No.',                  value: step3?.gstNo ?? '—' },
            { label: 'Nature of Business',       value: step2?.natureOfBusiness ?? '—' },
            { label: 'Organisation Address',     value: step2?.orgAddress ?? '—' },
          ].map((f) => (
            <div key={f.label}>
              <div style={lStyle}>{f.label}</div>
              <div style={{ fontSize: 13, color: COLORS.text }}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Details */}
      <div style={card}>
        <div style={cardTitle}>Product Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[
            { label: 'Product Name',       value: app.productName ?? '—' },
            { label: 'Application Type',   value: TYPE_LABELS[app.applicationType] ?? app.applicationType },
            { label: 'Food Category',      value: app.foodCategory ?? '—' },
            { label: 'Product Category',   value: step2?.productCategory ?? '—' },
            { label: 'Justification',      value: step2?.justification ?? '—' },
            { label: 'Submitted On',       value: fmtDate(app.submittedAt) },
          ].map((f) => (
            <div key={f.label}>
              <div style={lStyle}>{f.label}</div>
              <div style={{ fontSize: 13, color: COLORS.text }}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Uploaded Documents */}
      <div style={card}>
        <div style={cardTitle}>Uploaded Documents</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {DOCS.filter((d) => d.val).map((d) => (
            <div key={d.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 12px' }}>
              <span style={{ fontSize: 12, color: COLORS.text }}>{d.label}</span>
              <span style={{ fontSize: 11, color: COLORS.primary, fontWeight: 600, cursor: 'pointer' }}>📎 View</span>
            </div>
          ))}
          {DOCS.every((d) => !d.val) && <div style={{ fontSize: 12, color: COLORS.textMuted, gridColumn: '1/-1' }}>No documents uploaded.</div>}
        </div>
      </div>

      {/* Workflow Timeline */}
      <div style={card}>
        <div style={cardTitle}>Workflow Timeline</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { stage: 'Application Submitted',       date: fmtDate(app.submittedAt),  done: !!app.submittedAt },
            { stage: 'Received by Nodal Officer A', date: fmtDate(app.submittedAt),  done: !!app.submittedAt },
            { stage: 'Forwarded to Technical Officer', date: '—',                    done: true               },
            { stage: 'Scrutiny Completed by TO',    date: '—',                       done: true               },
            { stage: 'Forwarded to EC',             date: '—',                       done: EC_STAGES.includes(app.stage) },
            { stage: 'EC Review',                   date: '—',                       done: ['WithNodalOfficerB','WithCEO','WithChairperson','Approved','Closed','Rejected'].includes(app.stage) },
            { stage: 'Final Decision',              date: '—',                       done: ['Approved','Closed','Rejected'].includes(app.stage) },
          ].map((t, i, arr) => (
            <div key={t.stage} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: i < arr.length - 1 ? 12 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: t.done ? COLORS.primary : COLORS.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700 }}>{t.done ? '✓' : ''}</div>
                {i < arr.length - 1 && <div style={{ width: 2, height: 20, background: t.done ? COLORS.primary : COLORS.border, marginTop: 2 }} />}
              </div>
              <div style={{ paddingTop: 2 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.done ? COLORS.text : COLORS.textMuted }}>{t.stage}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>{t.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EC Review Status */}
      <div style={card}>
        <div style={cardTitle}>EC Review Status</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>Current Stage:</span>
          {ecStatusBadge(app.stage)}
          {app.stage === 'WithEC' && <span style={{ fontSize: 12, color: COLORS.textMuted }}>— Pending EC review</span>}
          {['Approved','Closed'].includes(app.stage) && <span style={{ fontSize: 12, color: COLORS.success }}>— Application approved</span>}
          {app.stage === 'Rejected' && <span style={{ fontSize: 12, color: COLORS.danger }}>— Application rejected</span>}
        </div>
      </div>
    </div>
  );
}

export default function TechForwardedToEC() {
  const [allApps,   setAllApps]   = useState<Application[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [detail,    setDetail]    = useState<Application | null>(null);

  const [fRef,     setFRef]     = useState('');
  const [fCompany, setFCompany] = useState('');
  const [fFrom,    setFFrom]    = useState('');
  const [fTo,      setFTo]      = useState('');
  const [fType,    setFType]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setAllApps(await fetchTechnicalAll()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const forwardedApps = allApps.filter((a) => EC_STAGES.includes(a.stage));

  const visible = forwardedApps.filter((a) => {
    if (fRef     && !a.referenceNumber.toLowerCase().includes(fRef.toLowerCase())) return false;
    if (fCompany && !a.companyName.toLowerCase().includes(fCompany.toLowerCase())) return false;
    if (fType    && fType !== 'All' && a.applicationType !== fType) return false;
    if (fFrom) {
      const d = new Date(a.submittedAt ?? 0).getTime();
      if (d < new Date(fFrom).getTime()) return false;
    }
    if (fTo) {
      const d = new Date(a.submittedAt ?? 0).getTime();
      if (d > new Date(fTo).getTime()) return false;
    }
    return true;
  });

  if (detail) return <DetailView app={detail} onClose={() => setDetail(null)} />;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={S.roleLabel}>TECHNICAL OFFICER</div>
        <div style={S.pageTitle}>Scrutiny Completed — Forwarded to EC</div>
        <div style={S.pageDesc}>Read-only tracking of applications scrutinized and forwarded to the Expert Committee.</div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total Forwarded to EC', value: forwardedApps.length,                                                    color: COLORS.primary },
          { label: 'With EC (Pending)',      value: forwardedApps.filter((a) => a.stage === 'WithEC').length,                color: COLORS.warning },
          { label: 'Approved',               value: forwardedApps.filter((a) => ['Approved','Closed'].includes(a.stage)).length, color: COLORS.success },
          { label: 'Rejected',               value: forwardedApps.filter((a) => a.stage === 'Rejected').length,             color: COLORS.danger  },
        ].map((sc) => (
          <div key={sc.label} style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${sc.color}`, borderRadius: 8, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: sc.color, fontFamily: "'Libre Baskerville',Georgia,serif" }}>{sc.value}</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4, lineHeight: 1.4 }}>{sc.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160, flex: '1 1 160px' }}>
          <label style={lStyle}>Application Ref. No.</label>
          <input value={fRef} onChange={(e) => setFRef(e.target.value)} placeholder="EPAAS-…" style={iStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160, flex: '1 1 160px' }}>
          <label style={lStyle}>Company Name</label>
          <input value={fCompany} onChange={(e) => setFCompany(e.target.value)} placeholder="Search…" style={iStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120, flex: '1 1 120px' }}>
          <label style={lStyle}>From Date</label>
          <input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} style={iStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120, flex: '1 1 120px' }}>
          <label style={lStyle}>To Date</label>
          <input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} style={iStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130, flex: '1 1 130px' }}>
          <label style={lStyle}>Application Type</label>
          <select value={fType} onChange={(e) => setFType(e.target.value)} style={{ ...iStyle, cursor: 'pointer' }}>
            <option value="">All</option>
            <option value="NSF">New</option>
            <option value="ClaimApproval">Appeal</option>
            <option value="AyurvedaAahara">Review</option>
          </select>
        </div>
        <button onClick={() => { setFRef(''); setFCompany(''); setFFrom(''); setFTo(''); setFType(''); }}
          style={{ background: 'none', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer', alignSelf: 'flex-end' }}>Reset</button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Forwarded to EC
            {!loading && <span style={{ marginLeft: 8, background: COLORS.primaryLight, color: COLORS.primary, borderRadius: 10, fontSize: 10, padding: '1px 7px', fontWeight: 700 }}>{visible.length}</span>}
          </span>
          <button style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['Sr. No.', 'Application Ref. No.', 'Company Name', 'Product Name', 'Application Type', 'Forwarded To', 'Forwarded Date', 'Current Status', 'EC Status', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={10} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>}
              {!loading && visible.length === 0 && <tr><td colSpan={10} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No applications forwarded to EC.</td></tr>}
              {visible.map((a, i) => (
                <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                  <td style={S.td}>{i + 1}</td>
                  <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                  <td style={S.td}>{a.companyName}</td>
                  <td style={S.td}>{a.productName ?? '—'}</td>
                  <td style={S.td}>
                    <span style={{ background: COLORS.primaryLight, color: COLORS.primary, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                      {TYPE_LABELS[a.applicationType] ?? a.applicationType}
                    </span>
                  </td>
                  <td style={{ ...S.td, fontSize: 11, fontWeight: 600, color: COLORS.primary }}>Expert Committee</td>
                  <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                  <td style={S.td}>{stageBadge(a.stage)}</td>
                  <td style={S.td}>{ecStatusBadge(a.stage)}</td>
                  <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => setDetail(a)}
                        style={{ padding: '4px 10px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>View</button>
                      <button onClick={() => setDetail(a)}
                        style={{ padding: '4px 10px', background: 'transparent', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Track Status</button>
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
