import React from 'react';
import { COLORS, S } from '@/utils/colors';

// ── Value helpers ─────────────────────────────────────────────────────────────
const FILE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i;

function isFileVal(v: unknown): boolean {
  return typeof v === 'string' && FILE_RE.test(v);
}
function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined || v === '') return true;
  if (Array.isArray(v)) return v.length === 0;
  return false;
}
// Override map for abbreviated or non-obvious field names used across form types
const LABEL_OVERRIDES: Record<string, string> = {
  applicationFor:        'Application For',
  specifyFood:           'Specify Food Type',
  applicantName:         'Applicant Name',
  authorisedPerson:      'Authorised Person',
  authorisedPersonOther: 'Authorised Person (Other)',
  mobileNo:              'Mobile No.',
  orgName:               'Organisation Name',
  orgAddress:            'Organisation Address',
  licenseNumber:         'License Number',
  mfgAddress:            'Manufacturing / Processing Address',
  natureOfBusiness:      'Nature of Business',
  productName:           'Product Name',
  justification:         'Justification of Name',
  productCategory:       'Product Category',
  subCategory:           'Sub-Category',
  source:                'Source (Animal / Chemical / Botanical / Micro-biological)',
  genusSp:               'Genus & Species',
  functionalBenefits:    'Functional Benefits',
  healthBenefits:        'Health Benefits',
  gstNo:                 'GST No.',
  regulatoryStatus:      'Regulatory Status',
  relationshipType:      'Relationship Type',
  targetGroup:           'Target Group',
  newTechnology:         'New Technology Details',
  humanStudies:          'Safety Information (Risk / Toxicity)',
  toxicologyStudies:     'History of Consumption',
  chemicalName:          'Chemical Name & INS No.',
  purity:                'Purity (Food Grade)',
  adi:                   'ADI (JECFA / Risk Assessment Body)',
  proposedLevel:         'Proposed Level of Use',
  colorIndex:            'Colour Index',
  paymentMethod:         'Payment Method',
  paymentReference:      'Transaction Reference Number',
  // CA form
  applicantAddress:      'Applicant Address',
  authorisedSignatory:   'Authorised Signatory',
  authorisedContact:     'Authorised Contact Number',
  licenseCategory:       'License Category',
  productComposition:    'Product Composition',
  nonSpecifiedCategory:  'Falls Under Non-Specified Category?',
  claimType:             'Type of Claim(s)',
  claimIngredient:       'Ingredient / Substance for Claim',
  claimStatement:        'Claim Statement',
  claimJustification:    'Claim Justification',
  isIPRProtected:        'Ingredient / Product IPR Protected?',
  claimFunctionProtected:'Claim Function IPR Protected?',
  iprDetails:            'IPR Details',
  scientificSubstantiation: 'Scientific Substantiation',
  diseaseRiskStudies:    'Cause-effect Relationship Studies',
  analysisMethod:        'Validated Method of Analysis',
  adverseEffects:        'Safety / Adverse Effects / Warnings',
  additionalInfo:        'Additional Information',
  authorisedEmail:       'Authorised Signatory Email',
  approvalLetter:        'FSSAI Approval Letter',
  composition:           'Detailed Composition (Ingredients & Additives)',
};

function camelToLabel(key: string): string {
  if (key in LABEL_OVERRIDES) return LABEL_OVERRIDES[key];
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/\bUrl\b/g, 'URL').replace(/\bId\b/g, 'ID')
    .trim();
}
function fmt(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}

// ── Low-level row components ──────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={2} style={{
        padding: '12px 16px 9px',
        background: COLORS.primaryLight,
        borderTop: `2px solid ${COLORS.border}`,
        borderLeft: `4px solid ${COLORS.primary}`,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: COLORS.primary,
          textTransform: 'uppercase', letterSpacing: 1,
        }}>{label}</span>
      </td>
    </tr>
  );
}

