// Claim Approval (CA) application form. Separate from NSF/other flows.
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { COLORS, S } from '@/utils/colors';
import Stepper from '@/components/ui/Stepper';
import UploadBox from '@/components/ui/UploadBox';
import {
  createDraftApplication, fetchApplication,
  fetchMyApplications, saveDraftApplication, submitDraftApplication,
  type AppFormData,
} from '@/services/application.service';

// ── Constants ─────────────────────────────────────────────────────────────────
const STEPS = ['Applicant & Product', 'Claim & IPR', 'Scientific & Safety', 'Payment'];

const FOOD_CATEGORIES = [
  'Dairy & Products', 'Cereals & Pulse Products', 'Bakery Products',
  'Beverages', 'Meat & Poultry', 'Fish & Marine Products', 'Fruits & Vegetables',
  'Fats & Oils', 'Confectionery', 'Health & Nutritional Foods',
  'Herbal & Ayurvedic Products', 'Novel Foods', 'Fortified Foods',
  'Infant Foods', 'Food Additives & Processing Aids', 'Packaging Materials',
];

const CA_FEE = { fee: '₹50,000', gst: '₹9,000', total: '₹59,000' };

// ── CA-specific flat form data ────────────────────────────────────────────────
interface CAFormData {
  // Step 0 — Applicant & Product
  applicantName:           string;
  applicantAddress:        string;
  authorisedSignatory:     string;
  authorisedEmail:         string;
  authorisedContact:       string;
  licenseNumber:           string;
  licenseCopy:             string;
  licenseCategory:         string;
  productName:             string;
  productComposition:      string;
  productCategory:         string;
  nonSpecifiedCategory:    string;
  approvalLetter:          string;
  // Step 1 — Claim & IPR
  claimType:               string;
  claimIngredient:         string;
  claimStatement:          string;
  claimJustification:      string;
  isIPRProtected:          string;
  claimFunctionProtected:  string;
  iprDetails:              string;
  iprSupportingDoc:        string;
  // Step 2 — Scientific & Safety
  scientificSubstantiation:     string;
  scientificSubstantiationFile: string;
  diseaseRiskStudies:           string;
  diseaseRiskStudiesFile:       string;
  analysisMethod:               string;
  analysisMethodFile:           string;
  adverseEffects:               string;
  adverseEffectsFile:           string;
  additionalInfo:               string;
  additionalInfoFile:           string;
  // Step 3 — Payment
  paymentMethod:    string;
  paymentReference: string;
}

function emptyCAFormData(): CAFormData {
  return {
    applicantName: '', applicantAddress: '', authorisedSignatory: '',
    authorisedEmail: '', authorisedContact: '',
    licenseNumber: '', licenseCopy: '', licenseCategory: '',
    productName: '', productComposition: '', productCategory: '',
    nonSpecifiedCategory: '', approvalLetter: '',
    claimType: '', claimIngredient: '', claimStatement: '', claimJustification: '',
    isIPRProtected: '', claimFunctionProtected: '',
    iprDetails: '', iprSupportingDoc: '',
    scientificSubstantiation: '', scientificSubstantiationFile: '',
    diseaseRiskStudies: '', diseaseRiskStudiesFile: '',
    analysisMethod: '', analysisMethodFile: '',
    adverseEffects: '', adverseEffectsFile: '',
    additionalInfo: '', additionalInfoFile: '',
    paymentMethod: 'Online Payment (NEFT/RTGS/UPI)', paymentReference: '',
  };
}

// ── Inline styles (mirrors NSFApplicationForm) ────────────────────────────────
const input: React.CSSProperties = {
  width: '100%', border: `1px solid ${COLORS.border}`, borderRadius: 6,
  padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  fontFamily: "'Noto Sans','Segoe UI',sans-serif",
};
const textarea: React.CSSProperties = { ...input, resize: 'vertical', minHeight: 80 };
const select: React.CSSProperties   = { ...input, cursor: 'pointer', appearance: 'auto' };
const secCard: React.CSSProperties  = {
  background: COLORS.white, border: `1px solid ${COLORS.border}`,
  borderRadius: 10, padding: 16, marginBottom: 12,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};
