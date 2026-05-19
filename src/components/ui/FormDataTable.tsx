import type React from 'react';
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
function camelToLabel(key: string): string {
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
      <td colSpan={2} style={{ padding: '9px 12px 4px', background: COLORS.primaryLight }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.7 }}>{label}</span>
      </td>
    </tr>
  );
}

function PrimRow({ label, value, idx }: { label: string; value: string; idx: number }) {
  return (
    <tr style={{ background: idx % 2 === 0 ? '#fff' : COLORS.bg }}>
      <td style={{ padding: '5px 12px 5px 22px', fontSize: 11, fontWeight: 600, color: COLORS.textMuted, width: '38%', verticalAlign: 'top', borderBottom: `1px solid ${COLORS.border}` }}>
        {label}
      </td>
      <td style={{ padding: '5px 12px', fontSize: 12, color: COLORS.text, borderBottom: `1px solid ${COLORS.border}`, whiteSpace: 'pre-wrap' }}>
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
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ ...S.th, fontSize: 10, padding: '4px 8px' }}>#</th>
              {cols.map((c) => <th key={c} style={{ ...S.th, fontSize: 10, padding: '4px 8px' }}>{camelToLabel(c)}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                <td style={{ ...S.td, fontSize: 11, padding: '3px 8px' }}>{i + 1}</td>
                {cols.map((c) => <td key={c} style={{ ...S.td, fontSize: 11, padding: '3px 8px' }}>{fmt(row[c])}</td>)}
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

// ── AA field key lists (ALL categories combined per step) ─────────────────────
// Because we skip empty values, only the applicant's chosen category fields
// will actually appear — no hardcoded category detection needed.

const AA_S0_CATEGORY = ['ayurvedaCategory'];
const AA_S0_APPLICANT = [
  'applicantPrefix','applicantName','nameOfOrganization',
  'registeredOfficeAddress','manufacturingAddress','manufacturingPremisesContactDetails',
  'authorisedPersonPrefix','authorisedPerson',
  'authorisedEmail','authorisedEmail2','authorisedEmail3','authorisedContact',
  'natureOfBusiness',
];
const AA_S0_PRODUCT = [
  'productName','justificationOfProposedAyurvedaAahara','functionalUse','intendedUse',
];
const AA_S1_COMPOSITION = [
  'ingredients','additives','otherBotanicals','hasSpecifications',
];
// Traditional reference — ALL four categories combined; only filled keys appear
const AA_S1_TRAD_REF = [
  // Category A
  'ayurvedaBookMultiSelect','ayurvedaAaharaNameOfText','ayurvedaAaharaRecipe',
  'ayurvedaReferenceBook','referenceChapter','referenceVerse',
  'bookEditor','bookAuthor','bookVolume','bookSthana',
  'bookPageNumbers','bookPublisher','bookPublicationYear','bookPublicationPlace',
  // Category B
  'catBNameOfAyurvedaAahara','catBFormatOfAyurvedaAahara',
  'catBAyurvedaBookMultiSelect','catBAyurvedaAaharaRecipe','catBNameOfAuthoritativeText',
  'catBBookEditor','catBBookAuthor','catBBookVolume','catBBookSthana',
  'catBReferenceChapter','catBReferenceVerse','catBBookPageNumbers',
  'catBBookPublisher','catBBookPublicationYear','catBBookPublicationPlace',
  // Category B1
  'catB1NameOfAyurvedaAahara','catB1FormatOfAyurvedaAahara',
  'catB1AyurvedaBookMultiSelect','catB1AyurvedaAaharaRecipe','catB1NameOfAuthoritativeText',
  'catB1BookEditor','catB1BookAuthor','catB1BookVolume','catB1BookSthana',
  'catB1ReferenceChapter','catB1ReferenceVerse','catB1BookPageNumbers',
  'catB1BookPublisher','catB1BookPublicationYear','catB1BookPublicationPlace',
  // Category B2
  'catB2NameOfAyurvedaAahara','catB2FormatOfAyurvedaAahara',
  'catB2AyurvedaBookMultiSelect','catB2AyurvedaAaharaRecipe','catB2NameOfAuthoritativeText',
  'catB2BookEditor','catB2BookAuthor','catB2BookVolume','catB2BookSthana',
  'catB2ReferenceChapter','catB2ReferenceVerse','catB2BookPageNumbers',
  'catB2BookPublisher','catB2BookPublicationYear','catB2BookPublicationPlace',
];
const AA_S2_USAGE = [
  'targetPopulation','servingSize','durationOfUse','directionsForUse',
  'packageMaterial','fssConformance',
];
// Claims / evidence — ALL four categories; only filled keys appear
const AA_S2_CLAIMS = [
  // Category A
  'catANameOfAyurvedaAahara','catAFormatOfAyurvedaAahara',
  'catAHealthBenefitYesNo','catAHealthBenefitClaim','catAHealthBenefitAbstract','catAHealthBenefitEfficacyRows',
  'catADiseaseRiskYesNo','catADiseaseRiskStatement1','catADiseaseRiskStatement2','catADiseaseRiskStatement3',
  'catADiseaseRiskAbstract','catADiseaseRiskEvidenceRows',
  'otherBotanicalsRationale',
  // Category B
  'catBHealthBenefitYesNo','catBHealthBenefitClaim','catBHealthBenefitAbstract','catBHealthBenefitEfficacyRows',
  'catBDiseaseRiskYesNo','catBDiseaseRiskStatement1','catBDiseaseRiskStatement2','catBDiseaseRiskStatement3',
  'catBDiseaseRiskAbstract','catBDiseaseRiskEvidenceRows',
  'catBSafetyDataAbstract','catBSafetyEvidenceRows',
  // Category B1
  'diseaseRiskStatement1','diseaseRiskStatement2','diseaseRiskStatement3',
  'humanInterventionStudies','differentFormatRationale',
  'efficacyDataAbstract','catB1EfficacyEvidenceRows',
  'b1LabelHealthBenefitYesNo','b1HealthBenefitAbstract','catB1HealthBenefitEvidenceRows',
  'b1LabelDiseaseRiskYesNo','b1LabelDiseaseRiskStatement1','b1LabelDiseaseRiskStatement2','b1LabelDiseaseRiskStatement3',
  'b1LabelDiseaseRiskAbstract','catB1HealthBenefitRationale','catB1DiseaseRiskEvidenceRows',
  'catB1SafetyDataAbstract','catB1SafetyEvidenceRows',
  // Category B2
  'catB2HealthBenefit1YesNo','catB2HealthBenefit1Abstract','catB2HealthBenefit1Rationale','catB2HealthBenefit1EvidenceRows',
  'catB2HealthBenefit2YesNo','catB2HealthBenefit2Abstract','catB2HealthBenefit2Rationale','catB2HealthBenefit2EvidenceRows',
  'catB2DiseaseRisk1YesNo','catB2DiseaseRisk1Statement1','catB2DiseaseRisk1Statement2','catB2DiseaseRisk1Statement3',
  'catB2DiseaseRisk1Abstract','catB2DiseaseRisk1EvidenceRows',
  'catB2DiseaseRisk2YesNo','catB2DiseaseRisk2Statement1','catB2DiseaseRisk2Statement2','catB2DiseaseRisk2Statement3',
  'catB2DiseaseRisk2Abstract','catB2DiseaseRisk2EvidenceRows',
  'catB2SafetyDataAbstract','catB2SafetyEvidenceRows',
];
const AA_S3_REGISTRATION = [
  'hasExistingRegistration','registrationNumber','registrationDate',
  'licenseNumberExisting','licenseDate',
];
const AA_S4_PAYMENT = ['paymentMethod','paymentReference'];

function AyurvedaFormTable({ data }: { data: Record<string, unknown> }) {
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: COLORS.primary }}>
            <th style={thStyle}>Field</th>
            <th style={{ ...thStyle, width: 'auto' }}>Applicant Response</th>
          </tr>
        </thead>
        <tbody>
          <KeyedSection label="Step 0 — Category Selection"       keys={AA_S0_CATEGORY}     data={data} />
          <KeyedSection label="Step 0 — Applicant Details"         keys={AA_S0_APPLICANT}    data={data} />
          <KeyedSection label="Step 0 — Product Details"           keys={AA_S0_PRODUCT}      data={data} />
          <KeyedSection label="Step 1 — Ingredients & Composition" keys={AA_S1_COMPOSITION}  data={data} />
          <KeyedSection label="Step 1 — Traditional Reference"     keys={AA_S1_TRAD_REF}     data={data} />
          <KeyedSection label="Step 2 — Usage & Population"        keys={AA_S2_USAGE}        data={data} />
          <KeyedSection label="Step 2 — Label Claims & Evidence"   keys={AA_S2_CLAIMS}       data={data} />
          <KeyedSection label="Step 3 — Existing Registration"     keys={AA_S3_REGISTRATION} data={data} />
          <KeyedSection label="Step 4 — Payment"                   keys={AA_S4_PAYMENT}      data={data} />
        </tbody>
      </table>
    </div>
  );
}

