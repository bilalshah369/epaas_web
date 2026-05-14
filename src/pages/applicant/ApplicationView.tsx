// Mirrors ApplicantApplicationView from mock (App.jsx). Single application read-only view with tabs.
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { COLORS, S } from '@/utils/colors';
import StatusBadge from '@/components/ui/StatusBadge';
import TabBar from '@/components/ui/TabBar';
import {
  fetchApplication, fetchQueries, respondToQuery,
  type Application, type AppFormData, type Query,
} from '@/services/application.service';
import { API_BASE } from '@/services/api';

// ── Constants ─────────────────────────────────────────────────────────────────
const TABS = ['Details', 'Documents', 'Queries', 'Decision History', 'Timeline'];

const TYPE_LABELS: Record<string, string> = {
  NSF: 'Novel & Special Foods (NSF)',
  ClaimApproval: 'Claim Approval',
  AyurvedaAahara: 'Ayurveda Aahara',
  RPET: 'rPET',
  AnyOther: 'Any Other',
};

const STAGE_LABELS: Record<string, string> = {
  Draft: 'Draft',
  Submitted: 'Submitted',
  WithNodalOfficerA: 'With Nodal Officer A',
  WithTechnicalOfficer: 'With Technical Officer',
  QuerySent: 'Query Sent',
  WithExpertCommittee: 'With Expert Committee',
  WithNodalPointB: 'With Nodal Point B',
  DecisionPending: 'Decision Pending',
  WithCEO: 'With CEO',
  WithChairperson: 'With Chairperson',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Closed: 'Closed',
};

// AA document fields (flat structure) — must match field keys in AyurvedaAaharaApplicationForm
const AA_DOC_FIELDS: { key: string; label: string }[] = [
  // Step 0 — Basic product info
  { key: 'functionalUseFile',              label: 'Functional Use Supporting Document' },
  { key: 'certificateOfAnalysis',          label: 'Certificate of Analysis' },
  { key: 'manufacturingProcessFile',       label: 'Manufacturing Process Document' },
  // Step 1 — Ingredients / Composition
  { key: 'compositionFile',                label: 'Composition of Proposed Ayurveda Aahara' },
  { key: 'ingredientListFile',             label: 'Ingredient List PDF' },
  { key: 'specificationsFile',             label: 'Specifications Document' },
  // Traditional reference (per category)
  { key: 'authoritativeBookScanFile',      label: 'Scanned Pages of Authoritative Book (Cat. A)' },
  { key: 'catBAuthoritativeBookScanFile',  label: 'Scanned Pages of Authoritative Book (Cat. B)' },
  { key: 'catB1AuthoritativeBookScanFile', label: 'Scanned Pages of Authoritative Book (Cat. B1)' },
  { key: 'catB2AuthoritativeBookScanFile', label: 'Scanned Pages of Authoritative Book (Cat. B2)' },
  { key: 'otherBotanicalsRationaleFile',   label: 'Other Botanicals Supporting Document' },
  // Step 2 — Claims / Usage
  { key: 'productLabel',                   label: 'Product Label' },
  { key: 'servingSizeFile',                label: 'Serving Size Document' },
  { key: 'targetPopulationFile',           label: 'Target Population Document' },
  { key: 'directionsForUseFile',           label: 'Directions for Use Document' },
  { key: 'durationOfUseFile',              label: 'Duration of Use Document' },
  // Category A — Label Claims
  { key: 'catAHealthBenefitFile',          label: 'Health Benefit Claim Document (Cat. A)' },
  { key: 'catADiseaseRiskFile',            label: 'Disease Risk Claim Document (Cat. A)' },
  // Category B — Label Claims
  { key: 'catBHealthBenefitFile',          label: 'Health Benefit Claim Document (Cat. B)' },
  { key: 'catBDiseaseRiskFile',            label: 'Disease Risk Claim Document (Cat. B)' },
  { key: 'catBSafetyDataFile',             label: 'Safety Data Document (Cat. B)' },
  // Category B1 — Label Claims
  { key: 'b1HealthBenefitFile',            label: 'Health Benefit Document (Cat. B1)' },
  { key: 'b1LabelDiseaseRiskFile',         label: 'Disease Risk Reduction Document (Cat. B1)' },
  // Category B2 — Health Benefit Claims
  { key: 'catB2HealthBenefit1File',        label: 'Specified Health Benefit Document (Cat. B2)' },
  { key: 'catB2HealthBenefit2File',        label: 'Non-specified Health Benefit Document (Cat. B2)' },
  // Category B2 — Disease Risk Claims
  { key: 'catB2DiseaseRisk1File',          label: 'Disease Risk Claim 1 Document (Cat. B2)' },
  { key: 'catB2DiseaseRisk2File',          label: 'Disease Risk Claim 2 Document (Cat. B2)' },
  // Step 3 — Scientific Support (B1)
  { key: 'differentFormatRationaleFile',   label: 'Format Rationale Supporting Document (Cat. B1)' },
  { key: 'efficacyDataFile',               label: 'Efficacy Data Document (Cat. B1)' },
  { key: 'catB1SafetyDataFile',            label: 'Safety Data Document (Cat. B1)' },
  // Part III — Registration
  { key: 'registrationCertificate',        label: 'Registration Certificate' },
  { key: 'licenseCertificate',             label: 'License Certificate' },
];

