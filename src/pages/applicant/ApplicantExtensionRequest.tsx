// Dedicated page for applicant to request extension of time for a specific application.
// Opened from dashboard "Req. Extension" button — app is pre-selected, 15 days is fixed.
import { useState, useEffect } from 'react';
import type React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { COLORS } from '@/utils/colors';
import { fetchApplication, fetchQueries, uploadFile, type Application, type Query } from '@/services/application.service';
import { createExtension } from '@/services/extension.service';

const EXTENSION_DAYS = 15; // Default — only admin can change

const card: React.CSSProperties = {
  background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '20px 22px', marginBottom: 16,
};
const fieldLabel = (text: string, required = false) => (
  <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>
    {text}{required && <span style={{ color: COLORS.danger, marginLeft: 3 }}>*</span>}
  </label>
);
const inputStyle: React.CSSProperties = {
  width: '100%', border: `1px solid ${COLORS.border}`, borderRadius: 6,
  padding: '8px 10px', fontSize: 12, boxSizing: 'border-box',
  fontFamily: "'Noto Sans','Segoe UI',sans-serif",
};

export default function ApplicantExtensionRequest() {
  const navigate = useNavigate();
  const { appId } = useParams<{ appId: string }>();

  const [app,       setApp]       = useState<Application | null>(null);
  const [queries,   setQueries]   = useState<Query[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [reason,    setReason]    = useState('Technical / Lab Delay');
  const [justification, setJustification] = useState('');
  const [supportingDoc,  setSupportingDoc]  = useState<string | null>(null);
  const [supportingDocName, setSupportingDocName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!appId) return;
    Promise.all([fetchApplication(appId), fetchQueries(appId)])
      .then(([a, qs]) => { setApp(a); setQueries(qs); })
      .catch(() => toast.error('Could not load application'))
      .finally(() => setLoading(false));
  }, [appId]);

  // The open query: either a TO query forwarded by Nodal (nodalForwardedAt set)
  // or a direct Nodal deficiency query (originStage is null — goes straight to QuerySent).
  const openQuery = queries
    .filter((q) => !q.response && (q.nodalForwardedAt !== null || q.originStage !== 'WithTechnicalOfficer'))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;

  // Check if extension was already filed for this query
  // We can't check from the frontend without an extra API call — backend will reject with a clear error

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const storedName = await uploadFile(file, appId!, 'extensionDoc');
      setSupportingDoc(storedName);
      setSupportingDocName(file.name);
      toast.success('Document uploaded');
    } catch {
      toast.error('File upload failed');
    } finally { setUploading(false); }
  }

  async function handleSubmit() {
    if (!app || !appId) return;
    if (justification.trim().length < 10) { toast.error('Justification must be at least 10 characters'); return; }
    if (!openQuery) { toast.error('No open query found for this application'); return; }

    setSubmitting(true);
    try {
      await createExtension({
        applicationId:     appId,
        reason,
        extensionDays:     EXTENSION_DAYS,
        contactEmail:      '',
        justification:     justification.trim(),
        queryId:           openQuery.id,
        ...(supportingDoc ? { supportingDocument: supportingDoc } : {}),
      });
      toast.success('Extension request submitted. Nodal Officer will review it shortly.');
      navigate('/app/requests/extension');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Could not submit extension request');
    } finally { setSubmitting(false); }
  }

  if (loading) return <div style={{ padding: '60px 0', textAlign: 'center', color: COLORS.textMuted }}>Loading…</div>;
  if (!app)    return <div style={{ padding: '60px 0', textAlign: 'center', color: COLORS.textMuted }}>Application not found.</div>;

  const alreadyClosed = app.stage !== 'QuerySent';

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <button onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: COLORS.primary, fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 14, fontWeight: 600 }}>
        ← Back
      </button>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 3 }}>APPLICANT — REQUEST EXTENSION OF TIME</div>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", margin: 0 }}>
          Extension of Time Request
        </h2>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>Request additional time to respond to the authority's query.</div>
      </div>

      {/* Application info (read-only) */}
      <div style={card}>
        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>APPLICATION DETAILS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            ['Reference No.',    app.referenceNumber],
            ['Application Type', app.applicationType],
            ['Company',          app.companyName],
            ['Current Stage',    app.stage],
          ].map(([k, v]) => (
            <div key={k} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 12px' }}>
              <div style={{ fontSize: 9, color: COLORS.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Open query info */}
      {openQuery ? (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', marginBottom: 6 }}>⏳ Open Query from Authority</div>
          <p style={{ fontSize: 12, color: '#78350F', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{openQuery.text}</p>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 6 }}>Raised on {new Date(openQuery.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        </div>
      ) : (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#9F1239' }}>No open query found</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>Extension requests can only be filed when there is an open query awaiting your response.</div>
        </div>
      )}

      {alreadyClosed && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#9F1239' }}>Application not in Query stage</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>Extensions can only be requested when your application has an active query awaiting your response.</div>
        </div>
      )}

      {/* Form */}
      {!alreadyClosed && openQuery && (
        <div style={card}>
          <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 16 }}>EXTENSION REQUEST DETAILS</div>

          {/* Extension period — fixed, read-only */}
          <div style={{ marginBottom: 14 }}>
            {fieldLabel('Extension Period Requested')}
            <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>15 Days</span>
              <span style={{ fontSize: 10, color: COLORS.textMuted }}>Fixed — standard extension period</span>
            </div>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: 14 }}>
            {fieldLabel('Reason for Extension', true)}
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ ...inputStyle, background: '#fff', cursor: 'pointer' }}>
              <option>Technical / Lab Delay</option>
              <option>Document Collection</option>
              <option>Other</option>
            </select>
          </div>

          {/* Justification */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              {fieldLabel('Detailed Justification', true)}
              <span style={{ fontSize: 10, color: justification.trim().length < 10 ? COLORS.danger : COLORS.textMuted, alignSelf: 'flex-end', marginBottom: 5 }}>
                {justification.trim().length} / min 10
              </span>
            </div>
            <textarea
              rows={5}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain why you need additional time to respond to the query. Provide specific reasons and context…"
              style={{
                ...inputStyle, resize: 'vertical', minHeight: 100,
                borderColor: justification.length > 0 && justification.trim().length < 10 ? COLORS.danger : COLORS.border,
              }}
            />
          </div>

          {/* Supporting document (optional) */}
          <div style={{ marginBottom: 18 }}>
            {fieldLabel('Supporting Document (optional)')}
            {supportingDoc ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '8px 12px' }}>
                <span style={{ fontSize: 13 }}>📎</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#065F46', flex: 1 }}>{supportingDocName}</span>
                <button onClick={() => { setSupportingDoc(null); setSupportingDocName(''); }}
                  style={{ background: 'none', border: 'none', color: COLORS.danger, fontSize: 14, cursor: 'pointer', fontWeight: 700, padding: '0 4px' }}>✕</button>
              </div>
            ) : (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: COLORS.bg, border: `1px dashed ${COLORS.border}`, borderRadius: 6, padding: '8px 14px', fontSize: 12, cursor: uploading ? 'not-allowed' : 'pointer', color: COLORS.primary, fontWeight: 600 }}>
                {uploading ? '⏳ Uploading…' : '📎 Attach Supporting Document'}
                <input type="file" style={{ display: 'none' }} disabled={uploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ''; }} />
              </label>
            )}
          </div>

          <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '10px 14px', marginBottom: 18, fontSize: 11, color: COLORS.textMuted, lineHeight: 1.6 }}>
            <strong style={{ color: COLORS.text }}>Note:</strong> This extension request will be reviewed by the Nodal Officer. If approved, you will have an additional 15 days to respond to the query. You can only file one extension request per query.
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSubmit}
              disabled={submitting || uploading || justification.trim().length < 10}
              style={{
                padding: '10px 24px', background: COLORS.primary, color: '#fff', border: 'none',
                borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: submitting || uploading || justification.trim().length < 10 ? 'not-allowed' : 'pointer',
                opacity: justification.trim().length < 10 ? 0.5 : 1,
              }}>
              {submitting ? 'Submitting…' : 'Submit Extension Request'}
            </button>
            <button
              onClick={() => navigate(-1)}
              style={{ padding: '10px 18px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
