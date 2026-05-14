// Technical Officer — Document Scrutinization (/technical/scrutiny)
// Same structure as nodalA/DocumentScrutiny but uses fetchTechnicalPending().
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, S } from '@/utils/colors';
import { resolveFoodCategory } from '@/utils/docResolver';
import { fetchTechnicalPending, technicalForwardToEC } from '@/services/technical.service';
import type { Application } from '@/services/application.service';

const TYPE_LABELS: Record<string, string> = {
  NSF: 'NSF', ClaimApproval: 'Claim Approval', AyurvedaAahara: 'Ayurveda Aahara', RPET: 'rPET', AnyOther: 'Any Other',
};

const FILTER_FIELDS = [
  { label: 'Application Ref. No.', placeholder: 'EPAAS-…', type: 'text' },
  { label: 'Company / Org Name',   placeholder: 'Search…', type: 'text' },
  { label: 'State',                type: 'select', options: ['All', 'Gujarat', 'Maharashtra', 'Delhi', 'Karnataka'] },
  { label: 'From Date',            type: 'date' },
  { label: 'To Date',              type: 'date' },
  { label: 'Application Type',     type: 'select', options: ['All', 'New', 'Appeal', 'Review'] },
  { label: 'Application Filter',   type: 'select', options: ['All', 'Edited by Applicant', 'Recommended by IO', 'Recommended by EC', 'Extension of Additional Time'] },
];

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function Btn({ label, variant = 'primary', onClick }: { label: string; variant?: 'primary' | 'outline'; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      style={{ background: variant === 'primary' ? COLORS.primary : 'transparent', color: variant === 'primary' ? '#fff' : COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  );
}

// ── Forward modal ──────────────────────────────────────────────────────────────
function ForwardModal({ app, onClose, onForward }: { app: Application; onClose: () => void; onForward: (remarks: string) => Promise<void> }) {
  const [remarks, setRemarks] = useState('');
  const [busy,    setBusy]    = useState(false);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 24, width: 440, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Forward to Expert Committee</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>{app.referenceNumber} — {app.companyName}</div>
        <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 6 }}>Remarks</label>
        <textarea rows={4} value={remarks} onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add forwarding remarks…"
          style={{ width: '100%', resize: 'vertical', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '7px 16px', background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
          <button disabled={busy} onClick={async () => { setBusy(true); await onForward(remarks); }}
            style={{ padding: '7px 20px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: busy ? 0.7 : 1 }}>
            {busy ? 'Forwarding…' : 'Forward to EC'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TechDocScrutiny() {
  const navigate = useNavigate();
  const [apps,         setApps]         = useState<Application[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [forwardModal, setForwardModal] = useState<Application | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setApps(await fetchTechnicalPending()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleForward(app: Application, _remarks: string) {
    await technicalForwardToEC(app.id);
    setForwardModal(null);
    load();
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={S.roleLabel}>TECHNICAL OFFICER</div>
        <div style={S.pageTitle}>Document Scrutinization</div>
        <div style={S.pageDesc}>Applications assigned for technical review and assessment.</div>
      </div>

      {/* Filter bar */}
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

      {/* Table */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Applications for Technical Review
            {!loading && <span style={{ marginLeft: 8, background: COLORS.warningLight, color: COLORS.warning, borderRadius: 10, fontSize: 10, padding: '1px 7px', fontWeight: 700 }}>{apps.length}</span>}
          </span>
          <button style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['Sr. No.', 'App. Ref. No.', 'App. Type', 'Food Category', 'Company / Org.', 'Product Applied For', 'Pending With', 'Received On', 'Edited', 'Days Remaining', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={11} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading…</td></tr>}
              {!loading && apps.length === 0 && <tr><td colSpan={11} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No applications pending technical review.</td></tr>}
              {apps.map((a, i) => {
                const days = daysSince(a.submittedAt);
                return (
                  <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                    <td style={S.td}><span style={{ background: COLORS.infoLight, color: COLORS.info, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{TYPE_LABELS[a.applicationType] ?? a.applicationType}</span></td>
                    <td style={{ ...S.td, fontSize: 11 }}>{resolveFoodCategory(a)}</td>
                    <td style={S.td}>{a.companyName}</td>
                    <td style={S.td}>{a.productName ?? '—'}</td>
                    <td style={{ ...S.td, fontSize: 11, color: COLORS.primary, fontWeight: 600 }}>Technical Officer</td>
                    <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                    <td style={S.td}>No</td>
                    <td style={{ ...S.td, color: days > 14 ? COLORS.danger : COLORS.text, fontWeight: days > 14 ? 700 : 400 }}>{days}d</td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <Btn label="Proceed"     onClick={() => navigate(`/technical/assessment/${a.id}`)} />
                        <Btn label="Draft Query" variant="outline" onClick={() => navigate(`/technical/assessment/${a.id}?tab=query`)} />
                        <Btn label="Forward"     variant="outline" onClick={() => setForwardModal(a)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {forwardModal && (
        <ForwardModal app={forwardModal} onClose={() => setForwardModal(null)} onForward={(r) => handleForward(forwardModal, r)} />
      )}
    </div>
  );
}
