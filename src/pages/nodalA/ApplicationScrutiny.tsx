import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { COLORS, S } from '@/utils/colors';
import StatusBadge from '@/components/ui/StatusBadge';
import { fetchApplication, fetchQueries, nodalForwardQueryToApplicant, nodalForwardResponseToTech, type Application, type AppFormData, type Query } from '@/services/application.service';
import { getDocRows, getProfileDisplay } from '@/utils/docResolver';
import { nodalAForward, nodalAReturnWithQuery, nodalASendDecision } from '@/services/officer.service';

const API_BASE = (import.meta as { env: Record<string, string> }).env.VITE_API_URL ?? 'http://localhost:3000/api';

// ── Checklist definition ──────────────────────────────────────────────────────
const CHECKLIST = [
  'Application form is complete with all mandatory fields filled',
  'FSSAI license number is valid and matches the applicant details',
  'All required documents are attached (Certificate of Analysis, Manufacturing Process, Safety Information)',
  'Fee payment reference number is provided',
  'Product category and application type are correctly identified',
  'Prototype label is submitted as per FSS Regulations',
];

const TYPE_LABELS: Record<string, string> = {
  NSF: 'Novel & Special Foods (NSF)', ClaimApproval: 'Claim Approval',
  AyurvedaAahara: 'Ayurveda Aahara', RPET: 'rPET', AnyOther: 'Any Other',
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: value ? COLORS.text : COLORS.textMuted, fontStyle: value ? 'normal' : 'italic' }}>{value || '—'}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ApplicationScrutiny() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();

  const [app, setApp]           = useState<Application | null>(null);
  const [loading, setLoading]   = useState(true);
  const [checked, setChecked]   = useState<boolean[]>(Array(CHECKLIST.length).fill(false));
  const [decision, setDecision] = useState<'forward' | 'return' | 'send-decision' | null>(null);
  const [queryText, setQueryText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [queries, setQueries]   = useState<Query[]>([]);

  useEffect(() => {
    if (!id) return;
    fetchApplication(id)
      .then((a) => {
        setApp(a);
        // Auto-check based on actual form data — handles NSF/CA/AA shapes
        const _raw = a.formData as Record<string, unknown> | null;
        const _s   = (k: string) => typeof _raw?.[k] === 'string' && (_raw[k] as string).length > 0;
        const type = a.applicationType;
        const _isAA = type === 'AyurvedaAahara' || type === 'AA';
        const _isCA = type === 'ClaimApproval'  || type === 'CA';
        const fd_   = a.formData as AppFormData | null;
        const s2   = (!_isAA && !_isCA) ? fd_?.step2 : null;
        const s3   = (!_isAA && !_isCA) ? fd_?.step3 : null;
        const s5   = (!_isAA && !_isCA) ? fd_?.step5 : null;
        setChecked([
          // 1. Mandatory fields filled
          _isAA ? !!(_s('applicantName') && _s('nameOfOrganization') && _s('productName'))
                : _isCA ? !!(_s('applicantName') && _s('licenseNumber') && _s('productName'))
                        : !!(s2?.applicantName && s2.orgName && s2.mobileNo && s2.email && s2.productName && s2.productCategory),
          // 2. FSSAI license number present
          _isCA ? !!_s('licenseNumber') : _isAA ? !!_s('licenseNumber') : !!(s2?.licenseNumber),
          // 3. Required documents attached
          _isAA ? !!(_s('certificateOfAnalysis') && _s('manufacturingProcessFile'))
                : _isCA ? !!(_s('licenseCopy') && _s('scientificSubstantiationFile'))
                        : !!(s3?.certOfAnalysis && s3.manufacturingProcess && s3.safetyFile1),
          // 4. Payment reference provided
          (_isAA || _isCA) ? !!_s('paymentReference') : !!(s5?.paymentReference),
          // 5. Product category and application type identified
          (_isAA || _isCA) ? !!(_s('productCategory') && a.applicationType) : !!(s2?.productCategory && a.applicationType),
          // 6. Prototype / product label submitted
          _isAA ? !!_s('productLabel') : _isCA ? !!_s('licenseCopy') : !!(s3?.prototypeLabel),
        ]);
      })
      .catch(() => toast.error('Could not load application'))
      .finally(() => setLoading(false));
    fetchQueries(id).then(setQueries).catch(() => {});
  }, [id]);

  const allChecked   = checked.every(Boolean);
  const checkedCount = checked.filter(Boolean).length;

  async function handleForward() {
    if (!app) return;
    if (!allChecked) { toast.error('Please complete all checklist items before forwarding'); return; }
    setSubmitting(true);
    try {
      await nodalAForward(app.id);
      toast.success('Application forwarded to Technical Officer');
      navigate('/nodal/dashboard');
    } catch {
      toast.error('Could not forward application');
    } finally { setSubmitting(false); }
  }

  async function handleSendDecision() {
    if (!app) return;
    setSubmitting(true);
    try {
      await nodalASendDecision(app.id);
      toast.success('Decision communicated to applicant — application approved');
      navigate('/nodal/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Could not send decision');
    } finally { setSubmitting(false); }
  }

  async function handleReturn() {
    if (!app) return;
    if (!queryText.trim()) { toast.error('Please enter the deficiency / query details'); return; }
    if (queryText.trim().length < 10) { toast.error('Deficiency details must be at least 10 characters'); return; }
    setSubmitting(true);
    try {
      await nodalAReturnWithQuery(app.id, queryText);
      toast.success('Application returned to applicant with deficiency notice');
      navigate('/nodal/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Could not return application');
    } finally { setSubmitting(false); }
  }

  if (loading) return <div style={{ padding: '60px 0', textAlign: 'center', color: COLORS.textMuted }}>Loading application…</div>;
  if (!app)    return <div style={{ padding: '60px 0', textAlign: 'center', color: COLORS.textMuted }}>Application not found.</div>;

  const fd      = app.formData as AppFormData | null;
  const display = getProfileDisplay(app);
  const docRows = getDocRows(app);
  const toDecision = app.toDecision as Record<string, unknown> | null;
  const fromEC     = !!toDecision?.fromEC;
  const ecDecision = toDecision?.ecDecision as string | undefined;
  const form2      = toDecision?.form2Data as Record<string, unknown> | undefined;
  const f2Decision = toDecision?.decision as string | undefined;

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate('/nodal/dashboard')}
        style={{ background: 'none', border: 'none', color: COLORS.primary, fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 10, fontWeight: 600 }}
      >
        ← Back to Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={S.roleLabel}>NODAL OFFICER A — SCRUTINY</div>
          <div style={{ ...S.pageTitle, display: 'flex', alignItems: 'center', gap: 10 }}>
            {app.referenceNumber} <StatusBadge status={app.stage} />
          </div>
          <div style={S.pageDesc}>{TYPE_LABELS[app.applicationType] ?? app.applicationType} · {app.companyName}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'start' }}>
        {/* ── Left: Application details ──────────────────────────── */}
        <div>
          {/* Key info chips */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            {[
              { label: 'Reference',   value: app.referenceNumber },
              { label: 'Type',        value: TYPE_LABELS[app.applicationType] ?? app.applicationType },
              { label: 'Submitted',   value: fmtDate(app.submittedAt) },
              { label: 'Company',     value: app.companyName },
            ].map((c) => (
              <div key={c.label} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px 14px' }}>
                <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{c.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Applicant & General Info */}
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, borderBottom: `2px solid ${COLORS.primaryLight}`, paddingBottom: 6, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Applicant &amp; Product Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
              <Field label="Applicant Name"       value={display?.applicantName} />
              <Field label="Organisation"         value={display?.orgName} />
              <Field label="FSSAI License No."    value={display?.licenseNumber} />
              <Field label="Mobile"               value={display?.mobileNo} />
              <Field label="Email"                value={display?.email} />
              <Field label="Nature of Business"   value={display?.natureOfBusiness} />
              <Field label="Product Name"         value={display?.productName} />
              <Field label="Product Category"     value={display?.productCategory} />
              {display?.subCategory  && <Field label="Sub-Category"  value={display.subCategory} />}
              {display?.source       && <Field label="Source"        value={display.source} />}
              {display?.gstNo        && <Field label="GST No."       value={display.gstNo} />}
              <Field label="Payment Reference"    value={display?.paymentReference} />
            </div>
            <Field label="Manufacturing Address"  value={display?.mfgAddress} />
            <Field label="Justification"          value={display?.justification} />
          </div>

          {/* Query & Response History */}
          {queries.length > 0 && (
            <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, borderBottom: `2px solid ${COLORS.primaryLight}`, paddingBottom: 6, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Query &amp; Response History
                <span style={{ marginLeft: 8, background: COLORS.primaryLight, color: COLORS.primary, borderRadius: 10, fontSize: 10, padding: '1px 7px', fontWeight: 700 }}>{queries.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {queries.map((q, i) => {
                  const isTechQuery = q.originStage === 'WithTechnicalOfficer';
                  const needsForwardToApplicant = isTechQuery && !q.nodalForwardedAt;
                  const needsForwardToTech = isTechQuery && !!q.response && !q.nodalFwdResponseAt;
                  return (
                    <div key={q.id} style={{ border: `1px solid ${needsForwardToApplicant || needsForwardToTech ? COLORS.accent : COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
                      {/* Query header */}
                      <div style={{ background: isTechQuery ? '#FFF7ED' : COLORS.primaryLight, padding: '10px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 24, height: 24, borderRadius: '50%', background: isTechQuery ? COLORS.accent : COLORS.primary, color: '#fff', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              {i + 1}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: isTechQuery ? COLORS.accent : COLORS.primary }}>
                              {isTechQuery ? '🔀 Tech Officer Query' : 'Query'} — raised by {q.askedBy?.username ?? 'Officer'}
                            </span>
                          </div>
                          <span style={{ fontSize: 10, color: COLORS.textMuted }}>
                            {new Date(q.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: COLORS.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{q.text}</p>
                      </div>

                      {/* ACTION: Forward tech query to applicant */}
                      {needsForwardToApplicant && !q.response && (
                        <div style={{ background: '#FFF7ED', padding: '10px 14px', borderTop: `1px solid #FED7AA`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#92400E', fontWeight: 600 }}>⚠ Action Required: Forward this query to the applicant</span>
                          <button
                            disabled={submitting}
                            onClick={async () => {
                              setSubmitting(true);
                              try {
                                await nodalForwardQueryToApplicant(app!.id, q.id);
                                toast.success('Query forwarded to applicant');
                                const updated = await fetchQueries(app!.id);
                                setQueries(updated);
                              } catch { toast.error('Could not forward query'); }
                              finally { setSubmitting(false); }
                            }}
                            style={{ padding: '5px 14px', background: COLORS.accent, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            Forward to Applicant →
                          </button>
                        </div>
                      )}

                      {/* Forwarded, awaiting applicant */}
                      {isTechQuery && q.nodalForwardedAt && !q.response && (
                        <div style={{ background: '#FFFBEB', padding: '8px 14px', borderTop: `1px solid ${COLORS.border}` }}>
                          <span style={{ fontSize: 11, color: '#B45309', fontWeight: 600 }}>⏳ Forwarded to applicant on {fmtDate(q.nodalForwardedAt)} — awaiting response…</span>
                        </div>
                      )}

                      {/* Applicant responded — show response */}
                      {q.response && (
                        <div style={{ background: '#F0FDF4', padding: '10px 14px', borderTop: `1px solid ${COLORS.border}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#065F46' }}>✅ Response from Applicant</span>
                            <span style={{ fontSize: 10, color: COLORS.textMuted }}>
                              {q.respondedAt ? new Date(q.respondedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: '#065F46', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{q.response}</p>
                        </div>
                      )}

                      {/* ACTION: Forward applicant response to Tech Officer */}
                      {needsForwardToTech && (
                        <div style={{ background: '#FFF7ED', padding: '10px 14px', borderTop: `1px solid #FED7AA`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#92400E', fontWeight: 600 }}>⚠ Action Required: Forward applicant's response to Technical Officer</span>
                          <button
                            disabled={submitting}
                            onClick={async () => {
                              setSubmitting(true);
                              try {
                                await nodalForwardResponseToTech(app!.id, q.id);
                                toast.success('Response forwarded to Technical Officer');
                                const updated = await fetchQueries(app!.id);
                                setQueries(updated);
                                // refresh app to get updated stage
                                const fresh = await fetchApplication(app!.id);
                                setApp(fresh);
                              } catch { toast.error('Could not forward response'); }
                              finally { setSubmitting(false); }
                            }}
                            style={{ padding: '5px 14px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            Forward to Tech Officer →
                          </button>
                        </div>
                      )}

                      {/* Tech query fully resolved */}
                      {isTechQuery && q.nodalFwdResponseAt && (
                        <div style={{ background: COLORS.bg, padding: '6px 14px', borderTop: `1px solid ${COLORS.border}` }}>
                          <span style={{ fontSize: 10, color: COLORS.textMuted }}>✓ Response forwarded to Technical Officer on {fmtDate(q.nodalFwdResponseAt)}</span>
                        </div>
                      )}

                      {/* Non-tech query with no response yet */}
                      {!isTechQuery && !q.response && (
                        <div style={{ background: '#FFFBEB', padding: '8px 14px', borderTop: `1px solid ${COLORS.border}` }}>
                          <span style={{ fontSize: 11, color: '#B45309', fontWeight: 600 }}>⏳ Awaiting applicant response…</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Documents */}
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, borderBottom: `2px solid ${COLORS.primaryLight}`, paddingBottom: 6, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Uploaded Documents
            </div>
            {docRows.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr>{['Document', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {docRows.map((d, i) => {
  return (
    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
      <td style={S.td}>{d.label}</td>
      <td style={S.td}>
        <a
          href={`${API_BASE}/uploads/${d.val}`}
          target="_blank"
          rel="noreferrer"
          style={{
            color: COLORS.primary,
            fontWeight: 600,
            fontSize: 11,
            textDecoration: 'none',
          }}
        >
          📥 View
        </a>
      </td>
    </tr>
  );
})}
                </tbody>
              </table>
            ) : (
              <div style={{ color: COLORS.textMuted, fontSize: 12, fontStyle: 'italic' }}>No documents uploaded yet.</div>
            )}
          </div>
        </div>

        {/* ── Right: Checklist + Decision ────────────────────────── */}
        <div>
          {fromEC ? (
            /* ── Post-EC mode: show Form 2 summary + dispatch only ── */
            <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, borderBottom: `2px solid ${COLORS.primaryLight}`, paddingBottom: 6, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Form II — Decision Summary
              </div>

              {/* EC Recommendation */}
              <div style={{ background: ecDecision === 'RecommendRejection' ? '#FFF1F2' : '#F0FDF4', border: `1px solid ${ecDecision === 'RecommendRejection' ? '#FECDD3' : '#BBF7D0'}`, borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: ecDecision === 'RecommendRejection' ? '#9F1239' : '#166534', marginBottom: 2 }}>
                  EC Recommendation: {ecDecision === 'RecommendRejection' ? 'Recommend Rejection' : 'Recommend Approval'}
                </div>
              </div>

              {/* TO Final Decision */}
              <div style={{ background: f2Decision === 'Rejected' ? '#FFF1F2' : '#F0FDF4', border: `1px solid ${f2Decision === 'Rejected' ? '#FECDD3' : '#BBF7D0'}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>Technical Officer Final Decision</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: f2Decision === 'Rejected' ? '#9F1239' : '#166534' }}>
                  {f2Decision === 'Rejected' ? '✗ Rejected' : '✓ Approved'}
                </div>
                {form2 && (
                  <div style={{ marginTop: 8, fontSize: 11, color: COLORS.textMuted, lineHeight: 1.6 }}>
                    {form2['productName'] && <div><strong>Product:</strong> {String(form2['productName'])}</div>}
                    {form2['orgName']     && <div><strong>Organisation:</strong> {String(form2['orgName'])}</div>}
                  </div>
                )}
              </div>

              <button
                onClick={handleSendDecision}
                disabled={submitting}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', border: 'none', background: COLORS.success, color: '#fff', opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Processing…' : '📨 Confirm — Dispatch Decision to Applicant →'}
              </button>
            </div>
          ) : (
            /* ── Normal scrutiny mode ───────────────────────────────── */
            <>
              {/* Scrutiny Checklist */}
              <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, borderBottom: `2px solid ${COLORS.primaryLight}`, paddingBottom: 6, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Scrutiny Checklist
                </div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 10 }}>
                  {checkedCount}/{CHECKLIST.length} items verified
                </div>
                <div style={{ height: 4, background: COLORS.border, borderRadius: 2, marginBottom: 14 }}>
                  <div style={{ height: '100%', borderRadius: 2, background: COLORS.primary, width: `${(checkedCount / CHECKLIST.length) * 100}%`, transition: 'width 0.3s' }} />
                </div>
                {CHECKLIST.map((item, i) => (
                  <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={checked[i]}
                      onChange={(e) => setChecked((prev) => prev.map((v, j) => j === i ? e.target.checked : v))}
                      style={{ marginTop: 2, accentColor: COLORS.primary, width: 14, height: 14, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 11, color: COLORS.text, lineHeight: 1.5 }}>{item}</span>
                  </label>
                ))}
              </div>

              {/* Decision — only actionable when stage is WithNodalOfficerA */}
              {app.stage === 'WithNodalOfficerA' ? (
                <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, borderBottom: `2px solid ${COLORS.primaryLight}`, paddingBottom: 6, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Scrutiny Decision
                  </div>

                  <button onClick={() => setDecision('forward')}
                    style={{ width: '100%', padding: '10px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', marginBottom: 8, background: decision === 'forward' ? COLORS.primary : COLORS.primaryLight, color: decision === 'forward' ? '#fff' : COLORS.primary, border: `2px solid ${COLORS.primary}` }}>
                    ✅ Forward to Technical Officer
                  </button>

                  <button onClick={() => setDecision('return')}
                    style={{ width: '100%', padding: '10px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', marginBottom: 12, background: decision === 'return' ? COLORS.accent : '#FFF7ED', color: decision === 'return' ? '#fff' : COLORS.accent, border: `2px solid ${COLORS.accent}` }}>
                    ↩ Return with Deficiency Notice
                  </button>

                  {decision === 'return' && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text }}>Deficiency / Query Details *</div>
                        <div style={{ fontSize: 10, color: queryText.trim().length < 10 ? COLORS.danger : COLORS.textMuted }}>{queryText.trim().length} / min 10 chars</div>
                      </div>
                      <textarea value={queryText} onChange={(e) => setQueryText(e.target.value)}
                        placeholder="Describe the deficiency or information required from the applicant…"
                        rows={5}
                        style={{ width: '100%', border: `1.5px solid ${queryText.trim().length > 0 && queryText.trim().length < 10 ? COLORS.danger : COLORS.accent}`, borderRadius: 6, padding: '8px 10px', fontSize: 11, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: "'Noto Sans','Segoe UI',sans-serif" }} />
                    </div>
                  )}

                  {decision && (
                    <button
                      onClick={decision === 'forward' ? handleForward : handleReturn}
                      disabled={submitting}
                      style={{ width: '100%', padding: '11px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', border: 'none', background: decision === 'forward' ? COLORS.primary : COLORS.accent, color: '#fff', opacity: submitting ? 0.7 : 1 }}>
                      {submitting ? 'Processing…' : decision === 'forward' ? 'Confirm Forward →' : 'Confirm Return →'}
                    </button>
                  )}

                  {decision === 'forward' && !allChecked && (
                    <div style={{ marginTop: 8, fontSize: 10, color: '#DC2626', textAlign: 'center' }}>
                      ⚠ Complete all checklist items before forwarding
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ background: app.stage === 'Rejected' ? '#FEF2F2' : COLORS.bg, border: `1px solid ${app.stage === 'Rejected' ? '#FECACA' : COLORS.border}`, borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: app.stage === 'Rejected' ? COLORS.danger : COLORS.textMuted, marginBottom: 6 }}>
                    {app.stage === 'Rejected' ? '✕ Application Rejected' : `Status: ${app.stage}`}
                  </div>
                  {app.stage === 'Rejected' && (
                    <div style={{ fontSize: 11, color: COLORS.text, lineHeight: 1.6 }}>
                      This application has been rejected. No further Nodal Officer action is available until the CEO approves the applicant's appeal and routes it back to this queue.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
