// Mirrors the Document Scrutinization section from mock (App.jsx L13158).
// Proceed → scrutiny workbench, Assign I/O → modal (UI), Forward → modal + API.
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { COLORS, S } from '@/utils/colors';
import { resolveFoodCategory } from '@/utils/docResolver';
import { fetchNodalAPending, nodalAForward, fetchEligibleTO, type EligibleOfficer } from '@/services/officer.service';
import type { Application } from '@/services/application.service';

const TYPE_LABELS: Record<string, string> = {
  NSF:            'NSF',
  ClaimApproval:  'Claim Approval',
  AyurvedaAahara: 'Ayurveda Aahara',
  RPET:           'rPET',
  AnyOther:       'Any Other',
};

const FILTER_FIELDS = [
  { label: 'Application Ref. No.',  placeholder: 'EPAAS-…',  type: 'text'   },
  { label: 'Company / Org Name',    placeholder: 'Search…',   type: 'text'   },
  { label: 'State',  type: 'select', options: ['All', 'Gujarat', 'Maharashtra', 'Delhi', 'Karnataka'] },
  { label: 'From Date',  type: 'date' },
  { label: 'To Date',    type: 'date' },
  { label: 'Kind of Business',   type: 'select', options: ['All', 'Manufacturer', 'Relabeller', 'Importer'] },
  { label: 'Application Type',   type: 'select', options: ['All', 'New', 'Appeal', 'Review'] },
  { label: 'Application Filter', type: 'select', options: ['All', 'Edited by Applicant', 'Recommended by TO', 'Recommended by EC', 'Extension of Additional Time'] },
];


function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysLeft(submittedAt: string | null, windowDays = 30): number {
  if (!submittedAt) return 0;
  const elapsed = Math.floor((Date.now() - new Date(submittedAt).getTime()) / 86_400_000);
  return Math.max(0, windowDays - elapsed);
}

