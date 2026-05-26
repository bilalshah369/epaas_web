// Tax Invoice / Payments page — mirrors mock ApplicantTaxInvoice screen.
import { useState, useEffect } from 'react';
import { COLORS, S } from '@/utils/colors';
import StatusBadge from '@/components/ui/StatusBadge';
import { fetchMyApplications, type Application } from '@/services/application.service';
import { getPayment, type PaymentRecord } from '@/services/payment.service';
import { openInvoiceWindow } from '@/utils/invoiceBuilder';

// ── Fee table ──────────────────────────────────────────────────────────────────
const FEE: Record<string, { desc: string; base: number; gst: number; total: number }> = {
  NSF:            { desc: 'Novel & Special Foods (NSF)',    base: 50000, gst: 9000, total: 59000 },
  ClaimApproval:  { desc: 'Claim Approval',                 base: 50000, gst: 9000, total: 59000 },
  AyurvedaAahara: { desc: 'Ayurveda Aahara',                base: 50000, gst: 9000, total: 59000 },
  RPET:           { desc: 'Recycled PET (rPET)',            base: 2000,  gst: 360,  total: 2360  },
  Vegan:          { desc: 'Vegan Logo Certification',       base: 10000, gst: 1800, total: 11800 },
};

const TYPE_LABELS: Record<string, string> = {
  NSF: 'NSF', ClaimApproval: 'Claim Approval', AyurvedaAahara: 'Ayurveda Aahara', RPET: 'rPET', Vegan: 'Vegan',
};

function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TaxInvoice() {
  const [apps, setApps]         = useState<Application[]>([]);
  const [payments, setPayments] = useState<Record<string, PaymentRecord | null>>({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetchMyApplications()
      .then((all) => {
        const submitted = all.filter((a) => a.stage !== 'Draft' && !['AnyOther'].includes(a.applicationType));
        setApps(submitted);
        // Load payment record for each submitted application
        Promise.all(
          submitted.map((a) => getPayment(a.id).then((p) => ({ id: a.id, p })).catch(() => ({ id: a.id, p: null })))
        ).then((results) => {
          const map: Record<string, PaymentRecord | null> = {};
          results.forEach(({ id, p }) => { map[id] = p; });
          setPayments(map);
        });
      })
      .finally(() => setLoading(false));
  }, []);

  function openInvoice(app: Application) {
    openInvoiceWindow(app, payments[app.id] ?? null);
  }

  const submitted = apps.filter((a) => a.stage !== 'Approved' && a.stage !== 'Closed');
  const approved  = apps.filter((a) => a.stage === 'Approved' || a.stage === 'Closed');

  function AppTable({ rows, title }: { rows: Application[]; title: string }) {
    if (rows.length === 0) return null;
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 4, height: 18, borderRadius: 2, background: COLORS.primary, display: 'inline-block' }} />
          {title}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['#', 'Reference No.', 'Company', 'Type', 'Fee (incl. GST)', 'Payment Ref.', 'Status', 'Action']
                  .map((h) => <th key={h} style={S.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((app, i) => {
                const payment     = payments[app.id] ?? null;
                const fallbackFee = FEE[app.applicationType] ?? FEE['NSF'];
                const fee = payment?.amount
                  ? { total: Math.round(payment.amount / 100), base: Math.round(payment.amount / 100 * 100 / 118), gst: Math.round(payment.amount / 100 * 18 / 118) }
                  : fallbackFee;
                const paid    = payment?.status === 'Completed';
                const invoiceNo = payment?.invoiceNo ?? '';
                return (
                  <tr key={app.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={S.td}><span style={{ color: COLORS.primary, fontWeight: 700 }}>{app.referenceNumber}</span></td>
                    <td style={S.td}><span style={{ fontWeight: 600 }}>{app.companyName}</span></td>
                    <td style={S.td}>{TYPE_LABELS[app.applicationType] ?? app.applicationType}</td>
                    <td style={S.td}>
                      <div style={{ fontWeight: 700 }}>{inr(fee.total)}</div>
                      <div style={{ fontSize: 10, color: COLORS.textMuted }}>{inr(fee.base)} + {inr(fee.gst)} GST</div>
                    </td>
                    <td style={S.td}>
                      {paid
                        ? <span style={{ color: '#065F46', fontWeight: 600 }}>✓ {invoiceNo}</span>
                        : <span style={{ color: COLORS.textMuted, fontStyle: 'italic' }}>Pending</span>}
                    </td>
                    <td style={S.td}><StatusBadge status={app.stage} /></td>
                    <td style={S.td}>
                      <button
                        onClick={() => openInvoice(app)}
                        style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        🧾 View Invoice
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Page header ───────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={S.roleLabel}>APPLICANT</div>
        <div style={S.pageTitle}>Tax Invoice / Payments</div>
        <div style={S.pageDesc}>View and print GST tax invoices for all your submitted applications.</div>
      </div>

      {/* ── Fee reference card ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 20 }}>
        {Object.entries(FEE).map(([type, f]) => (
          <div key={type} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{TYPE_LABELS[type]}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.primary, fontFamily: "'Libre Baskerville',serif" }}>{inr(f.total)}</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>{inr(f.base)} + {inr(f.gst)} GST</div>
          </div>
        ))}
      </div>

      {/* ── Invoice table ─────────────────────────────────────────── */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>Loading…</div>
        ) : apps.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🧾</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>No invoices yet</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>Invoices will appear here once you submit an application.</div>
          </div>
        ) : (
          <>
            <AppTable rows={submitted} title="Submitted / Under Review" />
            <AppTable rows={approved}  title="Approved / Closed" />
          </>
        )}
      </div>

      {/* ── GST info footer ───────────────────────────────────────── */}
      <div style={{ marginTop: 14, fontSize: 11, color: COLORS.textMuted, lineHeight: 1.7 }}>
        <strong>FSSAI GSTIN:</strong> 07AAAGF0023K1ZV &nbsp;|&nbsp;
        <strong>HSN/SAC Code:</strong> 852380 &nbsp;|&nbsp;
        <strong>GST Rate:</strong> 18% &nbsp;|&nbsp;
        Invoices are computer-generated and do not require a physical signature.
      </div>
    </div>
  );
}

