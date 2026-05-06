import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import type React from 'react';
import { COLORS, S } from '@/utils/colors';
import StatusBadge from '@/components/ui/StatusBadge';
import { fetchApplication, type Application, type AppFormData } from '@/services/application.service';
import {
  fetchChairpersonReviews, chairpersonApprove, chairpersonReject,
  chairpersonDisposeReview, type Review,
} from '@/services/chairperson.service';

const card: React.CSSProperties = {
  background: COLORS.white, border: `1px solid ${COLORS.border}`,
  borderRadius: 8, padding: '16px 18px', marginBottom: 16,
};
const cardTitle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: COLORS.textMuted,
  textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14,
};
const textarea: React.CSSProperties = {
  width: '100%', resize: 'vertical' as const,
  fontFamily: "'Noto Sans','Segoe UI',sans-serif", fontSize: 12, outline: 'none',
  border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', boxSizing: 'border-box',
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function daysSince(iso: string | null | undefined) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

const API_BASE = (import.meta as { env: Record<string, string> }).env.VITE_API_URL ?? 'http://localhost:3000/api';

const DOC_FIELDS: { label: string; key: keyof AppFormData['step3'] }[] = [
  { label: 'Certificate of Analysis',        key: 'certOfAnalysis'       },
  { label: 'Manufacturing Process Flow',     key: 'manufacturingProcess' },
  { label: 'Regulatory Status Document',     key: 'regulatoryStatusFile' },
  { label: 'Agreement Document',             key: 'agreementDoc'         },
  { label: 'Safety Information — File 1',    key: 'safetyFile1'          },
  { label: 'Safety Information — File 2',    key: 'safetyFile2'          },
  { label: 'Claim Support — File 1',         key: 'claimFile1'           },
  { label: 'Claim Support — File 2',         key: 'claimFile2'           },
  { label: 'Prototype Label',                key: 'prototypeLabel'       },
  { label: 'Post-Marketing Declaration',     key: 'postMarketingDecl'    },
  { label: 'Confidentiality Declaration',    key: 'confidentialityDecl'  },
];

type Tab = 'dossier' | 'documents' | 'decision';
const TABS: { key: Tab; label: string }[] = [
  { key: 'dossier',   label: 'Application Dossier' },
  { key: 'documents', label: 'Document Viewer'      },
  { key: 'decision',  label: 'Final Decision'       },
];

export default function ChairpersonApplicationReview() {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();
  const [app,     setApp]     = useState<Application | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dossier');
  const [decision,  setDecision]  = useState('Grant Final Approval');
  const [remarks,   setRemarks]   = useState('');
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetchApplication(id),
      fetchChairpersonReviews(),
    ])
      .then(([application, allReviews]) => {
        setApp(application);
        setReviews(allReviews.filter((r) => r.applicationId === id));
      })
      .catch(() => toast.error('Could not load application'))
      .finally(() => setLoading(false));
  }, [id]);

  const fd    = app?.formData as AppFormData | null | undefined;
  const appId = id ?? '';

  // Find pending review
  const pendingReview = reviews.find((r) => r.status === 'ReviewPending') ?? reviews[0] ?? null;

  async function handleSubmit() {
    if (remarks.trim().length < 10) { toast.error('Decision remarks must be at least 10 characters'); return; }
    setSaving(true);
    try {
      if (decision === 'Grant Final Approval') {
        await chairpersonApprove(appId, remarks);
        toast.success('Application Approved — Congratulations! The applicant will be notified.');
      } else if (decision === 'Reject Application') {
        await chairpersonReject(appId, remarks);
        toast.success('Application rejected — grounds recorded');
      } else if (decision === 'Dispose Review (Uphold CEO Decision)') {
        if (!pendingReview) { toast.error('No pending review petition found for this application'); setSaving(false); return; }
        await chairpersonDisposeReview(pendingReview.id, remarks);
        toast.success('Review petition disposed — CEO decision upheld');
      }
      navigate('/chairperson/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Action failed — please try again');
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: '60px 0', textAlign: 'center', color: COLORS.textMuted }}>Loading application…</div>;
  if (!app)    return <div style={{ padding: '60px 0', textAlign: 'center', color: COLORS.textMuted }}>Application not found.</div>;

  const days = daysSince(app.submittedAt);

  return (
    <div>
      <button onClick={() => navigate('/chairperson/dashboard')}
        style={{ background: 'none', border: 'none', color: COLORS.primary, fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 10, fontWeight: 600 }}>
        ← Back to Chairperson Dashboard
      </button>

      <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 2 }}>CHAIRPERSON — FINAL REVIEW &amp; DECISION</div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", margin: 0 }}>{app.referenceNumber}</h2>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 3 }}>
          {app.companyName} · {app.applicationType} · Stage: <strong>{app.stage}</strong>
          {days !== null && <> · {days} days since submission</>}
          {reviews.length > 0 && <> · <span style={{ color: COLORS.warning, fontWeight: 700 }}>📋 {reviews.length} Review Petition(s) on file</span></>}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 14 }}>
        {TABS.map((t) => (
          <div key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              color: activeTab === t.key ? COLORS.primary : COLORS.textMuted,
              borderBottom: activeTab === t.key ? `2px solid ${COLORS.primary}` : '2px solid transparent',
              marginBottom: -1 }}>
            {t.label}
            {t.key === 'decision' && reviews.length > 0 && (
              <span style={{ marginLeft: 5, background: COLORS.warning, color: '#fff', borderRadius: 8, fontSize: 9, padding: '1px 5px', fontWeight: 700 }}>{reviews.length}</span>
            )}
          </div>
        ))}
      </div>

      {/* Dossier tab */}
      {activeTab === 'dossier' && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={cardTitle}>APPLICATION DOSSIER — READ ONLY</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, background: COLORS.bg, padding: '3px 8px', borderRadius: 4, border: `1px solid ${COLORS.border}` }}>READ-ONLY</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
            {([
              ['APPLICATION ID',    app.referenceNumber],
              ['APPLICATION TYPE',  app.applicationType],
              ['APPLICANT',         app.companyName],
              ['PRODUCT',           app.productName ?? (fd?.step2?.productName || '—')],
              ['FOOD CATEGORY',     app.foodCategory || '—'],
              ['SUBMITTED ON',      fmtDate(app.submittedAt)],
              ['DAYS IN REVIEW',    days !== null ? `${days} days` : '—'],
              ['CURRENT STAGE',     app.stage],
              ['APPLICANT NAME',    fd?.step2?.applicantName || '—'],
              ['ORGANISATION',      fd?.step2?.orgName || '—'],
              ['FSSAI LICENSE NO.', fd?.step2?.licenseNumber || '—'],
              ['MOBILE',            fd?.step2?.mobileNo || '—'],
              ['EMAIL',             fd?.step2?.email || '—'],
              ['NATURE OF BUSINESS',fd?.step2?.natureOfBusiness || '—'],
              ['GST NO.',           fd?.step3?.gstNo || '—'],
              ['PAYMENT REF.',      fd?.step5?.paymentReference || '—'],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 12px' }}>
                <div style={{ fontSize: 9, color: COLORS.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{v}</div>
              </div>
            ))}
          </div>
          {fd?.step2?.justification && (
            <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: 9, color: COLORS.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Justification / Purpose</div>
              <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.6 }}>{fd.step2.justification}</div>
            </div>
          )}

          {/* Review Details inline */}
          {reviews.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.warning, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>📋 Review Petition Details ({reviews.length})</div>
              {reviews.map((r, i) => (
                <div key={r.id} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '12px 14px', marginBottom: 10, background: COLORS.bg }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.text }}>Review Petition #{i + 1}</span>
                    <StatusBadge status={r.status} label={r.status.replace('Review', '')} />
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.text, marginBottom: 6, lineHeight: 1.5 }}><strong>Review Grounds:</strong> {r.grounds}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>Filed on: {fmtDate(r.filedAt)}</div>
                  {r.appeal && (
                    <div style={{ background: COLORS.warningLight, border: `1px solid ${COLORS.warning}33`, borderRadius: 4, padding: '8px 10px', marginTop: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.warning, marginBottom: 4 }}>Original Appeal Grounds</div>
                      <div style={{ fontSize: 12, color: COLORS.text }}>{r.appeal.grounds}</div>
                      <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>Appeal Status: {r.appeal.status}</div>
                    </div>
                  )}
                  {r.decisionRemarks && (
                    <div style={{ marginTop: 8, fontSize: 12, color: COLORS.text }}><strong>Decision Remarks:</strong> {r.decisionRemarks}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Documents tab */}
      {activeTab === 'documents' && (
        <div style={card}>
          <div style={cardTitle}>DOSSIER — DOCUMENT VIEWER</div>
          {!fd ? (
            <div style={{ color: COLORS.textMuted, fontSize: 12, fontStyle: 'italic' }}>No documents found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['#', 'Document Name', 'Type', 'Status', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {DOC_FIELDS.map((d, i) => {
                  const storedName = fd.step3?.[d.key] as string | undefined;
                  return (
                    <tr key={d.key} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                      <td style={S.td}>{i + 1}</td>
                      <td style={{ ...S.td, fontWeight: 600 }}>{d.label}</td>
                      <td style={S.td}>PDF</td>
                      <td style={S.td}>
                        {storedName
                          ? <span style={{ color: COLORS.success, fontWeight: 700, fontSize: 11 }}>✓ Uploaded</span>
                          : <span style={{ color: COLORS.danger, fontSize: 11 }}>✗ Missing</span>}
                      </td>
                      <td style={S.td}>
                        {storedName
                          ? <a href={`${API_BASE}/uploads/${storedName}`} target="_blank" rel="noreferrer"
                              style={{ background: 'transparent', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 5, padding: '3px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>📥 View</a>
                          : <span style={{ fontSize: 11, color: COLORS.textMuted }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Decision tab */}
      {activeTab === 'decision' && (
        <div style={card}>
          <div style={cardTitle}>CHAIRPERSON FINAL DECISION</div>

          {/* Summary strip */}
          <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div><span style={{ fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Ref No.</span><div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary }}>{app.referenceNumber}</div></div>
            <div><span style={{ fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Company</span><div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{app.companyName}</div></div>
            <div><span style={{ fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Stage</span><div style={{ marginTop: 2 }}><StatusBadge status={app.stage} /></div></div>
            <div><span style={{ fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Reviews</span><div style={{ fontSize: 12, fontWeight: 600, color: reviews.length > 0 ? COLORS.warning : COLORS.textMuted }}>{reviews.length} on file</div></div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Final Decision</label>
            <select value={decision} onChange={(e) => setDecision(e.target.value)}
              style={{ padding: '7px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, background: COLORS.bg, cursor: 'pointer', width: '100%' }}>
              <option>Grant Final Approval</option>
              <option>Reject Application</option>
              {reviews.length > 0 && <option>Dispose Review (Uphold CEO Decision)</option>}
            </select>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Decision Remarks *</label>
              <span style={{ fontSize: 10, color: remarks.trim().length < 10 ? COLORS.danger : COLORS.textMuted }}>{remarks.trim().length} chars (min 10)</span>
            </div>
            <textarea rows={5} value={remarks} onChange={(e) => setRemarks(e.target.value)}
              placeholder="State the Chairperson's final decision reasoning and grounds…"
              style={{ ...textarea, minHeight: 120, borderColor: remarks.length > 0 && remarks.trim().length < 10 ? COLORS.danger : COLORS.border }} />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {decision === 'Grant Final Approval' && (
              <button onClick={handleSubmit} disabled={saving}
                style={{ background: COLORS.success, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Processing…' : '✅ Grant Final Approval'}
              </button>
            )}
            {decision === 'Reject Application' && (
              <button onClick={handleSubmit} disabled={saving}
                style={{ background: 'transparent', color: COLORS.danger, border: `1.5px solid ${COLORS.danger}`, borderRadius: 6, padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Processing…' : '✗ Reject Application'}
              </button>
            )}
            {decision === 'Dispose Review (Uphold CEO Decision)' && (
              <button onClick={handleSubmit} disabled={saving}
                style={{ background: COLORS.info, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Processing…' : '⚖️ Dispose Review'}
              </button>
            )}
            <button onClick={() => navigate('/chairperson/dashboard')}
              style={{ background: 'transparent', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, padding: '8px 16px', fontSize: 12, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>

          <div style={{ marginTop: 16, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 14px', fontSize: 11, color: COLORS.textMuted, lineHeight: 1.6 }}>
            <strong style={{ color: COLORS.text }}>Stage transitions:</strong>
            <ul style={{ margin: '6px 0 0 0', paddingLeft: 16 }}>
              <li><strong>Grant Final Approval</strong> → application status set to Approved; applicant notified</li>
              <li><strong>Reject Application</strong> → application closed with Chairperson grounds recorded</li>
              <li><strong>Dispose Review</strong> → review petition disposed; CEO's original decision upheld</li>
            </ul>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.border}`, justifyContent: 'flex-end' }}>
        <button onClick={() => navigate('/chairperson/dashboard')}
          style={{ background: 'transparent', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          ← Back to Chairperson Dashboard
        </button>
      </div>
    </div>
  );
}
