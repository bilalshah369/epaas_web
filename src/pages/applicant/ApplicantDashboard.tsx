// Mirrors ApplicantDashboard from mock (App.jsx L8176).
// Bins, welcome banner, alert banner, and table — data from real API.
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { COLORS } from '@/utils/colors';
import BinCard from '@/components/ui/BinCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { fetchMyApplications, deleteDraftApplication, requestWithdrawal, getBin, type Application, type Bin } from '@/services/application.service';
import { openInvoiceWindow } from '@/utils/invoiceBuilder';
import { getPayment } from '@/services/payment.service';

// ── Helpers: extract address/food-category from formData for any app type ─────
function getAddress(r: Application): string {
  if (r.address && r.address.trim()) return r.address;
  if (!r.formData) return '—';
  const fd = r.formData as unknown as Record<string, unknown>;
  // NSF / RPET / AnyOther — nested step2
  if (fd.step2 && typeof fd.step2 === 'object') {
    const s2 = fd.step2 as Record<string, unknown>;
    const v = s2.orgAddress ?? s2.mfgAddress;
    if (typeof v === 'string' && v.trim()) return v;
  }
  // CA — flat applicantAddress
  if (typeof fd.applicantAddress === 'string' && fd.applicantAddress.trim()) return fd.applicantAddress;
  // AA — registeredOfficeAddress or manufacturingAddress
  if (typeof fd.registeredOfficeAddress === 'string' && fd.registeredOfficeAddress.trim()) return fd.registeredOfficeAddress;
  if (typeof fd.manufacturingAddress === 'string' && fd.manufacturingAddress.trim()) return fd.manufacturingAddress;
  return '—';
}

function getFoodCategory(r: Application): string {
  if (r.foodCategory && r.foodCategory.trim()) return r.foodCategory;
  if (!r.formData) return '—';
  const fd = r.formData as unknown as Record<string, unknown>;
  // NSF / RPET / AnyOther — nested step2
  if (fd.step2 && typeof fd.step2 === 'object') {
    const v = (fd.step2 as Record<string, unknown>).productCategory;
    if (typeof v === 'string' && v.trim()) return v;
  }
  // CA — flat productCategory
  if (typeof fd.productCategory === 'string' && fd.productCategory.trim()) return fd.productCategory;
  // AA — ayurvedaCategory
  if (typeof fd.ayurvedaCategory === 'string' && fd.ayurvedaCategory.trim()) return fd.ayurvedaCategory;
  return '—';
}

// ── Static bin definitions ────────────────────────────────────────────────────
const BINS: Array<{ key: Bin; icon: string; label: string; color: string; alert?: boolean }> = [
  { key: 'all',        icon: '📂', label: 'Click to View All Applications',              color: COLORS.primary },
  { key: 'incomplete', icon: '📋', label: 'Incomplete Application',                       color: COLORS.warning },
  { key: 'submitted',  icon: '✅', label: 'Submitted Applications with Successful Payment', color: COLORS.info },
  { key: 'reverted',   icon: '🔄', label: 'Reverted Application by Authority',             color: COLORS.accent, alert: true },
  { key: 'rejected',   icon: '❌', label: 'Rejected Application',                           color: COLORS.danger },
  { key: 'approved',   icon: '🏅', label: 'Approval Issued',                                color: COLORS.success },
];

// ── Column definitions per bin ────────────────────────────────────────────────
const BIN_COLS: Record<Bin, string[]> = {
  all:        ['Sr. No.', 'Reference No.', 'Application Type', 'Status', 'Last Updated On', 'Action'],
  incomplete: ['Sr. No.', 'Reference No.', 'Address', 'Application Type', 'Food Category', 'Last Updated On', 'Action'],
  submitted:  ['Sr. No.', 'Reference No.', 'Address', 'Application Type', 'Food Category', 'Last Updated On', 'Status', 'Action'],
  reverted:   ['Sr. No.', 'Reference No.', 'Address', 'Application Type', 'Food Category', 'Last Updated On', 'Status', 'Action', 'Query / Ext. Time'],
  rejected:   ['Sr. No.', 'Reference No.', 'Address', 'Application Type', 'Food Category', 'Rejected Date', 'Status', 'Action'],
  approved:   ['Sr. No.', 'Reference No.', 'Address', 'Application Type', 'Food Category', 'Issued Date', 'Status', 'Action'],
};

