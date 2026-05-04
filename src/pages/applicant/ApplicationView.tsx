// Mirrors ApplicantApplicationView from mock (App.jsx). Single application read-only view with tabs.
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { COLORS, S } from '@/utils/colors';
import StatusBadge from '@/components/ui/StatusBadge';
import TabBar from '@/components/ui/TabBar';
import {
  fetchApplication, fetchQueries, respondToQuery,
  type Application, type AppFormData, type Query,
} from '@/services/application.service';

// ── Constants ─────────────────────────────────────────────────────────────────
const TABS = ['Details', 'Documents', 'Queries', 'Decision History', 'Timeline'];

const TYPE_LABELS: Record<string, string> = {
  NSF: 'Novel & Special Foods (NSF)',
  ClaimApproval: 'Claim Approval',
  AyurvedaAahara: 'Ayurveda Aahara',
  RPET: 'rPET',
  AnyOther: 'Any Other',
};

const STAGE_LABELS: Record<string, string> = {
  Draft: 'Draft',
  Submitted: 'Submitted',
  WithNodalOfficerA: 'With Nodal Officer A',
  WithTechnicalOfficer: 'With Technical Officer',
  QuerySent: 'Query Sent',
  WithExpertCommittee: 'With Expert Committee',
  WithNodalPointB: 'With Nodal Point B',
  DecisionPending: 'Decision Pending',
  WithCEO: 'With CEO',
  WithChairperson: 'With Chairperson',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Closed: 'Closed',
};

// Document field → display label mapping (step3 + step4)
const DOC_FIELDS: { key: keyof AppFormData['step3'] | keyof AppFormData['step4']; label: string; step: 'step3' | 'step4' }[] = [
  { step: 'step3', key: 'certOfAnalysis',      label: 'Certificate of Analysis' },
  { step: 'step3', key: 'manufacturingProcess', label: 'Manufacturing Process' },
  { step: 'step3', key: 'regulatoryStatusFile', label: 'Regulatory Status Document' },
  { step: 'step3', key: 'agreementDoc',         label: 'Agreement / Authorization Document' },
  { step: 'step3', key: 'safetyFile1',          label: 'Safety Document 1' },
  { step: 'step3', key: 'safetyFile2',          label: 'Safety Document 2' },
  { step: 'step3', key: 'claimFile1',           label: 'Claim Support Document 1' },
  { step: 'step3', key: 'claimFile2',           label: 'Claim Support Document 2' },
  { step: 'step3', key: 'prototypeLabel',       label: 'Prototype Label' },
  { step: 'step3', key: 'postMarketingDecl',    label: 'Post-Marketing Declaration' },
  { step: 'step3', key: 'confidentialityDecl',  label: 'Confidentiality Declaration' },
  { step: 'step4', key: 'specificationDoc',     label: 'Specification Document' },
  { step: 'step4', key: 'microTemplate',        label: 'Microorganism Template' },
  { step: 'step4', key: 'anyOtherDoc',          label: 'Any Other Document' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function InfoChip({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 16px', minWidth: 140 }}>
      <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: highlight ? COLORS.primary : COLORS.text }}>{value}</div>
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6, borderBottom: `2px solid ${COLORS.primaryLight}`, paddingBottom: 6, marginBottom: 10, marginTop: 18 }}>
      {title}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: value ? COLORS.text : COLORS.textMuted, fontStyle: value ? 'normal' : 'italic' }}>{value || '—'}</div>
    </div>
  );
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>{children}</div>;
}

