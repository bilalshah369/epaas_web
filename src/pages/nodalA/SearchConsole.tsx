// Mirrors SearchConsole from mock (App.jsx L15885).
// Wired to real API: fetchNodalAAll() used as search source.
import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, S } from '@/utils/colors';
import { resolveFoodCategory } from '@/utils/docResolver';
import { fetchNodalAAll } from '@/services/officer.service';
import type { Application } from '@/services/application.service';

const STAGE_PENDING_WITH: Record<string, string> = {
  WithNodalOfficerA:    'Nodal Officer',
  WithTechnicalOfficer: 'Technical Officer',
  WithEC:               'Expert Committee',
  WithNodalOfficerB:    'Nodal Officer B',
  WithCEO:              'CEO',
  WithChairperson:      'Chairperson',
  Approved:             '—',
  Rejected:             '—',
  Closed:               '—',
  Withdrawn:            '—',
  QuerySent:            'Applicant',
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const FOOD_PRODUCT_CATEGORIES = [
  'None',
  'Bakery products',
  'Beverages, excluding dairy products',
  'Cereals and cereal products, derived from cereal grains, from roots and tubers, pulses, legumes and pith or soft core of palm tree, excluding bakery wares of food category 7.0',
  'Confectionery',
  'Dairy products and analogues, excluding products of food category 2.0',
  'Edible ices, including sherbet and sorbet',
  'Eggs and egg products',
  'Fats and oils, and fat emulsions',
  'Indian Sweets and Indian Snacks & Savouries products',
  'Substances added to food',
  'Standardised Food Product excluding those covered under category 1-14',
  'Fish and fish products, including molluscs, crustaceans, and echinoderms',
  'Foodstuffs intended for particular nutritional uses',
  'Fruits and vegetables (including mushrooms and fungi, roots and tubers, fresh pulses and legumes, and aloe vera), seaweeds, and nuts and seeds',
  'Hemp Seeds and Seed Products',
  'Meat and meat products, including poultry and game',
  'Prepared Foods',
  'Products not covered into category 1-16',
  'Products for export only',
  'Ready-to-eat savouries',
  'Salts, spices, soups, sauces, salads and protein products',
  'Sweeteners, including honey',
];

const iStyle: React.CSSProperties = { padding: '7px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, background: COLORS.bg, width: '100%', boxSizing: 'border-box' };
const lStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: COLORS.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 };

interface DatePairProps { fromLabel: string; toLabel: string; fromVal: string; toVal: string; onFrom: (v: string) => void; onTo: (v: string) => void; }
function DatePair({ fromLabel, toLabel, fromVal, toVal, onFrom, onTo }: DatePairProps) {
  return (
    <>
      <div><label style={lStyle}>{fromLabel}</label><input type="date" value={fromVal} onChange={(e) => onFrom(e.target.value)} style={iStyle} /></div>
      <div><label style={lStyle}>{toLabel}</label><input type="date" value={toVal} onChange={(e) => onTo(e.target.value)} style={iStyle} /></div>
    </>
  );
}

const SUMMARY_LABELS = [
  { label: 'Total applications received',         stageFilter: (_a: Application) => true },
  { label: 'Applications Approved',               stageFilter: (a: Application) => ['Approved', 'Closed'].includes(a.stage) },
  { label: 'Applications Rejected',               stageFilter: (a: Application) => a.stage === 'Rejected' },
  { label: 'Applications Pending / Under Review', stageFilter: (a: Application) => !['Approved', 'Closed', 'Rejected', 'Withdrawn', 'Draft'].includes(a.stage) },
  { label: 'Applications Withdrawn / Closed',     stageFilter: (a: Application) => a.stage === 'Withdrawn' },
];

const TABLE_COLS = ['Sr. No.', 'Application No.', 'Name & Address of Applicant', 'Name of Product', 'Date of Receipt of Application', 'EC Number', 'EC Status', 'Date of Receipt of Appeal', 'Date of Appellate Order', 'Date of Receipt of Review', 'Date of Review Order', 'Date of Issue of Form II', 'Final Status'];

export default function SearchConsole() {
  const navigate = useNavigate();
  const [searched,  setSearched]  = useState(false);
  const [allApps,   setAllApps]   = useState<Application[]>([]);
  const [loading,   setLoading]   = useState(false);

  const [fCompany,    setFCompany]    = useState('');
  const [fStatus,     setFStatus]     = useState('');
  const [fRefNo,      setFRefNo]      = useState('');
  const [fBusiness,   setFBusiness]   = useState('');
  const [fFoodCat,    setFFoodCat]    = useState('');
  const [fProduct,    setFProduct]    = useState('');
  const [fAppType,    setFAppType]    = useState('');
  const [fSubFrom,    setFSubFrom]    = useState('');
  const [fSubTo,      setFSubTo]      = useState('');
  const [fApprFrom,   setFApprFrom]   = useState('');
  const [fApprTo,     setFApprTo]     = useState('');
  const [fRejFrom,    setFRejFrom]    = useState('');
  const [fRejTo,      setFRejTo]      = useState('');
  const [fWitFrom,    setFWitFrom]    = useState('');
  const [fWitTo,      setFWitTo]      = useState('');
  const [fAppealFrom, setFAppealFrom] = useState('');
  const [fAppealTo,   setFAppealTo]   = useState('');
  const [fRevFrom,    setFRevFrom]    = useState('');
  const [fRevTo,      setFRevTo]      = useState('');

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNodalAAll();
      setAllApps(data);
      setSearched(true);
    } finally { setLoading(false); }
  }, []);

  const doReset = () => {
    setSearched(false); setAllApps([]);
    setFCompany(''); setFStatus(''); setFRefNo(''); setFBusiness(''); setFFoodCat('');
    setFProduct(''); setFAppType(''); setFSubFrom(''); setFSubTo(''); setFApprFrom('');
    setFApprTo(''); setFRejFrom(''); setFRejTo(''); setFWitFrom(''); setFWitTo('');
    setFAppealFrom(''); setFAppealTo(''); setFRevFrom(''); setFRevTo('');
  };

  const inRange = (iso: string | null | undefined, from: string, to: string) => {
    if (!iso) return true;
    const d = new Date(iso).getTime();
    if (from && d < new Date(from).getTime()) return false;
    if (to   && d > new Date(to).getTime())   return false;
    return true;
  };

  const results = useMemo(() => {
    if (!searched) return [];
    return allApps.filter((a) => {
      if (fCompany && !a.companyName.toLowerCase().includes(fCompany.toLowerCase())) return false;
      if (fStatus  && fStatus !== 'All Stages' && a.stage !== fStatus) return false;
      if (fRefNo   && !a.referenceNumber.toLowerCase().includes(fRefNo.toLowerCase())) return false;
      if (fProduct && !(a.productName ?? '').toLowerCase().includes(fProduct.toLowerCase())) return false;
      if (fFoodCat && fFoodCat !== 'None' && a.foodCategory !== fFoodCat) return false;
      if (!inRange(a.submittedAt, fSubFrom, fSubTo)) return false;
      return true;
    });
  }, [allApps, searched, fCompany, fStatus, fRefNo, fProduct, fFoodCat, fSubFrom, fSubTo]);

  // suppress unused warning for STAGE_PENDING_WITH
  void STAGE_PENDING_WITH;

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 16 }}>
        <div style={S.pageDesc}>Comprehensive search across all applications, approvals, and lifecycle events.</div>
      </div>

      {/* Summary stats */}
      {searched && allApps.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 16 }}>
          {SUMMARY_LABELS.map((s) => {
            const count = allApps.filter(s.stageFilter).length;
            return (
              <div key={s.label} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${COLORS.primary}`, borderRadius: 8, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.primary, fontFamily: "'Libre Baskerville',Georgia,serif" }}>{count}</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4, lineHeight: 1.4 }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search Filters Card */}
      <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 18 }}>Search Filters</div>

        {/* Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lStyle}>Name of Company / Organization</label>
            <input placeholder="Search company..." value={fCompany} onChange={(e) => setFCompany(e.target.value)} style={iStyle} />
          </div>
          <div>
            <label style={lStyle}>Application Status</label>
            <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} style={{ ...iStyle, cursor: 'pointer' }}>
              <option>All Stages</option>
              <option>Document Scrutinization</option>
              <option>Forwarded to Technical Officer</option>
              <option>Forwarded to EC</option>
              <option>Approved</option>
              <option>Rejected</option>
              <option>Conditionally Approved</option>
              <option>Withdrawn</option>
              <option>Under Appeal</option>
              <option>Under Review</option>
            </select>
          </div>
          <div>
            <label style={lStyle}>Reference No. / Approval No.</label>
            <input placeholder="Enter ref. or approval no." value={fRefNo} onChange={(e) => setFRefNo(e.target.value)} style={iStyle} />
          </div>
        </div>

        {/* Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lStyle}>Kind of Business</label>
            <select value={fBusiness} onChange={(e) => setFBusiness(e.target.value)} style={{ ...iStyle, cursor: 'pointer' }}>
              <option value="">Select Business Type</option>
              <option>Manufacturer</option>
              <option>Relabeller</option>
              <option>Importer</option>
            </select>
          </div>
          <div>
            <label style={lStyle}>Food Product Category</label>
            <select value={fFoodCat} onChange={(e) => setFFoodCat(e.target.value)} style={{ ...iStyle, cursor: 'pointer' }}>
              {FOOD_PRODUCT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lStyle}>Product Name</label>
            <input placeholder="Search product..." value={fProduct} onChange={(e) => setFProduct(e.target.value)} style={iStyle} />
          </div>
        </div>

        {/* Row 3 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lStyle}>Type of Application</label>
            <select value={fAppType} onChange={(e) => setFAppType(e.target.value)} style={{ ...iStyle, cursor: 'pointer' }}>
              <option value="">Select Type</option>
              <option>New</option>
              <option>Appeal</option>
              <option>Review</option>
            </select>
          </div>
        </div>

        {/* Date Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <DatePair fromLabel="Application Submitted Date (From)" toLabel="Application Submitted Date (To)" fromVal={fSubFrom} toVal={fSubTo} onFrom={setFSubFrom} onTo={setFSubTo} />
          <DatePair fromLabel="Approval Issued Date (From)" toLabel="Approval Issued Date (To)" fromVal={fApprFrom} toVal={fApprTo} onFrom={setFApprFrom} onTo={setFApprTo} />
          <DatePair fromLabel="Rejection Issued Date (From)" toLabel="Rejection Issued Date (To)" fromVal={fRejFrom} toVal={fRejTo} onFrom={setFRejFrom} onTo={setFRejTo} />
          <DatePair fromLabel="Appeal Date (From)" toLabel="Appeal Date (To)" fromVal={fAppealFrom} toVal={fAppealTo} onFrom={setFAppealFrom} onTo={setFAppealTo} />
          <DatePair fromLabel="Review Date (From)" toLabel="Review Date (To)" fromVal={fRevFrom} toVal={fRevTo} onFrom={setFRevFrom} onTo={setFRevTo} />
          <DatePair fromLabel="Withdrawn / Closure Date (From)" toLabel="Withdrawn / Closure Date (To)" fromVal={fWitFrom} toVal={fWitTo} onFrom={setFWitFrom} onTo={setFWitTo} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={doSearch} disabled={loading}
            style={{ padding: '7px 24px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Searching…' : 'Search'}
          </button>
          <button onClick={doReset}
            style={{ padding: '7px 16px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
            Reset
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searched && (
        <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Search Results — {results.length} Records Found
            </div>
            <button style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{TABLE_COLS.map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {results.length === 0 && <tr><td colSpan={13} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No applications match the filters.</td></tr>}
                {results.map((a, i) => {
                  const isApproved = ['Approved', 'Closed'].includes(a.stage);
                  const isRejected = a.stage === 'Rejected';
                  const badgeBg    = isApproved ? COLORS.successLight : isRejected ? COLORS.dangerLight : COLORS.warningLight;
                  const badgeFg    = isApproved ? COLORS.success      : isRejected ? COLORS.danger      : COLORS.warning;
                  return (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                      <td style={S.td}>{i + 1}</td>
                      <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                      <td style={S.td}>{a.companyName}{a.address ? `, ${a.address}` : ''}</td>
                      <td style={S.td}>{a.productName ?? '—'}</td>
                      <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                      <td style={{ ...S.td, fontWeight: 700 }}>{a.approvalNumber ?? '—'}</td>
                      <td style={S.td}>—</td>
                      <td style={S.td}>—</td>
                      <td style={S.td}>—</td>
                      <td style={S.td}>—</td>
                      <td style={S.td}>—</td>
                      <td style={S.td}>—</td>
                      <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: badgeBg, color: badgeFg }}>{a.stage}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