function TypeBadge({ type }: { type: string }) {
  const label = TYPE_LABELS[type] ?? type;
  const isNSF = type === 'NSF';
  return (
    <span style={{ background: isNSF ? COLORS.primaryLight : COLORS.infoLight, color: isNSF ? COLORS.primary : COLORS.info, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
      {label}
    </span>
  );
}

function Btn({ label, variant = 'primary', onClick }: { label: string; variant?: 'primary' | 'outline'; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      style={{ background: variant === 'primary' ? COLORS.primary : 'transparent', color: variant === 'primary' ? '#fff' : COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  );
}

// ── Forward to Technical Officer Modal (API-driven) ───────────────────────────

interface ForwardToTOModalProps {
  app:     Application;
  onClose: () => void;
  onSubmit:(toId: string) => Promise<void>;
}

function ForwardToTOModal({ app, onClose, onSubmit }: ForwardToTOModalProps) {
  const [officers,   setOfficers]   = useState<EligibleOfficer[]>([]);
  const [loadingTO,  setLoadingTO]  = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEligibleTO(app.id)
      .then(o => { setOfficers(o); if (o.length > 0) setSelectedId(o[0].id); })
      .catch(() => toast.error('Could not load eligible Technical Officers'))
      .finally(() => setLoadingTO(false));
  }, [app.id]);

  async function handleConfirm() {
    if (!selectedId) return;
    setSubmitting(true);
    try { await onSubmit(selectedId); } finally { setSubmitting(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
        <div style={{ background: COLORS.primary, borderRadius: '12px 12px 0 0', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Forward Application</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 2 }}>Assign Technical Officer</div>
          </div>
          <div onClick={onClose} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 18, lineHeight: 1 }}>✕</div>
        </div>
        <div style={{ padding: 18 }}>
          <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 14px' }}>
            {([
              ['App. Ref. No.',   app.referenceNumber],
              ['Company',         app.companyName],
              ['Product',         app.productName ?? '—'],
              ['App. Type',       TYPE_LABELS[app.applicationType] ?? app.applicationType],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, marginTop: 1 }}>{v}</div>
              </div>
            ))}
          </div>

          <label style={S.label}>Select Technical Officer <span style={{ color: COLORS.danger }}>*</span></label>
          {loadingTO ? (
            <div style={{ padding: '10px 0', color: COLORS.textMuted, fontSize: 12 }}>Loading eligible officers…</div>
          ) : officers.length === 0 ? (
            <div style={{ padding: '10px 0', color: COLORS.danger, fontSize: 12 }}>No Technical Officers assigned to this application category. Please contact admin.</div>
          ) : (
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
              style={{ width: '100%', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 12, marginBottom: 14, background: '#fff', cursor: 'pointer' }}>
              {officers.map(o => (
                <option key={o.id} value={o.id}>{o.username} ({o.activeApplications} active app{o.activeApplications !== 1 ? 's' : ''})</option>
              ))}
            </select>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose}
              style={{ padding: '7px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${COLORS.primary}`, background: 'transparent', color: COLORS.primary }}>
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={!selectedId || submitting || officers.length === 0}
              style={{ padding: '7px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: selectedId ? 'pointer' : 'not-allowed', border: 'none', background: COLORS.primary, color: '#fff', opacity: selectedId && !submitting ? 1 : 0.5 }}>
              {submitting ? 'Forwarding…' : 'Forward to Technical Officer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── View Purpose Modal ────────────────────────────────────────────────────────

function ViewPurposeModal({ app, onClose }: { app: Application; onClose: () => void }) {
  const fd = app.formData as { step2?: { justification?: string; productCategory?: string; subCategory?: string; source?: string } } | null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
        <div style={{ background: COLORS.primary, borderRadius: '12px 12px 0 0', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Application Purpose</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 2 }}>View Purpose of Application</div>
          </div>
          <div onClick={onClose} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>✕</div>
        </div>
        <div style={{ padding: 18 }}>
          <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 14px' }}>
            {([
              ['App. Ref. No.',   app.referenceNumber],
              ['Company',         app.companyName],
              ['Product',         app.productName ?? '—'],
              ['Application Type', TYPE_LABELS[app.applicationType] ?? app.applicationType],
              ['Food Category',   resolveFoodCategory(app)],
              ['Submitted On',    app.submittedAt ? fmtDate(app.submittedAt) : '—'],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, marginTop: 1 }}>{v}</div>
              </div>
            ))}
          </div>

          {fd?.step2?.productCategory && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Product Category</div>
              <div style={{ fontSize: 12, color: COLORS.text, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 12px' }}>{fd.step2.productCategory}{fd.step2.subCategory ? ` › ${fd.step2.subCategory}` : ''}</div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Purpose / Justification</div>
            <div style={{ fontSize: 12, color: fd?.step2?.justification ? COLORS.text : COLORS.textMuted, fontStyle: fd?.step2?.justification ? 'normal' : 'italic', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '10px 12px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {fd?.step2?.justification || 'No justification provided.'}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose}
              style={{ padding: '7px 20px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: COLORS.primary, color: '#fff' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DocumentScrutiny() {
  const navigate = useNavigate();
  const [apps,          setApps]          = useState<Application[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [forwardModal,  setForwardModal]  = useState<Application | null>(null);
  const [purposeModal,  setPurposeModal]  = useState<Application | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setApps(await fetchNodalAPending()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleForward(app: Application, toId: string) {
    try {
      await nodalAForward(app.id, toId);
      toast.success(`${app.referenceNumber} forwarded to Technical Officer.`);
      setForwardModal(null);
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Could not forward application. Please try again.');
    }
  }

  return (
    <div>
      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {forwardModal && (
        <ForwardToTOModal
          app={forwardModal}
          onClose={() => setForwardModal(null)}
          onSubmit={(toId) => handleForward(forwardModal, toId)}
        />
      )}
      {purposeModal && (
        <ViewPurposeModal
          app={purposeModal}
          onClose={() => setPurposeModal(null)}
        />
      )}

      {/* Page header */}
      <div style={{ marginBottom: 16 }}>
        <div style={S.pageDesc}>Review and scrutinize submitted applications before forwarding to Technical Officer.</div>
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

      {/* Table card */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Applications Pending Scrutiny
            {!loading && (
              <span style={{ marginLeft: 8, background: COLORS.primary, color: '#fff', borderRadius: 10, fontSize: 10, padding: '1px 7px', fontWeight: 700 }}>{apps.length}</span>
            )}
          </span>
          <button style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Sr. No.', 'App. Ref. No. / UID', 'App. Type', 'Food Category', 'Company / Org.', 'Product Applied For', 'Pending With', 'Received On', 'Edited', 'Days Remaining', 'Action'].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={11} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>Loading applications…</td></tr>
              )}
              {!loading && apps.length === 0 && (
                <tr><td colSpan={11} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No applications pending scrutiny.</td></tr>
              )}
              {apps.map((a, i) => {
                const dl = daysLeft(a.submittedAt);
                return (
                  <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                    <td style={S.td}><TypeBadge type={a.applicationType} /></td>
                    <td style={{ ...S.td, fontSize: 11 }}>{resolveFoodCategory(a)}</td>
                    <td style={S.td}>{a.companyName}</td>
                    <td style={S.td}>{a.productName ?? '—'}</td>
                    <td style={{ ...S.td, fontSize: 11, color: COLORS.primary, fontWeight: 600 }}>Nodal Officer</td>
                    <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                    <td style={S.td}>No</td>
                    <td style={S.td}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: dl <= 5 ? COLORS.danger : dl <= 10 ? COLORS.warning : COLORS.success, background: dl <= 5 ? COLORS.dangerLight : dl <= 10 ? COLORS.warningLight : COLORS.successLight, padding: '2px 7px', borderRadius: 4 }}>
                        {dl}d
                      </span>
                    </td>
                    <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <Btn label="View"         variant="outline" onClick={() => navigate(`/nodal/scrutiny/${a.id}`)} />
                        {a.stage === 'WithNodalOfficerA' && <Btn label="Proceed" onClick={() => navigate(`/nodal/scrutiny/${a.id}`)} />}
                        {a.stage === 'WithNodalOfficerA' && <Btn label="Forward to TO" variant="outline" onClick={() => setForwardModal(a)} />}
                        <Btn label="View Purpose" variant="outline" onClick={() => setPurposeModal(a)} />
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

