import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import type React from 'react';
import { COLORS, S } from '@/utils/colors';
import { fetchApplication, fetchQueries, type Application, type AppFormData, type Query } from '@/services/application.service';
import { technicalForwardToEC, technicalReject, technicalSendQuery } from '@/services/technical.service';

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

function btn(variant: 'solid' | 'outline' | 'danger' = 'solid', small = false): React.CSSProperties {
  return {
    padding: small ? '4px 10px' : '7px 14px', borderRadius: 5,
    fontSize: small ? 11 : 12, fontWeight: 600, cursor: 'pointer',
    border: variant === 'solid' ? 'none' : `1.5px solid ${variant === 'danger' ? COLORS.danger : COLORS.primary}`,
    background: variant === 'solid' ? COLORS.primary : variant === 'danger' ? 'transparent' : 'transparent',
    color: variant === 'solid' ? '#fff' : variant === 'danger' ? COLORS.danger : COLORS.primary,
  };
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysSince(iso: string | null | undefined) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

type Tab = 'profile' | 'documents' | 'compliance' | 'query' | 'recommendation';
const TABS: Tab[] = ['profile', 'documents', 'compliance', 'query', 'recommendation'];
const TAB_LABELS: Record<Tab, string> = {
  profile: 'Applicant Profile', documents: 'Uploaded Documents',
  compliance: 'Compliance Checklist', query: 'Draft Query', recommendation: 'Recommendation',
};

const COMPLIANCE_ITEMS = [
  { label: 'Application Form Complete',             fn: (fd: AppFormData) => !!(fd.step2?.applicantName && fd.step2.orgName && fd.step2.productName) },
  { label: 'GST Number Provided',                   fn: (fd: AppFormData) => !!(fd.step3?.gstNo) },
  { label: 'FSSAI License Valid',                   fn: (fd: AppFormData) => !!(fd.step2?.licenseNumber) },
  { label: 'Product Formulation Submitted',         fn: (fd: AppFormData) => !!(fd.step2?.functionalBenefits || fd.step4?.composition) },
  { label: 'Certificate of Analysis Attached',      fn: (fd: AppFormData) => !!(fd.step3?.certOfAnalysis) },
  { label: 'Safety Information Attached',           fn: (fd: AppFormData) => !!(fd.step3?.safetyFile1) },
  { label: 'Manufacturing Process Flow Attached',   fn: (fd: AppFormData) => !!(fd.step3?.manufacturingProcess) },
  { label: 'Prototype Label Uploaded',              fn: (fd: AppFormData) => !!(fd.step3?.prototypeLabel) },
  { label: 'Regulatory Status Document Provided',   fn: (fd: AppFormData) => !!(fd.step3?.regulatoryStatusFile) },
  { label: 'Payment Reference Provided',            fn: (fd: AppFormData) => !!(fd.step5?.paymentReference) },
];

const DOC_FIELDS: { label: string; key: keyof AppFormData['step3'] }[] = [
  { label: 'Certificate of Analysis',        key: 'certOfAnalysis'      },
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

const API_BASE = (import.meta as { env: Record<string, string> }).env.VITE_API_URL ?? 'http://localhost:3000/api';

export default function TechAssessment() {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();

  const [app,     setApp]     = useState<Application | null>(null);
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [recType,   setRecType]   = useState('Recommend Approval');
  const [remarks,   setRemarks]   = useState('');
  const [querySubject, setQuerySubject] = useState('');
  const [queryBody,    setQueryBody]    = useState('');
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchApplication(id)
      .then(setApp)
      .catch(() => toast.error('Could not load application'))
      .finally(() => setLoading(false));
    fetchQueries(id).then(setQueries).catch(() => {});
  }, [id]);

  const fd  = app?.formData as AppFormData | null | undefined;
  const appId = id ?? '';

  async function handleForwardEC() {
    if (!appId) return;
    setSaving(true);
    try {
      await technicalForwardToEC(appId);
      toast.success('Application forwarded to Expert Committee');
      navigate('/technical/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Could not forward to EC');
      setSaving(false);
    }
  }

  async function handleReject() {
    if (!appId) return;
    if (!remarks.trim()) { toast.error('Please enter grounds for rejection'); return; }
    setSaving(true);
    try {
      await technicalReject(appId, remarks);
      toast.success('Application rejected');
      navigate('/technical/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Could not reject application');
      setSaving(false);
    }
  }

  async function handleSendQuery() {
    if (!appId) return;
    const text = `${querySubject ? querySubject + '\n\n' : ''}${queryBody}`.trim();
    if (text.length < 10) { toast.error('Query must be at least 10 characters'); return; }
    setSaving(true);
    try {
      await technicalSendQuery(appId, text);
      toast.success('Query sent to Nodal Officer for forwarding to applicant');
      setQuerySubject('');
      setQueryBody('');
      const updated = await fetchQueries(appId);
      setQueries(updated);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Could not send query');
    } finally { setSaving(false); }
  }

  if (loading) return <div style={{ padding: '60px 0', textAlign: 'center', color: COLORS.textMuted }}>Loading application…</div>;
  if (!app)    return <div style={{ padding: '60px 0', textAlign: 'center', color: COLORS.textMuted }}>Application not found.</div>;

  const days = daysSince(app.submittedAt);

  return (
    <div>
      {/* Header */}
      <button onClick={() => navigate('/technical/dashboard')}
        style={{ background: 'none', border: 'none', color: COLORS.primary, fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 10, fontWeight: 600 }}>
        ← Back to Dashboard
      </button>

      <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 2 }}>TECHNICAL OFFICER — ASSESSMENT</div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", margin: 0 }}>
          {app.referenceNumber}
        </h2>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 3 }}>
          {app.companyName} · {app.applicationType} · Stage: <strong>{app.stage}</strong>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 14 }}>
        {TABS.map((t) => (
          <div key={t} onClick={() => setActiveTab(t)}
            style={{ padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              color: activeTab === t ? COLORS.primary : COLORS.textMuted,
              borderBottom: activeTab === t ? `2px solid ${COLORS.primary}` : '2px solid transparent',
              marginBottom: -1, position: 'relative' }}>
            {TAB_LABELS[t]}
            {t === 'query' && queries.length > 0 && (
              <span style={{ marginLeft: 5, background: COLORS.primary, color: '#fff', borderRadius: 8, fontSize: 9, padding: '1px 5px', fontWeight: 700 }}>{queries.length}</span>
            )}
          </div>
        ))}
      </div>

      {/* ── Profile tab ──────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div style={card}>
          <div style={cardTitle}>APPLICANT &amp; APPLICATION DETAILS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
            {([
              ['Reference No.',      app.referenceNumber],
              ['Application Type',   app.applicationType],
              ['Company Name',       app.companyName],
              ['Product Name',       app.productName ?? (fd?.step2?.productName || '—')],
              ['Food Category',      app.foodCategory || '—'],
              ['Submitted On',       fmtDate(app.submittedAt)],
              ['Days in Review',     days !== null ? `${days} days` : '—'],
              ['Applicant Name',     fd?.step2?.applicantName || '—'],
              ['Organisation',       fd?.step2?.orgName || '—'],
              ['FSSAI License No.',  fd?.step2?.licenseNumber || '—'],
              ['Mobile',             fd?.step2?.mobileNo || '—'],
              ['Email',              fd?.step2?.email || '—'],
              ['Nature of Business', fd?.step2?.natureOfBusiness || '—'],
              ['Product Category',   fd?.step2?.productCategory || '—'],
              ['Source',             fd?.step2?.source || '—'],
              ['GST No.',            fd?.step3?.gstNo || '—'],
              ['Payment Ref.',       fd?.step5?.paymentReference || '—'],
              ['Current Stage',      app.stage],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 12px' }}>
                <div style={{ fontSize: 9, color: COLORS.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{v}</div>
              </div>
            ))}
          </div>
          {fd?.step2?.justification && (
            <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: 9, color: COLORS.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Justification</div>
              <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.6 }}>{fd.step2.justification}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Documents tab ────────────────────────────────────────── */}
      {activeTab === 'documents' && (
        <div style={card}>
          <div style={cardTitle}>UPLOADED DOCUMENTS</div>
          {!fd ? (
            <div style={{ color: COLORS.textMuted, fontSize: 12, fontStyle: 'italic' }}>No documents found — form data not yet submitted.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['#', 'Document Name', 'Status', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {DOC_FIELDS.map((d, i) => {
                  const storedName = fd.step3?.[d.key] as string | undefined;
                  return (
                    <tr key={d.key} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                      <td style={S.td}>{i + 1}</td>
                      <td style={{ ...S.td, fontWeight: 600 }}>{d.label}</td>
                      <td style={S.td}>
                        {storedName
                          ? <span style={{ color: COLORS.success, fontWeight: 700 }}>✓ Uploaded</span>
                          : <span style={{ color: COLORS.danger }}>✗ Missing</span>}
                      </td>
                      <td style={S.td}>
                        {storedName
                          ? <a href={`${API_BASE}/uploads/${storedName}`} target="_blank" rel="noreferrer"
                              style={{ ...btn('outline', true), textDecoration: 'none', display: 'inline-block' }}>📥 View</a>
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

      {/* ── Compliance tab ───────────────────────────────────────── */}
      {activeTab === 'compliance' && (
        <div style={card}>
          <div style={cardTitle}>COMPLIANCE CHECKLIST</div>
          {!fd ? (
            <div style={{ color: COLORS.textMuted, fontSize: 12, fontStyle: 'italic' }}>No form data available to evaluate compliance.</div>
          ) : (
            <>
              {(() => {
                const passCount = COMPLIANCE_ITEMS.filter((c) => c.fn(fd)).length;
                return (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6 }}>{passCount}/{COMPLIANCE_ITEMS.length} items compliant</div>
                    <div style={{ height: 6, background: COLORS.border, borderRadius: 3 }}>
                      <div style={{ height: '100%', borderRadius: 3, background: passCount === COMPLIANCE_ITEMS.length ? COLORS.success : COLORS.primary, width: `${(passCount / COMPLIANCE_ITEMS.length) * 100}%`, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })()}
              {COMPLIANCE_ITEMS.map((c, i) => {
                const pass = c.fn(fd);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: pass ? COLORS.successLight : COLORS.dangerLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
                      {pass ? '✓' : '✗'}
                    </div>
                    <span style={{ fontSize: 13, color: pass ? COLORS.text : COLORS.danger }}>{c.label}</span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── Query tab ────────────────────────────────────────────── */}
      {activeTab === 'query' && (
        <div>
          {/* Existing query history */}
          {queries.length > 0 && (
            <div style={card}>
              <div style={cardTitle}>QUERY &amp; RESPONSE HISTORY ({queries.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {queries.map((q, i) => {
                  const isTechQuery = q.originStage === 'WithTechnicalOfficer';
                  return (
                    <div key={q.id} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ background: COLORS.primaryLight, padding: '10px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.primary }}>
                            Query #{i + 1} — raised by {q.askedBy?.username ?? 'Officer'}
                          </span>
                          <span style={{ fontSize: 10, color: COLORS.textMuted }}>{fmtDate(q.createdAt)}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: COLORS.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{q.text}</p>
                      </div>

                      {/* Routing status for tech-initiated queries */}
                      {isTechQuery && !q.nodalForwardedAt && (
                        <div style={{ background: '#FFF7ED', padding: '8px 14px', borderTop: `1px solid ${COLORS.border}` }}>
                          <span style={{ fontSize: 11, color: '#B45309', fontWeight: 600 }}>⏳ Pending — Nodal Officer to forward this query to applicant</span>
                        </div>
                      )}
                      {isTechQuery && q.nodalForwardedAt && !q.response && (
                        <div style={{ background: '#FFFBEB', padding: '8px 14px', borderTop: `1px solid ${COLORS.border}` }}>
                          <span style={{ fontSize: 11, color: '#B45309', fontWeight: 600 }}>⏳ Forwarded to applicant on {fmtDate(q.nodalForwardedAt)} — awaiting response…</span>
                        </div>
                      )}
                      {isTechQuery && q.response && !q.nodalFwdResponseAt && (
                        <div style={{ background: '#FEF3C7', padding: '8px 14px', borderTop: `1px solid ${COLORS.border}` }}>
                          <span style={{ fontSize: 11, color: '#92400E', fontWeight: 600 }}>⏳ Applicant responded — pending Nodal Officer to forward response to you</span>
                        </div>
                      )}
                      {isTechQuery && q.response && q.nodalFwdResponseAt && (
                        <div style={{ background: '#F0FDF4', padding: '10px 14px', borderTop: `1px solid ${COLORS.border}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#065F46' }}>✅ Applicant Response (forwarded by Nodal Officer)</span>
                            <span style={{ fontSize: 10, color: COLORS.textMuted }}>{fmtDate(q.respondedAt)}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: '#065F46', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{q.response}</p>
                        </div>
                      )}

                      {/* Non-tech queries (raised by Nodal or EC) */}
                      {!isTechQuery && (
                        q.response ? (
                          <div style={{ background: '#F0FDF4', padding: '10px 14px', borderTop: `1px solid ${COLORS.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#065F46' }}>✅ Applicant Response</span>
                              <span style={{ fontSize: 10, color: COLORS.textMuted }}>{fmtDate(q.respondedAt)}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 12, color: '#065F46', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{q.response}</p>
                          </div>
                        ) : (
                          <div style={{ background: '#FFFBEB', padding: '8px 14px', borderTop: `1px solid ${COLORS.border}` }}>
                            <span style={{ fontSize: 11, color: '#B45309', fontWeight: 600 }}>⏳ Awaiting applicant response…</span>
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New query form */}
          <div style={card}>
            <div style={cardTitle}>DRAFT NEW QUERY TO APPLICANT</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Query Subject</label>
              <input value={querySubject} onChange={(e) => setQuerySubject(e.target.value)}
                placeholder="e.g. Request for stability data and formulation certificate"
                style={{ width: '100%', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 12, boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Query Body *</label>
                <span style={{ fontSize: 10, color: queryBody.trim().length < 10 ? COLORS.danger : COLORS.textMuted }}>{queryBody.trim().length} / min 10 chars</span>
              </div>
              <textarea rows={5} value={queryBody} onChange={(e) => setQueryBody(e.target.value)}
                placeholder="Describe the information required from the applicant…"
                style={{ ...textarea, minHeight: 120, borderColor: queryBody.trim().length > 0 && queryBody.trim().length < 10 ? COLORS.danger : COLORS.border }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={btn()} disabled={saving} onClick={handleSendQuery}>
                {saving ? 'Sending…' : 'Send Query to Nodal Officer'}
              </button>
              <button style={btn('outline')} onClick={() => { setQuerySubject(''); setQueryBody(''); }}>Clear</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Recommendation tab ───────────────────────────────────── */}
      {activeTab === 'recommendation' && (
        <div style={card}>
          <div style={cardTitle}>RECOMMENDATION &amp; DECISION</div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Recommendation Type</label>
            <select style={S.select} value={recType} onChange={(e) => setRecType(e.target.value)}>
              <option>Recommend Approval</option>
              <option>Recommend Rejection</option>
              <option>Recommend EC Referral</option>
              <option>Prepare Clarification Letter</option>
              <option>Prepare Approval/Rejection Letter</option>
            </select>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Remarks / Grounds *</label>
            <textarea rows={5} value={remarks} onChange={(e) => setRemarks(e.target.value)}
              placeholder="State grounds for recommendation…"
              style={{ ...textarea, minHeight: 120 }} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button style={btn()} disabled={saving} onClick={handleForwardEC}>
              {saving ? 'Processing…' : '✅ Forward to Expert Committee'}
            </button>
            <button style={btn('danger')} disabled={saving} onClick={handleReject}>
              {saving ? 'Processing…' : '✗ Reject Application'}
            </button>
          </div>

          <div style={{ marginTop: 16, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 14px', fontSize: 11, color: COLORS.textMuted, lineHeight: 1.6 }}>
            <strong style={{ color: COLORS.text }}>Note:</strong> "Forward to Expert Committee" advances the application to the EC stage. "Reject Application" closes it with the remarks above as grounds. Make sure you have filled the Remarks field before taking action.
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.border}`, justifyContent: 'flex-end' }}>
        <button style={btn('outline')} onClick={() => navigate('/technical/dashboard')}>← Back to Dashboard</button>
      </div>
    </div>
  );
}