// RPET document fields (flat structure) — must match field keys in RPETApplicationForm
const RPET_DOC_FIELDS: { key: string; label: string }[] = [
  { key: 'factoryLicensesFile',         label: 'All Licences – Factory' },
  { key: 'labourLicenseFile',           label: 'Labour Licence' },
  { key: 'pollutionLicenseFile',        label: 'Pollution Licence' },
  { key: 'gstLicenseFile',             label: 'GST Certificate' },
  { key: 'recyclingTechnologyFile',    label: 'Recycling Technology Document' },
  { key: 'plantMachineryFile',         label: 'Plant & Machinery Document' },
  { key: 'globalRegulatoryFile',       label: 'NOL/NOC/Safety Assessment Document' },
  { key: 'facilityApprovalFile',       label: 'Facility Approval/Clearance (Competent Authority)' },
  { key: 'vendorAuditFile',            label: 'Vendor & Internal Audit Reports' },
  { key: 'qualitySafetyTestReportFile', label: 'Quality & Safety Test Reports (NABL Accredited)' },
  { key: 'fssPackagingRegFile',        label: 'FSS(Packaging) Regulations 2018 Compliance' },
  { key: 'sensoryAnalysisFile',        label: 'Sensory Analysis (ISO 13302 / GMP/QMS)' },
];

// CA document fields (flat structure)
const CA_DOC_FIELDS: { key: string; label: string }[] = [
  { key: 'licenseCopy',                  label: 'Central/State License Copy' },
  { key: 'approvalLetter',               label: 'FSSAI Approval Letter' },
  { key: 'iprSupportingDoc',             label: 'IPR Supporting Document' },
  { key: 'scientificSubstantiationFile', label: 'Scientific Substantiation Document' },
  { key: 'diseaseRiskStudiesFile',       label: 'Disease Risk Studies Document' },
  { key: 'analysisMethodFile',           label: 'Analysis Method Document' },
  { key: 'adverseEffectsFile',           label: 'Safety / Adverse Effects Document' },
  { key: 'additionalInfoFile',           label: 'Additional Information Document' },
];

// Document field → display label mapping (step3 + step4)
const DOC_FIELDS: { key: keyof AppFormData['step3'] | keyof AppFormData['step4']; label: string; step: 'step3' | 'step4' }[] = [
  { step: 'step3', key: 'certOfAnalysis',      label: 'Certificate of Analysis' },
  { step: 'step3', key: 'manufacturingProcess', label: 'Manufacturing Process' },
  { step: 'step3', key: 'regulatoryStatusFile', label: 'Regulatory Status Document' },
  { step: 'step3', key: 'agreementDoc',         label: 'Agreement / Authorization Document' },
  { step: 'step3', key: 'safetyFile1',          label: 'Safety Document 1' },
  { step: 'step3', key: 'safetyFile2',          label: 'Safety Document 2' },
  { step: 'step3', key: 'claimFile1',           label: 'Claim Support Document 1' },
  { step: 'step3', key: 'claimFile2',           label: 'Claim Support Document 2' },
  { step: 'step3', key: 'prototypeLabel',       label: 'Prototype Label' },
  { step: 'step3', key: 'postMarketingDecl',    label: 'Post-Marketing Declaration' },
  { step: 'step3', key: 'confidentialityDecl',  label: 'Confidentiality Declaration' },
  { step: 'step4', key: 'specificationDoc',     label: 'Specification Document' },
  { step: 'step4', key: 'microTemplate',        label: 'Microorganism Template' },
  { step: 'step4', key: 'anyOtherDoc',          label: 'Any Other Document' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getCatKey(cat: string): string {
  if (cat.startsWith('Category B2')) return 'B2';
  if (cat.startsWith('Category B1')) return 'B1';
  if (cat.startsWith('Category B'))  return 'B';
  if (cat.startsWith('Category A'))  return 'A';
  return '';
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function InfoChip({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 16px', minWidth: 140 }}>
      <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: highlight ? COLORS.primary : COLORS.text }}>{value}</div>
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6, borderBottom: `2px solid ${COLORS.primaryLight}`, paddingBottom: 6, marginBottom: 10, marginTop: 18 }}>
      {title}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: value ? COLORS.text : COLORS.textMuted, fontStyle: value ? 'normal' : 'italic' }}>{value || '—'}</div>
    </div>
  );
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>{children}</div>;
}

