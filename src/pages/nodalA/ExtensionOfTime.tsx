// Mirrors ExtensionScreen from mock (App.jsx L15755).
// Wired to real API: fetchNodalAExtensionRequests(), nodalAGrantExtension(), nodalARejectExtension(), nodalACreateExtension().
import { useState, useEffect, useCallback } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { COLORS, S } from '@/utils/colors';
import { API_BASE } from '@/services/api';
import {
  fetchNodalAExtensionRequests, nodalAGrantExtension, nodalARejectExtension, nodalACreateExtension,
} from '@/services/officer.service';
import { fetchNodalAAll } from '@/services/officer.service';
import type { ExtensionRecord } from '@/services/officer.service';
import type { Application } from '@/services/application.service';


function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const TYPE_LABELS: Record<string, string> = {
  NSF: 'NSF', ClaimApproval: 'Claim Approval', AyurvedaAahara: 'Ayurveda Aahara', RPET: 'rPET', AnyOther: 'Any Other',
};

const BLANK_FORM = { applicationId: '', contactEmail: '', justification: '' };

function fieldLabel(text: string) {
  return <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>{text}</label>;
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: `1px solid ${COLORS.border}`, borderRadius: 6,
  padding: '8px 10px', fontSize: 12, boxSizing: 'border-box',
  fontFamily: "'Noto Sans','Segoe UI',sans-serif",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, background: '#fff', cursor: 'pointer',
};

