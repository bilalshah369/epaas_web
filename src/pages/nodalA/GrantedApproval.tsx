// Wired to real API: fetchNodalAAll() filtered to Approved/Closed stage.
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { COLORS, S } from '@/utils/colors';
import { fetchNodalAAll, withdrawByAuthority } from '@/services/officer.service';
import type { Application } from '@/services/application.service';

const FILTER_FIELDS = [
  { label: 'Application Ref. No.', placeholder: 'EPAAS-…', type: 'text'   },
  { label: 'Approval No.',         placeholder: 'APPR-…',  type: 'text'   },
  { label: 'Company / Org Name',   placeholder: 'Search…', type: 'text'   },
  { label: 'Application Type',     type: 'select', options: ['All', 'New', 'Appeal', 'Review'] },
  { label: 'From Date',            type: 'date'   },
  { label: 'To Date',              type: 'date'   },
];

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function GrantedApproval() {
  const navigate = useNavigate();
  const [apps,    setApps]    = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Withdraw modal state
  const [withdrawTarget, setWithdrawTarget] = useState<Application | null>(null);
  const [justification,  setJustification]  = useState('');
  const [withdrawing,    setWithdrawing]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await fetchNodalAAll();
      setApps(all.filter((a) => ['Approved', 'Closed'].includes(a.stage)));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleWithdraw() {
    if (!withdrawTarget) return;
    if (!justification.trim()) { toast.error('Justification is required'); return; }
    setWithdrawing(true);
    try {
      await withdrawByAuthority(withdrawTarget.id, justification.trim());
      toast.success(`Application ${withdrawTarget.referenceNumber} withdrawn by authority.`);
      setWithdrawTarget(null);
      setJustification('');
      load();
    } catch {
      toast.error('Could not withdraw application');
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <div>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <div style={S.pageDesc}>Applications where approval has been issued and Form II dispatched.</div>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
        {FILTER_FIELDS.map((f) => (
          <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140, flex: '1 1 140px' }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.label}</label>
            {f.type === 'select' ? (
              <select style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11, background: '#fff', cursor: 'pointer' }}>
                {(f.options ?? []).map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : f.type === 'date' ? (
              <input type="date" style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11 }} />
            ) : (
              <input placeholder={f.placeholder ?? ''} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11 }} />
            )}
          </div>
        ))}
        <button style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontSize: 11, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-end' }}>Search</button>
        <button style={{ background: 'none', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer', alignSelf: 'flex-end' }}>Reset</button>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Granted Approvals
            {!loading && (
              <span style={{ marginLeft: 8, background: COLORS.success, color: '#fff', borderRadius: 10, fontSize: 10, padding: '1px 7px', fontWeight: 700 }}>{apps.length}</span>
            )}
          </span>
          <button style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Sr. No.', 'Application No.', 'Approval No.', 'Company / Org.', 'Product', 'EC Status', 'Date of Issue', 'Stage', 'Actions'].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>
              )}
              {!loading && apps.length === 0 && (
                <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No approved applications found.</td></tr>
              )}
              {apps.map((a, i) => (
                <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                  <td style={S.td}>{i + 1}</td>
                  <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{a.approvalNumber ?? '—'}</td>
                  <td style={S.td}>{a.companyName}</td>
                  <td style={S.td}>{a.productName ?? '—'}</td>
                  <td style={S.td}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: COLORS.successLight, color: COLORS.success }}>EC Approved</span>
                  </td>
                  <td style={S.td}>{fmtDate(a.updatedAt)}</td>
                  <td style={S.td}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                      background: a.stage === 'Approved' ? COLORS.successLight : '#F3F4F6',
                      color:      a.stage === 'Approved' ? COLORS.success      : COLORS.textMuted,
                    }}>
                      {a.stage}
                    </span>
                  </td>
                  <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => navigate(`/nodal/scrutiny/${a.id}`)}
                        style={{ padding: '4px 10px', background: 'transparent', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                      >
                        View
                      </button>
                      {['Approved', 'Closed'].includes(a.stage) && (
                        <button
                          onClick={() => { setWithdrawTarget(a); setJustification(''); }}
                          style={{ padding: '4px 10px', background: COLORS.danger, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Withdraw confirmation modal ──────────────────────────────────── */}
      {withdrawTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 480, maxWidth: '92vw', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.danger, marginBottom: 6 }}>⚠ Withdraw Approval by Authority</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 18, lineHeight: 1.6 }}>
              You are about to withdraw the approval for <strong style={{ color: COLORS.text }}>{withdrawTarget.referenceNumber}</strong> ({withdrawTarget.companyName}). This action is irreversible and will set the application stage to <strong>Withdrawn by Authority</strong>.
            </div>

            <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 6 }}>
              Justification / Reason <span style={{ color: COLORS.danger }}>*</span>
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="State the reason for withdrawing this approval…"
              rows={4}
              style={{ width: '100%', border: `1.5px solid ${COLORS.border}`, borderRadius: 7, padding: '9px 12px', fontSize: 12, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setWithdrawTarget(null); setJustification(''); }}
                disabled={withdrawing}
                style={{ padding: '8px 20px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 7, fontSize: 12, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing || !justification.trim()}
                style={{ padding: '8px 22px', background: COLORS.danger, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: withdrawing || !justification.trim() ? 'not-allowed' : 'pointer', opacity: withdrawing || !justification.trim() ? 0.7 : 1 }}
              >
                {withdrawing ? 'Withdrawing…' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
