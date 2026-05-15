// Mirrors ApplicantAppealReview + ApplicantExtension from mock (App.jsx L9224, L10258).
// Wired to real API: /api/appeals, /api/appeals/reviews, /api/extensions.
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type React from 'react';
import toast from 'react-hot-toast';
import { COLORS, S } from '@/utils/colors';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  fetchAppeals, fileAppeal, fetchReviews, fileReview,
  type AppealItem, type ReviewItem,
} from '@/services/appeal.service';
import { uploadFile } from '@/services/application.service';
import {
  fetchExtensions, createExtension, updateExtension,
  type ExtensionItem,
} from '@/services/extension.service';
import { fetchMyApplications, type Application } from '@/services/application.service';

// ── Local style helpers ────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: COLORS.white,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: '16px 18px',
  marginBottom: 16,
};

const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 12 };

const textarea: React.CSSProperties = {
  width: '100%', resize: 'vertical' as const,
  fontFamily: "'Noto Sans','Segoe UI',sans-serif", fontSize: 12,
  padding: '8px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, outline: 'none',
};

const selectStyle: React.CSSProperties = {
  ...S.select, width: '100%', padding: '7px 10px',
  border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12,
};

const inputStyle: React.CSSProperties = {
  ...S.input, padding: '7px 10px',
  border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12,
};

function btn(variant: 'solid' | 'outline' | 'warning' | 'info' | 'danger' | 'success' = 'solid', small = false): React.CSSProperties {
  const BG: Record<string, string> = { solid: COLORS.primary, outline: 'transparent', warning: '#C67C12', info: COLORS.info, danger: COLORS.danger, success: COLORS.success };
  return {
    padding: small ? '3px 9px' : '6px 12px', borderRadius: 5,
    fontSize: small ? 10 : 11, fontWeight: 600, cursor: 'pointer',
    border: variant === 'outline' ? `1.5px solid ${COLORS.primary}` : 'none',
    background: BG[variant] ?? COLORS.primary,
    color: variant === 'outline' ? COLORS.primary : '#fff',
    marginRight: 4, whiteSpace: 'nowrap' as const,
  };
}

