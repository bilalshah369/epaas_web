// Mirrors ApplicantApplicationDetails from mock (App.jsx L10549).
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, S } from '@/utils/colors';
import StatusBadge from '@/components/ui/StatusBadge';
import { fetchMyApplications, deleteDraftApplication, type Application } from '@/services/application.service';

const STATUS_OPTIONS = ['All Statuses', 'Draft', 'WithNodalOfficerA', 'WithTechnicalOfficer', 'WithExpertCommittee', 'QuerySent', 'WithCEO', 'WithChairperson', 'Approved', 'Rejected'];
const STATUS_LABELS: Record<string, string> = {
  WithNodalOfficerA: 'Document Scrutiny', WithTechnicalOfficer: 'Technical Assessment',
  WithExpertCommittee: 'Expert Committee', QuerySent: 'Query / Clarification',
  WithCEO: 'CEO (Appeal)', WithChairperson: 'Chairperson (Review)',
};
const TYPE_OPTIONS   = ['All Types', 'NSF', 'Claim Approval', 'Ayurveda Aahara', 'rPET', 'Any Other'];
const STATUS_MAP: Record<string, string> = { 'Claim Approval': 'ClaimApproval', 'Ayurveda Aahara': 'AyurvedaAahara', 'rPET': 'RPET', 'Any Other': 'AnyOther' };
const APP_TYPE_NORM: Record<string, string> = {
  CA: 'ClaimApproval', ClaimApproval: 'ClaimApproval',
  AA: 'AyurvedaAahara', AyurvedaAahara: 'AyurvedaAahara',
  NSF: 'NSF', RPET: 'RPET', AnyOther: 'AnyOther',
};
const TYPE_LABELS: Record<string, string> = {
  NSF: 'NSF', ClaimApproval: 'Claim Approval', AyurvedaAahara: 'Ayurveda Aahara', RPET: 'rPET', AnyOther: 'Any Other',
};