// ── Tab: Details ──────────────────────────────────────────────────────────────
function TabSummary({ fd, applicationType }: { fd: AppFormData; applicationType: string }) {
  if (applicationType === 'AyurvedaAahara') {
    const aa = fd as unknown as Record<string, unknown>;
    const cat = getCatKey((aa.ayurvedaCategory as string) ?? '');
    const CAT_LABEL: Record<string, string> = {
      A: 'Category A — Classical Ayurvedic Formulations',
      B: 'Category B — Proprietary Ayurvedic Products',
      B1: 'Category B1 — New Ayurvedic Ingredients',
      B2: 'Category B2 — Traditional System Ingredients',
    };
    function str(k: string) { return (aa[k] as string) || undefined; }
    return (
      <div>
        <SectionHead title="Ayurveda Category" />
        <Field label="Category" value={cat ? CAT_LABEL[cat] : str('ayurvedaCategory')} />

        <SectionHead title="Applicant Details" />
        <TwoCol>
          <Field label="Applicant Name"         value={str('applicantName')} />
          <Field label="Authorised Person"       value={str('authorisedPerson')} />
          <Field label="Email"                   value={str('authorisedEmail')} />
          <Field label="Contact Number"          value={str('authorisedContact')} />
          <Field label="FSSAI License Number"    value={str('licenseNumber')} />
        </TwoCol>
        <Field label="Address"                   value={str('applicantAddress')} />

        <SectionHead title="Product Details" />
        <TwoCol>
          <Field label="Product Name"            value={str('productName')} />
          <Field label="Product Category"        value={str('productCategory')} />
        </TwoCol>
        <Field label="Product Description"       value={str('productDescription')} />
        <Field label="Proposed Usage"            value={str('proposedUsage')} />

        <SectionHead title="Ingredients" />
        {Array.isArray(aa.ingredients) && (aa.ingredients as Record<string, string>[]).length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 8 }}>
            <thead>
              <tr>{['#', 'Ingredient Name', 'Quantity', 'Unit', 'Reference Book'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {(aa.ingredients as Record<string, string>[]).map((ing, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#F8F9FA' }}>
                  <td style={S.td}>{i + 1}</td>
                  <td style={S.td}>{ing.ingredientName}</td>
                  <td style={S.td}>{ing.quantity}</td>
                  <td style={S.td}>{ing.unit}</td>
                  <td style={S.td}>{ing.referenceBook}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', marginBottom: 8 }}>No ingredients listed.</div>}

        {Array.isArray(aa.additives) && (aa.additives as Record<string, string>[]).length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Additives</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 8 }}>
              <thead>
                <tr>{['#', 'Additive Name', 'Quantity', 'Purpose'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {(aa.additives as Record<string, string>[]).map((add, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#F8F9FA' }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={S.td}>{add.additiveName}</td>
                    <td style={S.td}>{add.quantity}</td>
                    <td style={S.td}>{add.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <TwoCol>
          <Field label="Nutritional Composition"  value={str('nutritionalComposition')} />
          <Field label="Active Ingredients"        value={str('activeIngredients')} />
        </TwoCol>
        <Field label="Formulation Details"         value={str('formulationDetails')} />

        <SectionHead title="Claims / Usage" />
        <Field label="Claim Statement 1"           value={str('claimStatement1')} />
        {str('claimStatement2') && <Field label="Claim Statement 2" value={str('claimStatement2')} />}
        {str('claimStatement3') && <Field label="Claim Statement 3" value={str('claimStatement3')} />}
        <TwoCol>
          <Field label="Target Population"         value={str('targetPopulation')} />
          <Field label="Serving Size"              value={str('servingSize')} />
          <Field label="Frequency of Use"          value={str('frequencyOfUse')} />
          <Field label="Duration of Use"           value={str('durationOfUse')} />
        </TwoCol>
        <Field label="Directions for Use"          value={str('directionsForUse')} />
        <Field label="Warnings"                    value={str('warnings')} />
        <Field label="Contraindications"           value={str('contraindications')} />

        {cat === 'A' && (
          <>
            <SectionHead title="Category A — Traditional Reference" />
            <TwoCol>
              <Field label="Reference Book"        value={str('ayurvedaReferenceBook')} />
              <Field label="Chapter (Adhyaya)"     value={str('referenceChapter')} />
              <Field label="Verse (Shloka)"        value={str('referenceVerse')} />
            </TwoCol>
            <Field label="Traditional Usage"       value={str('traditionalUsage')} />
            <Field label="Classical Claim Basis"   value={str('classicalClaimBasis')} />
            <Field label="Historical Consumption Evidence" value={str('historicalConsumptionEvidence')} />
            <Field label="Traditional Preparation Method" value={str('traditionalPreparationMethod')} />
          </>
        )}

        {cat === 'B' && (
          <>
            <SectionHead title="Category B — Nutritional Evidence &amp; Consumption" />
            <Field label="Nutritional Benefit"     value={str('nutritionalBenefit')} />
            <Field label="Scientific Rationale"    value={str('scientificRationale')} />
            <Field label="Supporting Studies"      value={str('supportingStudies')} />
            <TwoCol>
              <Field label="Recommended Serving"   value={str('recommendedServing')} />
              <Field label="Maximum Daily Usage"   value={str('maximumDailyUsage')} />
              <Field label="Intended Users"        value={str('intendedUsers')} />
              <Field label="Restrictions"          value={str('restrictions')} />
            </TwoCol>
          </>
        )}

        {cat === 'B1' && (
          <>
            <SectionHead title="Category B1 — Disease Risk Reduction &amp; Clinical Evidence" />
            <Field label="Disease Risk Claim"      value={str('diseaseRiskClaim')} />
            <Field label="Mechanism of Action"     value={str('mechanismOfAction')} />
            <Field label="Human Intervention Studies" value={str('humanInterventionStudies')} />
            <Field label="Cause-Effect Relationship" value={str('causeEffectRelationship')} />
            <Field label="Scientific Consensus"    value={str('b1ScientificConsensus')} />
            <TwoCol>
              <Field label="Study Type"            value={str('studyType')} />
              <Field label="Study Duration"        value={str('studyDuration')} />
              <Field label="Study Population"      value={str('studyPopulation')} />
              <Field label="Outcome Summary"       value={str('outcomeSummary')} />
            </TwoCol>
          </>
        )}

        {cat === 'B2' && (
          <>
            <SectionHead title="Category B2 — Special Population Claims &amp; Safety" />
            <Field label="Target Condition"        value={str('targetCondition')} />
            <Field label="Target Population Details" value={str('targetPopulationDetails')} />
            <Field label="Physiological Benefit"   value={str('physiologicalBenefit')} />
            <Field label="Scientific Substantiation" value={str('b2ScientificSubstantiation')} />
            <Field label="Contraindication Details" value={str('contraindicationDetails')} />
            <Field label="Drug/Herb Interactions"  value={str('interactionDetails')} />
            <Field label="Adverse Reaction Monitoring" value={str('adverseReactionMonitoring')} />
            <Field label="Medical Supervision Requirement" value={str('medicalSupervisionRequirement')} />
          </>
        )}

        <SectionHead title="Scientific Support" />
        <Field label="Scientific Justification"    value={str('scientificJustification')} />
        <Field label="Traditional Reference"       value={str('traditionalReference')} />
        <Field label="Published Research"          value={str('publishedResearch')} />
        <Field label="Safety Evidence"             value={str('safetyEvidence')} />
        <Field label="Additional Information"      value={str('additionalInfo')} />

        {str('hasExistingRegistration') && (
          <>
            <SectionHead title="Part III — Existing Registration" />
            <Field label="Has Existing Registration"  value={str('hasExistingRegistration')} />
            {str('hasExistingRegistration') === 'Yes' && (
              <TwoCol>
                <Field label="Registration Number"    value={str('registrationNumber')} />
                <Field label="Registration Date"      value={str('registrationDate')} />
                <Field label="License Number"         value={str('licenseNumberExisting')} />
                <Field label="License Date"           value={str('licenseDate')} />
              </TwoCol>
            )}
          </>
        )}

        <SectionHead title="Payment" />
        <TwoCol>
          <Field label="Payment Method"            value={str('paymentMethod')} />
          <Field label="Payment Reference"         value={str('paymentReference')} />
        </TwoCol>
      </div>
    );
  }

  if (applicationType === 'CA') {
    const ca = fd as unknown as Record<string, string>;
    return (
      <div>
        <SectionHead title="Applicant Details" />
        <TwoCol>
          <Field label="Applicant Name"            value={ca.applicantName} />
          <Field label="Authorised Signatory"      value={ca.authorisedSignatory} />
          <Field label="Email"                     value={ca.authorisedEmail} />
          <Field label="Contact Number"            value={ca.authorisedContact} />
        </TwoCol>
        <Field label="Address"                     value={ca.applicantAddress} />

        <SectionHead title="License Information" />
        <TwoCol>
          <Field label="License Number"            value={ca.licenseNumber} />
          <Field label="License Category"          value={ca.licenseCategory} />
        </TwoCol>

        <SectionHead title="Product Information" />
        <TwoCol>
          <Field label="Product Name"              value={ca.productName} />
          <Field label="Product Category"          value={ca.productCategory} />
          <Field label="Non-specified Category"    value={ca.nonSpecifiedCategory} />
        </TwoCol>
        <Field label="Product Composition"         value={ca.productComposition} />

        <SectionHead title="Claim & IPR Details" />
        <TwoCol>
          <Field label="Claim Type"                value={ca.claimType} />
          <Field label="Claim Ingredient/Substance" value={ca.claimIngredient} />
          <Field label="IPR Protected"             value={ca.isIPRProtected} />
          <Field label="Claim Functions IPR Protected" value={ca.claimFunctionProtected} />
        </TwoCol>
        <Field label="Claim Statement"             value={ca.claimStatement} />
        <Field label="Claim Justification"         value={ca.claimJustification} />
        {ca.claimFunctionProtected === 'Yes' && (
          <Field label="IPR Details"               value={ca.iprDetails} />
        )}

        <SectionHead title="Payment" />
        <TwoCol>
          <Field label="Payment Method"            value={ca.paymentMethod} />
          <Field label="Payment Reference"         value={ca.paymentReference} />
        </TwoCol>
      </div>
    );
  }

  return (
    <div>
      <SectionHead title="Step 1 — Ingredients & Application Type" />
      <TwoCol>
        <Field label="Application For"   value={fd.step1.applicationFor} />
        <Field label="Specify Food"      value={fd.step1.specifyFood} />
      </TwoCol>

      {fd.step1.ingredients.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginTop: 10, marginBottom: 4 }}>Ingredients</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>{['Ingredient Name', 'Quantity', 'Standardize'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {fd.step1.ingredients.map((ing, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                  <td style={S.td}>{ing.name}</td>
                  <td style={S.td}>{ing.quantity}</td>
                  <td style={S.td}>{ing.standardize}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {fd.step1.additives.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginTop: 10, marginBottom: 4 }}>Additives</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>{['Additive Name', 'Quantity', 'Standardize'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {fd.step1.additives.map((a, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                  <td style={S.td}>{a.name}</td>
                  <td style={S.td}>{a.quantity}</td>
                  <td style={S.td}>{a.standardize}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <SectionHead title="Step 2 — General Information" />
      <TwoCol>
        <Field label="Applicant Name"          value={fd.step2.applicantName} />
        <Field label="Authorised Person"        value={fd.step2.authorisedPerson} />
        <Field label="Mobile No."               value={fd.step2.mobileNo} />
        <Field label="Email"                    value={fd.step2.email} />
        <Field label="Organisation Name"        value={fd.step2.orgName} />
        <Field label="Organisation Address"     value={fd.step2.orgAddress} />
        <Field label="FSSAI License Number"     value={fd.step2.licenseNumber} />
        <Field label="Manufacturing Address"    value={fd.step2.mfgAddress} />
        <Field label="Nature of Business"       value={fd.step2.natureOfBusiness} />
        <Field label="Product Name"             value={fd.step2.productName} />
        <Field label="Product Category"         value={fd.step2.productCategory} />
        <Field label="Sub-Category"             value={fd.step2.subCategory} />
        <Field label="Source"                   value={fd.step2.source} />
        <Field label="Genus / Species"          value={fd.step2.genusSp} />
      </TwoCol>
      <Field label="Justification / Background" value={fd.step2.justification} />
      <Field label="Functional Benefits"        value={fd.step2.functionalBenefits} />
      <Field label="Health Benefits"            value={fd.step2.healthBenefits} />

      <SectionHead title="Step 3 — Documents & Declarations" />
      <TwoCol>
        <Field label="Regulatory Status"       value={fd.step3.regulatoryStatus} />
        <Field label="Relationship Type"       value={fd.step3.relationshipType} />
        <Field label="GST Number"              value={fd.step3.gstNo} />
      </TwoCol>

      <SectionHead title="Step 4 — Additional Information" />
      <TwoCol>
        <Field label="Target Group"    value={fd.step4.targetGroup} />
        <Field label="Composition"     value={fd.step4.composition} />
        <Field label="New Technology"  value={fd.step4.newTechnology} />
        <Field label="Chemical Name"   value={fd.step4.chemicalName} />
        <Field label="Purity"          value={fd.step4.purity} />
        <Field label="ADI"             value={fd.step4.adi} />
        <Field label="Proposed Level"  value={fd.step4.proposedLevel} />
        <Field label="Color Index"     value={fd.step4.colorIndex} />
        <Field label="Enzyme Activity" value={fd.step4.enzymeActivity} />
      </TwoCol>

      <SectionHead title="Step 5 — Payment" />
      <TwoCol>
        <Field label="Payment Method"    value={fd.step5.paymentMethod} />
        <Field label="Payment Reference" value={fd.step5.paymentReference} />
      </TwoCol>
    </div>
  );
}

// ── Tab: Documents ────────────────────────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i;
function isStored(v: string) { return UUID_RE.test(v); }
function cleanName(v: string) { return v.replace(UUID_RE, ''); }

function TabDocuments({ fd, applicationType }: { fd: AppFormData; applicationType: string }) {
  if (applicationType === 'AyurvedaAahara') {
    const aa = fd as unknown as Record<string, string>;
    const files = AA_DOC_FIELDS.filter((d) => {
      const val = aa[d.key];
      return val && typeof val === 'string' && val.trim() !== '';
    });
    if (files.length === 0) {
      return (
        <div style={{ padding: '48px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
          No documents uploaded yet.
        </div>
      );
    }
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>{['#', 'Document', 'File Name', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {files.map((d, i) => {
            const val = aa[d.key];
            const stored = isStored(val);
            return (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                <td style={S.td}>{i + 1}</td>
                <td style={S.td}><span style={{ fontWeight: 600 }}>{d.label}</span></td>
                <td style={S.td}><span style={{ color: COLORS.primary }}>📎 {stored ? cleanName(val) : val}</span></td>
                <td style={S.td}>
                  {stored ? (
                    <a href={`${API_BASE}/uploads/${val}`} target="_blank" rel="noreferrer"
                      style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 5, fontSize: 10, padding: '4px 10px', cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}>
                      ⬇ Download
                    </a>
                  ) : (
                    <span style={{ fontSize: 10, color: COLORS.textMuted, fontStyle: 'italic' }}>Re-upload to enable download</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  if (applicationType === 'CA') {
    const ca = fd as unknown as Record<string, string>;
    const files = CA_DOC_FIELDS.filter((d) => {
      const val = ca[d.key];
      return val && typeof val === 'string' && val.trim() !== '';
    });
    if (files.length === 0) {
      return (
        <div style={{ padding: '48px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
          No documents uploaded yet.
        </div>
      );
    }
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>{['#', 'Document', 'File Name', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {files.map((d, i) => {
            const val = ca[d.key];
            const stored = isStored(val);
            return (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                <td style={S.td}>{i + 1}</td>
                <td style={S.td}><span style={{ fontWeight: 600 }}>{d.label}</span></td>
                <td style={S.td}><span style={{ color: COLORS.primary }}>📎 {stored ? cleanName(val) : val}</span></td>
                <td style={S.td}>
                  {stored ? (
                    <a href={`${API_BASE}/uploads/${val}`} target="_blank" rel="noreferrer"
                      style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 5, fontSize: 10, padding: '4px 10px', cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}>
                      ⬇ Download
                    </a>
                  ) : (
                    <span style={{ fontSize: 10, color: COLORS.textMuted, fontStyle: 'italic' }}>Re-upload to enable download</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  if (applicationType === 'RPET') {
    const rpet = fd as unknown as Record<string, string>;
    const files = RPET_DOC_FIELDS.filter((d) => {
      const val = rpet[d.key];
      return val && typeof val === 'string' && val.trim() !== '';
    });
    if (files.length === 0) {
      return (
        <div style={{ padding: '48px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
          No documents uploaded yet.
        </div>
      );
    }
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>{['#', 'Document', 'File Name', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {files.map((d, i) => {
            const val = rpet[d.key];
            const stored = isStored(val);
            return (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                <td style={S.td}>{i + 1}</td>
                <td style={S.td}><span style={{ fontWeight: 600 }}>{d.label}</span></td>
                <td style={S.td}><span style={{ color: COLORS.primary }}>📎 {stored ? cleanName(val) : val}</span></td>
                <td style={S.td}>
                  {stored ? (
                    <a href={`${API_BASE}/uploads/${val}`} target="_blank" rel="noreferrer"
                      style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 5, fontSize: 10, padding: '4px 10px', cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}>
                      ⬇ Download
                    </a>
                  ) : (
                    <span style={{ fontSize: 10, color: COLORS.textMuted, fontStyle: 'italic' }}>Re-upload to enable download</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  const files = DOC_FIELDS.filter((d) => {
    const val = d.step === 'step3'
      ? (fd.step3 as unknown as Record<string, unknown>)[d.key as string]
      : (fd.step4 as unknown as Record<string, unknown>)[d.key as string];
    return val && typeof val === 'string' && val.trim() !== '';
  });

  if (files.length === 0) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
        No documents uploaded yet.
      </div>
    );
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr>{['#', 'Document', 'File Name', 'Action'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {files.map((d, i) => {
          const val = (d.step === 'step3'
            ? (fd.step3 as unknown as Record<string, unknown>)[d.key as string]
            : (fd.step4 as unknown as Record<string, unknown>)[d.key as string]) as string;
          const stored = isStored(val);
          return (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
              <td style={S.td}>{i + 1}</td>
              <td style={S.td}><span style={{ fontWeight: 600 }}>{d.label}</span></td>
              <td style={S.td}><span style={{ color: COLORS.primary }}>📎 {stored ? cleanName(val) : val}</span></td>
              <td style={S.td}>
                {stored ? (
                  <a
                    href={`${API_BASE}/uploads/${val}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 5, fontSize: 10, padding: '4px 10px', cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}
                  >
                    ⬇ Download
                  </a>
                ) : (
                  <span style={{ fontSize: 10, color: COLORS.textMuted, fontStyle: 'italic' }}>Re-upload to enable download</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Tab: Queries ──────────────────────────────────────────────────────────────
function TabQueries({ app, onResponded }: { app: Application; onResponded: () => void }) {
  const [queries, setQueries]     = useState<Query[]>([]);
  const [loading, setLoading]     = useState(true);
  const [responding, setResponding] = useState<string | null>(null); // queryId being responded to
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting]     = useState(false);

  useEffect(() => {
    fetchQueries(app.id)
      .then(setQueries)
      .catch(() => toast.error('Could not load queries'))
      .finally(() => setLoading(false));
  }, [app.id]);

  async function handleRespond(queryId: string) {
    if (!responseText.trim()) { toast.error('Please enter a response'); return; }
    setSubmitting(true);
    try {
      const updated = await respondToQuery(app.id, queryId, responseText);
      setQueries((prev) => prev.map((q) => (q.id === queryId ? updated : q)));
      setResponding(null);
      setResponseText('');
      toast.success('Response submitted — application returned to review.');
      onResponded();
    } catch {
      toast.error('Could not submit response');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div style={{ padding: '40px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>Loading queries…</div>;

  if (queries.length === 0) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>No Queries</div>
        <div style={{ fontSize: 11 }}>Any queries raised by the reviewing officer will appear here.</div>
      </div>
    );
  }

  return (
    <div>
      {app.stage === 'QuerySent' && (
        <div style={{ background: COLORS.warningLight, border: '1px solid rgba(246,173,85,0.5)', borderLeft: `4px solid ${COLORS.accent}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 12 }}>
          <strong>⚠ Action Required:</strong> The officer has raised {queries.filter((q) => !q.response).length} unanswered query/queries. Please respond to continue the review process.
        </div>
      )}
      {queries.map((q, i) => (
        <div key={q.id} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, marginBottom: 14, background: q.response ? '#F9FFF9' : '#FFFBF0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: COLORS.primary, color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted }}>
                From: <strong style={{ color: COLORS.text }}>{q.askedBy.username}</strong>
                {q.askedBy.officeLocation && ` · ${q.askedBy.officeLocation}`}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: COLORS.textMuted }}>{fmtDate(q.createdAt)}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                background: q.response ? '#D1FAE5' : '#FEF3C7',
                color:      q.response ? '#065F46' : '#92400E',
              }}>
                {q.response ? 'Answered' : 'Pending Response'}
              </span>
            </div>
          </div>

          {/* Query text */}
          <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '10px 12px', fontSize: 12, color: COLORS.text, marginBottom: 12, lineHeight: 1.6 }}>
            {q.text}
          </div>

          {/* Response */}
          {q.response ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.primary, marginBottom: 4 }}>
                Your Response · {fmtDate(q.respondedAt)}
              </div>
              <div style={{ background: '#F0FDF4', border: `1px solid #BBF7D0`, borderRadius: 6, padding: '10px 12px', fontSize: 12, color: COLORS.text, lineHeight: 1.6 }}>
                {q.response}
              </div>
            </div>
          ) : (
            <div>
              {responding === q.id ? (
                <div>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Enter your response to this query…"
                    style={{ width: '100%', border: `1.5px solid ${COLORS.primary}`, borderRadius: 6, padding: '10px 12px', fontSize: 12, resize: 'vertical', minHeight: 100, outline: 'none', boxSizing: 'border-box', fontFamily: "'Noto Sans','Segoe UI',sans-serif" }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => handleRespond(q.id)}
                      disabled={submitting}
                      style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 12, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
                    >
                      {submitting ? 'Submitting…' : 'Submit Response'}
                    </button>
                    <button
                      onClick={() => { setResponding(null); setResponseText(''); }}
                      style={{ background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setResponding(q.id)}
                  style={{ background: COLORS.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  ✏ Write Response
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Tab: Timeline ─────────────────────────────────────────────────────────────
const STAGE_ORDER = [
  'Draft', 'Submitted', 'WithNodalOfficerA', 'WithTechnicalOfficer',
  'WithExpertCommittee', 'WithNodalPointB', 'DecisionPending',
  'WithCEO', 'WithChairperson', 'Approved',
];

function TabTimeline({ app }: { app: Application }) {
  const currentIdx = STAGE_ORDER.indexOf(app.stage);

  return (
    <div style={{ padding: '4px 0' }}>
      {STAGE_ORDER.map((stage, i) => {
        const done    = i < currentIdx || app.stage === 'Approved' || app.stage === 'Closed';
        const active  = stage === app.stage;
        const future  = i > currentIdx && !done;
        const dotColor = done || active ? COLORS.primary : COLORS.border;
        const lineColor = done ? COLORS.primary : COLORS.border;

        let dateStr = '';
        if (stage === 'Draft')     dateStr = fmtDate(app.createdAt);
        if (stage === 'Submitted') dateStr = fmtDate(app.submittedAt);
        if (active && !dateStr)    dateStr = 'Current stage';

        return (
          <div key={stage} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            {/* Dot + line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', marginTop: 2,
                background: active ? COLORS.primary : done ? COLORS.primaryLight : '#E5E7EB',
                border: `2px solid ${dotColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, color: done || active ? COLORS.primary : COLORS.textMuted, fontWeight: 700,
              }}>
                {done && !active ? '✓' : ''}
              </div>
              {i < STAGE_ORDER.length - 1 && (
                <div style={{ width: 2, flex: 1, minHeight: 28, background: lineColor, marginTop: 2, marginBottom: 2 }} />
              )}
            </div>
            {/* Label */}
            <div style={{ paddingBottom: 20, opacity: future ? 0.4 : 1 }}>
              <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? COLORS.primary : COLORS.text }}>
                {STAGE_LABELS[stage] ?? stage}
                {active && (
                  <span style={{ marginLeft: 8, fontSize: 10, background: COLORS.primaryLight, color: COLORS.primary, padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>
                    CURRENT
                  </span>
                )}
              </div>
              {dateStr && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{dateStr}</div>}
            </div>
          </div>
        );
      })}

      {(app.stage === 'Rejected') && (
        <div style={{ marginTop: 8, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#991B1B', fontWeight: 600 }}>
          ✕ Application Rejected
        </div>
      )}
      {(app.stage === 'QuerySent') && (
        <div style={{ marginTop: 8, background: COLORS.warningLight, border: '1px solid rgba(246,173,85,0.5)', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#7C2D12', fontWeight: 600 }}>
          ⚠ Query Sent — Response Required
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ApplicationView() {
  const { id }        = useParams<{ id: string }>();
  const navigate      = useNavigate();
  const [params]      = useSearchParams();
  const [app, setApp]         = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    const t = parseInt(params.get('tab') ?? '0', 10);
    return isNaN(t) ? 0 : t;
  });

  useEffect(() => {
    if (!id) return;
    fetchApplication(id)
      .then(setApp)
      .catch(() => toast.error('Could not load application'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div style={{ padding: '60px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>Loading application…</div>;
  }

  if (!app) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
        <div style={{ fontSize: 14, color: COLORS.textMuted }}>Application not found.</div>
        <button onClick={() => navigate('/app/applications')} style={{ marginTop: 16, background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 12, cursor: 'pointer' }}>
          ← Back to Applications
        </button>
      </div>
    );
  }

  const fd = app.formData as AppFormData | null;

  return (
    <div>
      {/* ── Page header ───────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => navigate('/app/applications')}
          style={{ background: 'none', border: 'none', color: COLORS.primary, fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ← Back to Application Details
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={S.roleLabel}>APPLICANT</div>
            <div style={{ ...S.pageTitle, display: 'flex', alignItems: 'center', gap: 10 }}>
              {app.referenceNumber}
              <StatusBadge status={app.stage} />
            </div>
            <div style={S.pageDesc}>{TYPE_LABELS[app.applicationType] ?? app.applicationType} · {app.companyName}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {app.stage === 'Draft' && (
              <button
                onClick={() => {
                  let path: string;
                  if (app.applicationType === 'NSF')      path = `/app/apply/nsf-form?id=${app.id}`;
                  else if (app.applicationType === 'CA')  path = `/app/apply/ca-form?id=${app.id}`;
                  else if (app.applicationType === 'AyurvedaAahara' || app.applicationType === 'AA')
                                                          path = `/app/apply/aa-form?id=${app.id}`;
                  else if (app.applicationType === 'RPET') path = `/app/apply/rpet-form?id=${app.id}`;
                  else                                    path = `/app/apply/form?id=${app.id}&type=${app.applicationType}`;
                  navigate(path);
                }}
                style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                ✏ Edit Draft
              </button>
            )}
            {app.stage === 'QuerySent' && (
              <button
                onClick={() => setActiveTab(2)}
                style={{ background: COLORS.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                ⚠ Respond to Query
              </button>
            )}
            <button
              onClick={() => window.print()}
              style={{ background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 8, padding: '9px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              🖨 Print
            </button>
          </div>
        </div>
      </div>

      {/* ── Info chips row ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <InfoChip label="Reference No."  value={app.referenceNumber} highlight />
        <InfoChip label="Application Type" value={TYPE_LABELS[app.applicationType] ?? app.applicationType} />
        <InfoChip label="Current Stage"  value={STAGE_LABELS[app.stage] ?? app.stage} />
        <InfoChip label="Created"        value={fmtDate(app.createdAt)} />
        <InfoChip label="Submitted"      value={fmtDate(app.submittedAt)} />
        <InfoChip label="Last Updated"   value={fmtDate(app.updatedAt)} />
      </div>

      {/* ── Tab content ───────────────────────────────────────────── */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === 0 && (
          fd
            ? <TabSummary fd={fd} applicationType={app.applicationType} />
            : <div style={{ padding: '40px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>No form data saved yet.</div>
        )}
        {activeTab === 1 && (fd ? <TabDocuments fd={fd} applicationType={app.applicationType} /> : <TabDocuments fd={{ step1: { applicationFor: '', specifyFood: '', ingredients: [], additives: [] }, step2: {} as never, step3: {} as never, step4: {} as never, step5: {} as never }} applicationType={app.applicationType} />)}
        {activeTab === 2 && <TabQueries app={app} onResponded={() => fetchApplication(app.id).then(setApp)} />}
        {activeTab === 3 && (
          <div style={{ padding: '16px 0' }}>
            {app.stage === 'Approved' ? (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '16px 20px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.success, marginBottom: 6 }}>✅ Application Approved</div>
                <div style={{ fontSize: 12, color: COLORS.text }}>This application has been approved by FSSAI. The formal approval letter has been dispatched.</div>
              </div>
            ) : app.stage === 'Rejected' ? (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '16px 20px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.danger, marginBottom: 6 }}>✕ Application Rejected</div>
                <div style={{ fontSize: 12, color: COLORS.text }}>This application was rejected. Please refer to the queries section for details and use the Appeal option if applicable.</div>
              </div>
            ) : (
              <div style={{ padding: '48px 0', textAlign: 'center', color: COLORS.textMuted }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No formal decision yet</div>
                <div style={{ fontSize: 12 }}>Application is currently with: <strong>{STAGE_LABELS[app.stage] ?? app.stage}</strong></div>
              </div>
            )}
          </div>
        )}
        {activeTab === 4 && <TabTimeline app={app} />}
      </div>
    </div>
  );
}

import type React from 'react';