const row: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
  marginBottom: 12, alignItems: 'start',
};
const fieldLabel: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: COLORS.text,
  paddingTop: 4, lineHeight: 1.5,
};

// ── CA Application Form ───────────────────────────────────────────────────────
export default function CAApplicationForm() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const { user }   = useAuthStore();

  const idParam = params.get('id');

  const [appId, setAppId]       = useState<string | null>(idParam);
  const [step, setStep]         = useState(0);
  const [saving, setSaving]     = useState(false);
  const [formData, setFormData] = useState<CAFormData>(emptyCAFormData);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (idParam) {
      fetchApplication(idParam).then((app) => {
        setAppId(app.id);
        if (app.formData) setFormData(app.formData as unknown as CAFormData);
      }).catch(() => toast.error('Could not load draft'));
    } else {
      fetchMyApplications()
        .then((apps) => {
          const existing = apps.find((a) => a.stage === 'Draft' && a.applicationType === 'CA');
          if (existing) {
            setAppId(existing.id);
            if (existing.formData) setFormData(existing.formData as unknown as CAFormData);
          } else {
            return createDraftApplication('CA', user?.username ?? '').then((app) => setAppId(app.id));
          }
        })
        .catch(() => toast.error('Could not start application'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setField(field: keyof CAFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setStepErrors((p) => { const n = { ...p }; delete n[field as string]; return n; });
  }

  const errMsg = (field: string) =>
    stepErrors[field]
      ? <div style={{ fontSize: 11, color: COLORS.danger, marginTop: 3 }}>{stepErrors[field]}</div>
      : null;

  const eb = (base: React.CSSProperties, field: string): React.CSSProperties =>
    stepErrors[field] ? { ...base, borderColor: COLORS.danger } : base;

  function UB({ value, field }: { value: string; field: keyof CAFormData }) {
    return (
      <div>
        <UploadBox
          value={value}
          onChange={(v) => {
            setFormData((prev) => ({ ...prev, [field]: v }));
            setStepErrors((p) => { const n = { ...p }; delete n[field as string]; return n; });
          }}
          applicationId={appId ?? undefined}
          fieldName={field as string}
        />
        {errMsg(field as string)}
      </div>
    );
  }

  // Inline Yes/No radio group (returns JSX — not a React component)
  function radioGroup(field: keyof CAFormData, currentValue: string) {
    return (
      <div style={{ display: 'flex', gap: 24, paddingTop: 6 }}>
        {(['Yes', 'No'] as const).map((opt) => (
          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, color: COLORS.text }}>
            <input
              type="radio"
              name={field as string}
              value={opt}
              checked={currentValue === opt}
              onChange={() => setField(field, opt)}
              style={{ accentColor: COLORS.primary, width: 15, height: 15 }}
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  async function handleSave() {
    if (!appId) return;
    setSaving(true);
    try {
      await saveDraftApplication(appId, formData as unknown as AppFormData, formData.productName || undefined);
      toast.success('Draft saved');
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!appId) return;
    setSaving(true);
    try {
      await saveDraftApplication(appId, formData as unknown as AppFormData, formData.productName || undefined);
      await submitDraftApplication(appId);
      toast.success('Application submitted! Your reference number has been generated.');
      navigate('/app/dashboard');
    } catch {
      toast.error('Submission failed');
    } finally {
      setSaving(false);
    }
  }

  function validateStep(stepIndex: number): Record<string, string> {
    const errs: Record<string, string> = {};
    const d = formData;

    if (stepIndex === 0) {
      if (!d.applicantName.trim())        errs.applicantName        = 'This field is required';
      if (!d.applicantAddress.trim())     errs.applicantAddress     = 'This field is required';
      if (!d.authorisedSignatory.trim())  errs.authorisedSignatory  = 'This field is required';
      if (!d.authorisedEmail.trim())      errs.authorisedEmail      = 'This field is required';
      if (!d.authorisedContact.trim())    errs.authorisedContact    = 'This field is required';
      if (!d.licenseNumber.trim())        errs.licenseNumber        = 'This field is required';
      if (!d.licenseCopy)                 errs.licenseCopy          = 'License copy is required';
      if (!d.licenseCategory.trim())      errs.licenseCategory      = 'This field is required';
      if (!d.productName.trim())          errs.productName          = 'This field is required';
      if (!d.productComposition.trim())   errs.productComposition   = 'This field is required';
      if (!d.productCategory)             errs.productCategory      = 'Please select a category';
      if (!d.nonSpecifiedCategory)        errs.nonSpecifiedCategory = 'Please select Yes or No';
      if (d.nonSpecifiedCategory === 'Yes' && !d.approvalLetter)
                                          errs.approvalLetter       = 'FSSAI approval letter is required';
    }

    if (stepIndex === 1) {
      if (!d.claimType.trim())            errs.claimType            = 'This field is required';
      if (!d.claimIngredient.trim())      errs.claimIngredient      = 'This field is required';
      if (!d.claimStatement.trim())       errs.claimStatement       = 'This field is required';
      if (!d.claimJustification.trim())   errs.claimJustification   = 'This field is required';
      if (!d.isIPRProtected)              errs.isIPRProtected       = 'Please select Yes or No';
      if (!d.claimFunctionProtected)      errs.claimFunctionProtected = 'Please select Yes or No';
      if (d.claimFunctionProtected === 'Yes') {
        if (!d.iprDetails.trim())         errs.iprDetails           = 'IPR details are required';
        if (!d.iprSupportingDoc)          errs.iprSupportingDoc     = 'IPR supporting document is required';
      }
    }

    if (stepIndex === 2) {
      if (!d.scientificSubstantiation.trim())     errs.scientificSubstantiation     = 'This field is required';
      if (!d.scientificSubstantiationFile)        errs.scientificSubstantiationFile = 'Document is required';
      if (!d.diseaseRiskStudies.trim())           errs.diseaseRiskStudies           = 'This field is required';
      if (!d.diseaseRiskStudiesFile)              errs.diseaseRiskStudiesFile       = 'Document is required';
      if (!d.analysisMethod.trim())               errs.analysisMethod               = 'This field is required';
      if (!d.analysisMethodFile)                  errs.analysisMethodFile           = 'Document is required';
      if (!d.adverseEffects.trim())               errs.adverseEffects               = 'This field is required';
      if (!d.adverseEffectsFile)                  errs.adverseEffectsFile           = 'Document is required';
      if (!d.additionalInfo.trim())               errs.additionalInfo               = 'This field is required';
      if (!d.additionalInfoFile)                  errs.additionalInfoFile           = 'Document is required';
    }

    if (stepIndex === 3) {
      if (!d.paymentReference.trim())             errs.paymentReference             = 'Please enter a transaction reference number';
    }

    return errs;
  }

  function advanceStep() {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) { setStepErrors(errs); return; }
    setStepErrors({});
    setStep(step + 1);
  }

  const d = formData;

  // ── Step content ───────────────────────────────────────────────────────────
  const stepContent = [
    // ── Step 0: Applicant & Product Details ────────────────────────────────
    <div key={0}>
      {/* Applicant Details */}
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Applicant Details</div>
        <div style={row}>
          <label style={fieldLabel}>Name of the Applicant *</label>
          <div>
            <input style={eb(input, 'applicantName')} value={d.applicantName} onChange={(e) => setField('applicantName', e.target.value)} />
            {errMsg('applicantName')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Address of the Applicant *</label>
          <div>
            <textarea style={eb(textarea, 'applicantAddress')} value={d.applicantAddress} onChange={(e) => setField('applicantAddress', e.target.value)} />
            {errMsg('applicantAddress')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>
            Name of the authorised signatory *
            <span style={{ fontWeight: 400, color: COLORS.textMuted, fontSize: 11, display: 'block', marginTop: 2 }}>All communications only via provided email/phone.</span>
          </label>
          <div>
            <input style={eb(input, 'authorisedSignatory')} value={d.authorisedSignatory} onChange={(e) => setField('authorisedSignatory', e.target.value)} />
            {errMsg('authorisedSignatory')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Email of the authorised signatory *</label>
          <div>
            <input type="email" style={eb(input, 'authorisedEmail')} value={d.authorisedEmail} onChange={(e) => setField('authorisedEmail', e.target.value)} />
            {errMsg('authorisedEmail')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Contact number of the authorised signatory *</label>
          <div>
            <input style={eb(input, 'authorisedContact')} value={d.authorisedContact} onChange={(e) => setField('authorisedContact', e.target.value)} />
            {errMsg('authorisedContact')}
          </div>
        </div>
      </div>

      {/* License Info */}
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>License Information</div>
        <div style={row}>
          <label style={fieldLabel}>License Number *</label>
          <div>
            <input style={eb(input, 'licenseNumber')} value={d.licenseNumber} onChange={(e) => setField('licenseNumber', e.target.value)} />
            {errMsg('licenseNumber')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Central/State License — also attach a copy of your license *</label>
          <UB value={d.licenseCopy} field="licenseCopy" />
        </div>
        <div style={row}>
          <label style={fieldLabel}>Nature of license / License Category *</label>
          <div>
            <input style={eb(input, 'licenseCategory')} value={d.licenseCategory} onChange={(e) => setField('licenseCategory', e.target.value)} />
            {errMsg('licenseCategory')}
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Product Information</div>
        <div style={row}>
          <label style={fieldLabel}>Name of the food product *</label>
          <div>
            <input style={eb(input, 'productName')} value={d.productName} onChange={(e) => setField('productName', e.target.value)} />
            {errMsg('productName')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Product Composition *</label>
          <div>
            <textarea style={eb(textarea, 'productComposition')} value={d.productComposition} onChange={(e) => setField('productComposition', e.target.value)} />
            {errMsg('productComposition')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Product Category *</label>
          <div>
            <select style={eb(select, 'productCategory')} value={d.productCategory} onChange={(e) => setField('productCategory', e.target.value)}>
              <option value="">Select a category</option>
              {FOOD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errMsg('productCategory')}
          </div>
        </div>
      </div>

      {/* Regulatory Status */}
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Regulatory Status</div>
        <div style={row}>
          <label style={fieldLabel}>
            Does your ingredient/product fall under Non-specified category? *
            <span style={{ fontWeight: 400, color: COLORS.textMuted, fontSize: 11, display: 'block', marginTop: 2 }}>If yes, please attach copy of approval letter from FSSAI.</span>
          </label>
          <div>
            {radioGroup('nonSpecifiedCategory', d.nonSpecifiedCategory)}
            {errMsg('nonSpecifiedCategory')}
          </div>
        </div>
        {d.nonSpecifiedCategory === 'Yes' && (
          <div style={row}>
            <label style={fieldLabel}>Attach copy of approval letter from FSSAI *</label>
            <UB value={d.approvalLetter} field="approvalLetter" />
          </div>
        )}
      </div>
    </div>,

    // ── Step 1: Claim & IPR Information ────────────────────────────────────
    <div key={1}>
      {/* Claim Details */}
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Claim Details</div>
        <div style={row}>
          <label style={fieldLabel}>Type of Claim(s) required (On product/Ingredient) *</label>
          <div>
            <input style={eb(input, 'claimType')} value={d.claimType} onChange={(e) => setField('claimType', e.target.value)} />
            {errMsg('claimType')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Name of ingredient, nutrient or substance on the basis of which the claim is to be made *</label>
          <div>
            <input style={eb(input, 'claimIngredient')} value={d.claimIngredient} onChange={(e) => setField('claimIngredient', e.target.value)} />
            {errMsg('claimIngredient')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Claim Statement *</label>
          <div>
            <textarea style={eb(textarea, 'claimStatement')} value={d.claimStatement} onChange={(e) => setField('claimStatement', e.target.value)} />
            {errMsg('claimStatement')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Justification for the claim statement (How is the claim clear and meaningful and help consumers to comprehend the information provided?) *</label>
          <div>
            <textarea style={eb(textarea, 'claimJustification')} value={d.claimJustification} onChange={(e) => setField('claimJustification', e.target.value)} />
            {errMsg('claimJustification')}
          </div>
        </div>
      </div>

      {/* IPR Info */}
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>IPR Information</div>
        <div style={row}>
          <label style={fieldLabel}>Is the ingredient/product on which claim is intended to be made protected under Intellectual Property Rights (IPR)/patented? *</label>
          <div>
            {radioGroup('isIPRProtected', d.isIPRProtected)}
            {errMsg('isIPRProtected')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Are any of the claim functions protected by IPR? *</label>
          <div>
            {radioGroup('claimFunctionProtected', d.claimFunctionProtected)}
            {errMsg('claimFunctionProtected')}
          </div>
        </div>
        {d.claimFunctionProtected === 'Yes' && (
          <>
            <div style={row}>
              <label style={fieldLabel}>IPR Details *</label>
              <div>
                <textarea style={eb(textarea, 'iprDetails')} value={d.iprDetails} onChange={(e) => setField('iprDetails', e.target.value)} />
                {errMsg('iprDetails')}
              </div>
            </div>
            <div style={row}>
              <label style={fieldLabel}>IPR Supporting Document *</label>
              <UB value={d.iprSupportingDoc} field="iprSupportingDoc" />
            </div>
          </>
        )}
      </div>
    </div>,

    // ── Step 2: Scientific / Analysis / Safety ─────────────────────────────
    <div key={2}>
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: COLORS.primary }}>Scientific Substantiation *</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8, lineHeight: 1.6 }}>Scientific substantiation supporting documents/material</div>
        <textarea
          style={eb(textarea, 'scientificSubstantiation')}
          placeholder="Describe the scientific substantiation supporting documents / material..."
          value={d.scientificSubstantiation}
          onChange={(e) => setField('scientificSubstantiation', e.target.value)}
        />
        {errMsg('scientificSubstantiation')}
        <div style={{ marginTop: 10 }}>
          <UB value={d.scientificSubstantiationFile} field="scientificSubstantiationFile" />
        </div>
      </div>

      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: COLORS.primary }}>Cause-effect Relationship Studies *</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8, lineHeight: 1.6 }}>
          Cause-effect relationship studies in respect of "reduction of disease risk claims" (Well-designed human intervention studies conducted by or under guidance of established research institutions)
        </div>
        <textarea
          style={eb(textarea, 'diseaseRiskStudies')}
          placeholder="Describe the cause-effect relationship studies..."
          value={d.diseaseRiskStudies}
          onChange={(e) => setField('diseaseRiskStudies', e.target.value)}
        />
        {errMsg('diseaseRiskStudies')}
        <div style={{ marginTop: 10 }}>
          <UB value={d.diseaseRiskStudiesFile} field="diseaseRiskStudiesFile" />
        </div>
      </div>

      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: COLORS.primary }}>Analysis *</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8, lineHeight: 1.6 }}>
          Validated Method of analysis of ingredient or substance for which the claim is to be made
        </div>
        <textarea
          style={eb(textarea, 'analysisMethod')}
          placeholder="Describe the validated method of analysis..."
          value={d.analysisMethod}
          onChange={(e) => setField('analysisMethod', e.target.value)}
        />
        {errMsg('analysisMethod')}
        <div style={{ marginTop: 10 }}>
          <UB value={d.analysisMethodFile} field="analysisMethodFile" />
        </div>
      </div>

      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: COLORS.primary }}>Safety *</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8, lineHeight: 1.6 }}>
          Interaction / Contraindications / Possible Adverse Effects / Warnings / Advisories on the food product
        </div>
        <textarea
          style={eb(textarea, 'adverseEffects')}
          placeholder="Describe interactions, contraindications, possible adverse effects, warnings or advisories..."
          value={d.adverseEffects}
          onChange={(e) => setField('adverseEffects', e.target.value)}
        />
        {errMsg('adverseEffects')}
        <div style={{ marginTop: 10 }}>
          <UB value={d.adverseEffectsFile} field="adverseEffectsFile" />
        </div>
      </div>

      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: COLORS.primary }}>Additional Information *</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>Any other useful information</div>
        <textarea
          style={eb(textarea, 'additionalInfo')}
          placeholder="Any other relevant information..."
          value={d.additionalInfo}
          onChange={(e) => setField('additionalInfo', e.target.value)}
        />
        {errMsg('additionalInfo')}
        <div style={{ marginTop: 10 }}>
          <UB value={d.additionalInfoFile} field="additionalInfoFile" />
        </div>
      </div>
    </div>,

    // ── Step 3: Payment & Submit ────────────────────────────────────────────
    <div key={3} style={secCard}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Payment &amp; Submission</div>

      <div style={{ background: COLORS.primaryLight, border: `1px solid ${COLORS.primary}22`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: COLORS.primary, marginBottom: 8 }}>Fee Summary</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13 }}>CA Application Fee</span>
          <span style={{ fontWeight: 700 }}>{CA_FEE.fee}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13 }}>GST (18%)</span>
          <span style={{ fontWeight: 700 }}>{CA_FEE.gst}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${COLORS.primary}22`, paddingTop: 8, marginTop: 4 }}>
          <span style={{ fontWeight: 700 }}>Total</span>
          <span style={{ fontWeight: 800, fontSize: 16, color: COLORS.primary }}>{CA_FEE.total}</span>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={S.label}>Payment Method</label>
        <select style={select} value={d.paymentMethod} onChange={(e) => setField('paymentMethod', e.target.value)}>
          <option>Online Payment (NEFT/RTGS/UPI)</option>
          <option>Demand Draft</option>
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>Transaction Reference Number *</label>
        <div>
          <input
            style={eb(input, 'paymentReference')}
            placeholder="Enter payment transaction reference"
            value={d.paymentReference}
            onChange={(e) => setField('paymentReference', e.target.value)}
          />
          {errMsg('paymentReference')}
        </div>
      </div>

      <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 6, padding: 12, fontSize: 12, lineHeight: 1.6 }}>
        ℹ️ By submitting this application, I declare that the information provided is true and accurate. I understand that false information may lead to rejection or cancellation of approval.
      </div>
    </div>,
  ];

  const sectionTitles = ['Applicant & Product Details', 'Claim & IPR Information', 'Scientific / Analysis / Safety', 'Payment & Submit'];

  return (
    <div>
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16, paddingLeft: 12, borderLeft: `4px solid ${COLORS.primary}` }}>
        <div style={S.roleLabel}>START NEW APPLICATION</div>
        <div style={S.pageTitle}>Application Form (CA)</div>
        <div style={S.pageDesc}>Claim Approval application. All data is auto-saved on each step.</div>
      </div>

      {/* ── Form card ────────────────────────────────────────────────── */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Stepper steps={STEPS} current={step} />

        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          STEP {step + 1} OF {STEPS.length}
        </div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: COLORS.text }}>
          {sectionTitles[step]}
        </div>

        {/* Validation error summary */}
        {Object.keys(stepErrors).length > 0 && (
          <div style={{ background: COLORS.dangerLight, border: `1px solid #F5C6C6`, borderLeft: `4px solid ${COLORS.danger}`, borderRadius: 7, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: COLORS.danger }}>
            <strong>Please fill in all required fields before continuing.</strong>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: 18 }}>
              {Object.values(stepErrors).map((msg, i) => <li key={i}>{msg}</li>)}
            </ul>
          </div>
        )}

        {stepContent[step]}

        {/* Navigation bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
          <button
            onClick={() => { setStepErrors({}); step > 0 ? setStep(step - 1) : navigate('/app/apply'); }}
            style={{ background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            ← Back
          </button>

          <span style={{ color: COLORS.textMuted, fontSize: 12 }}>{step + 1} / {STEPS.length}</span>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving || !appId}
              style={{ background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? '…' : '💾 Save'}
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={advanceStep}
                style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => {
                  const errs = validateStep(step);
                  if (Object.keys(errs).length > 0) { setStepErrors(errs); return; }
                  handleSubmit();
                }}
                disabled={saving || !appId}
                style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 24px', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Submitting…' : 'Submit Application →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import type React from 'react';