function ActionBtn({ label, variant = 'primary', onClick }: { label: string; variant?: string; onClick?: () => void }) {
  const vars: Record<string, React.CSSProperties> = {
    primary: { background: COLORS.primary,  color: '#fff', border: 'none' },
    outline:  { background: 'transparent',  color: COLORS.primary, border: `1.5px solid ${COLORS.primary}` },
    warning:  { background: COLORS.warning, color: '#fff', border: 'none' },
    danger:   { background: '#d32f2f',       color: '#fff', border: 'none' },
  };
  return (
    <button
      onClick={onClick}
      style={{ ...(vars[variant] ?? vars.primary), display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', marginRight: 4, marginBottom: 2 }}
    >
      {label}
    </button>
  );
}

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
  // RPET — flat addressOfPremise
  if (typeof fd.addressOfPremise === 'string' && fd.addressOfPremise.trim()) return fd.addressOfPremise;
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

function getEditPath(r: Application): string {
  if (r.applicationType === 'NSF')             return `/app/apply/nsf-form?id=${r.id}`;
  if (r.applicationType === 'CA')              return `/app/apply/ca-form?id=${r.id}`;
  if (r.applicationType === 'AyurvedaAahara' || r.applicationType === 'AA')
                                               return `/app/apply/aa-form?id=${r.id}`;
  if (r.applicationType === 'RPET')            return `/app/apply/rpet-form?id=${r.id}`;
  return `/app/apply/form?id=${r.id}&type=${r.applicationType}`;
}

export default function ApplicationDetails() {
  const navigate = useNavigate();
  const [apps, setApps]           = useState<Application[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [filterType, setFilterType]     = useState('All Types');
  const [deleting, setDeleting]         = useState<string | null>(null);

  useEffect(() => {
    fetchMyApplications()
      .then(setApps)
      .finally(() => setLoading(false));
  }, []);

  const displayed = useMemo(() => {
    let list = apps;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        a.referenceNumber.toLowerCase().includes(q) ||
        a.companyName.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'All Statuses') list = list.filter((a) => a.stage === filterStatus);
    if (filterType   !== 'All Types') {
      const dbVal = STATUS_MAP[filterType] ?? filterType;
      list = list.filter((a) => (APP_TYPE_NORM[a.applicationType] ?? a.applicationType) === dbVal);
    }
    return list;
  }, [apps, search, filterStatus, filterType]);

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this draft application? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await deleteDraftApplication(id);
      setApps((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  function fmtDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <div>
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={S.roleLabel}>APPLICANT</div>
          <div style={S.pageTitle}>Application Details</div>
          <div style={S.pageDesc}>Complete list of all your E-PAAS applications across all statuses.</div>
        </div>
        <button
          onClick={() => navigate('/app/apply')}
          style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          + New Application
        </button>
      </div>

      {/* ── Card ─────────────────────────────────────────────────────── */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applications…"
            style={{ flex: 1, minWidth: 200, border: `1.5px solid ${COLORS.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 11, outline: 'none', background: COLORS.bg }}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontSize: 11, background: '#fff', cursor: 'pointer', minWidth: 150 }}
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontSize: 11, background: '#fff', cursor: 'pointer', minWidth: 150 }}
          >
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t === 'All Types' ? t : (TYPE_LABELS[t] ?? t)}</option>)}
          </select>
          {(search || filterStatus !== 'All Statuses' || filterType !== 'All Types') && (
            <button
              onClick={() => { setSearch(''); setFilterStatus('All Statuses'); setFilterType('All Types'); }}
              style={{ background: 'none', border: 'none', fontSize: 11, color: COLORS.primary, cursor: 'pointer', fontWeight: 600 }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Record count */}
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>
          {displayed.length} record{displayed.length !== 1 ? 's' : ''}
          {(search || filterStatus !== 'All Statuses' || filterType !== 'All Types') && ` (filtered from ${apps.length})`}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>Loading…</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>No applications found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Sr. No.', 'Company Name', 'Reference No.', 'Address', 'Application Type', 'Food Category', 'Last Updated', 'Status', 'Action']
                    .map((c) => <th key={c} style={S.th}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {displayed.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={S.td}><span style={{ fontWeight: 600 }}>{r.companyName}</span></td>
                    <td style={S.td}>
                      <span style={{ color: COLORS.primary, fontWeight: 600 }}>{r.referenceNumber}</span>
                      {r.approvalNumber && (
                        <div style={{ marginTop: 2, fontSize: 10, fontWeight: 700, color: r.stage === 'Approved' ? COLORS.success : COLORS.danger }}>
                          {r.stage === 'Approved' ? 'Appr.' : 'Rjct.'} {r.approvalNumber}
                        </div>
                      )}
                    </td>
                    <td style={S.td}><span style={{ color: COLORS.primary, fontWeight: 600 }}>{getAddress(r)}</span></td>
                    <td style={S.td}>{TYPE_LABELS[r.applicationType] ?? r.applicationType}</td>
                    <td style={S.td}>{getFoodCategory(r)}</td>
                    <td style={S.td}>{fmtDate(r.updatedAt)}</td>
                    <td style={S.td}><StatusBadge status={r.stage} /></td>
                    <td style={S.td}>
                      <ActionBtn label="View / Respond" variant="outline" onClick={() => navigate(`/app/applications/${r.id}`)} />
                      {r.stage === 'Draft'     && <ActionBtn label="Edit"    variant="primary" onClick={() => navigate(getEditPath(r))} />}
                      {r.stage === 'Draft'     && <ActionBtn label="Delete"  variant="danger"  onClick={() => handleDelete(r.id)} />}
                      {r.stage === 'QuerySent' && <ActionBtn label="Respond" variant="warning" onClick={() => navigate(`/app/applications/${r.id}?tab=2`)} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import type React from 'react';
