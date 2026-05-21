import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { COLORS, S } from '@/utils/colors';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  fetchApplication, fetchQueries,
  nodalForwardQueryToApplicant, nodalForwardResponseToTech,
  type Application, type AppFormData, type Query,
} from '@/services/application.service';
import { getDocRows, getProfileDisplay } from '@/utils/docResolver';
import FormDataTable from '@/components/ui/FormDataTable';

const API_BASE = (import.meta as { env: Record<string, string> }).env.VITE_API_URL ?? 'http://localhost:3000/api';

function parseResponse(text: string) {
  const m = text.match(/\n\n📎 Attachment: (.+?) \[(.+?)\]$/);
  if (!m || m.index === undefined) return { body: text, attachmentFile: null, attachmentName: null };
  return { body: text.slice(0, m.index), attachmentFile: m[2], attachmentName: m[1] };
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const TYPE_LABELS: Record<string, string> = {
  NSF: 'Novel & Special Foods (NSF)', ClaimApproval: 'Claim Approval',
  AyurvedaAahara: 'Ayurveda Aahara', RPET: 'rPET', AnyOther: 'Any Other',
};

// ── Main component ─────────────────────────────────────────────────────────────
export default function NodalApplicationView() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [app,       setApp]       = useState<Application | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [queries,   setQueries]   = useState<Query[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'queries'>('details');
  const [fwding,    setFwding]    = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchApplication(id), fetchQueries(id)])
      .then(([a, qs]) => { setApp(a); setQueries(qs); })
      .catch(() => toast.error('Failed to load application'))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Query state helpers ──────────────────────────────────────────────────────
  const activeTOQueryToForward = queries.find(
    (q) => q.originStage === 'WithTechnicalOfficer' && !q.nodalForwardedAt,
  ) ?? null;

  const activeTOResponseToForward = queries.find(
    (q) => q.originStage === 'WithTechnicalOfficer' && !!q.nodalForwardedAt && !!q.response && !q.nodalFwdResponseAt,
  ) ?? null;

  const pendingApplicantResponse = app?.stage === 'QuerySent';

  const hasQueryAlert = !!(activeTOQueryToForward || activeTOResponseToForward || pendingApplicantResponse);

  async function handleForwardToApplicant(qId: string) {
    setFwding(true);
    try {
      await nodalForwardQueryToApplicant(app!.id, qId);
      toast.success('Query forwarded to applicant');
      const updated = await fetchQueries(app!.id);
      setQueries(updated);
    } catch { toast.error('Could not forward query'); }
    finally { setFwding(false); }
  }

  async function handleForwardResponseToTO(qId: string) {
    setFwding(true);
    try {
      await nodalForwardResponseToTech(app!.id, qId);
      toast.success('Response forwarded to Technical Officer');
      const updated = await fetchQueries(app!.id);
      setQueries(updated);
    } catch { toast.error('Could not forward response'); }
    finally { setFwding(false); }
  }

  if (loading) return <div style={{ padding: '60px 0', textAlign: 'center', color: COLORS.textMuted }}>Loading application…</div>;
  if (!app)    return <div style={{ padding: '60px 0', textAlign: 'center', color: COLORS.textMuted }}>Application not found.</div>;

  const fd      = app.formData as AppFormData | null;
  const docRows = getDocRows(app);
  const profile = getProfileDisplay(app);

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate('/nodal/dashboard')}
        style={{ background: 'none', border: 'none', color: COLORS.primary, fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 10, fontWeight: 600 }}
      >
        ← Back to Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={S.roleLabel}>NODAL OFFICER — APPLICATION VIEW</div>
          <div style={{ ...S.pageTitle, display: 'flex', alignItems: 'center', gap: 10 }}>
            {app.referenceNumber} <StatusBadge status={app.stage} />
          </div>
          <div style={S.pageDesc}>{TYPE_LABELS[app.applicationType] ?? app.applicationType} · {app.companyName}</div>
        </div>
        <button
          onClick={() => navigate(`/nodal/scrutiny/${app.id}`)}
          style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 7, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          Proceed →
        </button>
      </div>

      {/* ── Key info chips ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        {[
          { label: 'Reference',  value: app.referenceNumber },
          { label: 'Type',       value: TYPE_LABELS[app.applicationType] ?? app.applicationType },
          { label: 'Submitted',  value: fmtDate(app.submittedAt) },
          { label: 'Company',    value: app.companyName },
          { label: 'Category',   value: app.foodCategory || '—' },
        ].map((c) => (
          <div key={c.label} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px 14px' }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{c.label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* ── Query alert banner ────────────────────────────────────────────── */}
      {hasQueryAlert && (
        <div
          onClick={() => setActiveTab('queries')}
          style={{
            background: '#FFF7ED', border: `1.5px solid ${COLORS.accent}`, borderRadius: 8,
            padding: '10px 16px', marginBottom: 14, display: 'flex', alignItems: 'center',
            gap: 10, cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 16 }}>⚠</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>
              {activeTOQueryToForward
                ? 'Query received from Technical Officer — action required'
                : activeTOResponseToForward
                ? 'Applicant responded — forward response to Technical Officer'
                : 'Query sent — awaiting applicant response'}
            </div>
            <div style={{ fontSize: 11, color: '#B45309', marginTop: 1 }}>Click to open the Queries tab</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent }}>View Queries →</span>
        </div>
      )}

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${COLORS.border}`, marginBottom: 16 }}>
        {(['details', 'queries'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '9px 22px', fontSize: 12, fontWeight: 700,
              color: activeTab === tab ? COLORS.primary : COLORS.textMuted,
              borderBottom: `2px solid ${activeTab === tab ? COLORS.primary : 'transparent'}`,
              marginBottom: -2,
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}
          >
            {tab === 'details' ? 'Application Details' : `Queries${queries.length ? ` (${queries.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* ══ APPLICATION DETAILS TAB ══════════════════════════════════════════ */}
      {activeTab === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Applicant profile strip */}
          {profile.applicantName && (
            <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                ['Applicant', profile.applicantName],
                ['Organisation', profile.orgName || app.companyName],
                ['Address', app.address || '—'],
              ].map(([lbl, val]) => (
                <div key={lbl}>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>{lbl}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{val || '—'}</div>
                </div>
              ))}
            </div>
          )}

          {/* Form data */}
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, borderBottom: `2px solid ${COLORS.primaryLight}`, paddingBottom: 6, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Form Data
            </div>
            <FormDataTable formData={fd} />
          </div>

          {/* Documents */}
          {docRows.length > 0 && (
            <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, borderBottom: `2px solid ${COLORS.primaryLight}`, paddingBottom: 6, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Uploaded Documents
                <span style={{ marginLeft: 8, background: COLORS.primaryLight, color: COLORS.primary, borderRadius: 10, fontSize: 10, padding: '1px 7px', fontWeight: 700 }}>{docRows.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {docRows.map((d) => (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: COLORS.bg, borderRadius: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text }}>{d.label}</div>
                    <a
                      href={`${API_BASE}/uploads/${d.val}`}
                      target="_blank" rel="noreferrer"
                      style={{ fontSize: 11, fontWeight: 600, color: COLORS.primary, textDecoration: 'none', border: `1px solid ${COLORS.primary}`, borderRadius: 4, padding: '3px 8px' }}
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ QUERIES TAB ══════════════════════════════════════════════════════ */}
      {activeTab === 'queries' && (
        <div>
          {queries.length === 0 ? (
            <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '40px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>
              No queries raised yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {queries.map((q, i) => {
                const isTechQuery = q.originStage === 'WithTechnicalOfficer';
                const needsForwardToApplicant = isTechQuery && !q.nodalForwardedAt;
                const needsForwardToTO = isTechQuery && !!q.response && !q.nodalFwdResponseAt;
                const pr = q.response ? parseResponse(q.response) : null;

                return (
                  <div
                    key={q.id}
                    style={{
                      border: `1px solid ${needsForwardToApplicant || needsForwardToTO ? COLORS.accent : COLORS.border}`,
                      borderRadius: 8, overflow: 'hidden',
                      boxShadow: needsForwardToApplicant || needsForwardToTO ? `0 0 0 2px ${COLORS.accent}22` : 'none',
                    }}
                  >
                    {/* Query header */}
                    <div style={{ background: isTechQuery ? '#FFF7ED' : COLORS.primaryLight, padding: '10px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 22, height: 22, borderRadius: '50%', background: isTechQuery ? COLORS.accent : COLORS.primary, color: '#fff', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {i + 1}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: isTechQuery ? COLORS.accent : COLORS.primary }}>
                            {isTechQuery ? '🔀 Technical Officer Query' : '📋 Nodal Officer Query'}
                            {' — '}raised by {q.askedBy?.username ?? 'Officer'}
                          </span>
                        </div>
                        <span style={{ fontSize: 10, color: COLORS.textMuted }}>
                          {fmtDate(q.createdAt)}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: COLORS.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{q.text}</p>
                    </div>

                    {/* Action: forward TO query to applicant */}
                    {needsForwardToApplicant && !q.response && (
                      <div style={{ background: '#FFF7ED', borderTop: `1px solid #FED7AA`, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#92400E', fontWeight: 600 }}>⚠ Action Required — forward this query to the applicant</span>
                        <button
                          disabled={fwding}
                          onClick={() => handleForwardToApplicant(q.id)}
                          style={{ background: COLORS.accent, color: '#fff', border: 'none', borderRadius: 5, padding: '5px 14px', fontSize: 11, fontWeight: 700, cursor: fwding ? 'wait' : 'pointer', opacity: fwding ? 0.7 : 1 }}
                        >
                          {fwding ? 'Forwarding…' : 'Forward to Applicant →'}
                        </button>
                      </div>
                    )}

                    {/* TO query forwarded to applicant — waiting */}
                    {isTechQuery && !!q.nodalForwardedAt && !q.response && (
                      <div style={{ background: '#F0F9FF', borderTop: `1px solid #BAE6FD`, padding: '8px 14px' }}>
                        <span style={{ fontSize: 11, color: '#0369A1' }}>✓ Forwarded to applicant on {fmtDate(q.nodalForwardedAt)} — awaiting response</span>
                      </div>
                    )}

                    {/* Applicant response */}
                    {q.response && (
                      <div style={{ background: '#F8FAFC', borderTop: `1px solid ${COLORS.border}`, padding: '10px 14px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
                          Applicant Response — {fmtDate(q.respondedAt ?? null)}
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: COLORS.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{pr?.body ?? q.response}</p>
                        {pr?.attachmentFile && (
                          <a href={`${API_BASE}/uploads/${pr.attachmentFile}`} target="_blank" rel="noreferrer"
                            style={{ display: 'inline-block', marginTop: 6, fontSize: 11, color: COLORS.primary, fontWeight: 600 }}>
                            📎 {pr.attachmentName}
                          </a>
                        )}
                      </div>
                    )}

                    {/* Action: forward response back to TO */}
                    {needsForwardToTO && (
                      <div style={{ background: '#FFF7ED', borderTop: `1px solid #FED7AA`, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#92400E', fontWeight: 600 }}>⚠ Action Required — forward applicant's response to Technical Officer</span>
                        <button
                          disabled={fwding}
                          onClick={() => handleForwardResponseToTO(q.id)}
                          style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 5, padding: '5px 14px', fontSize: 11, fontWeight: 700, cursor: fwding ? 'wait' : 'pointer', opacity: fwding ? 0.7 : 1 }}
                        >
                          {fwding ? 'Forwarding…' : 'Forward to Technical Officer →'}
                        </button>
                      </div>
                    )}

                    {/* Response forwarded to TO */}
                    {isTechQuery && !!q.nodalFwdResponseAt && (
                      <div style={{ background: '#F0FDF4', borderTop: `1px solid #BBF7D0`, padding: '8px 14px' }}>
                        <span style={{ fontSize: 11, color: '#166534' }}>✓ Response forwarded to Technical Officer on {fmtDate(q.nodalFwdResponseAt)}</span>
                      </div>
                    )}

                    {/* Regular query — responded */}
                    {!isTechQuery && q.response && !needsForwardToTO && (
                      <div style={{ background: '#F0FDF4', borderTop: `1px solid #BBF7D0`, padding: '6px 14px' }}>
                        <span style={{ fontSize: 11, color: '#166534' }}>✓ Response received</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
