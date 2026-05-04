// Tax Invoice / Payments page — mirrors mock ApplicantTaxInvoice screen.
import { useState, useEffect } from 'react';
import { COLORS, S } from '@/utils/colors';
import StatusBadge from '@/components/ui/StatusBadge';
import { fetchMyApplications, type Application, type AppFormData } from '@/services/application.service';

// ── Fee table ──────────────────────────────────────────────────────────────────
const FEE: Record<string, { desc: string; base: number; gst: number; total: number }> = {
  NSF:            { desc: 'Novel & Special Foods (NSF)',  base: 50000, gst: 9000,  total: 59000  },
  ClaimApproval:  { desc: 'Claim Approval',               base: 50000, gst: 9000,  total: 59000  },
  AyurvedaAahara: { desc: 'Ayurveda Aahara',              base: 50000, gst: 9000,  total: 59000  },
  RPET:           { desc: 'Recycled PET (rPET)',          base: 15000, gst: 2700,  total: 17700  },
  AnyOther:       { desc: 'Any Other Non-Specified Food', base: 10000, gst: 1800,  total: 11800  },
};

const TYPE_LABELS: Record<string, string> = {
  NSF: 'NSF', ClaimApproval: 'Claim Approval', AyurvedaAahara: 'Ayurveda Aahara', RPET: 'rPET', AnyOther: 'Any Other',
};

