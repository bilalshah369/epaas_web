import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import type React from 'react';
import { COLORS, S } from '@/utils/colors';
import { fetchApplication, fetchQueries, type Application, type AppFormData, type Query } from '@/services/application.service';
import { getDocRows } from '@/utils/docResolver';
import { ecForwardToTechnicalOfficer, ecReject, ecRequestClarification, ecSaveAssessment } from '@/services/ec.service';

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

type Tab = 'dossier' | 'documents' | 'assessment' | 'decision';
const TABS: Tab[] = ['dossier', 'documents', 'assessment', 'decision'];
const TAB_LABELS: Record<Tab, string> = {
  dossier: 'Application Dossier', documents: 'Document Viewer',
  assessment: 'EC Assessment', decision: 'Record Decision',
};

const EC_CHECKLIST = [
  { label: 'Product formulation reviewed',                  key: 'formulation' },
  { label: 'Safety and toxicology data evaluated',          key: 'safety'      },
  { label: 'Nutritional composition verified',              key: 'nutrition'   },
  { label: 'Claims substantiated by scientific evidence',   key: 'claims'      },
  { label: 'GRAS or equivalent international status noted', key: 'gras'        },
  { label: 'Risk assessment completed',                     key: 'risk'        },
  { label: 'Regulatory compliance across applicable FSS standards reviewed', key: 'regulatory' },
  { label: 'All committee members have reviewed dossier',   key: 'members'     },
];


const API_BASE = (import.meta as { env: Record<string, string> }).env.VITE_API_URL ?? 'http://localhost:3000/api';

