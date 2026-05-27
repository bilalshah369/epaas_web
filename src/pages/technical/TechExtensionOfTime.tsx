// Technical Officer — Extension of Time (/technical/extension)
import { useState, useEffect, useCallback } from 'react';
import { COLORS, S } from '@/utils/colors';
import { fetchTechnicalExtensionRequests, technicalGrantExtension, technicalRejectExtension } from '@/services/technical.service';
import type { ExtensionRecord } from '@/services/officer.service';
import { API_BASE } from '@/services/api';
import toast from 'react-hot-toast';

type StatusFilter = 'Pending' | 'Completed';

const TYPE_LABELS: Record<string, string> = { NSF: 'NSF', ClaimApproval: 'Claim Approval', AyurvedaAahara: 'Ayurveda Aahara', RPET: 'rPET', Vegan: 'Vegan', AnyOther: 'Any Other' };

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TechExtensionOfTime() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Pending');
  const [requests,     setRequests]     = useState<ExtensionRecord[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [remarksModal, setRemarksModal] = useState<string | null>(null);
  const [historyModal, setHistoryModal] = useState<ExtensionRecord | null>(null);
  const [actionModal,  setActionModal]  = useState<{ id: string; type: 'grant' | 'reject' } | null>(null);
  const [actionRemarks, setActionRemarks] = useState('');
  const [actioning,    setActioning]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRequests(await fetchTechnicalExtensionRequests()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = statusFilter === 'Pending'
    ? requests.filter((r) => r.status === 'Pending')
    : requests.filter((r) => r.status === 'Approved' || r.status === 'Rejected');

  async function handleAction() {
    if (!actionModal) return;
    setActioning(true);
    try {
      if (actionModal.type === 'grant') {
        await technicalGrantExtension(actionModal.id, actionRemarks || undefined);
        toast.success('Extension request granted.');
      } else {
        await technicalRejectExtension(actionModal.id, actionRemarks || undefined);
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

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={S.pageDesc}>Manage applicant requests for additional time to respond to queries or submit documents.</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 600 }}>Status:</span>
        {(['Pending', 'Completed'] as StatusFilter[]).map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)}
            style={{ padding: '6px 16px', background: statusFilter === f ? COLORS.primary : 'transparent', color: statusFilter === f ? '#fff' : COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Extension Requests
            {!loading && <span style={{ marginLeft: 8, background: statusFilter === 'Pending' ? COLORS.warningLight : COLORS.successLight, color: statusFilter === 'Pending' ? COLORS.warning : COLORS.success, borderRadius: 10, fontSize: 10, padding: '1px 7px', fontWeight: 700 }}>{visible.length}</span>}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['S. No.', 'App. Ref. No.', 'Company / Org', 'Product', 'Category', 'App. Date', 'Requested On', 'Status', 'Applicant Remarks', 'Supporting Doc', 'History', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={12} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>}
              {!loading && visible.length === 0 && <tr><td colSpan={12} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No {statusFilter.toLowerCase()} extension requests.</td></tr>}
              {visible.map((r, i) => {
                const isApproved = r.status === 'Approved';
                const bg = r.status === 'Pending' ? COLORS.warningLight : isApproved ? COLORS.successLight : COLORS.dangerLight;
                const fg = r.status === 'Pending' ? COLORS.warning      : isApproved ? COLORS.success      : COLORS.danger;
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{r.application.referenceNumber}</td>
                    <td style={S.td}>{r.application.companyName}</td>
                    <td style={S.td}>{r.application.productName ?? '—'}</td>
                    <td style={S.td}>{TYPE_LABELS[r.application.applicationType] ?? r.application.applicationType}</td>
                    <td style={S.td}>{fmtDate(r.application.submittedAt)}</td>
                    <td style={S.td}>{fmtDate(r.createdAt)}</td>
                    <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: bg, color: fg }}>{r.status}</span></td>
                    <td style={S.td}>
                      <span style={{ color: COLORS.primary, cursor: 'pointer', textDecoration: 'underline', fontSize: 11 }} onClick={() => setRemarksModal(r.justification)}>View</span>
                    </td>
                    <td style={S.td}>
                      {r.supportingDocument ? (
                        <a href={`${API_BASE}/uploads/${r.supportingDocument}`} target="_blank" rel="noreferrer"
                          style={{ color: COLORS.primary, fontWeight: 600, textDecoration: 'none', fontSize: 12 }}>
                          📎 View Doc
                        </a>
                      ) : <span style={{ color: COLORS.textMuted, fontSize: 11 }}>—</span>}
                    </td>
                    <td style={S.td}>
                      <span style={{ color: COLORS.primary, cursor: 'pointer', fontWeight: 600, fontSize: 11 }} onClick={() => setHistoryModal(r)}>📋 History</span>
                    </td>
                    <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                      {r.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: 4 }}>
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
                        </div>
                      ) : <span style={{ fontSize: 11, color: COLORS.textMuted }}>{isApproved ? 'Granted' : 'Rejected'}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Applicant Remarks Modal */}
      {remarksModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 24, maxWidth: 480, width: '90%' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>Applicant Remarks</div>
            <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.6, marginBottom: 20 }}>{remarksModal}</p>
            <button onClick={() => setRemarksModal(null)} style={{ padding: '7px 22px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 24, maxWidth: 520, width: '90%' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>Extension Request History</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 12 }}>{historyModal.application.referenceNumber} — {historyModal.application.companyName}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.primary, marginTop: 3, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>Extension Request Submitted</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{fmtDate(historyModal.createdAt)}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Reason: {historyModal.justification}</div>
                </div>
              </div>
              {historyModal.status !== 'Pending' && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: historyModal.status === 'Approved' ? COLORS.success : COLORS.danger, marginTop: 3, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: historyModal.status === 'Approved' ? COLORS.success : COLORS.danger }}>
                      {historyModal.status === 'Approved' ? '✓ Granted' : '✗ Rejected'} by Technical Officer
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>{fmtDate(historyModal.updatedAt)}</div>
                    {historyModal.authorityRemarks && (
                      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Remarks: {historyModal.authorityRemarks}</div>
                    )}
                  </div>
                </div>
              )}
              {historyModal.status === 'Pending' && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.warning, marginTop: 3, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.warning }}>Awaiting Decision</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>Pending review by Technical Officer</div>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setHistoryModal(null)} style={{ marginTop: 20, padding: '7px 22px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {/* Grant / Reject Confirmation Modal */}
      {actionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 24, maxWidth: 460, width: '90%' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>
              {actionModal.type === 'grant' ? '✅ Grant Extension' : '✗ Reject Extension'}
            </div>
            <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.6, marginBottom: 16 }}>
              {actionModal.type === 'grant'
                ? 'Confirm granting additional time to the applicant. Optionally add remarks.'
                : 'Confirm rejecting this extension request. Optionally add remarks for the applicant.'}
            </p>
            <label style={S.label}>Remarks (optional)</label>
            <textarea
              rows={3}
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              placeholder="Add any remarks…"
              style={{ ...S.input, width: '100%', resize: 'vertical', marginBottom: 16, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setActionModal(null); setActionRemarks(''); }}
                style={{ padding: '8px 20px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
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
