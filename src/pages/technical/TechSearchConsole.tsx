// Technical Officer — Search Console (/technical/search)
import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, S } from '@/utils/colors';
import { fetchTechnicalAll } from '@/services/technical.service';
import type { Application } from '@/services/application.service';
import type React from 'react';

const FOOD_PRODUCT_CATEGORIES = [
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

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const iStyle: React.CSSProperties = { padding: '7px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, background: COLORS.bg, width: '100%', boxSizing: 'border-box' };
const lStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: COLORS.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 };

function DatePair({ fromLabel, toLabel, fromVal, toVal, onFrom, onTo }: {
  fromLabel: string; toLabel: string;
  fromVal: string; toVal: string;
  onFrom: (v: string) => void; onTo: (v: string) => void;
}) {
  return (
    <>
      <div><label style={lStyle}>{fromLabel}</label><input type="date" value={fromVal} onChange={(e) => onFrom(e.target.value)} style={iStyle} /></div>
      <div><label style={lStyle}>{toLabel}</label><input type="date" value={toVal} onChange={(e) => onTo(e.target.value)} style={iStyle} /></div>
    </>
  );
}

const SUMMARY_LABELS = [
  { label: 'Total applications received',          fn: (_a: Application) => true },
  { label: 'Applications Approved',                fn: (a: Application) => ['Approved', 'Closed'].includes(a.stage) },
  { label: 'Applications Rejected',                fn: (a: Application) => a.stage === 'Rejected' },
  { label: 'Applications Pending / Under Review',  fn: (a: Application) => !['Approved', 'Closed', 'Rejected', 'Withdrawn', 'Draft'].includes(a.stage) },
  { label: 'Applications Withdrawn / Closed',      fn: (a: Application) => a.stage === 'Withdrawn' },
];

const TABLE_COLS = [
  'Sr. No.',
  'Application No.',
  'Name and Address of Applicant',
  'Name of Product',
  'Date of Receipt of Application',
  'EC Number',
  'EC Status',
  'Date of Receipt of Appeal',
  'Date of Appellate Order',
  'Date of Receipt of Review',
  'Date of Review Order',
  'Date of Issue of Form II',
  'Final Status',
];

export default function TechSearchConsole() {
  const navigate  = useNavigate();
  const [searched, setSearched] = useState(false);
  const [allApps,  setAllApps]  = useState<Application[]>([]);
  const [loading,  setLoading]  = useState(false);

  // Filter state
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

  const results = useMemo(() => {
    let list = [...allApps];
    if (fCompany) list = list.filter((a) => a.companyName.toLowerCase().includes(fCompany.toLowerCase()));
    if (fStatus)  list = list.filter((a) => a.stage === fStatus);
    if (fRefNo)   list = list.filter((a) => a.referenceNumber.toLowerCase().includes(fRefNo.toLowerCase()));
    if (fProduct) list = list.filter((a) => (a.productName ?? '').toLowerCase().includes(fProduct.toLowerCase()));
    if (fFoodCat) list = list.filter((a) => (a.foodCategory ?? '').toLowerCase().includes(fFoodCat.toLowerCase()));
    if (fSubFrom) list = list.filter((a) => a.submittedAt && new Date(a.submittedAt) >= new Date(fSubFrom));
    if (fSubTo)   list = list.filter((a) => a.submittedAt && new Date(a.submittedAt) <= new Date(fSubTo + 'T23:59:59'));
    return list;
  }, [allApps, fCompany, fStatus, fRefNo, fProduct, fFoodCat, fSubFrom, fSubTo]);

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTechnicalAll();
      setAllApps(data);
      setSearched(true);
    } finally { setLoading(false); }
  }, []);

  const doReset = () => {
    setSearched(false); setAllApps([]);
    setFCompany(''); setFStatus(''); setFRefNo('');
    setFBusiness(''); setFFoodCat(''); setFProduct(''); setFAppType('');
    setFSubFrom(''); setFSubTo(''); setFApprFrom(''); setFApprTo('');
    setFRejFrom(''); setFRejTo(''); setFWitFrom(''); setFWitTo('');
    setFAppealFrom(''); setFAppealTo(''); setFRevFrom(''); setFRevTo('');
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 2 }}>TECHNICAL OFFICER</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif" }}>Search Console</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>Comprehensive search across all applications, approvals, and lifecycle events.</div>
      </div>

      {searched && allApps.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 16 }}>
          {SUMMARY_LABELS.map((s) => (
            <div key={s.label} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${COLORS.primary}`, borderRadius: 8, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.primary, fontFamily: "'Libre Baskerville',Georgia,serif" }}>{allApps.filter(s.fn).length}</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4, lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 18 }}>Search Filters</div>

        {/* Row 1: Company, Status, Reference */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lStyle}>Name of Company / Organization</label>
            <input value={fCompany} onChange={(e) => setFCompany(e.target.value)} placeholder="Search company..." style={iStyle} />
          </div>
          <div>
            <label style={lStyle}>Application Status</label>
            <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} style={{ ...iStyle, cursor: 'pointer' }}>
              <option value="">All Stages</option>
              <option value="WithNodalOfficerA">Document Scrutinization</option>
              <option value="WithTechnicalOfficer">Forwarded to Technical Officer</option>
              <option value="WithEC">Forwarded to EC</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="QuerySent">Query Sent / Reverted</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>
          </div>
          <div>
            <label style={lStyle}>Reference No. / Approval No.</label>
            <input value={fRefNo} onChange={(e) => setFRefNo(e.target.value)} placeholder="Enter ref. or approval no." style={iStyle} />
          </div>
        </div>

        {/* Row 2: Kind of Business, Food Product Category, Product Name */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lStyle}>Kind of Business</label>
            <select value={fBusiness} onChange={(e) => setFBusiness(e.target.value)} style={{ ...iStyle, cursor: 'pointer' }}>
              <option value="">All</option>
              <option value="Manufacturer">Manufacturer</option>
              <option value="Relabeller">Relabeller</option>
              <option value="Importer">Importer</option>
            </select>
          </div>
          <div>
            <label style={lStyle}>Food Product Category</label>
            <select value={fFoodCat} onChange={(e) => setFFoodCat(e.target.value)} style={{ ...iStyle, cursor: 'pointer' }}>
              <option value="">All Categories</option>
              {FOOD_PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lStyle}>Product Name</label>
            <input value={fProduct} onChange={(e) => setFProduct(e.target.value)} placeholder="Enter product name..." style={iStyle} />
          </div>
        </div>

        {/* Row 3: Type of Application */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lStyle}>Type of Application</label>
            <select value={fAppType} onChange={(e) => setFAppType(e.target.value)} style={{ ...iStyle, cursor: 'pointer' }}>
              <option value="">All Types</option>
              <option value="New">New</option>
              <option value="Appeal">Appeal</option>
              <option value="Review">Review</option>
            </select>
          </div>
        </div>

        {/* Date filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <DatePair fromLabel="Application Submitted Date (From)" toLabel="Application Submitted Date (To)" fromVal={fSubFrom}    toVal={fSubTo}    onFrom={setFSubFrom}    onTo={setFSubTo}    />
          <DatePair fromLabel="Approval Issued Date (From)"       toLabel="Approval Issued Date (To)"       fromVal={fApprFrom}   toVal={fApprTo}   onFrom={setFApprFrom}   onTo={setFApprTo}   />
          <DatePair fromLabel="Rejection Issued Date (From)"      toLabel="Rejection Issued Date (To)"      fromVal={fRejFrom}    toVal={fRejTo}    onFrom={setFRejFrom}    onTo={setFRejTo}    />
          <DatePair fromLabel="Withdrawn / Closure Date (From)"   toLabel="Withdrawn / Closure Date (To)"   fromVal={fWitFrom}    toVal={fWitTo}    onFrom={setFWitFrom}    onTo={setFWitTo}    />
          <DatePair fromLabel="Appeal Date (From)"                toLabel="Appeal Date (To)"                fromVal={fAppealFrom} toVal={fAppealTo} onFrom={setFAppealFrom} onTo={setFAppealTo} />
          <DatePair fromLabel="Review Date (From)"                toLabel="Review Date (To)"                fromVal={fRevFrom}    toVal={fRevTo}    onFrom={setFRevFrom}    onTo={setFRevTo}    />
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

      {searched && (
        <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>Search Results — {results.length} Records Found</div>
            <button style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>⬇ Export CSV</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{TABLE_COLS.map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {results.length === 0 && (
                  <tr><td colSpan={TABLE_COLS.length} style={{ ...S.td, textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>No applications match the filters.</td></tr>
                )}
                {results.map((a, i) => {
                  const isApproved = ['Approved', 'Closed'].includes(a.stage);
                  const isRejected = a.stage === 'Rejected';
                  const bg = isApproved ? COLORS.successLight : isRejected ? COLORS.dangerLight : COLORS.warningLight;
                  const fg = isApproved ? COLORS.success       : isRejected ? COLORS.danger      : COLORS.warning;
                  return (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg, cursor: 'pointer' }}
                        onClick={() => navigate(`/technical/assessment/${a.id}`)}>
                      <td style={S.td}>{i + 1}</td>
                      <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                      <td style={S.td}>
                        <div style={{ fontWeight: 600 }}>{a.companyName}</div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted }}>{a.address ?? '—'}</div>
                      </td>
                      <td style={S.td}>{a.productName ?? '—'}</td>
                      <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                      <td style={{ ...S.td, fontWeight: 700 }}>{a.approvalNumber ?? '—'}</td>
                      <td style={S.td}>—</td>
                      <td style={S.td}>—</td>
                      <td style={S.td}>—</td>
                      <td style={S.td}>—</td>
                      <td style={S.td}>—</td>
                      <td style={S.td}>{fmtDate((a.toDecision as Record<string,unknown> | null)?.recordedAt as string | null)}</td>
                      <td style={S.td}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: bg, color: fg }}>{a.stage}</span>
                      </td>
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