export default function ExtensionOfTime() {
  const navigate = useNavigate();
  const [requests,     setRequests]     = useState<ExtensionRecord[]>([]);
  const [allApps,      setAllApps]      = useState<Application[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [remarksModal, setRemarksModal] = useState<string | null>(null);

  // Grant/Reject action modal
  const [actionModal, setActionModal]   = useState<{ id: string; type: 'grant' | 'reject' } | null>(null);
  const [actionRemarks, setActionRemarks] = useState('');
  const [actioning,    setActioning]    = useState(false);

  // Create form
  const [showCreate, setShowCreate]     = useState(false);
  const [form,       setForm]           = useState(BLANK_FORM);
  const [creating,   setCreating]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reqs, apps] = await Promise.all([fetchNodalAExtensionRequests(), fetchNodalAAll()]);
      setRequests(reqs);
      setAllApps(apps);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = requests;

  async function handleAction() {
    if (!actionModal) return;
    setActioning(true);
    try {
      if (actionModal.type === 'grant') {
        await nodalAGrantExtension(actionModal.id, actionRemarks || undefined);
        toast.success('Extension request granted.');
      } else {
        await nodalARejectExtension(actionModal.id, actionRemarks || undefined);
        toast.success('Extension request rejected.');
      }
      setActionModal(null);
      setActionRemarks('');
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Action failed');
    } finally { setActioning(false); }
  }

  async function handleCreate() {
    if (!form.applicationId) { toast.error('Please select an application'); return; }
    if (form.justification.trim().length < 10) { toast.error('Justification must be at least 10 characters'); return; }
    setCreating(true);
    try {
      await nodalACreateExtension({
        applicationId: form.applicationId,
        reason:        'Nodal Officer Extension',
        extensionDays: 30,
        contactEmail:  form.contactEmail,
        justification: form.justification,
      });
      toast.success('Extension request created.');
      setShowCreate(false);
      setForm(BLANK_FORM);
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Could not create extension request');
    } finally { setCreating(false); }
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={S.roleLabel}>NODAL OFFICER A</div>
          <div style={S.pageTitle}>Extension of Time Requests</div>
          <div style={S.pageDesc}>Manage applicant requests for additional time. You may also create manual or assisted extension requests on behalf of applicants.</div>
        </div>
        <button
          onClick={() => { setShowCreate((v) => !v); setForm(BLANK_FORM); }}
          style={{ padding: '8px 16px', background: showCreate ? 'transparent' : COLORS.primary, color: showCreate ? COLORS.primary : '#fff', border: `1.5px solid ${COLORS.primary}`, borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          {showCreate ? '← Back to List' : '+ Create Extension Request'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '20px 22px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 16 }}>CREATE EXTENSION REQUEST</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              {fieldLabel('Application Reference No.')}
              <select style={selectStyle} value={form.applicationId} onChange={(e) => setForm((f) => ({ ...f, applicationId: e.target.value }))}>
                <option value="">— Select application —</option>
                {allApps.filter((a) => a.stage === 'QuerySent').map((a) => (
                  <option key={a.id} value={a.id}>{a.referenceNumber} — {a.companyName}</option>
                ))}
              </select>
            </div>
            <div>
              {fieldLabel('Extension Period')}
              <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>30 Days</span>
                <span style={{ fontSize: 10, color: COLORS.textMuted }}>Fixed — standard extension period</span>
              </div>
            </div>
            <div>
              {fieldLabel('Contact Email')}
              <input style={inputStyle} placeholder="email@company.com" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            {fieldLabel('Detailed Justification *')}
            <textarea
              rows={4}
              placeholder="Provide a clear explanation for the requested extension…"
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80, fontFamily: "'Noto Sans','Segoe UI',sans-serif" }}
              value={form.justification}
              onChange={(e) => setForm((f) => ({ ...f, justification: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{ padding: '8px 18px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1 }}
              disabled={creating} onClick={handleCreate}>
              {creating ? 'Submitting…' : 'Submit Extension Request'}
            </button>
            <button
              style={{ padding: '8px 18px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
              onClick={() => { setShowCreate(false); setForm(BLANK_FORM); }}>
              Cancel
            </button>
          </div>
        </div>
      )}


      {/* Table card */}
      {!showCreate && (
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Extension Requests
              {!loading && <span style={{ marginLeft: 8, background: COLORS.infoLight, color: COLORS.info, borderRadius: 10, fontSize: 10, padding: '1px 7px', fontWeight: 700 }}>{visible.length}</span>}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['App. Ref. No.', 'Company / Org.', 'Product', 'Type', 'Application Date', 'Requested Date', 'Days Req.', 'Status', 'Justification', 'Supporting Doc', 'Action'].map((h) => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={11} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>}
                {!loading && visible.length === 0 && <tr><td colSpan={11} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No extension requests found.</td></tr>}
                {visible.map((r, i) => {
                  const isApproved = r.status === 'Approved';
                  const badgeBg    = r.status === 'Pending' ? COLORS.warningLight : isApproved ? COLORS.successLight : COLORS.dangerLight;
                  const badgeFg    = r.status === 'Pending' ? COLORS.warning      : isApproved ? COLORS.success      : COLORS.danger;
                  return (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                      <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{r.application.referenceNumber}</td>
                      <td style={S.td}>{r.application.companyName}</td>
                      <td style={S.td}>{r.application.productName ?? '—'}</td>
                      <td style={S.td}>{TYPE_LABELS[r.application.applicationType] ?? r.application.applicationType}</td>
                      <td style={S.td}>{fmtDate(r.application.submittedAt)}</td>
                      <td style={S.td}>{fmtDate(r.createdAt)}</td>
                      <td style={S.td}>{r.extensionDays} days</td>
                      <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: badgeBg, color: badgeFg }}>{r.status}</span></td>
                      <td style={S.td}>
                        <span title={r.justification} style={{ color: COLORS.textMuted, cursor: 'pointer', textDecoration: 'underline', fontSize: 11 }} onClick={() => setRemarksModal(r.justification)}>
                          View
                        </span>
                        {r.authorityRemarks && (
                          <span style={{ marginLeft: 6, fontSize: 10, color: COLORS.textMuted }}>· Remarks: {r.authorityRemarks}</span>
                        )}
                      </td>
                      <td style={S.td}>
                        {r.supportingDocument ? (
                          <a href={`${API_BASE}/uploads/${r.supportingDocument}`} target="_blank" rel="noreferrer"
                            style={{ color: COLORS.primary, fontWeight: 600, textDecoration: 'none', fontSize: 12 }}>
                            📎 View
                          </a>
                        ) : <span style={{ color: COLORS.textMuted, fontSize: 11 }}>—</span>}
                      </td>
                      <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => navigate(`/nodal/scrutiny/${r.application.id}`)}
                            style={{ padding: '4px 10px', background: 'transparent', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            View
                          </button>
                          {r.status === 'Pending' ? (
                            <>
                              <button
                                onClick={() => { setActionModal({ id: r.id, type: 'grant' }); setActionRemarks(''); }}
                                style={{ padding: '4px 10px', background: COLORS.success, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                Grant
                              </button>
                              <button
                                onClick={() => { setActionModal({ id: r.id, type: 'reject' }); setActionRemarks(''); }}
                                style={{ padding: '4px 10px', background: 'transparent', color: COLORS.danger, border: `1px solid ${COLORS.danger}`, borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>
                                Reject
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: 11, color: COLORS.textMuted, alignSelf: 'center' }}>{isApproved ? '✓ Granted' : '✗ Rejected'}</span>
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
      )}

      {/* Justification remarks modal */}
      {remarksModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 24, maxWidth: 480, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>Applicant Justification</div>
            <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.6, marginBottom: 20 }}>{remarksModal}</p>
            <button onClick={() => setRemarksModal(null)} style={{ padding: '7px 22px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {/* Grant / Reject action modal */}
      {actionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 28, maxWidth: 440, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.22)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>
              {actionModal.type === 'grant' ? '✅ Grant Extension' : '✗ Reject Extension'}
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16, lineHeight: 1.5 }}>
              {actionModal.type === 'grant'
                ? 'Confirm granting additional time to the applicant. Optionally add remarks.'
                : 'Confirm rejecting this extension request. Optionally add remarks for the applicant.'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>Remarks (optional)</label>
              <textarea
                rows={3}
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder="Add any remarks for the applicant…"
                style={{ width: '100%', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 12, resize: 'vertical', boxSizing: 'border-box', fontFamily: "'Noto Sans','Segoe UI',sans-serif" }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setActionModal(null); setActionRemarks(''); }}
                style={{ padding: '8px 18px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleAction} disabled={actioning}
                style={{ padding: '8px 20px', background: actionModal.type === 'grant' ? COLORS.success : COLORS.danger, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: actioning ? 'not-allowed' : 'pointer', opacity: actioning ? 0.7 : 1 }}>
                {actioning ? 'Processing…' : actionModal.type === 'grant' ? 'Confirm Grant' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