// ── Shared header style ────────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  padding: '8px 12px 8px 22px', fontSize: 10, fontWeight: 700,
  color: '#fff', textTransform: 'uppercase', letterSpacing: 0.6,
  textAlign: 'left', width: '38%',
};

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

  // ── Step-based forms (NSF / AnyOther): keys are step1, step2, … ──
  const topKeys = Object.keys(fd);
  const isStepBased = topKeys.some((k) => /^step\d+$/i.test(k));

  const STEP_LABELS: Record<string, string> = {
    step1: 'Step 1 — Application Type',
    step2: 'Step 2 — General Information',
    step3: 'Step 3 — Documents & Declarations',
    step4: 'Step 4 — Additional Information',
    step5: 'Step 5 — Payment',
  };

  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: COLORS.primary }}>
            <th style={thStyle}>Field</th>
            <th style={{ ...thStyle, width: 'auto' }}>Applicant Response</th>
          </tr>
        </thead>
        <tbody>
          {isStepBased
            ? topKeys.map((key) => {
                const val = fd[key];
                if (isEmpty(val) || typeof val !== 'object' || Array.isArray(val)) return null;
                return (
                  <GenericSection
                    key={key}
                    label={STEP_LABELS[key] ?? camelToLabel(key)}
                    data={val as Record<string, unknown>}
                  />
                );
              })
            : <GenericSection label="Application Details" data={fd} />
          }
        </tbody>
      </table>
    </div>
  );
}
