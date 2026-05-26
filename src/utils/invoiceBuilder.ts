import type { Application } from '@/services/application.service';
import type { PaymentRecord } from '@/services/payment.service';

const FEE: Record<string, { base: number; gst: number; total: number }> = {
  NSF:            { base: 50000, gst: 9000,  total: 59000  },
  ClaimApproval:  { base: 50000, gst: 9000,  total: 59000  },
  AyurvedaAahara: { base: 50000, gst: 9000,  total: 59000  },
  RPET:           { base: 15000, gst: 2700,  total: 17700  },
  AnyOther:       { base: 10000, gst: 1800,  total: 11800  },
};

function fmtAmt(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDateShort(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function numberToWords(n: number): string {
  if (n === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tensArr = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function convert(x: number): string {
    if (x < 20) return ones[x];
    if (x < 100) return tensArr[Math.floor(x / 10)] + (x % 10 ? ' ' + ones[x % 10] : '');
    if (x < 1000) return ones[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' + convert(x % 100) : '');
    if (x < 100000) return convert(Math.floor(x / 1000)) + ' Thousand' + (x % 1000 ? ' ' + convert(x % 1000) : '');
    if (x < 10000000) return convert(Math.floor(x / 100000)) + ' Lakh' + (x % 100000 ? ' ' + convert(x % 100000) : '');
    return convert(Math.floor(x / 10000000)) + ' Crore' + (x % 10000000 ? ' ' + convert(x % 10000000) : '');
  }
  return convert(n) + ' Only';
}

function getInvoiceNumber(app: Application): string {
  const d = new Date(app.submittedAt ?? app.updatedAt ?? new Date());
  const month = d.getMonth() + 1;
  const year  = d.getFullYear();
  const fyStart = month >= 4 ? year : year - 1;
  const fyStr   = `${fyStart % 100}-${String((fyStart + 1) % 100).padStart(2, '0')}`;
  const seq = (app.referenceNumber?.replace(/\D/g, '') ?? '').slice(-8).padStart(8, '0');
  return `GST/ePAAS/FY${fyStr}/${seq}`;
}

export function buildInvoiceHtml(app: Application, _payment: PaymentRecord | null): string {
  const fee = FEE[app.applicationType] ?? FEE['NSF'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fd  = app.formData as any;

  const buyerName  = fd?.step2?.applicantName ?? fd?.applicantName ?? app.companyName ?? '—';
  const buyerOrg   = fd?.step2?.orgName       ?? fd?.orgName       ?? app.companyName ?? '—';
  const buyerAddr  = fd?.step2?.orgAddress    ?? fd?.orgAddress    ?? app.address     ?? '—';
  const buyerGstin = fd?.step3?.gstNo         ?? fd?.gstNo         ?? 'NA';

  const invoiceNo   = getInvoiceNumber(app);
  const invoiceDate = fmtDateShort(app.submittedAt ?? app.updatedAt);
  const totalWords  = numberToWords(fee.total);
  const gstWords    = numberToWords(fee.gst);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tax Invoice — ${invoiceNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #000; background: #fff; padding: 24px; }
    .page { max-width: 720px; margin: 0 auto; }
    .title { text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 6px; }
    .outer { border: 1px solid #000; width: 100%; border-collapse: collapse; }
    .outer td, .outer th { border: 1px solid #000; padding: 5px 8px; vertical-align: top; }
    .org-name { font-size: 12px; font-weight: bold; }
    .org-detail { font-size: 11px; line-height: 1.7; }
    .inv-label { font-size: 11px; font-weight: bold; }
    .inv-val { font-size: 12px; font-weight: bold; }
    .buyer-name { font-weight: bold; font-size: 12px; }
    .buyer-detail { font-size: 11px; line-height: 1.7; }
    .svc-table { width: 100%; border-collapse: collapse; }
    .svc-table th { border: 1px solid #000; padding: 5px 8px; font-size: 11px; font-weight: bold; text-align: center; background: #f5f5f5; }
    .svc-table td { border: 1px solid #000; padding: 5px 8px; font-size: 12px; }
    .num { text-align: right; }
    .bold { font-weight: bold; }
    .hsn-table { width: 100%; border-collapse: collapse; }
    .hsn-table th { border: 1px solid #000; padding: 4px 8px; font-size: 11px; font-weight: bold; text-align: center; background: #f5f5f5; }
    .hsn-table td { border: 1px solid #000; padding: 4px 8px; font-size: 11px; text-align: center; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="title">Tax Invoice</div>

  <table class="outer">
    <tr>
      <td style="width:60%">
        <div class="org-name">FOOD SAFETY AND STANDARDS AUTHORITY OF INDIA</div>
        <div class="org-detail">
          FDA BHAWAN, 3RD AND 4TH FLOOR<br>
          KOTLA ROAD, DELHI, New Delhi - 110002<br>
          GSTIN/UIN: 07AAAGF0023K1ZV<br>
          State Name : Delhi, Code :07<br>
          Email: productapp@fssai.gov.in
        </div>
      </td>
      <td style="width:40%; padding:0;">
        <table style="width:100%; border-collapse:collapse; height:100%;">
          <tr><td style="border-bottom:1px solid #000; padding:5px 8px;">
            <div class="inv-label">Invoice No.</div>
            <div class="inv-val">${invoiceNo}</div>
          </td></tr>
          <tr><td style="padding:5px 8px;">
            <div class="inv-label">Dated</div>
            <div class="inv-val">${invoiceDate}</div>
          </td></tr>
        </table>
      </td>
    </tr>

    <tr>
      <td colspan="2">
        <div style="font-size:11px; font-weight:bold; margin-bottom:3px;">Buyer (Bill to)</div>
        <div class="buyer-name">${buyerName}</div>
        <div class="buyer-detail">
          ${buyerAddr}<br>
          GSTIN/UIN &nbsp;: ${buyerGstin}<br>
          PAN/IT &nbsp;&nbsp;&nbsp;&nbsp;: NA<br>
          State Name : NA
        </div>
        ${buyerOrg !== buyerName ? `<div style="font-size:11px; margin-top:3px;"><strong>Organisation:</strong> ${buyerOrg}</div>` : ''}
      </td>
    </tr>

    <tr>
      <td colspan="2" style="padding:0;">
        <table class="svc-table">
          <thead>
            <tr>
              <th style="text-align:left; width:60%">Description of Services</th>
              <th style="width:15%">HSN/SAC</th>
              <th style="width:25%">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Product Approval Fee (ePAAS)</td>
              <td class="num">852380</td>
              <td class="num">${fmtAmt(fee.base)}</td>
            </tr>
            <tr>
              <td style="padding-top:18px; padding-bottom:18px;">Output IGST @ 18%</td>
              <td></td>
              <td class="num" style="vertical-align:bottom;">${fmtAmt(fee.gst)}</td>
            </tr>
            <tr>
              <td class="bold">Total</td>
              <td></td>
              <td class="num bold">${fmtAmt(fee.total)}</td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>

    <tr>
      <td colspan="2">
        <span style="font-weight:bold;">Amount Chargeable (In Words)</span><br>
        <strong>INR ${totalWords}</strong>
      </td>
    </tr>

    <tr>
      <td colspan="2" style="padding:0;">
        <table class="hsn-table">
          <thead>
            <tr>
              <th rowspan="2">HSN/SAC</th>
              <th rowspan="2">Taxable Value</th>
              <th colspan="2">Tax</th>
              <th rowspan="2">Total Tax<br>Amount</th>
            </tr>
            <tr><th>Rate</th><th>Amount</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>852380</td>
              <td class="num">${fmtAmt(fee.base)}</td>
              <td>18%</td>
              <td class="num">${fmtAmt(fee.gst)}</td>
              <td class="num">${fmtAmt(fee.gst)}</td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>

    <tr>
      <td style="vertical-align:bottom;">
        <div style="font-size:11px;"><strong>Tax Amount (in words):</strong> INR ${gstWords}</div>
      </td>
      <td style="text-align:right; vertical-align:top;">
        <div style="font-size:11px;">For <strong>FOOD SAFETY AND STANDARDS AUTHORITY OF INDIA</strong></div>
        <div style="height:50px;"></div>
        <div style="font-size:11px; text-align:right;">Authorised Signatory</div>
      </td>
    </tr>
  </table>

  <div class="no-print" style="text-align:center; margin-top:20px;">
    <button onclick="window.print()" style="background:#1A3C34; color:#fff; border:none; border-radius:8px; padding:10px 28px; font-size:14px; font-weight:700; cursor:pointer;">🖨 Print / Save as PDF</button>
    &nbsp;
    <button onclick="window.close()" style="background:transparent; color:#1A3C34; border:2px solid #1A3C34; border-radius:8px; padding:10px 22px; font-size:14px; cursor:pointer;">Close</button>
  </div>
</div>
</body>
</html>`;
}

export function openInvoiceWindow(app: Application, payment: PaymentRecord | null): void {
  const html = buildInvoiceHtml(app, payment);
  const win  = window.open('', '_blank', 'width=860,height=700,scrollbars=yes');
  if (!win) { alert('Please allow popups for this site to view the invoice.'); return; }
  win.document.write(html);
  win.document.close();
}
