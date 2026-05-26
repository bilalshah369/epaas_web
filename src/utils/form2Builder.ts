// Shared Form II / Form B HTML builder for print/download.
// Used by TechAssessment, ApplicationScrutiny, and ApplicationView.

export interface Form2Params {
  applicationType:  string;
  appNo:            string;
  approvalNumber?:  string | null;
  dateOfApplication: string;
  mfgName:          string;      // manufacturer / FBO name / org name
  applicantName:    string;
  address:          string;
  authorizedPerson: string;
  productName?:     string;
  foodCategory?:    string;
  // RPET-specific
  materialType?:    string;
  techDetails?:     string;
  // Vegan-specific
  licenseNo?:       string;
  contactDetails?:  string;
  composition?:     string;
  // Decision
  decision:         'Approved' | 'Rejected';
  conditions?:      string;
  reasons?:         string;
  issuedOn?:        string;
}

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #000; background: #fff; padding: 40px; }
  h1 { font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 4px; }
  h2 { font-size: 13px; font-weight: bold; text-align: center; margin-bottom: 16px; }
  .tbl { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .tbl td { border: 1px solid #000; padding: 6px 10px; vertical-align: top; font-size: 12px; }
  .tbl td:first-child { font-weight: bold; width: 46%; }
  .sig { text-align: right; margin-top: 40px; font-size: 12px; }
  .cond-title { font-size: 12px; font-weight: bold; margin-bottom: 6px; }
  .cond-body  { font-size: 12px; margin-bottom: 16px; white-space: pre-wrap; }
  .cond-ol { padding-left: 20px; margin-bottom: 14px; }
  .cond-ol li { font-size: 12px; margin-bottom: 6px; line-height: 1.6; }
  .note { font-size: 11px; margin-top: 10px; line-height: 1.6; }
  .form-label { font-size: 11px; text-align: right; font-weight: bold; margin-bottom: 20px; }
  .status-box { border: 1px solid #000; padding: 8px 12px; font-size: 12px; line-height: 1.8; }
  @media print { body { padding: 16px; } }
`;

export function buildForm2Html(p: Form2Params): string {
  const isApproved = p.decision === 'Approved';
  const issued     = p.issuedOn ?? new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  // ── rPET: Form II — Authorization/Rejection of FCM-rPET ──────────────────────
  if (p.applicationType === 'RPET') {
    const status     = isApproved ? 'Approved' : 'Rejected';
    const conditions = p.conditions?.trim() ?? '';
    const reasons    = p.reasons?.trim()    ?? '';

    return `<!DOCTYPE html><html><head><title>Form II — ${p.appNo}</title>
<style>${CSS}</style></head><body>
<div class="form-label">Form - II</div>
<h1>Authorization/Rejection of FCM-rPET</h1>
<br/>
<table class="tbl">
  <tr><td>Application No:</td><td>${p.appNo}</td></tr>
  <tr><td>Date of application:</td><td>${p.dateOfApplication}</td></tr>
  <tr><td>Name of the manufacturer:</td><td>${p.mfgName}</td></tr>
  <tr><td>Name of the applicant:</td><td>${p.applicantName}</td></tr>
  <tr><td>Registered address:</td><td>${p.address}</td></tr>
  <tr><td>Authorized person:</td><td>${p.authorizedPerson}</td></tr>
  <tr><td>Type of material being recycled:</td><td>${p.materialType || 'Polyethylene Terephthalate (PET)'}</td></tr>
  <tr><td>Approval/NOC/Details of technology:</td><td>${p.techDetails || '—'}</td></tr>
  <tr><td>Status of application:</td><td><strong>${status}</strong>${p.approvalNumber ? ` &nbsp;|&nbsp; Ref. No.: <strong>${p.approvalNumber}</strong>` : ''}</td></tr>
  <tr><td>Reasons for rejection, if any:</td><td>${isApproved ? '—' : (reasons || '—')}</td></tr>
</table>

<p class="cond-title">Conditions for authorization*:</p>
<ol class="cond-ol" type="i">
  <li>The Food Authority reserves the right to inspect the records, premises and/or manufacturing &amp; other related facilities of the applicant or manufacturing facility of exporting country prior/post authorization.</li>
  <li>The recycled PET intended to be used as food contact material shall comply to all the criteria specified by FSSAI &amp; rules and regulations made under the Food Safety and Standards Act, 2006 &amp; as amended from time to time.</li>
  <li>The applicant shall maintain all documents/records/details/certificates/audit &amp; test reports as specified in the 'Guidelines for acceptance of recycled Polyethylene terephthalate (PET) as Food Contact Material (FCM-rPET)'.</li>
  ${isApproved && conditions ? `<li>${conditions}</li>` : ''}
</ol>

<p style="font-size:12px;margin-top:8px;">This issues with the approval of the Competent Authority.</p>
<div class="sig">Authorized Signatory</div>
<br/><br/>
<p style="font-size:12px;">To,</p>
<p style="font-size:12px;margin-top:6px;">M/s ${p.mfgName}, ${p.address}</p>
<p class="note"><strong>Note:</strong> * Conditions for authorization may change based on the application.</p>
</body></html>`;
  }

  // ── Vegan: Form B (Annexure-C) — Approval/Rejection for endorsement of vegan logo ──
  if (p.applicationType === 'Vegan') {
    const conditions = p.conditions?.trim() ?? '';
    const reasons    = p.reasons?.trim()    ?? '';

    return `<!DOCTYPE html><html><head><title>Form B — ${p.appNo}</title>
<style>${CSS}</style></head><body>
<div class="form-label">Annexure-C</div>
<h1>Form-B</h1>
<h2>Approval/ Rejection for endorsement of vegan logo</h2>

<table class="tbl">
  <tr><td>Application No:</td><td>${p.appNo}</td></tr>
  <tr><td>Date of application:</td><td>${p.dateOfApplication}</td></tr>
  <tr><td>Name and address of Food Business Operator</td><td>${p.mfgName}${p.address && p.address !== p.mfgName ? ', ' + p.address : ''}</td></tr>
  <tr><td>License number, if any:</td><td>${p.licenseNo || '—'}</td></tr>
  <tr><td>Authorized person:</td><td>${p.authorizedPerson}</td></tr>
  <tr><td>Contact details:</td><td>${p.contactDetails || '—'}</td></tr>
  <tr><td>Name of the product:</td><td>${p.productName || '—'}</td></tr>
  <tr><td>Nearest food category as per FSSR:</td><td>${p.foodCategory || '—'}</td></tr>
  <tr><td>Composition of the product:</td><td>${p.composition || '—'}</td></tr>
  <tr>
    <td>Application status/Remarks: (Tick whichever is applicable)</td>
    <td class="status-box">
      <div><strong>${isApproved ? '☑' : '☐'}</strong> 1. The product is approved for displaying vegan logo*;</div>
      <div style="margin-top:6px"><strong>${!isApproved ? '☑' : '☐'}</strong> 2. The product is not approved for displaying vegan logo.</div>
    </td>
  </tr>
</table>

<p class="note"><strong>Note:</strong> *If the product is approved, the Food Business Operator can submit this approval to the Licensing Authority for endorsement of the vegan logo on the product applied.</p>
<br/>
<p class="cond-title">1. Conditions for approval:</p>
${conditions ? `<p class="cond-body">${conditions}</p>` : '<br/>'}
<p class="cond-title">2. Reasons for rejection, if any:</p>
${!isApproved && reasons ? `<p class="cond-body">${reasons}</p>` : '<br/>'}

<div class="sig">(Authorized Signatory)</div>
</body></html>`;
  }

  // ── Generic Form II (NSF, CA, AA, AnyOther) ───────────────────────────────────
  const conditions = p.conditions?.trim() ?? '';
  const reasons    = p.reasons?.trim()    ?? '';

  return `<!DOCTYPE html><html><head><title>Form II — ${p.appNo}</title>
<style>${CSS}
.decision { padding: 10px 14px; font-size: 13px; font-weight: bold; margin-bottom: 16px; border-radius: 4px; }
.approved { background: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; }
.rejected { background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA; }
</style></head><body>
<div class="form-label">Form - II</div>
<h1>Food Safety and Standards Authority of India</h1>
<h2>Approval / Rejection</h2>

<table class="tbl">
  <tr><td>Application No:</td><td>${p.appNo}</td></tr>
  ${p.approvalNumber ? `<tr><td>${isApproved ? 'Approval No.' : 'Rejection No.'}:</td><td><strong>${p.approvalNumber}</strong></td></tr>` : ''}
  <tr><td>Date of Application:</td><td>${p.dateOfApplication}</td></tr>
  <tr><td>Name of Organisation:</td><td>${p.mfgName}</td></tr>
  <tr><td>Name of Applicant:</td><td>${p.applicantName}</td></tr>
  <tr><td>Registered Address:</td><td>${p.address}</td></tr>
  <tr><td>Authorised Person:</td><td>${p.authorizedPerson}</td></tr>
  ${p.productName ? `<tr><td>Name of Food Product:</td><td>${p.productName}</td></tr>` : ''}
  ${p.foodCategory ? `<tr><td>Product Category:</td><td>${p.foodCategory}</td></tr>` : ''}
  <tr><td>Status:</td><td><strong>${isApproved ? 'Approved' : 'Rejected'}</strong></td></tr>
</table>

<div class="decision ${isApproved ? 'approved' : 'rejected'}">${isApproved ? '✓ APPROVED' : '✗ REJECTED'}</div>
${isApproved && conditions ? `<p class="cond-title">Conditions for Approval:</p><p class="cond-body">${conditions}</p>` : ''}
${!isApproved && reasons   ? `<p class="cond-title">Reasons for Rejection:</p><p class="cond-body">${reasons}</p>` : ''}

<div class="sig">Authorized Signatory</div>
<br/>
<p style="font-size:10px;color:#666;text-align:right">Issued on: ${issued}</p>
</body></html>`;
}