function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ── Invoice HTML generator (opens in new window for printing) ─────────────────
function buildInvoiceHtml(app: Application) {
  const fee  = FEE[app.applicationType] ?? FEE['NSF'];
  const fd   = app.formData as AppFormData | null;
  const payMethod = fd?.step5?.paymentMethod  ?? '—';
  const payRef    = fd?.step5?.paymentReference ?? '—';
  const address   = fd?.step2?.orgAddress ?? app.address ?? '—';
  const license   = fd?.step2?.licenseNumber ?? '—';
  const invoiceNo = `INV-${app.referenceNumber}`;
  const invoiceDate = fmtDate(app.submittedAt ?? app.updatedAt);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tax Invoice — ${invoiceNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 32px; }
    .page { max-width: 780px; margin: 0 auto; border: 2px solid #1A3C34; border-radius: 4px; overflow: hidden; }
    .header { background: #1A3C34; color: #fff; padding: 20px 28px; display: flex; align-items: center; gap: 20px; }
    .logo-box { width: 56px; height: 56px; background: rgba(255,255,255,0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 28px; flex-shrink: 0; }
    .org-name { font-size: 18px; font-weight: 700; letter-spacing: 0.3px; }
    .org-sub  { font-size: 11px; color: rgba(255,255,255,0.8); margin-top: 2px; }
    .org-addr { font-size: 10px; color: rgba(255,255,255,0.7); margin-top: 4px; line-height: 1.5; }
    .title-bar { background: #E8F5E9; border-bottom: 2px solid #1A3C34; padding: 10px 28px; display: flex; justify-content: space-between; align-items: center; }
    .invoice-title { font-size: 16px; font-weight: 700; color: #1A3C34; letter-spacing: 1px; text-transform: uppercase; }
    .invoice-meta  { font-size: 12px; color: #333; text-align: right; }
    .body { padding: 24px 28px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px; }
    .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #666; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px; margin-bottom: 8px; }
    .field { margin-bottom: 6px; }
    .field-label { font-size: 10px; color: #888; }
    .field-val   { font-size: 13px; font-weight: 600; color: #111; margin-top: 1px; }
    .fee-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .fee-table th { background: #1A3C34; color: #fff; font-size: 11px; font-weight: 600; padding: 8px 12px; text-align: left; }
    .fee-table td { padding: 9px 12px; border-bottom: 1px solid #E5E7EB; font-size: 13px; }
    .fee-table tr:last-child td { border-bottom: none; }
    .fee-table .num { text-align: right; }
    .total-row td { font-weight: 700; font-size: 14px; background: #F0FDF4; }
    .payment-box { background: #F8FAFC; border: 1px solid #E5E7EB; border-radius: 6px; padding: 14px 16px; margin-bottom: 20px; }
    .status-paid { display: inline-block; background: #D1FAE5; color: #065F46; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 10px; }
    .status-pending { display: inline-block; background: #FEF3C7; color: #92400E; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 10px; }
    .footer { border-top: 2px solid #1A3C34; padding: 14px 28px; display: flex; justify-content: space-between; align-items: flex-end; background: #F9FAFB; font-size: 10px; color: #666; }
    .sig-line { text-align: right; }
    .sig-line .name { font-size: 13px; font-weight: 700; color: #1A3C34; }
    .notice { font-size: 10px; color: #888; border: 1px dashed #ccc; border-radius: 4px; padding: 8px 12px; margin-bottom: 16px; line-height: 1.5; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="logo-box">🛡</div>
    <div>
      <div class="org-name">Food Safety and Standards Authority of India</div>
      <div class="org-sub">Ministry of Health and Family Welfare, Government of India</div>
      <div class="org-addr">FDA Bhawan, Kotla Road, New Delhi – 110 002 &nbsp;|&nbsp; GSTIN: 07AAAGF0189N1Z5 &nbsp;|&nbsp; www.fssai.gov.in</div>
    </div>
  </div>

  <!-- Title bar -->
  <div class="title-bar">
    <div class="invoice-title">Tax Invoice</div>
    <div class="invoice-meta">
      <div><strong>Invoice No.:</strong> ${invoiceNo}</div>
      <div><strong>Date:</strong> ${invoiceDate}</div>
    </div>
  </div>

  <div class="body">
    <!-- Applicant + Application details -->
    <div class="two-col">
      <div>
        <div class="section-label">Bill To</div>
        <div class="field"><div class="field-val">${app.companyName}</div></div>
        <div class="field"><div class="field-label">Address</div><div class="field-val" style="font-weight:400">${address}</div></div>
        <div class="field"><div class="field-label">FSSAI License</div><div class="field-val">${license}</div></div>
      </div>
      <div>
        <div class="section-label">Application Details</div>
        <div class="field"><div class="field-label">Reference Number</div><div class="field-val">${app.referenceNumber}</div></div>
        <div class="field"><div class="field-label">Application Type</div><div class="field-val">${fee.desc}</div></div>
        <div class="field"><div class="field-label">Submission Date</div><div class="field-val">${fmtDate(app.submittedAt)}</div></div>
        <div class="field"><div class="field-label">Status</div><div class="field-val">${app.stage}</div></div>
      </div>
    </div>

    <!-- Fee breakdown -->
    <table class="fee-table">
      <thead>
        <tr><th>Description</th><th>SAC Code</th><th class="num">Amount</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Application Fee — ${fee.desc}</td>
          <td>999419</td>
          <td class="num">${inr(fee.base)}</td>
        </tr>
        <tr>
          <td>Goods & Services Tax (GST) @ 18%</td>
          <td>—</td>
          <td class="num">${inr(fee.gst)}</td>
        </tr>
        <tr class="total-row">
          <td>Total Amount Payable</td>
          <td></td>
          <td class="num">${inr(fee.total)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Payment details -->
    <div class="section-label">Payment Information</div>
    <div class="payment-box">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="font-weight:700; font-size:14px;">Total Paid: ${inr(fee.total)}</span>
        ${payRef && payRef !== '—'
          ? '<span class="status-paid">✓ Payment Reference Provided</span>'
          : '<span class="status-pending">⚠ Reference Pending</span>'}
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:12px;">
        <div><span style="color:#888">Payment Method: </span><strong>${payMethod}</strong></div>
        <div><span style="color:#888">Reference / UTR No.: </span><strong>${payRef}</strong></div>
      </div>
    </div>

    <!-- Notice -->
    <div class="notice">
      <strong>Note:</strong> This is a computer-generated tax invoice. The application fee is non-refundable once the application is submitted.
      For any payment discrepancy, please contact FSSAI at <strong>helpdesk@fssai.gov.in</strong> quoting the reference number above.
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>
      <div>Generated on: ${new Date().toLocaleString('en-IN')}</div>
      <div style="margin-top:4px;">E-PAAS Portal — Electronic Product Approval System</div>
    </div>
    <div class="sig-line">
      <div style="height:32px; border-bottom:1px solid #1A3C34; width:160px; margin-bottom:4px;"></div>
      <div class="name">Authorised Signatory</div>
      <div style="margin-top:2px;">FSSAI, New Delhi</div>
    </div>
  </div>
</div>

<div class="no-print" style="text-align:center; margin-top:20px;">
  <button onclick="window.print()" style="background:#1A3C34; color:#fff; border:none; border-radius:8px; padding:10px 28px; font-size:14px; font-weight:700; cursor:pointer;">🖨 Print / Save as PDF</button>
  &nbsp;
  <button onclick="window.close()" style="background:transparent; color:#1A3C34; border:2px solid #1A3C34; border-radius:8px; padding:10px 22px; font-size:14px; cursor:pointer;">Close</button>
</div>
</body>
</html>`;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TaxInvoice() {
  const [apps, setApps]     = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyApplications()
      .then((all) => setApps(all.filter((a) => a.stage !== 'Draft')))
      .finally(() => setLoading(false));
  }, []);

  function openInvoice(app: Application) {
    const html = buildInvoiceHtml(app);
    const win  = window.open('', '_blank', 'width=860,height=700,scrollbars=yes');
    if (!win) { alert('Please allow popups for this site to view the invoice.'); return; }
    win.document.write(html);
    win.document.close();
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
                const fee = FEE[app.applicationType] ?? FEE['NSF'];
                const fd  = app.formData as AppFormData | null;
                const payRef = fd?.step5?.paymentReference ?? '';
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
                      {payRef
                        ? <span style={{ color: '#065F46', fontWeight: 600 }}>✓ {payRef}</span>
                        : <span style={{ color: COLORS.textMuted, fontStyle: 'italic' }}>Not provided</span>}
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
        <strong>FSSAI GSTIN:</strong> 07AAAGF0189N1Z5 &nbsp;|&nbsp;
        <strong>SAC Code:</strong> 999419 (Regulatory Services) &nbsp;|&nbsp;
        <strong>GST Rate:</strong> 18% &nbsp;|&nbsp;
        Invoices are computer-generated and do not require a physical signature.
      </div>
    </div>
  );
}

