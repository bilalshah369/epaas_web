// Technical Officer — Extension of Time (/technical/extension)
import { useState, useEffect, useCallback } from 'react';
import { COLORS, S } from '@/utils/colors';
import { fetchTechnicalExtensionRequests } from '@/services/technical.service';
import type { ExtensionRecord } from '@/services/officer.service';

type StatusFilter = 'Pending' | 'Completed';

const TYPE_LABELS: Record<string, string> = { NSF: 'NSF', ClaimApproval: 'Claim Approval', AyurvedaAahara: 'Ayurveda Aahara', RPET: 'rPET', AnyOther: 'Any Other' };

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TechExtensionOfTime() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Pending');
  const [requests,     setRequests]     = useState<ExtensionRecord[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [remarksModal, setRemarksModal] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRequests(await fetchTechnicalExtensionRequests()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = statusFilter === 'Pending'
    ? requests.filter((r) => r.status === 'Pending')
    : requests.filter((r) => r.status === 'Approved' || r.status === 'Rejected');

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={S.roleLabel}>TECHNICAL OFFICER</div>
        <div style={S.pageTitle}>Applicant Request for Extension of Additional Time</div>
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
          <button style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['App. Ref. No.', 'Company / Org.', 'Product', 'Product Category', 'Application Date', 'Requested Date', 'Status', 'Applicant Remarks', 'Documents', 'History', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={11} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>}
              {!loading && visible.length === 0 && <tr><td colSpan={11} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No {statusFilter.toLowerCase()} extension requests.</td></tr>}
              {visible.map((r, i) => {
                const isApproved = r.status === 'Approved';
                const bg = r.status === 'Pending' ? COLORS.warningLight : isApproved ? COLORS.successLight : COLORS.dangerLight;
                const fg = r.status === 'Pending' ? COLORS.warning      : isApproved ? COLORS.success      : COLORS.danger;
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{r.application.referenceNumber}</td>
                    <td style={S.td}>{r.application.companyName}</td>
                    <td style={S.td}>{r.application.productName ?? '—'}</td>
                    <td style={S.td}>{TYPE_LABELS[r.application.applicationType] ?? r.application.applicationType}</td>
                    <td style={S.td}>{fmtDate(r.application.submittedAt)}</td>
                    <td style={S.td}>{fmtDate(r.createdAt)}</td>
                    <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: bg, color: fg }}>{r.status}</span></td>
                    <td style={S.td}><span style={{ color: COLORS.textMuted, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setRemarksModal(r.justification)}>View</span></td>
                    <td style={S.td}><span style={{ color: COLORS.primary, cursor: 'pointer', fontWeight: 600 }}>📎 Docs</span></td>
                    <td style={S.td}><span style={{ color: COLORS.primary, cursor: 'pointer', fontWeight: 600 }}>📋 History</span></td>
                    <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                      {r.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button style={{ padding: '4px 10px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Grant</button>
                          <button style={{ padding: '4px 10px', background: 'transparent', color: COLORS.danger, border: `1px solid ${COLORS.danger}`, borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>Reject</button>
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

      {remarksModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 24, maxWidth: 480, width: '90%' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>Applicant Remarks</div>
            <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.6, marginBottom: 20 }}>{remarksModal}</p>
            <button onClick={() => setRemarksModal(null)} style={{ padding: '7px 22px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