function badge(type: string, overrideBg?: string): React.CSSProperties {
  const MAP: Record<string, { bg: string; color: string }> = {
    pending:  { bg: '#9E9E9E', color: '#fff' },
    ec:       { bg: '#1565C0', color: '#fff' },
    approved: { bg: '#2E7D32', color: '#fff' },
    rejected: { bg: '#E53935', color: '#fff' },
  };
  const e = MAP[type] ?? { bg: '#ccc', color: '#333' };
  return { display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700, background: overrideBg ?? e.bg, color: e.color, whiteSpace: 'nowrap' as const };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

type Tab = 'appeal' | 'review' | 'extension';

function tabFromPath(p: string): Tab {
  if (p.includes('/review'))    return 'review';
  if (p.includes('/extension')) return 'extension';
  return 'appeal';
}

// ── Extension form state ───────────────────────────────────────────────────────

interface ExtForm {
  applicationId: string;
  reason:        string;
  extensionDays: number;
  contactEmail:  string;
  justification: string;
}

const BLANK_EXT: ExtForm = { applicationId: '', reason: 'Technical / Lab Delay', extensionDays: 7, contactEmail: '', justification: '' };

// ── Component ──────────────────────────────────────────────────────────────────

export default function ApplicantRequests() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>(tabFromPath(location.pathname));

  // Appeal
  const [appealItems,      setAppealItems]      = useState<AppealItem[]>([]);
  const [appealLoading,    setAppealLoading]    = useState(false);
  const [appealModal,      setAppealModal]      = useState<AppealItem | null>(null);
  const [appealGrounds,    setAppealGrounds]    = useState('');
  const [appealSubmitting, setAppealSubmitting] = useState(false);
  const [appealFile,       setAppealFile]       = useState<string | null>(null);
  const [appealFileName,   setAppealFileName]   = useState('');
  const [appealUploading,  setAppealUploading]  = useState(false);
  const appealFileRef = useRef<HTMLInputElement>(null);

  // Review
  const [reviewItems,      setReviewItems]      = useState<ReviewItem[]>([]);
  const [reviewLoading,    setReviewLoading]    = useState(false);
  const [reviewModal,      setReviewModal]      = useState<ReviewItem | null>(null);
  const [reviewGrounds,    setReviewGrounds]    = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewFile,       setReviewFile]       = useState<string | null>(null);
  const [reviewFileName,   setReviewFileName]   = useState('');
  const [reviewUploading,  setReviewUploading]  = useState(false);
  const reviewFileRef = useRef<HTMLInputElement>(null);

  // Extension
  const [extItems,   setExtItems]   = useState<ExtensionItem[]>([]);
  const [extLoading, setExtLoading] = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [extForm,    setExtForm]    = useState<ExtForm>(BLANK_EXT);
  const [extSubmitting, setExtSubmitting] = useState(false);
  const [myApps,     setMyApps]     = useState<Application[]>([]);

  // ── Loaders ─────────────────────────────────────────────────────────────────

  const loadAppeals = useCallback(async () => {
    setAppealLoading(true);
    try { setAppealItems(await fetchAppeals()); } finally { setAppealLoading(false); }
  }, []);

  const loadReviews = useCallback(async () => {
    setReviewLoading(true);
    try { setReviewItems(await fetchReviews()); } finally { setReviewLoading(false); }
  }, []);

  const loadExtensions = useCallback(async () => {
    setExtLoading(true);
    try { setExtItems(await fetchExtensions()); } finally { setExtLoading(false); }
  }, []);

  useEffect(() => { loadAppeals();    }, [loadAppeals]);
  useEffect(() => { loadReviews();    }, [loadReviews]);
  useEffect(() => { loadExtensions(); }, [loadExtensions]);
  useEffect(() => { fetchMyApplications().then(setMyApps).catch(() => {}); }, []);

  useEffect(() => {
    setActiveTab(tabFromPath(location.pathname));
  }, [location.pathname]);

  // ── Tab switch ───────────────────────────────────────────────────────────────

  function switchTab(t: Tab) {
    setActiveTab(t);
    navigate(`/app/requests/${t}`, { replace: true });
  }

  // ── Appeal file upload ───────────────────────────────────────────────────────

  async function handleAppealFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAppealUploading(true);
    try {
      const url = await uploadFile(file);
      setAppealFile(url);
      setAppealFileName(file.name);
    } catch { toast.error('Upload failed'); }
    finally { setAppealUploading(false); }
  }

  // ── Appeal submit ────────────────────────────────────────────────────────────

  async function handleAppealSubmit() {
    if (!appealModal || !appealGrounds.trim()) return;
    setAppealSubmitting(true);
    try {
      await fileAppeal(appealModal.applicationId, appealGrounds, appealFile);
      setAppealModal(null);
      setAppealGrounds('');
      setAppealFile(null);
      setAppealFileName('');
      toast.success('Appeal submitted successfully');
      await loadAppeals();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to submit appeal');
    } finally { setAppealSubmitting(false); }
  }

  // ── Review file upload ───────────────────────────────────────────────────────

  async function handleReviewFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReviewUploading(true);
    try {
      const url = await uploadFile(file);
      setReviewFile(url);
      setReviewFileName(file.name);
    } catch { toast.error('Upload failed'); }
    finally { setReviewUploading(false); }
  }

  // ── Review submit ────────────────────────────────────────────────────────────

  async function handleReviewSubmit() {
    if (!reviewModal || !reviewGrounds.trim()) return;
    setReviewSubmitting(true);
    try {
      await fileReview(reviewModal.appealId, reviewGrounds, reviewFile);
      setReviewModal(null);
      setReviewGrounds('');
      setReviewFile(null);
      setReviewFileName('');
      await loadReviews();
    } finally { setReviewSubmitting(false); }
  }

  // ── Extension submit ─────────────────────────────────────────────────────────

  async function handleExtSubmit() {
    if (!extForm.applicationId || !extForm.contactEmail || !extForm.justification.trim()) return;
    setExtSubmitting(true);
    try {
      if (editId) {
        await updateExtension(editId, { reason: extForm.reason, extensionDays: extForm.extensionDays, contactEmail: extForm.contactEmail, justification: extForm.justification });
      } else {
        await createExtension(extForm);
      }
      setShowForm(false);
      setEditId(null);
      setExtForm(BLANK_EXT);
      await loadExtensions();
    } finally { setExtSubmitting(false); }
  }

  function startEdit(item: ExtensionItem) {
    setEditId(item.id);
    setExtForm({ applicationId: item.applicationId, reason: item.reason, extensionDays: item.extensionDays, contactEmail: item.contactEmail, justification: item.justification });
    setShowForm(true);
  }

  // ── Stats ────────────────────────────────────────────────────────────────────

  const pendingFiling  = appealItems.filter((a) => a.appealStatus === 'PendingFiling').length;
  const appealPending  = appealItems.filter((a) => a.appealStatus === 'AppealPending').length;
  const reviewPending  = reviewItems.filter((r) => r.reviewStatus === 'PendingReview').length;
  const extApproved    = extItems.filter((e) => e.status === 'Approved').length;
  const extPending     = extItems.filter((e) => e.status === 'Pending').length;
  const extRejected    = extItems.filter((e) => e.status === 'Rejected').length;

  const stats = activeTab === 'appeal'
    ? [
        { label: 'Total Appeals',  value: appealItems.length,                                           color: COLORS.primary, icon: '⚖️' },
        { label: 'Pending Filing', value: pendingFiling,                                                color: COLORS.warning, icon: '⏳' },
        { label: 'Appeal Pending', value: appealPending,                                                color: '#E67E22',      icon: '🔄' },
        { label: 'Rejected',       value: appealItems.filter((a) => a.appealStatus === 'AppealRejected').length, color: COLORS.danger, icon: '❌' },
      ]
    : activeTab === 'review'
    ? [
        { label: 'Total Reviews',   value: reviewItems.length,                                                          color: '#6A0572',      icon: '📋' },
        { label: 'Pending Review',  value: reviewPending,                                                               color: COLORS.warning, icon: '⏳' },
        { label: 'Deadline Passed', value: reviewItems.filter((r) => r.reviewStatus === 'DeadlinePassed').length,       color: COLORS.danger,  icon: '⌛' },
        { label: 'Review Disposed', value: reviewItems.filter((r) => r.reviewStatus === 'ReviewDisposed').length,       color: COLORS.success, icon: '✅' },
      ]
    : [
        { label: 'Total Requests', value: extItems.length, color: COLORS.primary,  icon: '⏱️' },
        { label: 'Pending',        value: extPending,       color: COLORS.warning,  icon: '⏳' },
        { label: 'Approved',       value: extApproved,      color: COLORS.success,  icon: '✅' },
        { label: 'Rejected',       value: extRejected,      color: COLORS.danger,   icon: '❌' },
      ];

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Appeal Modal ────────────────────────────────────────────────────── */}
      {appealModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
            <div style={{ background: COLORS.primary, borderRadius: '12px 12px 0 0', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>File Appeal against Rejection</div>
              <div onClick={() => { setAppealModal(null); setAppealGrounds(''); }} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 20 }}>✕</div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                {([
                  ['Application Ref.', appealModal.ref],
                  ['Company',          appealModal.company],
                  ['Product',          appealModal.product],
                  ['Rejection Date',   fmtDate(appealModal.rejDate)],
                  ['Application Type', appealModal.appType],
                  ['Days Remaining',   `${appealModal.daysLeft} days`],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginTop: 1 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#E8F4FD', border: '1px solid #B3D4F0', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: '#1A5276', marginBottom: 14, lineHeight: 1.6 }}>
                Appeal shall be filed within the permitted period. The appeal will be routed to the <strong>CEO (Appellate Authority)</strong> for decision.
              </div>
              <label style={S.label}>Grounds for Appeal <span style={{ color: COLORS.danger }}>*</span></label>
              <textarea value={appealGrounds} onChange={(e) => setAppealGrounds(e.target.value)} placeholder="State the grounds for your appeal clearly — include specific errors in the rejection decision..." style={{ ...textarea, minHeight: 100, marginBottom: 12 }} />
              <label style={S.label}>Supporting Documents <span style={{ fontWeight: 400, color: COLORS.textMuted }}>(Optional)</span></label>
              <input ref={appealFileRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={handleAppealFileSelect} />
              {appealFile ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6 }}>
                  <span style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>✓ {appealFileName}</span>
                  <button onClick={() => { setAppealFile(null); setAppealFileName(''); if (appealFileRef.current) appealFileRef.current.value = ''; }}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: COLORS.danger, fontSize: 14 }}>✕</button>
                </div>
              ) : (
                <div onClick={() => !appealUploading && appealFileRef.current?.click()}
                  style={{ border: `1.5px dashed ${COLORS.border}`, borderRadius: 8, padding: '14px 16px', textAlign: 'center', background: COLORS.bg, cursor: appealUploading ? 'wait' : 'pointer', fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>
                  {appealUploading ? '⏳ Uploading…' : '📎 Click to attach file (PDF, DOCX, Image — max 5 MB)'}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setAppealModal(null); setAppealGrounds(''); setAppealFile(null); setAppealFileName(''); }} style={{ ...btn('outline'), padding: '8px 18px' }}>Cancel</button>
                <button onClick={handleAppealSubmit} disabled={appealSubmitting || !appealGrounds.trim()}
                  style={{ ...btn(), padding: '8px 18px', opacity: appealGrounds.trim() ? 1 : 0.5 }}>
                  {appealSubmitting ? 'Submitting…' : 'Submit Appeal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Review Modal ─────────────────────────────────────────────────────── */}
      {reviewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
            <div style={{ background: '#6A0572', borderRadius: '12px 12px 0 0', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>File Review against Appellate Order</div>
              <div onClick={() => { setReviewModal(null); setReviewGrounds(''); }} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 20 }}>✕</div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                {([
                  ['Application Ref.',  reviewModal.ref],
                  ['Company',           reviewModal.company],
                  ['Product',           reviewModal.product],
                  ['Appeal Rejected On', fmtDate(reviewModal.appealRejDate)],
                  ['Application Type',  reviewModal.appType],
                  ['Days Remaining',    `${reviewModal.daysLeft} days`],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginTop: 1 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#F3E5F5', border: '1px solid #CE93D8', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: '#6A1B9A', marginBottom: 14, lineHeight: 1.6 }}>
                Review lies to the <strong>Chairperson</strong> (Final Authority) after rejection of appeal. The Chairperson's decision is the <strong>final closure point</strong>.
              </div>
              <label style={S.label}>Grounds for Review <span style={{ color: COLORS.danger }}>*</span></label>
              <textarea value={reviewGrounds} onChange={(e) => setReviewGrounds(e.target.value)} placeholder="State the grounds for your review petition — reference the appellate order date and specific grounds..." style={{ ...textarea, minHeight: 100, marginBottom: 12 }} />
              <label style={S.label}>Supporting Material <span style={{ fontWeight: 400, color: COLORS.textMuted }}>(Optional)</span></label>
              <input ref={reviewFileRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={handleReviewFileSelect} />
              {reviewFile ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6 }}>
                  <span style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>✓ {reviewFileName}</span>
                  <button onClick={() => { setReviewFile(null); setReviewFileName(''); if (reviewFileRef.current) reviewFileRef.current.value = ''; }}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: COLORS.danger, fontSize: 14 }}>✕</button>
                </div>
              ) : (
                <div onClick={() => !reviewUploading && reviewFileRef.current?.click()}
                  style={{ border: `1.5px dashed ${COLORS.border}`, borderRadius: 8, padding: '14px 16px', textAlign: 'center', background: COLORS.bg, cursor: reviewUploading ? 'wait' : 'pointer', fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>
                  {reviewUploading ? '⏳ Uploading…' : '📎 Click to attach file (PDF, DOCX, Image — max 5 MB)'}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setReviewModal(null); setReviewGrounds(''); setReviewFile(null); setReviewFileName(''); }} style={{ ...btn('outline'), padding: '8px 18px' }}>Cancel</button>
                <button onClick={handleReviewSubmit} disabled={reviewSubmitting || !reviewGrounds.trim()}
                  style={{ ...btn(), padding: '8px 18px', background: '#6A0572', opacity: reviewGrounds.trim() ? 1 : 0.5 }}>
                  {reviewSubmitting ? 'Submitting…' : 'Submit Review Petition'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={S.roleLabel}>APPLICANT</div>
          <div style={S.pageTitle}>
            {activeTab === 'appeal' ? 'Appeal against Rejection' : activeTab === 'review' ? 'Review against Appellate Order' : 'Extension of Additional Time'}
          </div>
          <div style={S.pageDesc}>
            {activeTab === 'appeal'
              ? "Appeal lies to CEO (Appellate Authority) after rejection. Routes to CEO's appellate worklist."
              : activeTab === 'review'
              ? 'Review lies to Chairperson (Final Authority) after appeal rejection. Chairperson decision is the final closure point.'
              : 'Request extra time to respond to queries or submit supporting documents.'}
          </div>
        </div>
        {activeTab === 'extension' && (
          <button style={{ ...btn(), fontSize: 12 }} onClick={() => { setShowForm((f) => !f); if (showForm) { setEditId(null); setExtForm(BLANK_EXT); } }}>
            {showForm ? '← Back to List' : '+ Create New Request'}
          </button>
        )}
      </div>

      {/* ── Tab switcher ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 16 }}>
        {(['appeal', 'review', 'extension'] as Tab[]).map((t) => (
          <div key={t} onClick={() => switchTab(t)}
            style={{ padding: '7px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: activeTab === t ? COLORS.primary : COLORS.textMuted, borderBottom: activeTab === t ? `2px solid ${COLORS.primary}` : '2px solid transparent', marginBottom: -1 }}>
            {t === 'appeal' ? 'Appeal against Rejection' : t === 'review' ? 'Review against Appellate Order' : 'Extension of Time'}
          </div>
        ))}
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${s.color}`, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 3, fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search bar (appeal + review only) ───────────────────────────────── */}
      {activeTab !== 'extension' && (
        <div style={{ ...card, padding: '10px 14px', marginBottom: 0, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
          {[
            { label: 'Application No.',      ph: 'APP-2026-…'  },
            { label: 'Company Name',          ph: 'Search…'     },
            { label: 'Rejection Date (From)', ph: 'DD/MM/YYYY'  },
            { label: 'Rejection Date (To)',   ph: 'DD/MM/YYYY'  },
          ].map((f) => (
            <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 9, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</label>
              <input placeholder={f.ph} style={{ ...S.input, width: 155, padding: '5px 8px', fontSize: 11, border: `1px solid ${COLORS.border}`, borderRadius: 5 }} />
            </div>
          ))}
          <button style={{ ...btn('outline'), padding: '5px 12px', fontSize: 11, alignSelf: 'flex-end' }}>Clear</button>
          <button style={{ ...btn(),          padding: '5px 12px', fontSize: 11, alignSelf: 'flex-end' }}>Search</button>
        </div>
      )}

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      <div style={{ ...card, marginTop: 0 }}>

        {/* APPEAL */}
        {activeTab === 'appeal' && (
          appealLoading ? <div style={{ padding: 24, textAlign: 'center', color: COLORS.textMuted }}>Loading…</div> : (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Appeal against Rejection</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Appeal lies to CEO (Appellate Authority) after rejection.</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>{['Sr.','Reference No.','Company Name','Product Name','Type','Food Category','Rejection Date','Days Left','Appeal Status','Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {appealItems.length === 0 && (
                    <tr><td colSpan={10} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 24 }}>No appeals found.</td></tr>
                  )}
                  {appealItems.map((r, i) => {
                    const canFile = r.appealStatus === 'PendingFiling' && r.daysLeft > 0;
                    const badgeType = r.appealStatus === 'PendingFiling' ? 'pending' : r.appealStatus === 'AppealPending' ? 'ec' : r.appealStatus === 'AppealRejected' ? 'rejected' : 'approved';
                    const label    = r.appealStatus === 'PendingFiling' ? 'Pending Filing' : r.appealStatus === 'AppealPending' ? 'Appeal Pending' : r.appealStatus === 'AppealRejected' ? 'Appeal Rejected' : 'Appeal Approved';
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                        <td style={S.td}>{i + 1}</td>
                        <td style={S.td}><span style={{ color: COLORS.primary, fontWeight: 600, fontSize: 11 }}>{r.ref}</span></td>
                        <td style={S.td}><span style={{ fontWeight: 600 }}>{r.company}</span></td>
                        <td style={S.td}><span style={{ fontSize: 11 }}>{r.product}</span></td>
                        <td style={S.td}><span style={badge('ec')}>{r.appType}</span></td>
                        <td style={S.td}>{r.foodCategory}</td>
                        <td style={S.td}><span style={{ fontSize: 11 }}>{fmtDate(r.rejDate)}</span></td>
                        <td style={S.td}>
                          {canFile
                            ? <span style={{ fontSize: 10, fontWeight: 700, color: r.daysLeft <= 7 ? COLORS.danger : COLORS.success, background: r.daysLeft <= 7 ? COLORS.dangerLight : '#E8F5E9', padding: '2px 7px', borderRadius: 4 }}>{r.daysLeft}d left</span>
                            : <span style={{ fontSize: 10, color: COLORS.textMuted }}>—</span>}
                        </td>
                        <td style={S.td}><StatusBadge status={badgeType} label={label} /></td>
                        <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                          <button style={btn('outline', true)}>View</button>
                          {canFile && <button style={btn('warning', true)} onClick={() => setAppealModal(r)}>File Appeal</button>}
                          {r.appealStatus === 'AppealPending'  && <button style={btn('info',    true)}>Track</button>}
                          {r.appealStatus === 'AppealRejected' && <button style={btn('danger',  true)}>View Decision</button>}
                          {r.appealStatus === 'AppealApproved' && <button style={btn('success', true)}>View Decision</button>}
                          <button style={btn('outline', true)}>History</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ))}

        {/* REVIEW */}
        {activeTab === 'review' && (
          reviewLoading ? <div style={{ padding: 24, textAlign: 'center', color: COLORS.textMuted }}>Loading…</div> : (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Review against Appellate Order</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Review lies to Chairperson (Final Authority) after appeal rejection.</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>{['Sr.','Reference No.','Company Name','Product Name','Type','Food Category','Appeal Rejected On','Days Left','Review Status','Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {reviewItems.length === 0 && (
                    <tr><td colSpan={10} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 24 }}>No reviews found.</td></tr>
                  )}
                  {reviewItems.map((r, i) => {
                    const canReview = r.reviewStatus === 'PendingReview' && r.daysLeft > 0;
                    const badgeType = r.reviewStatus === 'PendingReview' ? 'pending' : r.reviewStatus === 'ReviewPending' ? 'ec' : r.reviewStatus === 'DeadlinePassed' ? 'rejected' : 'approved';
                    const label     = r.reviewStatus === 'PendingReview' ? 'Pending Review' : r.reviewStatus === 'ReviewPending' ? 'Review Pending' : r.reviewStatus === 'DeadlinePassed' ? 'Deadline Passed' : 'Review Disposed';
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                        <td style={S.td}>{i + 1}</td>
                        <td style={S.td}><span style={{ color: COLORS.primary, fontWeight: 600, fontSize: 11 }}>{r.ref}</span></td>
                        <td style={S.td}><span style={{ fontWeight: 600 }}>{r.company}</span></td>
                        <td style={S.td}><span style={{ fontSize: 11 }}>{r.product}</span></td>
                        <td style={S.td}><span style={badge('ec')}>{r.appType}</span></td>
                        <td style={S.td}>{r.foodCategory}</td>
                        <td style={S.td}><span style={{ fontSize: 11 }}>{fmtDate(r.appealRejDate)}</span></td>
                        <td style={S.td}>
                          {canReview
                            ? <span style={{ fontSize: 10, fontWeight: 700, color: r.daysLeft <= 7 ? COLORS.danger : '#6A0572', background: r.daysLeft <= 7 ? COLORS.dangerLight : '#F3E5F5', padding: '2px 7px', borderRadius: 4 }}>{r.daysLeft}d left</span>
                            : r.reviewStatus === 'DeadlinePassed'
                            ? <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.danger }}>Expired</span>
                            : <span style={{ fontSize: 10, color: COLORS.textMuted }}>—</span>}
                        </td>
                        <td style={S.td}>
                          <span style={{ ...badge(badgeType), ...(badgeType === 'pending' ? { background: '#6A0572' } : {}) }}>{label}</span>
                        </td>
                        <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                          <button style={btn('outline', true)}>View</button>
                          {canReview && <button style={btn('info', true)} onClick={() => setReviewModal(r)}>File Review</button>}
                          {r.reviewStatus === 'ReviewPending'  && <button style={btn('info',    true)}>Track</button>}
                          {r.reviewStatus === 'DeadlinePassed' && <button style={btn('outline', true)}>Expired</button>}
                          <button style={btn('outline', true)}>History</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ))}

        {/* EXTENSION */}
        {activeTab === 'extension' && (
          extLoading ? <div style={{ padding: 24, textAlign: 'center', color: COLORS.textMuted }}>Loading…</div> :
          showForm ? (
            <>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: COLORS.text }}>{editId ? 'Edit Extension Request' : 'New Extension Request'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={S.label}>APPLICATION REFERENCE NO.</label>
                  <select style={selectStyle} value={extForm.applicationId} onChange={(e) => setExtForm((f) => ({ ...f, applicationId: e.target.value }))} disabled={!!editId}>
                    <option value="">— Select application —</option>
                    {myApps.filter((a) => a.stage !== 'Draft' && a.stage !== 'Approved' && a.stage !== 'Rejected').map((a) => (
                      <option key={a.id} value={a.id}>{a.referenceNumber} — {a.productName ?? a.foodCategory}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={S.label}>REASON FOR EXTENSION</label>
                  <select style={selectStyle} value={extForm.reason} onChange={(e) => setExtForm((f) => ({ ...f, reason: e.target.value }))}>
                    <option>Technical / Lab Delay</option>
                    <option>Document Collection</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>REQUESTED EXTENSION PERIOD</label>
                  <select style={selectStyle} value={extForm.extensionDays} onChange={(e) => setExtForm((f) => ({ ...f, extensionDays: Number(e.target.value) }))}>
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>CONTACT EMAIL FOR CORRESPONDENCE</label>
                  <input placeholder="email@company.com" style={inputStyle} value={extForm.contactEmail} onChange={(e) => setExtForm((f) => ({ ...f, contactEmail: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>DETAILED JUSTIFICATION</label>
                <textarea placeholder="Provide a clear explanation for the requested extension..." style={{ ...textarea, minHeight: 80 }} value={extForm.justification} onChange={(e) => setExtForm((f) => ({ ...f, justification: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={S.label}>SUPPORTING DOCUMENTS</label>
                <div style={{ border: `2px dashed ${COLORS.border}`, borderRadius: 8, padding: 18, textAlign: 'center', background: COLORS.bg, cursor: 'pointer' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>⬆️</div>
                  <div style={{ fontSize: 12, color: COLORS.primary, fontWeight: 600 }}>Upload Documents</div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>PDF, DOCX, JPG — Max 5MB each</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...btn(), padding: '9px 20px' }} disabled={extSubmitting} onClick={handleExtSubmit}>
                  {extSubmitting ? 'Submitting…' : 'Submit Request'}
                </button>
                <button style={{ ...btn('outline'), padding: '9px 20px' }} onClick={() => { setShowForm(false); setEditId(null); setExtForm(BLANK_EXT); }}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>My Extension Requests</div>
              <table style={tableStyle}>
                <thead>
                  <tr>{['Sr. No.','Reference No.','Application Type','Food Category','Request Date','Status','Authority Remarks','Documents','Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {extItems.length === 0 && (
                    <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 24 }}>No extension requests yet. Click "+ Create New Request" to start one.</td></tr>
                  )}
                  {extItems.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                      <td style={S.td}>{i + 1}</td>
                      <td style={S.td}><span style={{ color: COLORS.primary, fontWeight: 600 }}>{r.application.referenceNumber}</span></td>
                      <td style={S.td}>{r.application.applicationType}</td>
                      <td style={S.td}>{r.application.foodCategory}</td>
                      <td style={S.td}>{fmtDate(r.createdAt)}</td>
                      <td style={S.td}><StatusBadge status={r.status === 'Pending' ? 'pending' : r.status === 'Approved' ? 'approved' : 'rejected'} label={r.status} /></td>
                      <td style={S.td}><span style={{ fontSize: 11, color: COLORS.textMuted }}>{r.authorityRemarks ?? '—'}</span></td>
                      <td style={S.td}><button style={btn('outline', true)}>View Docs</button></td>
                      <td style={S.td}>
                        <button style={btn('outline', true)}>View History</button>
                        {r.status === 'Pending' && <button style={btn('solid', true)} onClick={() => startEdit(r)}>Edit</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )
        )}

      </div>
    </div>
  );
}