function PrimRow({ label, value, idx }: { label: string; value: string; idx: number }) {
  return (
    <tr style={{ background: idx % 2 === 0 ? '#fff' : '#F8FAFC' }}>
      <td style={{
        padding: '9px 14px 9px 24px', fontSize: 12, fontWeight: 600,
        color: COLORS.textMuted, width: '38%', verticalAlign: 'top',
        borderBottom: `1px solid ${COLORS.border}`, lineHeight: 1.5,
      }}>
        {label}
      </td>
      <td style={{
        padding: '9px 16px', fontSize: 13, color: COLORS.text,
        borderBottom: `1px solid ${COLORS.border}`, whiteSpace: 'pre-wrap',
        lineHeight: 1.6, fontWeight: 500,
      }}>
        {value}
      </td>
    </tr>
  );
}

function ArraySubTable({ label, rows }: { label: string; rows: Record<string, unknown>[] }) {
  const cols = Array.from(
    new Set(rows.flatMap((r) => Object.keys(r).filter((k) => !isFileVal(r[k]) && !isEmpty(r[k]))))
  );
  if (cols.length === 0) return null;
  return (
    <tr>
      <td colSpan={2} style={{ padding: '6px 12px 10px 22px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>{camelToLabel(label)}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, borderRadius: 6, overflow: 'hidden', border: `1px solid ${COLORS.border}` }}>
          <thead>
            <tr>
              <th style={{ background: COLORS.primary, color: '#fff', fontSize: 10, fontWeight: 700, padding: '6px 10px', textAlign: 'left', letterSpacing: 0.6 }}>#</th>
              {cols.map((c) => <th key={c} style={{ background: COLORS.primary, color: '#fff', fontSize: 10, fontWeight: 700, padding: '6px 10px', textAlign: 'left', letterSpacing: 0.6 }}>{camelToLabel(c)}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                <td style={{ ...S.td, fontSize: 11, padding: '5px 10px' }}>{i + 1}</td>
                {cols.map((c) => <td key={c} style={{ ...S.td, fontSize: 11, padding: '5px 10px' }}>{fmt(row[c])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </td>
    </tr>
  );
}

// ── Section: renders a specific list of keys from a flat object ───────────────
// Only renders keys that have a non-empty, non-file value → naturally shows only
// what the applicant actually filled, regardless of which category they selected.
function KeyedSection({
  label, keys, data,
}: { label: string; keys: string[]; data: Record<string, unknown> }) {
  let rowIdx = 0;
  const nodes: React.ReactNode[] = [];

  for (const k of keys) {
    const v = data[k];
    if (isEmpty(v) || isFileVal(v)) continue;

    if (Array.isArray(v)) {
      if (typeof v[0] === 'object') {
        nodes.push(<ArraySubTable key={k} label={k} rows={v as Record<string, unknown>[]} />);
      } else {
        nodes.push(<PrimRow key={k} label={camelToLabel(k)} value={(v as unknown[]).join(', ')} idx={rowIdx++} />);
      }
    } else {
      nodes.push(<PrimRow key={k} label={camelToLabel(k)} value={fmt(v)} idx={rowIdx++} />);
    }
  }

  if (nodes.length === 0) return null;
  return <><SectionHeader label={label} />{nodes}</>;
}

// ── Generic section: walks any object, shows all filled non-file fields ────────
function GenericSection({ label, data }: { label: string; data: Record<string, unknown> }) {
  let rowIdx = 0;
  const nodes: React.ReactNode[] = [];

  for (const [k, v] of Object.entries(data)) {
    if (isEmpty(v) || isFileVal(v)) continue;
    if (Array.isArray(v)) {
      if (v.length > 0 && typeof v[0] === 'object') nodes.push(<ArraySubTable key={k} label={k} rows={v as Record<string, unknown>[]} />);
      else if (v.length > 0) nodes.push(<PrimRow key={k} label={camelToLabel(k)} value={(v as unknown[]).join(', ')} idx={rowIdx++} />);
    } else if (typeof v === 'object' && v !== null) {
      // Flatten one level of nesting
      for (const [nk, nv] of Object.entries(v as Record<string, unknown>)) {
        if (!isEmpty(nv) && !isFileVal(nv) && typeof nv !== 'object') {
          nodes.push(<PrimRow key={`${k}.${nk}`} label={`${camelToLabel(k)} — ${camelToLabel(nk)}`} value={fmt(nv)} idx={rowIdx++} />);
        }
      }
    } else {
      nodes.push(<PrimRow key={k} label={camelToLabel(k)} value={fmt(v)} idx={rowIdx++} />);
    }
  }

  if (nodes.length === 0) return null;
  return <><SectionHeader label={label} />{nodes}</>;
}

// ── Botanical cards: renders each OtherBotanicalRow as its own labeled section ─
// A 14-column flat table is unreadable; cards match the form's per-botanical UX.
const BOTANICAL_LABELS: Record<string, string> = {
  botanicalName:                    'Botanical Name',
  quantity:                         'Quantity',
  unit:                             'Unit',
  rationale:                        'Rationale for Inclusion',
  botanicalNameOfAuthoritativeText: 'Name of Authoritative Text',
  botanicalBookEditor:              'Editor',
  botanicalBookAuthor:              'Author',
  botanicalBookVolume:              'Volume',
  botanicalBookSthana:              'Sthana (Section)',
  botanicalReferenceChapter:        'Adhyaya (Chapter)',
  botanicalReferenceVerse:          'Verse Number(s)',
  botanicalBookPageNumbers:         'Page Numbers',
  botanicalBookPublisher:           'Publisher',
  botanicalPublicationYear:         'Publication Year',
  botanicalPublicationPlace:        'Publication Place',
};

function BotanicalCards({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows || rows.length === 0) return null;
  return (
    <>
      {rows.map((row, i) => {
        const name = typeof row.botanicalName === 'string' && row.botanicalName ? row.botanicalName : `Botanical ${i + 1}`;
        const entries = Object.entries(row).filter(([k, v]) => k in BOTANICAL_LABELS && !isFileVal(v) && !isEmpty(v));
        if (entries.length === 0) return null;
        let rowIdx = 0;
        return (
          <React.Fragment key={i}>
            <tr>
              <td colSpan={2} style={{ padding: '7px 12px 3px 22px', background: '#EFF6FF' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Botanical {i + 1} — {name}
                </span>
              </td>
            </tr>
            {entries.map(([k, v]) => (
              <PrimRow key={k} label={BOTANICAL_LABELS[k]} value={fmt(v)} idx={rowIdx++} />
            ))}
          </React.Fragment>
        );
      })}
    </>
  );
}

// ── AA field key lists (ALL categories combined per step) ─────────────────────
// Because we skip empty values, only the applicant's chosen category fields
// will actually appear — no hardcoded category detection needed.

const AA_S0_CATEGORY = ['ayurvedaCategory'];

// Applicant details — matches form order: applicant → authorised person → org → nature
const AA_S0_APPLICANT = [
  'applicantPrefix', 'applicantName',
  'authorisedPersonPrefix', 'authorisedPerson', 'authorisedContact',
  'authorisedEmail', 'authorisedEmail2', 'authorisedEmail3',
  'nameOfOrganization', 'registeredOfficeAddress', 'manufacturingAddress',
  'manufacturingPremisesContactDetails', 'natureOfBusiness',
];

const AA_S0_PRODUCT = [
  'productName', 'justificationOfProposedAyurvedaAahara', 'functionalUse', 'intendedUse',
];

// Step 1 — Trad ref for Cat B/B1/B2 (form renders this BEFORE ingredients for B categories)
// differentFormatRationale (B1 only) follows B1 trad ref fields immediately in the form.
const AA_S1_TRAD_B = [
  // Category B
  'catBNameOfAyurvedaAahara', 'catBFormatOfAyurvedaAahara',
  'catBAyurvedaBookMultiSelect', 'catBAyurvedaAaharaRecipe', 'catBNameOfAuthoritativeText',
  'catBBookEditor', 'catBBookAuthor', 'catBBookVolume', 'catBBookSthana',
  'catBReferenceChapter', 'catBReferenceVerse', 'catBBookPageNumbers',
  'catBBookPublisher', 'catBBookPublicationYear', 'catBBookPublicationPlace',
  // Category B1
  'catB1NameOfAyurvedaAahara', 'catB1FormatOfAyurvedaAahara',
  'catB1AyurvedaBookMultiSelect', 'catB1AyurvedaAaharaRecipe', 'catB1NameOfAuthoritativeText',
  'catB1BookEditor', 'catB1BookAuthor', 'catB1BookVolume', 'catB1BookSthana',
  'catB1ReferenceChapter', 'catB1ReferenceVerse', 'catB1BookPageNumbers',
  'catB1BookPublisher', 'catB1BookPublicationYear', 'catB1BookPublicationPlace',
  'differentFormatRationale',
  // Category B2
  'catB2NameOfAyurvedaAahara', 'catB2FormatOfAyurvedaAahara',
  'catB2AyurvedaBookMultiSelect', 'catB2AyurvedaAaharaRecipe', 'catB2NameOfAuthoritativeText',
  'catB2BookEditor', 'catB2BookAuthor', 'catB2BookVolume', 'catB2BookSthana',
  'catB2ReferenceChapter', 'catB2ReferenceVerse', 'catB2BookPageNumbers',
  'catB2BookPublisher', 'catB2BookPublicationYear', 'catB2BookPublicationPlace',
];

// Step 1 — Trad ref for Cat A (form renders this AFTER ingredients)
const AA_S1_TRAD_A = [
  'catANameOfAyurvedaAahara', 'catAFormatOfAyurvedaAahara',
  'ayurvedaBookMultiSelect', 'ayurvedaAaharaNameOfText', 'ayurvedaAaharaRecipe',
  'ayurvedaReferenceBook', 'referenceChapter', 'referenceVerse',
  'bookEditor', 'bookAuthor', 'bookVolume', 'bookSthana',
  'bookPageNumbers', 'bookPublisher', 'bookPublicationYear', 'bookPublicationPlace',
];

// Usage — matches form order: serving → population → directions → duration → packaging → conformance
const AA_S2_EARLY_CLAIMS = [
  // Category A
  'catAHealthBenefitYesNo', 'catAHealthBenefitClaim', 'catAHealthBenefitAbstract', 'catAHealthBenefitEfficacyRows',
  'catADiseaseRiskYesNo', 'catADiseaseRiskStatement1', 'catADiseaseRiskStatement2', 'catADiseaseRiskStatement3',
  'catADiseaseRiskAbstract', 'catADiseaseRiskEvidenceRows',
  // Category B
  'catBHealthBenefitYesNo', 'catBHealthBenefitClaim', 'catBHealthBenefitAbstract', 'catBHealthBenefitEvidenceRows',
  'catBDiseaseRiskYesNo', 'catBDiseaseRiskStatement1', 'catBDiseaseRiskStatement2', 'catBDiseaseRiskStatement3',
  'catBDiseaseRiskAbstract', 'catBDiseaseRiskEvidenceRows',
  'catBSafetyDataAbstract', 'catBSafetyEvidenceRows',
];

const AA_S2_USAGE = [
  'servingSize', 'targetPopulation', 'directionsForUse', 'durationOfUse',
  'packageMaterial', 'fssConformance',
];

const AA_S2_LATE_CLAIMS = [
  // Category B1
  'b1LabelHealthBenefitYesNo', 'catB1HealthBenefitRationale', 'b1HealthBenefitAbstract', 'catB1HealthBenefitEvidenceRows',
  'b1LabelDiseaseRiskYesNo', 'b1LabelDiseaseRiskStatement1', 'b1LabelDiseaseRiskStatement2', 'b1LabelDiseaseRiskStatement3',
  'b1LabelDiseaseRiskAbstract', 'catB1DiseaseRiskEvidenceRows',
  'catB1SafetyDataAbstract', 'catB1SafetyEvidenceRows',
  // Category B2
  'catB2HealthBenefit1YesNo', 'catB2HealthBenefit1Rationale', 'catB2HealthBenefit1Abstract', 'catB2HealthBenefit1EvidenceRows',
  'catB2HealthBenefit2YesNo', 'catB2HealthBenefit2Rationale', 'catB2HealthBenefit2Abstract', 'catB2HealthBenefit2EvidenceRows',
  'catB2DiseaseRisk1YesNo', 'catB2DiseaseRisk1Statement1', 'catB2DiseaseRisk1Statement2', 'catB2DiseaseRisk1Statement3',
  'catB2DiseaseRisk1Abstract', 'catB2DiseaseRisk1EvidenceRows',
  'catB2DiseaseRisk2YesNo', 'catB2DiseaseRisk2Statement1', 'catB2DiseaseRisk2Statement2', 'catB2DiseaseRisk2Statement3',
  'catB2DiseaseRisk2Abstract', 'catB2DiseaseRisk2EvidenceRows',
];

const AA_S2_EFFICACY_SAFETY = [
  'efficacyDataAbstract', 'catB1EfficacyEvidenceRows',
  'catB2SafetyDataAbstract', 'catB2SafetyEvidenceRows',
];

const AA_S3_REGISTRATION = [
  'hasExistingRegistration', 'registrationNumber', 'registrationDate',
  'licenseNumberExisting', 'licenseDate',
];

const AA_S4_PAYMENT = ['paymentMethod', 'paymentReference'];

// ── Shared header style — declared here so both table components can reference it ─
const thStyle: React.CSSProperties = {
  padding: '11px 16px 11px 24px', fontSize: 11, fontWeight: 700,
  color: '#fff', textTransform: 'uppercase', letterSpacing: 1,
  textAlign: 'left', width: '38%',
};

function AyurvedaFormTable({ data }: { data: Record<string, unknown> }) {
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: COLORS.primary }}>
            <th style={thStyle}>Field</th>
            <th style={{ ...thStyle, width: 'auto' }}>Applicant Response</th>
          </tr>
        </thead>
        <tbody>
          {/* Step 0 */}
          <KeyedSection label="Step 0 — Category Selection" keys={AA_S0_CATEGORY}  data={data} />
          <KeyedSection label="Step 0 — Applicant Details"  keys={AA_S0_APPLICANT} data={data} />
          <KeyedSection label="Step 0 — Product Details"    keys={AA_S0_PRODUCT}   data={data} />

          {/* Step 1: Cat B/B1/B2 trad ref first, then botanicals, then ingredients, then Cat A trad ref, then additives */}
          <KeyedSection label="Step 1 — Traditional Reference" keys={AA_S1_TRAD_B} data={data} />
          {Array.isArray(data.otherBotanicals) && (data.otherBotanicals as Record<string, unknown>[]).length > 0 && (
            <>
              <SectionHeader label="Step 1 — Other Botanicals (Category B)" />
              <BotanicalCards rows={data.otherBotanicals as Record<string, unknown>[]} />
            </>
          )}
          <KeyedSection label="Step 1 — Botanicals Rationale"           keys={['otherBotanicalsRationale']} data={data} />
          <KeyedSection label="Step 1 — Ingredients"                     keys={['ingredients']}             data={data} />
          <KeyedSection label="Step 1 — Traditional Reference (Cat A)"   keys={AA_S1_TRAD_A}                data={data} />
          <KeyedSection label="Step 1 — Additives"                        keys={['additives']}               data={data} />
          <KeyedSection label="Step 1 — Composition Details"              keys={['hasSpecifications']}       data={data} />

          {/* Step 2: Cat A/B claims, then usage, then Cat B1/B2 claims, then efficacy/safety */}
          <KeyedSection label="Step 2 — Label Claims & Evidence"           keys={AA_S2_EARLY_CLAIMS}   data={data} />
          <KeyedSection label="Step 2 — Usage & Population"                keys={AA_S2_USAGE}          data={data} />
          <KeyedSection label="Step 2 — Label Claims & Evidence (B1/B2)"   keys={AA_S2_LATE_CLAIMS}    data={data} />
          <KeyedSection label="Step 2 — Efficacy & Safety Data"            keys={AA_S2_EFFICACY_SAFETY} data={data} />

          {/* Step 3 */}
          <KeyedSection label="Step 3 — Existing Registration" keys={AA_S3_REGISTRATION} data={data} />

          {/* Step 4 */}
          <KeyedSection label="Step 4 — Payment" keys={AA_S4_PAYMENT} data={data} />
        </tbody>
      </table>
    </div>
  );
}

// ── NSF / AnyOther field key lists ────────────────────────────────────────────
// Exact form order; file fields are included but skipped by isFileVal.

const NSF_S1 = ['applicationFor', 'specifyFood'];

const NSF_S2 = [
  'applicantName', 'authorisedPerson', 'authorisedPersonOther',
  'mobileNo', 'email',
  'orgName', 'orgAddress',
  'licenseNumber', 'mfgAddress', 'natureOfBusiness',
  'productName', 'justification', 'productCategory', 'subCategory',
  'source', 'genusSp',
  'functionalBenefits', 'healthBenefits',
  'endUseDeclaration',
];

const NSF_S3 = [
  'certOfAnalysis', 'manufacturingProcess',
  'regulatoryStatus', 'regulatoryStatusFile',
  'relationshipType', 'agreementDoc',
  'safetyFile1', 'safetyFile2',
  'claimFile1', 'claimFile2',
  'prototypeLabel', 'postMarketingDecl', 'confidentialityDecl',
  'gstNo',
];

// All option A/B/C/D/E keys combined; only the applicant's chosen option fills any of these
const NSF_S4 = [
  // Option A — Novel food
  'targetGroup', 'composition', 'newTechnology',
  'humanStudies', 'humanStudiesFile',
  'toxicologyStudies', 'toxicologyStudiesFile',
  // Option B — New additives
  'chemicalName', 'purity', 'adi', 'proposedLevel', 'colorIndex',
  // Option C — Processing aids (all files, will be skipped)
  'specificationDoc', 'enzymeActivity', 'enzymePurity', 'residualLimit',
  // Option D — Microorganisms (file, will be skipped)
  'microTemplate',
  // Option E — Any other (file, will be skipped)
  'anyOtherDoc',
];

const NSF_S5 = ['paymentMethod', 'paymentReference'];

function NSFAnyOtherFormTable({ data }: { data: Record<string, unknown> }) {
  const s1 = (data.step1 ?? {}) as Record<string, unknown>;
  const s2 = (data.step2 ?? {}) as Record<string, unknown>;
  const s3 = (data.step3 ?? {}) as Record<string, unknown>;
  const s4 = (data.step4 ?? {}) as Record<string, unknown>;
  const s5 = (data.step5 ?? {}) as Record<string, unknown>;
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: COLORS.primary }}>
            <th style={thStyle}>Field</th>
            <th style={{ ...thStyle, width: 'auto' }}>Applicant Response</th>
          </tr>
        </thead>
        <tbody>
          <KeyedSection label="Step 1 — Application Type"       keys={NSF_S1} data={s1} />
          <KeyedSection label="Step 2 — General Information"    keys={NSF_S2} data={s2} />
          <KeyedSection label="Step 3 — Documents & Regulatory" keys={NSF_S3} data={s3} />
          <KeyedSection label="Step 4 — Additional Information" keys={NSF_S4} data={s4} />
          <KeyedSection label="Step 5 — Payment"                keys={NSF_S5} data={s5} />
        </tbody>
      </table>
    </div>
  );
}

// ── CA field key lists ─────────────────────────────────────────────────────────
// File fields (licenseCopy, iprSupportingDoc, etc.) are included here but skipped
// automatically by isFileVal, so no extra filtering is needed.

const CA_S0_APPLICANT = [
  'applicantName', 'applicantAddress',
  'authorisedSignatory', 'authorisedEmail', 'authorisedContact',
];
const CA_S0_LICENSE = [
  'licenseNumber', 'licenseCopy', 'licenseCategory',
];
const CA_S0_PRODUCT = [
  'productName', 'productComposition', 'productCategory',
];
const CA_S0_REGULATORY = [
  'nonSpecifiedCategory', 'approvalLetter',
];
const CA_S1_CLAIM = [
  'claimType', 'claimIngredient', 'claimStatement', 'claimJustification',
];
const CA_S1_IPR = [
  'isIPRProtected', 'claimFunctionProtected', 'iprDetails', 'iprSupportingDoc',
];
const CA_S2_SCIENTIFIC = [
  'scientificSubstantiation', 'scientificSubstantiationFile',
  'diseaseRiskStudies', 'diseaseRiskStudiesFile',
  'analysisMethod', 'analysisMethodFile',
  'adverseEffects', 'adverseEffectsFile',
  'additionalInfo', 'additionalInfoFile',
];
const CA_S3_PAYMENT = ['paymentMethod', 'paymentReference'];

function CAFormTable({ data }: { data: Record<string, unknown> }) {
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: COLORS.primary }}>
            <th style={thStyle}>Field</th>
            <th style={{ ...thStyle, width: 'auto' }}>Applicant Response</th>
          </tr>
        </thead>
        <tbody>
          <KeyedSection label="Step 0 — Applicant Details"   keys={CA_S0_APPLICANT}  data={data} />
          <KeyedSection label="Step 0 — License Information" keys={CA_S0_LICENSE}    data={data} />
          <KeyedSection label="Step 0 — Product Information" keys={CA_S0_PRODUCT}    data={data} />
          <KeyedSection label="Step 0 — Regulatory Status"   keys={CA_S0_REGULATORY} data={data} />
          <KeyedSection label="Step 1 — Claim Details"       keys={CA_S1_CLAIM}      data={data} />
          <KeyedSection label="Step 1 — IPR Information"     keys={CA_S1_IPR}        data={data} />
          <KeyedSection label="Step 2 — Scientific & Safety" keys={CA_S2_SCIENTIFIC} data={data} />
          <KeyedSection label="Step 3 — Payment"             keys={CA_S3_PAYMENT}    data={data} />
        </tbody>
      </table>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
interface FormDataTableProps { formData: unknown; }

export default function FormDataTable({ formData }: FormDataTableProps) {
  if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
    return (
      <div style={{ fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic', padding: '16px 0' }}>
        No form data available.
      </div>
    );
  }

  const fd = formData as Record<string, unknown>;

  // ── Ayurveda Aahara — flat form with explicit step groupings ──
  if ('ayurvedaCategory' in fd) {
    return <AyurvedaFormTable data={fd} />;
  }

  // ── Claim Approval — flat form with explicit step groupings ──
  if ('claimStatement' in fd) {
    return <CAFormTable data={fd} />;
  }

  // ── Step-based forms (NSF / AnyOther): keys are step1, step2, … ──
  const isStepBased = Object.keys(fd).some((k) => /^step\d+$/i.test(k));
  if (isStepBased) {
    return <NSFAnyOtherFormTable data={fd} />;
  }

  // ── Fallback: unknown flat form ──
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: COLORS.primary }}>
            <th style={thStyle}>Field</th>
            <th style={{ ...thStyle, width: 'auto' }}>Applicant Response</th>
          </tr>
        </thead>
        <tbody>
          <GenericSection label="Application Details" data={fd} />
        </tbody>
      </table>
    </div>
  );
}