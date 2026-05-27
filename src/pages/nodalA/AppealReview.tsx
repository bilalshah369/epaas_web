// Mirrors AppealReviewScreen from mock (App.jsx L15660).
// Wired to real API: fetchNodalAAppealReview() → combined appeal + review records.
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { COLORS, S } from '@/utils/colors';
import {
  fetchNodalAAppealReview, nodalAForwardAppealToCEO, nodalAForwardReviewToChairperson,
  nodalADispatchAppealDecision, nodalADispatchReviewDecision,
  uploadAppealAuthorityDoc, uploadReviewAuthorityDoc,
} from '@/services/officer.service';
import { uploadFile } from '@/services/application.service';
import { API_BASE } from '@/services/api';
import type { AppealReviewRecord } from '@/services/officer.service';

type TypeFilter = 'All' | 'Appeal' | 'Review';

const FILTERS = [
  { label: 'Application No.',                       placeholder: 'EPAAS-…', type: 'text' },
  { label: 'Company / Org Name',                    placeholder: 'Search…', type: 'text' },
  { label: 'Date of Rejection / Appellate Order',   type: 'date' },
  { label: 'From Date',                             type: 'date' },
  { label: 'To Date',                               type: 'date' },
];

function daysLeft(filedAt: string): number {
  const deadline = new Date(filedAt).getTime() + 30 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((deadline - Date.now()) / (24 * 60 * 60 * 1000)));
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AppealReview() {
  const navigate = useNavigate();
  const [typeFilter,  setTypeFilter]  = useState<TypeFilter>('All');
  const [records,     setRecords]     = useState<AppealReviewRecord[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [forwarding,  setForwarding]  = useState<string | null>(null);
  const [viewRecord,  setViewRecord]  = useState<AppealReviewRecord | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [authorityFile, setAuthorityFile] = useState<string | null>(null);
  const [authorityFileName, setAuthorityFileName] = useState<string>('');
  const authorityFileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRecords(await fetchNodalAAppealReview()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDispatch(r: AppealReviewRecord) {
    setDispatching(r.id);
    try {
      if (r.type === 'Appeal') {
        await nodalADispatchAppealDecision(r.id);
        toast.success('Appeal decision dispatched to applicant');
      } else {
        await nodalADispatchReviewDecision(r.id);
        toast.success('Review decision dispatched to applicant');
      }
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Dispatch failed');
    } finally { setDispatching(null); }
  }

  async function handleForward(r: AppealReviewRecord) {
    setForwarding(r.id);
    try {
      if (r.type === 'Appeal') {
        await nodalAForwardAppealToCEO(r.id);
        toast.success('Appeal forwarded to CEO');
      } else {
        await nodalAForwardReviewToChairperson(r.id);
        toast.success('Review petition forwarded to Chairperson');
      }
      await load();
    } catch (err: unknown) {
      const d = (err as any)?.response?.data;
      toast.error(d?.message ?? d?.error ?? 'Forward failed');
    } finally { setForwarding(null); }
  }

  async function handleAuthorityFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !viewRecord) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setAuthorityFile(url);
      setAuthorityFileName(file.name);
    } catch {
      toast.error('Upload failed');
    } finally { setUploading(false); }
  }

  async function handleSaveAuthorityDoc() {
    if (!viewRecord || !authorityFile) return;
    setUploading(true);
    try {
      if (viewRecord.type === 'Appeal') {
        await uploadAppealAuthorityDoc(viewRecord.id, authorityFile);
      } else {
        await uploadReviewAuthorityDoc(viewRecord.id, authorityFile);
      }
      toast.success('Authority document saved');
      await load();
      setViewRecord((prev) => prev ? { ...prev, authorityDocUrl: authorityFile } : null);
    } catch {
      toast.error('Failed to save document');
    } finally { setUploading(false); }
  }

  function openView(r: AppealReviewRecord) {
    setViewRecord(r);
    setAuthorityFile(r.authorityDocUrl ?? null);
    setAuthorityFileName('');
  }

  function closeView() {
    setViewRecord(null);
    setAuthorityFile(null);
    setAuthorityFileName('');
    if (authorityFileRef.current) authorityFileRef.current.value = '';
  }

  const visible = typeFilter === 'All' ? records : records.filter((r) => r.type === typeFilter);

  return (
    <div>
      {/* View Purpose Modal */}
      {viewRecord && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
            {/* Header */}
            <div style={{ background: viewRecord.type === 'Appeal' ? COLORS.primary : '#6A0572', borderRadius: '12px 12px 0 0', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                {viewRecord.type === 'Appeal' ? '⚖️ Purpose of Appeal' : '📋 Purpose of Review'}
              </div>
              <button onClick={closeView} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 20, padding: 0 }}>✕</button>
            </div>

            <div style={{ padding: 20 }}>
              {/* Application info */}
              <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                {([
                  ['Application No.', viewRecord.application.referenceNumber],
                  ['Company / Org.',   viewRecord.application.companyName],
                  ['Product',          viewRecord.application.productName ?? '—'],
                  ['Filed On',         fmtDate(viewRecord.filedAt)],
                  ['Status',           viewRecord.status],
                  ['Days Remaining',   `${daysLeft(viewRecord.filedAt)} days`],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Grounds */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  Grounds for {viewRecord.type}
                </div>
                <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 14px', fontSize: 12, color: COLORS.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {viewRecord.grounds}
                </div>
              </div>

              {/* Applicant document */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  Applicant Supporting Document
                </div>
                {viewRecord.attachmentUrl ? (
                  <a
                    href={`${API_BASE}/uploads/${viewRecord.attachmentUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: COLORS.primaryLight, color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}
                  >
                    ⬇ Download Document
                  </a>
                ) : (
                  <div style={{ fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' }}>No document attached by applicant.</div>
                )}
              </div>

              {/* Authority document upload */}
              <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  Authority Response Document
                </div>

                {/* Existing authority doc */}
                {(viewRecord.authorityDocUrl || authorityFile) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <a
                      href={`${API_BASE}/uploads/${authorityFile ?? viewRecord.authorityDocUrl ?? ''}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
                    >
                      ⬇ {authorityFileName || 'Download Authority Document'}
                    </a>
                    <span style={{ fontSize: 10, color: COLORS.success, fontWeight: 600 }}>✓ Uploaded</span>
                  </div>
                )}

                {/* Upload new */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    ref={authorityFileRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={handleAuthorityFileSelect}
                  />
                  <button
                    onClick={() => authorityFileRef.current?.click()}
                    disabled={uploading}
                    style={{ padding: '7px 14px', background: 'none', border: `1.5px dashed ${COLORS.border}`, borderRadius: 6, fontSize: 12, cursor: uploading ? 'not-allowed' : 'pointer', color: COLORS.text }}
                  >
                    {uploading ? '⏳ Uploading…' : '📎 Attach Document (PDF / DOCX / Image)'}
                  </button>
                  {authorityFile && authorityFileName && (
                    <button
                      onClick={handleSaveAuthorityDoc}
                      disabled={uploading}
                      style={{ padding: '7px 14px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer' }}
                    >
                      {uploading ? '…' : '💾 Save Document'}
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>
                  Upload the authority's response / decision document for this {viewRecord.type.toLowerCase()}.
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 20px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={closeView} style={{ padding: '7px 20px', background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div style={{ marginBottom: 16 }}>
        <div style={S.pageDesc}>Appeal against rejection orders and review against appellate orders.</div>
      </div>

      {/* Type filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['All', 'Appeal', 'Review'] as TypeFilter[]).map((f) => (
          <button key={f} onClick={() => setTypeFilter(f)}
            style={{ padding: '6px 16px', background: typeFilter === f ? COLORS.primary : 'transparent', color: typeFilter === f ? '#fff' : COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
        {FILTERS.map((f) => (
          <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140, flex: '1 1 140px' }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.label}</label>
            {f.type === 'date' ? (
              <input type="date" style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11 }} />
            ) : (
              <input placeholder={f.placeholder ?? ''} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11 }} />
            )}
          </div>
        ))}
        <button style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontSize: 11, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-end' }}>Search</button>
        <button style={{ background: 'none', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer', alignSelf: 'flex-end' }}>Reset</button>
      </div>

      {/* Table card */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Appeal &amp; Review Requests
            {!loading && <span style={{ marginLeft: 8, background: COLORS.infoLight, color: COLORS.info, borderRadius: 10, fontSize: 10, padding: '1px 7px', fontWeight: 700 }}>{visible.length}</span>}
          </span>
          <button style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Sr. No.', 'Application No.', 'Company / Org.', 'Food Category', 'Product Name', 'Request Date', 'Days Remaining', 'Type', 'Action'].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>}
              {!loading && visible.length === 0 && <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No appeal or review requests found.</td></tr>}
              {visible.map((r, i) => {
                const left = daysLeft(r.filedAt);
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{r.application.referenceNumber}</td>
                    <td style={S.td}>{r.application.companyName}</td>
                    <td style={S.td}>{r.application.foodCategory}</td>
                    <td style={S.td}>{r.application.productName ?? '—'}</td>
                    <td style={S.td}>{fmtDate(r.filedAt)}</td>
                    <td style={{ ...S.td, color: left <= 5 ? COLORS.danger : COLORS.text, fontWeight: left <= 5 ? 700 : 400 }}>{left} days</td>
                    <td style={S.td}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: r.type === 'Appeal' ? COLORS.warningLight : COLORS.infoLight, color: r.type === 'Appeal' ? COLORS.warning : COLORS.info }}>
                        {r.type}
                      </span>
                    </td>
                    <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button onClick={() => openView(r)}
                          style={{ padding: '4px 12px', background: 'transparent', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                          View Purpose
                        </button>
                        <button onClick={() => navigate(`/nodal/scrutiny/${r.application.id}`)}
                          style={{ padding: '4px 12px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                          Application
                        </button>
                        {/* Forward to CEO — appeal is pending at Nodal before CEO has seen it */}
                        {r.type === 'Appeal' && r.status === 'AppealPending' && r.application.stage === 'WithNodalOfficerA' && (
                          <button
                            onClick={() => handleForward(r)}
                            disabled={forwarding === r.id}
                            style={{ padding: '4px 12px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: forwarding === r.id ? 'not-allowed' : 'pointer', opacity: forwarding === r.id ? 0.6 : 1 }}>
                            {forwarding === r.id ? '…' : 'Forward to CEO'}
                          </button>
                        )}
                        {/* Forward to Chairperson — review petition is pending at Nodal */}
                        {r.type === 'Review' && r.status === 'ReviewPending' && r.application.stage === 'WithNodalOfficerA' && (
                          <button
                            onClick={() => handleForward(r)}
                            disabled={forwarding === r.id}
                            style={{ padding: '4px 12px', background: '#6A0572', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: forwarding === r.id ? 'not-allowed' : 'pointer', opacity: forwarding === r.id ? 0.6 : 1 }}>
                            {forwarding === r.id ? '…' : 'Forward to Chairperson'}
                          </button>
                        )}
                        {/* Dispatch — after CEO/Chairperson has decided and app is back at Nodal */}
                        {((r.type === 'Appeal' && (r.status === 'AppealApproved' || r.status === 'AppealRejected')) ||
                          (r.type === 'Review' && r.status === 'ReviewDisposed')) &&
                          r.application.stage === 'WithNodalOfficerA' && (
                          <button
                            onClick={() => handleDispatch(r)}
                            disabled={dispatching === r.id}
                            style={{ padding: '4px 12px', background: COLORS.success, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: dispatching === r.id ? 'not-allowed' : 'pointer', opacity: dispatching === r.id ? 0.6 : 1 }}>
                            {dispatching === r.id ? '…' : '📨 Dispatch'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