// ── Shared table styles ───────────────────────────────────────────────────────
const td: React.CSSProperties = { padding: '9px 10px', borderBottom: `1px solid ${COLORS.border}`, fontSize: 12 };
const th: React.CSSProperties = { textAlign: 'left', padding: '9px 10px', background: COLORS.bg, borderBottom: `2px solid ${COLORS.border}`, fontSize: 11, fontWeight: 700, color: COLORS.textMuted, whiteSpace: 'nowrap' };

function ActionBtn({ label, variant = 'primary', onClick }: { label: string; variant?: string; onClick?: () => void }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: COLORS.primary, color: '#fff', border: 'none' },
    outline:  { background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}` },
    warning:  { background: COLORS.warning, color: '#fff', border: 'none' },
    info:     { background: COLORS.info,    color: '#fff', border: 'none' },
    danger:   { background: COLORS.danger,  color: '#fff', border: 'none' },
  };
  return (
    <button
      onClick={onClick}
      style={{ ...styles[variant] ?? styles.primary, display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s', marginRight: 4, marginBottom: 2 }}
    >
      {label}
    </button>
  );
}

function MiniTable({ cols, rows, renderRow }: { cols: string[]; rows: Application[]; renderRow: (r: Application, i: number) => React.ReactNode }) {
  if (rows.length === 0) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>
        No records found.
      </div>
    );
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>{cols.map((c) => <th key={c} style={th}>{c}</th>)}</tr>
        </thead>
        <tbody>{rows.map((r, i) => renderRow(r, i))}</tbody>
      </table>
    </div>
  );
}

// ── Edit path per application type ───────────────────────────────────────────
function getEditPath(r: Application): string {
  if (r.applicationType === 'NSF')                                              return `/app/apply/nsf-form?id=${r.id}`;
  if (r.applicationType === 'CA' || r.applicationType === 'ClaimApproval')     return `/app/apply/ca-form?id=${r.id}`;
  if (r.applicationType === 'AA' || r.applicationType === 'AyurvedaAahara')    return `/app/apply/aa-form?id=${r.id}`;
  if (r.applicationType === 'RPET')                                             return `/app/apply/rpet-form?id=${r.id}`;
  return `/app/apply/form?id=${r.id}&type=${r.applicationType}`;
}

// ── Normalize applicationType variants for display ────────────────────────────
const NORM_TYPE: Record<string, string> = {
  CA: 'CA', ClaimApproval: 'CA',
  AA: 'AA', AyurvedaAahara: 'AA',
  NSF: 'NSF', RPET: 'RPET', AnyOther: 'AnyOther',
};

const CATEGORY_OPTIONS = [
  { value: 'NSF',      label: 'NSF' },
  { value: 'CA',       label: 'Claim Approval (CA)' },
  { value: 'AA',       label: 'Ayurveda Aahara (AA)' },
  { value: 'RPET',     label: 'rPET' },
  { value: 'AnyOther', label: 'Any Other' },
];

const WORKFLOW_OPTIONS = [
  { value: 'New',                   label: 'New' },
  { value: 'Appeal',                label: 'Appeal' },
  { value: 'Review',                label: 'Review' },
  { value: 'WithdrawalByApplicant', label: 'Withdrawal by Applicant' },
  { value: 'WithdrawnByAuthorities',label: 'Withdrawn by Authorities' },
];

const STATUS_OPTIONS = [
  { value: 'Draft',                label: 'Draft' },
  { value: 'WithNodalOfficerA',    label: 'Document Scrutiny' },
  { value: 'WithTechnicalOfficer', label: 'Technical Assessment' },
  { value: 'WithExpertCommittee',  label: 'Expert Committee' },
  { value: 'QuerySent',            label: 'Query / Clarification' },
  { value: 'WithCEO',              label: 'CEO (Appeal)' },
  { value: 'WithChairperson',      label: 'Chairperson (Review)' },
  { value: 'Approved',             label: 'Approved' },
  { value: 'Rejected',             label: 'Rejected' },
];

// ── Per-bin filter state ──────────────────────────────────────────────────────
interface BinFilters {
  search:         string;
  filterType:     string;
  filterWorkflow: string;
  filterCat:      string;
  filterStatus:   string;
  filterRef:      string;
  filterFrom:     string;
  filterTo:       string;
}
function emptyFilters(): BinFilters {
  return { search: '', filterType: '', filterWorkflow: '', filterCat: '', filterStatus: '', filterRef: '', filterFrom: '', filterTo: '' };
}
const ALL_BINS: Bin[] = ['all', 'incomplete', 'submitted', 'reverted', 'rejected', 'approved'];
function initBinFilters(): Record<Bin, BinFilters> {
  return Object.fromEntries(ALL_BINS.map((k) => [k, emptyFilters()])) as Record<Bin, BinFilters>;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ApplicantDashboard() {
  const { user }   = useAuthStore();
  const navigate   = useNavigate();
  const [vw, setVw] = useState(() => window.innerWidth);
  useEffect(() => {
    const fn = () => setVw(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  const [activeBin, setActiveBin] = useState<Bin>('all');
  const [binFilters, setBinFilters] = useState<Record<Bin, BinFilters>>(initBinFilters);
  const [apps, setApps]             = useState<Application[]>([]);
  const [loading, setLoading]       = useState(true);
  const [withdrawApp,        setWithdrawApp]        = useState<Application | null>(null);
  const [withdrawJustification, setWithdrawJustification] = useState('');
  const [withdrawSubmitting,    setWithdrawSubmitting]    = useState(false);

  // Always fetch ALL apps — no backend filters so bin counts are never affected by filters
  const loadApps = useCallback(() => {
    setLoading(true);
    fetchMyApplications()
      .then(setApps)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadApps(); }, [loadApps]);

  const binned = useMemo(() => {
    const groups: Record<Bin, Application[]> = { all: apps, incomplete: [], submitted: [], reverted: [], rejected: [], approved: [] };
    for (const a of apps) groups[getBin(a.stage)].push(a);
    return groups;
  }, [apps]);

  // Only the active bin's own filters affect the displayed list
  const f = binFilters[activeBin];
  const displayed = useMemo(() => {
    let list = activeBin === 'all' ? apps : binned[activeBin];
    if (f.search)       list = list.filter((a) => a.referenceNumber.toLowerCase().includes(f.search.toLowerCase()));
    if (f.filterRef)    list = list.filter((a) => a.referenceNumber.toLowerCase().includes(f.filterRef.toLowerCase()));
    if (f.filterType)   list = list.filter((a) => (NORM_TYPE[a.applicationType] ?? a.applicationType) === f.filterType);
    if (f.filterCat)    list = list.filter((a) => getFoodCategory(a).toLowerCase().includes(f.filterCat.toLowerCase()));
    if (f.filterWorkflow) list = list.filter((a) => a.workflowType === f.filterWorkflow);
    if (f.filterStatus) list = list.filter((a) => a.stage === f.filterStatus);
    if (f.filterFrom)   list = list.filter((a) => a.submittedAt && new Date(a.submittedAt) >= new Date(f.filterFrom));
    if (f.filterTo)     list = list.filter((a) => a.submittedAt && new Date(a.submittedAt) <= new Date(f.filterTo + 'T23:59:59'));
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBin, binned, apps, f]);

  function setFilter<K extends keyof BinFilters>(key: K, value: BinFilters[K]) {
    setBinFilters((prev) => ({ ...prev, [activeBin]: { ...prev[activeBin], [key]: value } }));
  }
  function clearFilters() {
    setBinFilters((prev) => ({ ...prev, [activeBin]: emptyFilters() }));
  }

  const activeBinDef  = BINS.find((b) => b.key === activeBin)!;
  const revertedCount  = binned.reverted.length;
  const approvedCount  = binned.approved.length;
  const foodCats      = [...new Set(apps.map(getFoodCategory).filter((c) => c !== '—'))];
  const hasFilters    = Object.values(f).some(Boolean);

  async function handleDeleteDraft(id: string) {
    if (!window.confirm('Delete this draft? This action cannot be undone.')) return;
    try {
      await deleteDraftApplication(id);
      toast.success('Draft deleted');
      loadApps();
    } catch {
      toast.error('Could not delete draft');
    }
  }

  async function handleWithdrawSubmit() {
    if (!withdrawApp || !withdrawJustification.trim()) return;
    setWithdrawSubmitting(true);
    try {
      await requestWithdrawal(withdrawApp.id, withdrawJustification);
      toast.success('Withdrawal request submitted. Nodal Officer will be notified.');
      setWithdrawApp(null);
      setWithdrawJustification('');
      loadApps();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to submit withdrawal request');
    } finally { setWithdrawSubmitting(false); }
  }

  const WITHDRAWAL_INELIGIBLE = ['Draft', 'Rejected', 'Withdrawn', 'WithdrawnByAuthority'];

  function fmtDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function renderRow(bin: Bin) {
    return (r: Application, i: number) => {
      const rowBg = i % 2 === 0 ? '#fff' : COLORS.bg;
      return (
        <tr key={r.id} style={{ background: rowBg }}>
          <td style={td}>{i + 1}</td>
          <td style={td}><span style={{ color: COLORS.primary, fontWeight: 600 }}>{r.referenceNumber}</span></td>
          {bin !== 'all' && <td style={td}><span style={{ color: COLORS.primary, fontWeight: 600 }}>{getAddress(r)}</span></td>}
          <td style={td}>{CATEGORY_OPTIONS.find((o) => o.value === (NORM_TYPE[r.applicationType] ?? r.applicationType))?.label ?? r.applicationType}</td>
          {bin !== 'all' && <td style={td}><span style={{ color: COLORS.primary, fontWeight: 600 }}>{getFoodCategory(r)}</span></td>}
          {bin === 'all' && <td style={td}><StatusBadge status={r.stage} /></td>}
          <td style={td}>{fmtDate(bin === 'rejected' || bin === 'approved' ? r.submittedAt : r.updatedAt)}</td>
          {(bin === 'submitted' || bin === 'reverted' || bin === 'rejected' || bin === 'approved') && (
            <td style={td}><StatusBadge status={r.stage} /></td>
          )}
          <td style={td}>
            {bin === 'incomplete' && <ActionBtn label="Delete Draft" variant="danger" onClick={() => handleDeleteDraft(r.id)} />}
            {bin === 'submitted'  && <>
              <ActionBtn label="View / Respond" variant="outline" onClick={() => navigate(`/app/applications/${r.id}`)} />
              {!WITHDRAWAL_INELIGIBLE.includes(r.stage) && <ActionBtn label="Withdraw" variant="danger" onClick={() => { setWithdrawApp(r); setWithdrawJustification(''); }} />}
            </>}
            {bin === 'reverted'   && <>
              <ActionBtn label="Respond"        onClick={() => navigate(`/app/applications/${r.id}?tab=2`)} />
              <ActionBtn label="View Query"     variant="info"    onClick={() => navigate(`/app/applications/${r.id}?tab=2`)} />
              <ActionBtn label="Req. Extension" variant="warning" onClick={() => navigate(`/app/extension-request/${r.id}`)} />
              {!WITHDRAWAL_INELIGIBLE.includes(r.stage) && <ActionBtn label="Withdraw" variant="danger" onClick={() => { setWithdrawApp(r); setWithdrawJustification(''); }} />}
            </>}
            {bin === 'rejected'   && <>
              <ActionBtn label="View"         variant="outline" onClick={() => navigate(`/app/applications/${r.id}`)} />
              <ActionBtn label="View History" variant="outline" onClick={() => navigate(`/app/applications/${r.id}`)} />
              <ActionBtn label="Appeal"       variant="warning" onClick={() => navigate('/app/requests/appeal')} />
              <ActionBtn label="Review"       variant="danger"  onClick={() => navigate('/app/requests/review')} />
            </>}
            {bin === 'approved'   && <>
              <ActionBtn label="View Receipt"  variant="outline" onClick={() => getPayment(r.id).then((p) => openInvoiceWindow(r, p)).catch(() => openInvoiceWindow(r, null))} />
              <ActionBtn label="View History"  variant="outline" onClick={() => navigate(`/app/applications/${r.id}`)} />
              <ActionBtn label="Tax Invoice"   variant="info"    onClick={() => navigate('/app/tax-invoice')} />
            </>}
            {bin === 'all' && r.stage === 'Draft'      && <ActionBtn label="Edit"         variant="primary" onClick={() => navigate(getEditPath(r))} />}
            {bin === 'all' && r.stage === 'Draft'      && <ActionBtn label="Delete Draft" variant="danger"  onClick={() => handleDeleteDraft(r.id)} />}
            {bin === 'all' && r.stage === 'QuerySent'  && <>
              <ActionBtn label="Respond"        onClick={() => navigate(`/app/applications/${r.id}?tab=2`)} />
              <ActionBtn label="View Query"     variant="info"    onClick={() => navigate(`/app/applications/${r.id}?tab=2`)} />
              <ActionBtn label="Req. Extension" variant="warning" onClick={() => navigate(`/app/extension-request/${r.id}`)} />
            </>}
            {bin === 'all' && r.stage !== 'Draft' && r.stage !== 'QuerySent' && <ActionBtn label="View" variant="outline" onClick={() => navigate(`/app/applications/${r.id}`)} />}
          </td>
          {bin === 'reverted' && <td style={td}>—</td>}
        </tr>
      );
    };
  }

  return (
    <div>
      {/* ── Withdrawal Modal ─────────────────────────────────────────── */}
      {withdrawApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: Math.min(500, vw - 32), maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
            <div style={{ background: COLORS.danger, borderRadius: '12px 12px 0 0', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Request Withdrawal</div>
              <div onClick={() => setWithdrawApp(null)} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 20 }}>✕</div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>Application</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary }}>{withdrawApp.referenceNumber}</div>
                <div style={{ fontSize: 11, color: COLORS.text, marginTop: 2 }}>{withdrawApp.companyName}</div>
              </div>
              <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 6, padding: '10px 14px', fontSize: 11, color: '#92400E', marginBottom: 14, lineHeight: 1.6 }}>
                Once submitted, your withdrawal request will be reviewed by the Nodal Officer. This action cannot be undone.
              </div>
              <label style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                Justification for Withdrawal <span style={{ color: COLORS.danger }}>*</span>
              </label>
              <textarea
                value={withdrawJustification}
                onChange={(e) => setWithdrawJustification(e.target.value)}
                placeholder="State clearly why you wish to withdraw this application..."
                style={{ width: '100%', resize: 'vertical', fontFamily: "'Noto Sans','Segoe UI',sans-serif", fontSize: 12, padding: '8px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, outline: 'none', minHeight: 90, marginBottom: 16 }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setWithdrawApp(null)} style={{ background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 5, padding: '8px 18px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleWithdrawSubmit} disabled={withdrawSubmitting || !withdrawJustification.trim()}
                  style={{ background: COLORS.danger, color: '#fff', border: 'none', borderRadius: 5, padding: '8px 18px', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: withdrawJustification.trim() ? 1 : 0.5 }}>
                  {withdrawSubmitting ? 'Submitting…' : 'Submit Withdrawal Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Welcome Banner ───────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(130deg, ${COLORS.primary} 0%, #0e2419 100%)`, borderRadius: 12, padding: vw < 640 ? '16px 16px' : '22px 28px', marginBottom: 20, display: 'flex', alignItems: vw < 640 ? 'flex-start' : 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            FSSAI E-PAAS · Applicant Portal
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: "'Libre Baskerville', Georgia, serif", marginBottom: 4 }}>
            Welcome back, {user?.username}
          </div>
          {user?.licenseNumber && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)' }}>
              FSSAI License: <strong style={{ color: '#fff' }}>{user.licenseNumber}</strong>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => navigate('/app/apply')}
            style={{ background: COLORS.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            + New Application
          </button>
          <button
            onClick={() => navigate('/app/profile')}
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '10px 16px', fontSize: 12, cursor: 'pointer' }}
          >
            My Profile
          </button>
        </div>
      </div>

      {/* ── Alert Banner ─────────────────────────────────────────────── */}
      {approvedCount > 0 && (
        <div style={{ background: '#F0FDF4', borderTop: '1px solid #BBF7D0', borderRight: '1px solid #BBF7D0', borderBottom: '1px solid #BBF7D0', borderLeft: '4px solid #16A34A', borderRadius: 8, padding: '12px 18px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 20 }}>🎉</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#14532D' }}>
              {approvedCount} Application{approvedCount > 1 ? 's' : ''} Approved!
            </div>
            <div style={{ fontSize: 11, color: '#166534', marginTop: 2 }}>
              FSSAI has issued an approval decision. You can view the approval letter and download your tax invoice.
            </div>
          </div>
          <button
            onClick={() => setActiveBin('approved')}
            style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            View Approval →
          </button>
        </div>
      )}
      {revertedCount > 0 && (
        <div style={{ background: COLORS.warningLight, borderTop: '1px solid rgba(246,173,85,0.44)', borderRight: '1px solid rgba(246,173,85,0.44)', borderBottom: '1px solid rgba(246,173,85,0.44)', borderLeft: `4px solid ${COLORS.accent}`, borderRadius: 8, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#7C2D12' }}>
              Action Required on {revertedCount} Application(s)
            </div>
            <div style={{ fontSize: 11, color: '#92400E', marginTop: 2 }}>
              The authority has reverted your application(s) with queries. Please respond before the deadline to avoid rejection.
            </div>
          </div>
          <button
            onClick={() => setActiveBin('reverted')}
            style={{ background: COLORS.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Respond Now →
          </button>
        </div>
      )}

      {/* ── Applications Table Card ───────────────────────────────────── */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {/* Bin cards */}
        <div style={{ display: 'grid', gridTemplateColumns: vw >= 1024 ? 'repeat(6, 1fr)' : vw >= 640 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
          {BINS.map((b) => (
            <BinCard
              key={b.key}
              icon={b.icon}
              label={b.label}
              count={b.key === 'all' ? apps.length : binned[b.key].length}
              color={b.color}
              active={activeBin === b.key}
              onClick={() => setActiveBin(b.key)}
            />
          ))}
        </div>

        {/* Title + search + export */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: vw < 640 ? 'flex-start' : 'center', paddingBottom: 12, marginBottom: 0, borderBottom: `1px solid ${COLORS.border}`, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 4, height: 22, borderRadius: 2, background: activeBinDef.color }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                {activeBinDef.label}
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>
                {displayed.length} record{displayed.length !== 1 ? 's' : ''}
                {activeBinDef.alert && revertedCount > 0 && (
                  <span style={{ marginLeft: 8, color: COLORS.accent, fontWeight: 600 }}>⚠ Response required</span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={f.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Search by reference number…"
              style={{ border: `1.5px solid ${COLORS.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 11, outline: 'none', background: COLORS.bg, width: vw < 640 ? '100%' : 210 }}
            />
            <button style={{ background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 6, fontSize: 11, padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              ⬇ Export
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0 12px', borderBottom: `1px solid ${COLORS.border}`, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>Filters:</span>

          {/* Bin / View */}
          <select value={activeBin} onChange={(e) => setActiveBin(e.target.value as Bin)}
            style={{ border: `1.5px solid ${COLORS.primary}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, color: COLORS.primary, fontWeight: 600, background: '#fff', cursor: 'pointer' }}>
            {BINS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
          </select>

          {/* Application Category */}
          <select value={f.filterType} onChange={(e) => setFilter('filterType', e.target.value)}
            style={{ border: `1px solid ${f.filterType ? COLORS.primary : COLORS.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, background: '#fff', cursor: 'pointer', color: f.filterType ? COLORS.primary : 'inherit', fontWeight: f.filterType ? 600 : 400 }}>
            <option value="">All Application Categories</option>
            {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Application Type / Workflow */}
          <select value={f.filterWorkflow} onChange={(e) => setFilter('filterWorkflow', e.target.value)}
            style={{ border: `1px solid ${f.filterWorkflow ? COLORS.primary : COLORS.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, background: '#fff', cursor: 'pointer', color: f.filterWorkflow ? COLORS.primary : 'inherit', fontWeight: f.filterWorkflow ? 600 : 400 }}>
            <option value="">All Application Types</option>
            {WORKFLOW_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Food Category */}
          <select value={f.filterCat} onChange={(e) => setFilter('filterCat', e.target.value)}
            style={{ border: `1px solid ${f.filterCat ? COLORS.primary : COLORS.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, background: '#fff', cursor: 'pointer', color: f.filterCat ? COLORS.primary : 'inherit', fontWeight: f.filterCat ? 600 : 400 }}>
            <option value="">All Food Categories</option>
            {foodCats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Status */}
          <select value={f.filterStatus} onChange={(e) => setFilter('filterStatus', e.target.value)}
            style={{ border: `1px solid ${f.filterStatus ? COLORS.primary : COLORS.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, background: '#fff', cursor: 'pointer', color: f.filterStatus ? COLORS.primary : 'inherit', fontWeight: f.filterStatus ? 600 : 400 }}>
            <option value="">All Application Statuses</option>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Reference No. */}
          <input value={f.filterRef} onChange={(e) => setFilter('filterRef', e.target.value)}
            placeholder="Reference No."
            style={{ border: `1px solid ${f.filterRef ? COLORS.primary : COLORS.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, width: 130, outline: 'none', background: '#fff' }} />

          {/* Date From */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600 }}>From</span>
            <input type="date" value={f.filterFrom} onChange={(e) => setFilter('filterFrom', e.target.value)}
              style={{ border: `1px solid ${f.filterFrom ? COLORS.primary : COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11, outline: 'none' }} />
          </div>

          {/* Date To */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600 }}>To</span>
            <input type="date" value={f.filterTo} onChange={(e) => setFilter('filterTo', e.target.value)}
              style={{ border: `1px solid ${f.filterTo ? COLORS.primary : COLORS.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 11, outline: 'none' }} />
          </div>

          {/* Clear */}
          {hasFilters && (
            <button onClick={clearFilters}
              style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, color: COLORS.primary, cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>Loading applications…</div>
        ) : (
          <MiniTable
            cols={BIN_COLS[activeBin]}
            rows={displayed}
            renderRow={renderRow(activeBin)}
          />
        )}
      </div>
    </div>
  );
}

// Tell TypeScript about React.CSSProperties in this file
import type React from 'react';