export default function ECDocketReview() {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const [app,     setApp]     = useState<Application | null>(null);
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);

  const initialTab = (searchParams.get('tab') as Tab | null) ?? 'dossier';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [decision,       setDecision]       = useState('Recommend Approval');
  const [remarks,        setRemarks]        = useState('');
  const [clarText,       setClarText]       = useState('');
  const [checklist,      setChecklist]      = useState<Record<string, boolean>>({});
  const [assessNotes,    setAssessNotes]    = useState('');
  const [assessDirty,    setAssessDirty]    = useState(false);
  const [assessSaving,   setAssessSaving]   = useState(false);
  const [saving,         setSaving]         = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchApplication(id)
      .then((a) => {
        setApp(a);
        if (a.ecAssessment) {
          setChecklist(a.ecAssessment.checklist ?? {});
          setAssessNotes(a.ecAssessment.notes ?? '');
        }
      })
      .catch(() => toast.error('Could not load application'))
      .finally(() => setLoading(false));
    fetchQueries(id).then(setQueries).catch(() => {});
  }, [id]);

  const fd    = app?.formData as AppFormData | null | undefined;
  const appId = id ?? '';

  async function handleForwardTechnicalOfficer() {
    if (!remarks.trim()) { toast.error('Please enter EC remarks before forwarding'); return; }
    setSaving(true);
    try {
      await ecForwardToTechnicalOfficer(appId);
      toast.success('Application forwarded to Technical Officer — EC recommends approval');
      navigate('/ec/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Could not forward to Technical Officer');
      setSaving(false);
    }
  }

  async function handleReject() {
    if (!remarks.trim()) { toast.error('Please enter grounds for rejection'); return; }
    setSaving(true);
    try {
      await ecReject(appId, remarks);
      toast.success('Rejection recommendation forwarded to Technical Officer');
      navigate('/ec/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Could not reject application');
      setSaving(false);
    }
  }

  async function handleClarification() {
    if (clarText.trim().length < 10) { toast.error('Clarification text must be at least 10 characters'); return; }
    setSaving(true);
    try {
      await ecRequestClarification(appId, clarText);
      toast.success('Clarification requested — application returned to applicant via Nodal Officer');
      navigate('/ec/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Could not request clarification');
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: '60px 0', textAlign: 'center', color: COLORS.textMuted }}>Loading docket…</div>;
  if (!app)    return <div style={{ padding: '60px 0', textAlign: 'center', color: COLORS.textMuted }}>Application not found.</div>;

  const days = daysSince(app.submittedAt);
  const checkCount = Object.values(checklist).filter(Boolean).length;

  return (
    <div>
      <button onClick={() => navigate('/ec/dockets')}
        style={{ background: 'none', border: 'none', color: COLORS.primary, fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 10, fontWeight: 600 }}>
        ← Back to Case Dockets
      </button>

      <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 2 }}>EXPERT COMMITTEE — DOCKET REVIEW</div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", margin: 0 }}>
          {app.referenceNumber}
        </h2>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 3 }}>
          {app.companyName} · {app.applicationType} · Stage: <strong>{app.stage}</strong>
          {days !== null && <> · {days} days since submission</>}
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
            {t === 'assessment' && checkCount > 0 && (
              <span style={{ marginLeft: 5, background: COLORS.primary, color: '#fff', borderRadius: 8, fontSize: 9, padding: '1px 5px', fontWeight: 700 }}>{checkCount}/{EC_CHECKLIST.length}</span>
            )}
          </div>
        ))}
      </div>

      {/* ── Dossier tab ──────────────────────────────────────────────────────── */}
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
              ['RISK LEVEL',        'Medium'],
              ['CURRENT OWNER',     'Expert Committee'],
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
          {queries.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Query History ({queries.length} queries)</div>
              {queries.map((q, i) => (
                <div key={q.id} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '10px 14px', marginBottom: 8, background: COLORS.bg }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.primary, marginBottom: 4 }}>Query #{i + 1} — {fmtDate(q.createdAt)}</div>
                  <div style={{ fontSize: 12, color: COLORS.text, whiteSpace: 'pre-wrap', marginBottom: q.response ? 8 : 0 }}>{q.text}</div>
                  {q.response && (
                    <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.success, marginBottom: 4 }}>✅ Applicant Response — {fmtDate(q.respondedAt)}</div>
                      <div style={{ fontSize: 12, color: COLORS.text, whiteSpace: 'pre-wrap' }}>{q.response}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Documents tab ────────────────────────────────────────────────────── */}
      {activeTab === 'documents' && (
        <div style={card}>
          <div style={cardTitle}>DOSSIER — DOCUMENT VIEWER</div>
          {(() => { const rows = getDocRows(app); return rows.length === 0 ? (
            <div style={{ color: COLORS.textMuted, fontSize: 12, fontStyle: 'italic' }}>No documents uploaded yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['#', 'Document Name', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((d, i) => (
                  <tr key={d.label} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{d.label}</td>
                    <td style={S.td}>
                      <a href={`${API_BASE}/uploads/${d.val}`} target="_blank" rel="noreferrer"
                          style={{ ...btn('outline', true), textDecoration: 'none', display: 'inline-block' }}>📥 View</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ); })()}
        </div>
      )}

      {/* ── EC Assessment tab ────────────────────────────────────────────────── */}
      {activeTab === 'assessment' && (
        <div style={card}>
          <div style={cardTitle}>EC ASSESSMENT CHECKLIST</div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6 }}>{checkCount}/{EC_CHECKLIST.length} items evaluated</div>
            <div style={{ height: 6, background: COLORS.border, borderRadius: 3 }}>
              <div style={{ height: '100%', borderRadius: 3, background: checkCount === EC_CHECKLIST.length ? COLORS.success : COLORS.primary, width: `${(checkCount / EC_CHECKLIST.length) * 100}%`, transition: 'width 0.3s' }} />
            </div>
          </div>
          {EC_CHECKLIST.map((item) => (
            <div key={item.key}
              onClick={() => { setChecklist((prev) => ({ ...prev, [item.key]: !prev[item.key] })); setAssessDirty(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: `1px solid ${COLORS.border}`, cursor: 'pointer', userSelect: 'none' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: checklist[item.key] ? COLORS.successLight : COLORS.bg, border: `2px solid ${checklist[item.key] ? COLORS.success : COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, transition: 'all 0.15s' }}>
                {checklist[item.key] ? '✓' : ''}
              </div>
              <span style={{ fontSize: 13, color: checklist[item.key] ? COLORS.text : COLORS.textMuted }}>{item.label}</span>
            </div>
          ))}
          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Committee Assessment Notes</label>
            <textarea rows={4} value={assessNotes}
              onChange={(e) => { setAssessNotes(e.target.value); setAssessDirty(true); }}
              placeholder="Enter technical observations and committee notes…"
              style={{ ...textarea, minHeight: 100 }} />
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              disabled={assessSaving || !assessDirty}
              onClick={async () => {
                setAssessSaving(true);
                try {
                  await ecSaveAssessment(appId, checklist, assessNotes);
                  setAssessDirty(false);
                  toast.success('Assessment saved');
                } catch {
                  toast.error('Save failed — please try again');
                } finally { setAssessSaving(false); }
              }}
              style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontSize: 12, fontWeight: 700, cursor: assessSaving || !assessDirty ? 'not-allowed' : 'pointer', opacity: assessSaving || !assessDirty ? 0.55 : 1 }}>
              {assessSaving ? 'Saving…' : '💾 Save Assessment'}
            </button>
            {assessDirty && !assessSaving && (
              <span style={{ fontSize: 11, color: COLORS.warning, fontWeight: 600 }}>● Unsaved changes</span>
            )}
            {!assessDirty && checkCount > 0 && (
              <span style={{ fontSize: 11, color: COLORS.success, fontWeight: 600 }}>✓ Saved</span>
            )}
          </div>
        </div>
      )}

      {/* ── Decision tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'decision' && (
        <div>
          {/* Decision form */}
          <div style={card}>
            <div style={cardTitle}>RECORD EC DECISION</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>EC Decision</label>
              <select style={S.select} value={decision} onChange={(e) => setDecision(e.target.value)}>
                <option>Recommend Approval</option>
                <option>Recommend Rejection</option>
                <option>Request Clarification from Applicant</option>
              </select>
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>EC Remarks / Grounds *</label>
                <span style={{ fontSize: 10, color: remarks.trim().length < 10 ? COLORS.danger : COLORS.textMuted }}>{remarks.trim().length} chars</span>
              </div>
              <textarea rows={5} value={remarks} onChange={(e) => setRemarks(e.target.value)}
                placeholder="State the committee's findings, scientific basis, and grounds for decision…"
                style={{ ...textarea, minHeight: 120 }} />
            </div>

            {decision === 'Request Clarification from Applicant' ? (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Clarification Required *</label>
                  <textarea rows={4} value={clarText} onChange={(e) => setClarText(e.target.value)}
                    placeholder="Specify exactly what additional information or documents are needed from the applicant…"
                    style={{ ...textarea, minHeight: 100, borderColor: clarText.length > 0 && clarText.trim().length < 10 ? COLORS.danger : COLORS.border }} />
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>{clarText.trim().length} / min 10 chars</div>
                </div>
                <button style={btn('outline')} disabled={saving} onClick={handleClarification}>
                  {saving ? 'Processing…' : '↩ Request Clarification from Applicant'}
                </button>
              </>
            ) : decision === 'Recommend Approval' ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={btn()} disabled={saving} onClick={handleForwardTechnicalOfficer}>
                  {saving ? 'Processing…' : '✅ Recommend Approval — Forward to Technical Officer'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={btn('danger')} disabled={saving} onClick={handleReject}>
                  {saving ? 'Processing…' : '✗ Recommend Rejection — Forward to Technical Officer'}
                </button>
              </div>
            )}

            <div style={{ marginTop: 16, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 14px', fontSize: 11, color: COLORS.textMuted, lineHeight: 1.6 }}>
              <strong style={{ color: COLORS.text }}>Stage transitions:</strong>
              <ul style={{ margin: '6px 0 0 0', paddingLeft: 16 }}>
                <li><strong>Recommend Approval</strong> → forwards to Technical Officer for decision preparation</li>
                <li><strong>Recommend Rejection</strong> → forwards to Technical Officer with EC rejection grounds</li>
                <li><strong>Request Clarification</strong> → returns to applicant via Nodal Officer A</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.border}`, justifyContent: 'flex-end' }}>
        <button style={btn('outline')} onClick={() => navigate('/ec/dockets')}>← Back to Case Dockets</button>
        <button style={btn('outline')} onClick={() => navigate('/ec/agenda')}>View Meeting Agenda →</button>
      </div>
    </div>
  );
}