// ── Tab: Details ──────────────────────────────────────────────────────────────
function TabSummary({ fd }: { fd: AppFormData }) {
  return (
    <div>
      <SectionHead title="Step 1 — Ingredients & Application Type" />
      <TwoCol>
        <Field label="Application For"   value={fd.step1.applicationFor} />
        <Field label="Specify Food"      value={fd.step1.specifyFood} />
      </TwoCol>

      {fd.step1.ingredients.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginTop: 10, marginBottom: 4 }}>Ingredients</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>{['Ingredient Name', 'Quantity', 'Standardize'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {fd.step1.ingredients.map((ing, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                  <td style={S.td}>{ing.name}</td>
                  <td style={S.td}>{ing.quantity}</td>
                  <td style={S.td}>{ing.standardize}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {fd.step1.additives.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginTop: 10, marginBottom: 4 }}>Additives</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>{['Additive Name', 'Quantity', 'Standardize'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {fd.step1.additives.map((a, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                  <td style={S.td}>{a.name}</td>
                  <td style={S.td}>{a.quantity}</td>
                  <td style={S.td}>{a.standardize}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <SectionHead title="Step 2 — General Information" />
      <TwoCol>
        <Field label="Applicant Name"          value={fd.step2.applicantName} />
        <Field label="Authorised Person"        value={fd.step2.authorisedPerson} />
        <Field label="Mobile No."               value={fd.step2.mobileNo} />
        <Field label="Email"                    value={fd.step2.email} />
        <Field label="Organisation Name"        value={fd.step2.orgName} />
        <Field label="Organisation Address"     value={fd.step2.orgAddress} />
        <Field label="FSSAI License Number"     value={fd.step2.licenseNumber} />
        <Field label="Manufacturing Address"    value={fd.step2.mfgAddress} />
        <Field label="Nature of Business"       value={fd.step2.natureOfBusiness} />
        <Field label="Product Name"             value={fd.step2.productName} />
        <Field label="Product Category"         value={fd.step2.productCategory} />
        <Field label="Sub-Category"             value={fd.step2.subCategory} />
        <Field label="Source"                   value={fd.step2.source} />
        <Field label="Genus / Species"          value={fd.step2.genusSp} />
      </TwoCol>
      <Field label="Justification / Background" value={fd.step2.justification} />
      <Field label="Functional Benefits"        value={fd.step2.functionalBenefits} />
      <Field label="Health Benefits"            value={fd.step2.healthBenefits} />

      <SectionHead title="Step 3 — Documents & Declarations" />
      <TwoCol>
        <Field label="Regulatory Status"       value={fd.step3.regulatoryStatus} />
        <Field label="Relationship Type"       value={fd.step3.relationshipType} />
        <Field label="GST Number"              value={fd.step3.gstNo} />
      </TwoCol>

      <SectionHead title="Step 4 — Additional Information" />
      <TwoCol>
        <Field label="Target Group"    value={fd.step4.targetGroup} />
        <Field label="Composition"     value={fd.step4.composition} />
        <Field label="New Technology"  value={fd.step4.newTechnology} />
        <Field label="Chemical Name"   value={fd.step4.chemicalName} />
        <Field label="Purity"          value={fd.step4.purity} />
        <Field label="ADI"             value={fd.step4.adi} />
        <Field label="Proposed Level"  value={fd.step4.proposedLevel} />
        <Field label="Color Index"     value={fd.step4.colorIndex} />
        <Field label="Enzyme Activity" value={fd.step4.enzymeActivity} />
      </TwoCol>

      <SectionHead title="Step 5 — Payment" />
      <TwoCol>
        <Field label="Payment Method"    value={fd.step5.paymentMethod} />
        <Field label="Payment Reference" value={fd.step5.paymentReference} />
      </TwoCol>
    </div>
  );
}

// ── Tab: Documents ────────────────────────────────────────────────────────────
function TabDocuments({ fd }: { fd: AppFormData }) {
  const files = DOC_FIELDS.filter((d) => {
    const val = d.step === 'step3'
      ? (fd.step3 as unknown as Record<string, unknown>)[d.key as string]
      : (fd.step4 as unknown as Record<string, unknown>)[d.key as string];
    return val && typeof val === 'string' && val.trim() !== '';
  });

  if (files.length === 0) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
        No documents uploaded yet.
      </div>
    );
  }

  // UUID-prefixed storedName → display name + download URL
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i;
  function isStored(v: string) { return UUID_RE.test(v); }
  function cleanName(v: string) { return v.replace(UUID_RE, ''); }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr>{['#', 'Document', 'File Name', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {files.map((d, i) => {
          const val = (d.step === 'step3'
            ? (fd.step3 as unknown as Record<string, unknown>)[d.key as string]
            : (fd.step4 as unknown as Record<string, unknown>)[d.key as string]) as string;
          const stored = isStored(val);
          return (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
              <td style={S.td}>{i + 1}</td>
              <td style={S.td}><span style={{ fontWeight: 600 }}>{d.label}</span></td>
              <td style={S.td}><span style={{ color: COLORS.primary }}>📎 {stored ? cleanName(val) : val}</span></td>
              <td style={S.td}>
                {stored ? (
                  <a
                    href={`/api/uploads/${val}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 5, fontSize: 10, padding: '4px 10px', cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}
                  >
                    ⬇ Download
                  </a>
                ) : (
                  <span style={{ fontSize: 10, color: COLORS.textMuted, fontStyle: 'italic' }}>Re-upload to enable download</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Tab: Queries ──────────────────────────────────────────────────────────────
function TabQueries({ app, onResponded }: { app: Application; onResponded: () => void }) {
  const [queries, setQueries]     = useState<Query[]>([]);
  const [loading, setLoading]     = useState(true);
  const [responding, setResponding] = useState<string | null>(null); // queryId being responded to
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting]     = useState(false);

  useEffect(() => {
    fetchQueries(app.id)
      .then(setQueries)
      .catch(() => toast.error('Could not load queries'))
      .finally(() => setLoading(false));
  }, [app.id]);

  async function handleRespond(queryId: string) {
    if (!responseText.trim()) { toast.error('Please enter a response'); return; }
    setSubmitting(true);
    try {
      const updated = await respondToQuery(app.id, queryId, responseText);
      setQueries((prev) => prev.map((q) => (q.id === queryId ? updated : q)));
      setResponding(null);
      setResponseText('');
      toast.success('Response submitted — application returned to review.');
      onResponded();
    } catch {
      toast.error('Could not submit response');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div style={{ padding: '40px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>Loading queries…</div>;

  if (queries.length === 0) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>No Queries</div>
        <div style={{ fontSize: 11 }}>Any queries raised by the reviewing officer will appear here.</div>
      </div>
    );
  }

  return (
    <div>
      {app.stage === 'QuerySent' && (
        <div style={{ background: COLORS.warningLight, border: '1px solid rgba(246,173,85,0.5)', borderLeft: `4px solid ${COLORS.accent}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 12 }}>
          <strong>⚠ Action Required:</strong> The officer has raised {queries.filter((q) => !q.response).length} unanswered query/queries. Please respond to continue the review process.
        </div>
      )}
      {queries.map((q, i) => (
        <div key={q.id} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, marginBottom: 14, background: q.response ? '#F9FFF9' : '#FFFBF0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: COLORS.primary, color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted }}>
                From: <strong style={{ color: COLORS.text }}>{q.askedBy.username}</strong>
                {q.askedBy.officeLocation && ` · ${q.askedBy.officeLocation}`}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: COLORS.textMuted }}>{fmtDate(q.createdAt)}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                background: q.response ? '#D1FAE5' : '#FEF3C7',
                color:      q.response ? '#065F46' : '#92400E',
              }}>
                {q.response ? 'Answered' : 'Pending Response'}
              </span>
            </div>
          </div>

          {/* Query text */}
          <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '10px 12px', fontSize: 12, color: COLORS.text, marginBottom: 12, lineHeight: 1.6 }}>
            {q.text}
          </div>

          {/* Response */}
          {q.response ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.primary, marginBottom: 4 }}>
                Your Response · {fmtDate(q.respondedAt)}
              </div>
              <div style={{ background: '#F0FDF4', border: `1px solid #BBF7D0`, borderRadius: 6, padding: '10px 12px', fontSize: 12, color: COLORS.text, lineHeight: 1.6 }}>
                {q.response}
              </div>
            </div>
          ) : (
            <div>
              {responding === q.id ? (
                <div>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Enter your response to this query…"
                    style={{ width: '100%', border: `1.5px solid ${COLORS.primary}`, borderRadius: 6, padding: '10px 12px', fontSize: 12, resize: 'vertical', minHeight: 100, outline: 'none', boxSizing: 'border-box', fontFamily: "'Noto Sans','Segoe UI',sans-serif" }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => handleRespond(q.id)}
                      disabled={submitting}
                      style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 12, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
                    >
                      {submitting ? 'Submitting…' : 'Submit Response'}
                    </button>
                    <button
                      onClick={() => { setResponding(null); setResponseText(''); }}
                      style={{ background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setResponding(q.id)}
                  style={{ background: COLORS.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  ✏ Write Response
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Tab: Timeline ─────────────────────────────────────────────────────────────
const STAGE_ORDER = [
  'Draft', 'Submitted', 'WithNodalOfficerA', 'WithTechnicalOfficer',
  'WithExpertCommittee', 'WithNodalPointB', 'DecisionPending',
  'WithCEO', 'WithChairperson', 'Approved',
];

function TabTimeline({ app }: { app: Application }) {
  const currentIdx = STAGE_ORDER.indexOf(app.stage);

  return (
    <div style={{ padding: '4px 0' }}>
      {STAGE_ORDER.map((stage, i) => {
        const done    = i < currentIdx || app.stage === 'Approved' || app.stage === 'Closed';
        const active  = stage === app.stage;
        const future  = i > currentIdx && !done;
        const dotColor = done || active ? COLORS.primary : COLORS.border;
        const lineColor = done ? COLORS.primary : COLORS.border;

        let dateStr = '';
        if (stage === 'Draft')     dateStr = fmtDate(app.createdAt);
        if (stage === 'Submitted') dateStr = fmtDate(app.submittedAt);
        if (active && !dateStr)    dateStr = 'Current stage';

        return (
          <div key={stage} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            {/* Dot + line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', marginTop: 2,
                background: active ? COLORS.primary : done ? COLORS.primaryLight : '#E5E7EB',
                border: `2px solid ${dotColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, color: done || active ? COLORS.primary : COLORS.textMuted, fontWeight: 700,
              }}>
                {done && !active ? '✓' : ''}
              </div>
              {i < STAGE_ORDER.length - 1 && (
                <div style={{ width: 2, flex: 1, minHeight: 28, background: lineColor, marginTop: 2, marginBottom: 2 }} />
              )}
            </div>
            {/* Label */}
            <div style={{ paddingBottom: 20, opacity: future ? 0.4 : 1 }}>
              <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? COLORS.primary : COLORS.text }}>
                {STAGE_LABELS[stage] ?? stage}
                {active && (
                  <span style={{ marginLeft: 8, fontSize: 10, background: COLORS.primaryLight, color: COLORS.primary, padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>
                    CURRENT
                  </span>
                )}
              </div>
              {dateStr && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{dateStr}</div>}
            </div>
          </div>
        );
      })}

      {(app.stage === 'Rejected') && (
        <div style={{ marginTop: 8, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#991B1B', fontWeight: 600 }}>
          ✕ Application Rejected
        </div>
      )}
      {(app.stage === 'QuerySent') && (
        <div style={{ marginTop: 8, background: COLORS.warningLight, border: '1px solid rgba(246,173,85,0.5)', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#7C2D12', fontWeight: 600 }}>
          ⚠ Query Sent — Response Required
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ApplicationView() {
  const { id }        = useParams<{ id: string }>();
  const navigate      = useNavigate();
  const [params]      = useSearchParams();
  const [app, setApp]         = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    const t = parseInt(params.get('tab') ?? '0', 10);
    return isNaN(t) ? 0 : t;
  });

  useEffect(() => {
    if (!id) return;
    fetchApplication(id)
      .then(setApp)
      .catch(() => toast.error('Could not load application'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div style={{ padding: '60px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>Loading application…</div>;
  }

  if (!app) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
        <div style={{ fontSize: 14, color: COLORS.textMuted }}>Application not found.</div>
        <button onClick={() => navigate('/app/applications')} style={{ marginTop: 16, background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 12, cursor: 'pointer' }}>
          ← Back to Applications
        </button>
      </div>
    );
  }

  const fd = app.formData as AppFormData | null;

  return (
    <div>
      {/* ── Page header ───────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => navigate('/app/applications')}
          style={{ background: 'none', border: 'none', color: COLORS.primary, fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ← Back to Application Details
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={S.roleLabel}>APPLICANT</div>
            <div style={{ ...S.pageTitle, display: 'flex', alignItems: 'center', gap: 10 }}>
              {app.referenceNumber}
              <StatusBadge status={app.stage} />
            </div>
            <div style={S.pageDesc}>{TYPE_LABELS[app.applicationType] ?? app.applicationType} · {app.companyName}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {app.stage === 'Draft' && (
              <button
                onClick={() => navigate(`/app/apply/form?id=${app.id}`)}
                style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                ✏ Edit Draft
              </button>
            )}
            {app.stage === 'QuerySent' && (
              <button
                onClick={() => setActiveTab(2)}
                style={{ background: COLORS.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                ⚠ Respond to Query
              </button>
            )}
            <button
              onClick={() => window.print()}
              style={{ background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 8, padding: '9px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              🖨 Print
            </button>
          </div>
        </div>
      </div>

      {/* ── Info chips row ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <InfoChip label="Reference No."  value={app.referenceNumber} highlight />
        <InfoChip label="Application Type" value={TYPE_LABELS[app.applicationType] ?? app.applicationType} />
        <InfoChip label="Current Stage"  value={STAGE_LABELS[app.stage] ?? app.stage} />
        <InfoChip label="Created"        value={fmtDate(app.createdAt)} />
        <InfoChip label="Submitted"      value={fmtDate(app.submittedAt)} />
        <InfoChip label="Last Updated"   value={fmtDate(app.updatedAt)} />
      </div>

      {/* ── Tab content ───────────────────────────────────────────── */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === 0 && (
          fd
            ? <TabSummary fd={fd} />
            : <div style={{ padding: '40px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>No form data saved yet.</div>
        )}
        {activeTab === 1 && (fd ? <TabDocuments fd={fd} /> : <TabDocuments fd={{ step1: { applicationFor: '', specifyFood: '', ingredients: [], additives: [] }, step2: {} as never, step3: {} as never, step4: {} as never, step5: {} as never }} />)}
        {activeTab === 2 && <TabQueries app={app} onResponded={() => fetchApplication(app.id).then(setApp)} />}
        {activeTab === 3 && (
          <div style={{ padding: '16px 0' }}>
            {app.stage === 'Approved' ? (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '16px 20px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.success, marginBottom: 6 }}>✅ Application Approved</div>
                <div style={{ fontSize: 12, color: COLORS.text }}>This application has been approved by FSSAI. The formal approval letter has been dispatched.</div>
              </div>
            ) : app.stage === 'Rejected' ? (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '16px 20px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.danger, marginBottom: 6 }}>✕ Application Rejected</div>
                <div style={{ fontSize: 12, color: COLORS.text }}>This application was rejected. Please refer to the queries section for details and use the Appeal option if applicable.</div>
              </div>
            ) : (
              <div style={{ padding: '48px 0', textAlign: 'center', color: COLORS.textMuted }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No formal decision yet</div>
                <div style={{ fontSize: 12 }}>Application is currently with: <strong>{STAGE_LABELS[app.stage] ?? app.stage}</strong></div>
              </div>
            )}
          </div>
        )}
        {activeTab === 4 && <TabTimeline app={app} />}
      </div>
    </div>
  );
}

import type React from 'react';
