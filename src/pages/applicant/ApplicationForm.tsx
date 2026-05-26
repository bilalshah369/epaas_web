// Mirrors ApplicationForm from mock (App.jsx L11047). 5-step form wired to real API.
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { COLORS, S } from '@/utils/colors';
import { validatePhone, validateEmail, filterPhone } from '@/utils/validators';
import { scrollToFirstError } from '@/utils/scrollToError';
import Stepper from '@/components/ui/Stepper';
import UploadBox from '@/components/ui/UploadBox';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  emptyFormData, createDraftApplication, fetchApplication,
  fetchMyApplications, saveDraftApplication, submitDraftApplication,
  type AppFormData,
} from '@/services/application.service';

// ── Static options ────────────────────────────────────────────────────────────
const STEPS = ['Application Type', 'General Info', 'Documents', 'Additional Info', 'Submit'];

const APPLICATION_FOR_OPTIONS = [
  'Novel food or novel food ingredients or processed with the use of novel technology',
  'New additives',
  'New processing aids including enzymes',
  'Articles of food and food ingredients consisting of or isolated from microorganisms, bacteria, yeast, fungi, or algae',
  'Any other non-specified food',
];

const FOOD_CATEGORIES = [
  'Dairy & Products', 'Cereals & Pulse Products', 'Bakery Products',
  'Beverages', 'Meat & Poultry', 'Fish & Marine Products', 'Fruits & Vegetables',
  'Fats & Oils', 'Confectionery', 'Health & Nutritional Foods',
  'Herbal & Ayurvedic Products', 'Novel Foods', 'Fortified Foods',
  'Infant Foods', 'Food Additives & Processing Aids', 'Packaging Materials',
];



// ── Shared inline styles ──────────────────────────────────────────────────────
const input: React.CSSProperties = {
  width: '100%', border: `1px solid ${COLORS.border}`, borderRadius: 6,
  padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  fontFamily: "'Noto Sans','Segoe UI',sans-serif",
};
const textarea: React.CSSProperties = {
  ...input, resize: 'vertical', minHeight: 72,
};
const select: React.CSSProperties = {
  ...S.select,
};
const secCard: React.CSSProperties = {
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

// ── Main component ────────────────────────────────────────────────────────────
export default function ApplicationForm() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const { user }   = useAuthStore();

  const typeParam = params.get('type') ?? 'NSF';
  const idParam   = params.get('id');

  const [appId, setAppId]     = useState<string | null>(idParam);
  const [step, setStep]       = useState(0);
  const [saving, setSaving]   = useState(false);
  const [dialog, setDialog]   = useState<{ msg: string; action: () => void } | null>(null);
  const [formData, setFormData] = useState<AppFormData>(emptyFormData);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // Load existing draft or create a new one
  useEffect(() => {
    if (idParam) {
      fetchApplication(idParam).then((app) => {
        setAppId(app.id);
        if (app.formData) setFormData(app.formData as AppFormData);
      }).catch(() => toast.error('Could not load draft'));
    } else {
      // Reuse an existing draft of the same type rather than creating a duplicate
      fetchMyApplications()
        .then((apps) => {
          const existing = apps.find(
            (a) => a.stage === 'Draft' && a.applicationType === typeParam,
          );
          if (existing) {
            setAppId(existing.id);
            if (existing.formData) setFormData(existing.formData as AppFormData);
          } else {
            return createDraftApplication(typeParam, user?.username || 'Draft')
              .then((app) => setAppId(app.id));
          }
        })
        .catch(() => toast.error('Could not start application'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generic field updater
  function set<K extends keyof AppFormData>(stepKey: K, field: keyof AppFormData[K], value: unknown) {
    setFormData((prev) => ({
      ...prev,
      [stepKey]: { ...prev[stepKey], [field]: value },
    }));
  }

  const errMsg = (field: string) =>
    stepErrors[field] ? <div className="form-field-error" style={{ fontSize: 11, color: COLORS.danger, marginTop: 3 }}>{stepErrors[field]}</div> : null;

  const eb = (base: React.CSSProperties, field: string): React.CSSProperties =>
    stepErrors[field] ? { ...base, borderColor: COLORS.danger } : base;

  // UploadBox shorthand — auto-injects applicationId; shows validation error below
  function UB({ value, stepKey, field }: { value: string; stepKey: 'step2' | 'step3' | 'step4'; field: string }) {
    return (
      <div>
        <UploadBox
          value={value}
          onChange={(v) => { set(stepKey, field as never, v); setStepErrors((p) => { const n = { ...p }; delete n[field]; return n; }); }}
          applicationId={appId ?? undefined}
          fieldName={field}
        />
        {errMsg(field)}
      </div>
    );
  }

  async function handleSave() {
    if (!appId) return;
    setSaving(true);
    try {
      await saveDraftApplication(appId, formData, formData.step2.productName || undefined);
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
      await saveDraftApplication(appId, formData, formData.step2.productName || undefined);
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
    const { step1, step2, step3 } = formData;

    if (stepIndex === 0) {
      if (!step1.applicationFor) errs.applicationFor = 'Please select an application type';
      if (step1.applicationFor === APPLICATION_FOR_OPTIONS[4] && !step1.specifyFood.trim())
        errs.specifyFood = 'Please specify the food type';
    }

    if (stepIndex === 1) {
      const reqFields = [
        'applicantName', 'orgName', 'orgAddress',
        'productName', 'justification', 'subCategory', 'genusSp', 'functionalBenefits',
      ] as (keyof typeof step2)[];
      reqFields.forEach((f) => {
        if (!(step2[f] as string).trim()) errs[f as string] = 'This field is required';
      });
      const phoneErr = validatePhone(step2.mobileNo);
      if (phoneErr) errs.mobileNo = phoneErr;
      const emailErr = validateEmail(step2.email);
      if (emailErr) errs.email = emailErr;
      if (!step2.authorisedPerson.trim())
        errs.authorisedPerson = 'This field is required';
      if (!step2.productCategory)
        errs.productCategory = 'Please select a product category';
      if (!step2.endUseDeclaration)
        errs.endUseDeclaration = 'End use declaration document is required';
    }

    if (stepIndex === 2) {
      if (!step3.certOfAnalysis)          errs.certOfAnalysis       = 'Required document';
      if (!step3.manufacturingProcess)    errs.manufacturingProcess  = 'Required document';
      if (!step3.regulatoryStatus.trim()) errs.regulatoryStatus      = 'This field is required';
      if (!step3.regulatoryStatusFile)    errs.regulatoryStatusFile  = 'Required document';
      if (!step3.agreementDoc)            errs.agreementDoc          = 'Required document';
      if (!step3.safetyFile1)             errs.safetyFile1           = 'Required document';
      if (!step3.claimFile1)              errs.claimFile1            = 'Required document';
      if (!step3.prototypeLabel)              errs.prototypeLabel       = 'Required document';
      if (step3.postMarketingDecl !== true)   errs.postMarketingDecl    = 'Please accept this declaration';
      if (step3.confidentialityDecl !== true) errs.confidentialityDecl  = 'Please accept this declaration';
    }

    if (stepIndex === 3) {
      const { step4 } = formData;
      if (step1.applicationFor === APPLICATION_FOR_OPTIONS[0]) {
        if (step4.humanStudies === 'Available' && !step4.humanStudiesFile)
          errs.humanStudiesFile = 'Document required when studies are Available';
        if (step4.toxicologyStudies === 'Available' && !step4.toxicologyStudiesFile)
          errs.toxicologyStudiesFile = 'Document required when studies are Available';
      }
      if (step1.applicationFor === APPLICATION_FOR_OPTIONS[1]) {
        (['chemicalName', 'purity', 'adi', 'proposedLevel'] as (keyof typeof step4)[]).forEach((f) => {
          if (!(step4[f] as string).trim()) errs[f as string] = 'This field is required';
        });
      }
      if (step1.applicationFor === APPLICATION_FOR_OPTIONS[2]) {
        if (!step4.specificationDoc) errs.specificationDoc = 'Required document';
        if (!step4.enzymeActivity)   errs.enzymeActivity   = 'Required document';
        if (!step4.enzymePurity)     errs.enzymePurity     = 'Required document';
        if (!step4.residualLimit)    errs.residualLimit    = 'Required document';
      }
      if (step1.applicationFor === APPLICATION_FOR_OPTIONS[3]) {
        if (!step4.microTemplate) errs.microTemplate = 'Required document';
      }
      if (step1.applicationFor === APPLICATION_FOR_OPTIONS[4]) {
        if (!step4.anyOtherDoc) errs.anyOtherDoc = 'Required document';
      }
    }

    return errs;
  }

  function advanceStep() {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) { setStepErrors(errs); scrollToFirstError(); return; }
    setStepErrors({});
    setStep(step + 1);
  }

  const { step1, step2, step3, step4 } = formData;

  // ── Step content ───────────────────────────────────────────────────────────
  const stepContent = [
    // ── Step 0: Application Type ────────────────────────────────────────────
    <div key={0}>
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Application Type *</div>
        <div style={row}>
          <label style={fieldLabel}>Application For *</label>
          <div>
            <select style={eb(select, 'applicationFor')} value={step1.applicationFor} onChange={(e) => { set('step1', 'applicationFor', e.target.value); setStepErrors((p) => { const n = { ...p }; delete n.applicationFor; return n; }); }}>
              <option value="">Select one</option>
              {APPLICATION_FOR_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {errMsg('applicationFor')}
          </div>
        </div>
        {step1.applicationFor === APPLICATION_FOR_OPTIONS[4] && (
          <div style={row}>
            <label style={fieldLabel}>Please specify <span style={{ fontWeight: 400, color: COLORS.textMuted, fontSize: 11 }}>(if "Any other non-specified food" is selected)</span></label>
            <div>
              <input style={eb(input, 'specifyFood')} placeholder="Specify the food type" value={step1.specifyFood} onChange={(e) => { set('step1', 'specifyFood', e.target.value); setStepErrors((p) => { const n = { ...p }; delete n.specifyFood; return n; }); }} />
              {errMsg('specifyFood')}
            </div>
          </div>
        )}
      </div>
    </div>,

    // ── Step 1: General Information ─────────────────────────────────────────
    <div key={1} style={secCard}>
      {([
        ['applicantName',         'Name of applicant *',                                                                                                              'input',    ''],
        ['authorisedPerson',      'Name of the authorised person *',                                                                                                  'input',    ''],
        ['mobileNo',              'Mobile No. / Phone No. *',                                                                                                         'input',    '(+91) or (0)/(STD Code)'],
        ['email',                 'Email (All communications will only be made through the above email and phone number) *',                                           'input',    'contact@company.com'],
        ['orgName',               'Name of the organisation *',                                                                                                       'input',    ''],
        ['orgAddress',            'Address of the organisation / registered office *',                                                                                'textarea', ''],
        ['licenseNumber',         'Licence number, if any',                                                                                                           'input',    ''],
        ['mfgAddress',            'Name, address and contact details of the premises where the product covered in the application is manufactured or processed',   'textarea', ''],
        ['natureOfBusiness',      'Nature of business *',                                                                                                             'select',   ['Manufacturer', 'Importer', 'Marketer', 'Other']],
        ['productName',           'Name of the product for which application is submitted *',                                                                         'input',    ''],
        ['justification',         'Justification of the name *',                                                                                                      'textarea', ''],
        ['productCategory',       'Proposed product category *',                                                                                                      'select',   FOOD_CATEGORIES],
        ['subCategory',           'Sub-Category *',                                                                                                                   'input',    ''],
        ['source',                'Source of food ingredient(s) (animal, chemical, botanical or micro-biological) *',                                                 'select',   ['Animal', 'Chemical', 'Botanical', 'Micro-biological']],
        ['genusSp',               'In case of animal, botanical or micro-biological source, genus and species of the organism shall be mentioned *',                  'input',    ''],
        ['functionalBenefits',    'Functional benefits *',                                                                                                            'textarea', ''],
        ['healthBenefits',        'Health benefits claimed for the product and on the label, if applicable',                                                          'textarea', ''],
      ] as Array<[keyof typeof step2, string, string, string | string[]]>).map(([field, label, type, placeholder]) => (
        <div key={field} style={row}>
          <label style={fieldLabel}>{label}</label>
          <div>
            {type === 'textarea' ? (
              <textarea
                style={eb(textarea, field as string)}
                value={step2[field] as string}
                onChange={(e) => { set('step2', field, e.target.value); setStepErrors((p) => { const n = { ...p }; delete n[field as string]; return n; }); }}
              />
            ) : type === 'select' ? (
              <select
                style={eb(select, field as string)}
                value={step2[field] as string}
                onChange={(e) => { set('step2', field, e.target.value); setStepErrors((p) => { const n = { ...p }; delete n[field as string]; return n; }); }}
              >
                {!(step2[field] as string) && <option value="" disabled>— Select —</option>}
                {(placeholder as string[]).map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                style={eb(input, field as string)}
                placeholder={placeholder as string}
                value={step2[field] as string}
                inputMode={field === 'mobileNo' ? 'numeric' : undefined}
                maxLength={field === 'mobileNo' ? 10 : undefined}
                onChange={(e) => {
                  const val = field === 'mobileNo' ? filterPhone(e.target.value) : e.target.value;
                  set('step2', field, val);
                  setStepErrors((p) => { const n = { ...p }; delete n[field as string]; return n; });
                }}
              />
            )}
            {errMsg(field as string)}
          </div>
        </div>
      ))}
      {/* 15.2 End use declaration */}
      <div style={row}>
        <label style={fieldLabel}>End use declaration for product / pre-mix / ingredient / additive imported or manufactured for supply to other Food Business Operators *</label>
        <div>
          <UB value={step2.endUseDeclaration} stepKey="step2" field="endUseDeclaration" />
          {errMsg('endUseDeclaration')}
        </div>
      </div>
    </div>,

    // ── Step 2: Documents & Regulatory ─────────────────────────────────────
    <div key={2}>
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Certificate of Analysis from NABL / ILAC / Accredited Laboratories *</div>
        <UB value={step3.certOfAnalysis} stepKey="step3" field="certOfAnalysis" />
      </div>

      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Manufacturing Process in Brief — Flow Sheet with Complete Details *</div>
        <UB value={step3.manufacturingProcess} stepKey="step3" field="manufacturingProcess" />
      </div>

      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Regulatory Status *</div>
        <div style={row}>
          <label style={fieldLabel}>Regulatory Status (text) *</label>
          <div>
            <input style={eb(input, 'regulatoryStatus')} placeholder="Enter regulatory status details" value={step3.regulatoryStatus} onChange={(e) => { set('step3', 'regulatoryStatus', e.target.value); setStepErrors((p) => { const n = { ...p }; delete n.regulatoryStatus; return n; }); }} />
            {errMsg('regulatoryStatus')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Regulatory Status (file upload) *</label>
          <UB value={step3.regulatoryStatusFile} stepKey="step3" field="regulatoryStatusFile" />
        </div>
      </div>

      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Copy of Agreement of Relationship *</div>
        <div style={row}>
          <label style={fieldLabel}>Relationship Type *</label>
          <select style={select} value={step3.relationshipType} onChange={(e) => set('step3', 'relationshipType', e.target.value)}>
            {['Brand Owner', 'Importer', 'Marketer', 'Repacker', 'Supplier', 'Trader'].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Agreement Document *</label>
          <UB value={step3.agreementDoc} stepKey="step3" field="agreementDoc" />
        </div>
      </div>

      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Safety Information (Documentation on risk assessment or toxicity studies) *</div>
        <div style={{ marginBottom: 8 }}>
          <button style={{ background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>⬇️ Download Soft Copy Annexure A</button>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Safety Information — File 1 *</label>
          <UB value={step3.safetyFile1} stepKey="step3" field="safetyFile1" />
        </div>
        <div style={row}>
          <label style={fieldLabel}>Safety Information — File 2</label>
          <UB value={step3.safetyFile2} stepKey="step3" field="safetyFile2" />
        </div>
      </div>

      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Claim Support Documentation *</div>
        <div style={{ marginBottom: 8 }}>
          <button style={{ background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>⬇️ Download Template</button>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Claim Support — File 1 *</label>
          <UB value={step3.claimFile1} stepKey="step3" field="claimFile1" />
        </div>
        <div style={row}>
          <label style={fieldLabel}>Claim Support — File 2</label>
          <UB value={step3.claimFile2} stepKey="step3" field="claimFile2" />
        </div>
      </div>

      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Declarations & Compliance Documents</div>
        <div style={row}>
          <label style={fieldLabel}>Copy of Proposed Product Prototype Label (as per relevant FSS Regulations) *</label>
          <UB value={step3.prototypeLabel} stepKey="step3" field="prototypeLabel" />
        </div>
        <div style={{ ...row, alignItems: 'flex-start' }}>
          <label style={fieldLabel}>Declarations *</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: COLORS.text, lineHeight: 1.55 }}>
              <input
                type="checkbox"
                checked={step3.postMarketingDecl === true}
                onChange={(e) => { set('step3', 'postMarketingDecl', e.target.checked); setStepErrors((p) => { const n = { ...p }; delete n.postMarketingDecl; return n; }); }}
                style={{ marginTop: 2, accentColor: COLORS.primary, width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
              />
              I/We agree to conduct Post Market Surveillance (PMS) within one year of placing the product in the market (or as directed by FSSAI) under Form II requirements, and undertake to comply with all FSSAI stipulations for the approved product. <span style={{ color: COLORS.danger }}>*</span>
            </label>
            {errMsg('postMarketingDecl')}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: COLORS.text, lineHeight: 1.55 }}>
              <input
                type="checkbox"
                checked={step3.confidentialityDecl === true}
                onChange={(e) => { set('step3', 'confidentialityDecl', e.target.checked); setStepErrors((p) => { const n = { ...p }; delete n.confidentialityDecl; return n; }); }}
                style={{ marginTop: 2, accentColor: COLORS.primary, width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
              />
              I/We request strict confidentiality for this application and all submitted data. It must not be shared with any third parties or disclosed under the RTI Act, except where mandated by applicable law or a competent authority. <span style={{ color: COLORS.danger }}>*</span>
            </label>
            {errMsg('confidentialityDecl')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>GST No.</label>
          <div>
            <input style={input} placeholder="Enter GST number (optional)" value={step3.gstNo} onChange={(e) => set('step3', 'gstNo', e.target.value)} />
          </div>
        </div>
      </div>
    </div>,

    // ── Step 3: Additional Specific Information (conditional per applicationFor) ─
    <div key={3}>
      <div style={{ background: COLORS.primaryLight, border: `1px solid ${COLORS.primary}22`, borderRadius: 8, padding: 12, fontSize: 12, color: COLORS.primary, marginBottom: 12 }}>
        ℹ️ Only the section matching your Application Type (selected in Step 1) is shown.
      </div>

      {!step1.applicationFor && (
        <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 24, textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>
          Please select an Application Type in Step 1 to see the relevant section.
        </div>
      )}

      {/* Section A: Novel food */}
      {step1.applicationFor === APPLICATION_FOR_OPTIONS[0] && (
        <div style={secCard}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>a) Novel Food / Novel Food Ingredients / Food processed with Novel Technology</div>
          <div style={row}>
            <label style={fieldLabel}>i. The target group for the said proposed food, if any</label>
            <input style={input} value={step4.targetGroup} onChange={(e) => set('step4', 'targetGroup', e.target.value)} />
          </div>
          <div style={row}>
            <label style={fieldLabel}>ii. Detailed composition of the product (with quantity of the ingredients and additives added in the product)</label>
            <textarea style={textarea} value={step4.composition} onChange={(e) => set('step4', 'composition', e.target.value)} />
          </div>
          <div style={row}>
            <label style={fieldLabel}>iii. Details of new technology</label>
            <textarea style={textarea} value={step4.newTechnology} onChange={(e) => set('step4', 'newTechnology', e.target.value)} />
          </div>
          <div style={row}>
            <label style={fieldLabel}>iv. Safety Information (Documents on risk assessment or toxicity studies to be attached)</label>
            <div>
              <select style={{ ...select, marginBottom: 8 }} value={step4.humanStudies} onChange={(e) => set('step4', 'humanStudies', e.target.value)}>
                <option value="">Select</option>
                <option>Available</option>
                <option>Not Available</option>
                <option>In Progress</option>
              </select>
              <UB value={step4.humanStudiesFile} stepKey="step4" field="humanStudiesFile" />
              {errMsg('humanStudiesFile')}
            </div>
          </div>
          <div style={row}>
            <label style={fieldLabel}>v. History of consumption of food product / food ingredient (attach supporting documents)</label>
            <div>
              <select style={{ ...select, marginBottom: 8 }} value={step4.toxicologyStudies} onChange={(e) => set('step4', 'toxicologyStudies', e.target.value)}>
                <option value="">Select</option>
                <option>Available</option>
                <option>Not Available</option>
                <option>In Progress</option>
              </select>
              <UB value={step4.toxicologyStudiesFile} stepKey="step4" field="toxicologyStudiesFile" />
              {errMsg('toxicologyStudiesFile')}
            </div>
          </div>
        </div>
      )}

      {/* Section B: New additives */}
      {step1.applicationFor === APPLICATION_FOR_OPTIONS[1] && (
        <div style={secCard}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>b) New Additives</div>
          {([
            ['chemicalName',  'i. Chemical name and INS No. *'],
            ['purity',        'ii. Purity (food grade or equivalent) *'],
            ['adi',           'iii. Acceptable Daily Intake specified by Joint Food and Agriculture Organization / World Health Organization Expert Committee on Food Additives or any other risk assessment body *'],
            ['proposedLevel', 'iv. Proposed level of use in food category *'],
            ['colorIndex',    'v. In case of colouring agent provide (Colour Index) colour number, where applicable'],
          ] as [keyof typeof step4, string][]).map(([field, label]) => (
            <div key={field} style={row}>
              <label style={fieldLabel}>{label}</label>
              <div>
                <input style={eb(input, field as string)} value={step4[field] as string} onChange={(e) => { set('step4', field, e.target.value); setStepErrors((p) => { const n = { ...p }; delete n[field as string]; return n; }); }} />
                {errMsg(field as string)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section C: New processing aids */}
      {step1.applicationFor === APPLICATION_FOR_OPTIONS[2] && (
        <div style={secCard}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>c) New Processing Aids including Enzymes</div>
          <div style={row}>
            <label style={fieldLabel}>i. Specification *</label>
            <div><UB value={step4.specificationDoc} stepKey="step4" field="specificationDoc" />{errMsg('specificationDoc')}</div>
          </div>
          <div style={row}>
            <label style={fieldLabel}>ii. Enzyme activity *</label>
            <div><UB value={step4.enzymeActivity} stepKey="step4" field="enzymeActivity" />{errMsg('enzymeActivity')}</div>
          </div>
          <div style={row}>
            <label style={fieldLabel}>iii. Purity including total organic acid (as per the standards) *</label>
            <div><UB value={step4.enzymePurity} stepKey="step4" field="enzymePurity" />{errMsg('enzymePurity')}</div>
          </div>
          <div style={row}>
            <label style={fieldLabel}>iv. Residual limit in the final product (in case of processing aid) *</label>
            <div><UB value={step4.residualLimit} stepKey="step4" field="residualLimit" />{errMsg('residualLimit')}</div>
          </div>
        </div>
      )}

      {/* Section D: Microorganisms */}
      {step1.applicationFor === APPLICATION_FOR_OPTIONS[3] && (
        <div style={secCard}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>d) Articles of Food / Ingredients from Microorganisms / Bacteria / Yeast / Fungi / Algae</div>
          <div style={{ marginBottom: 8 }}>
            <button style={{ background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>⬇️ Download Template</button>
          </div>
          <div style={row}>
            <label style={fieldLabel}>Upload completed template *</label>
            <div><UB value={step4.microTemplate} stepKey="step4" field="microTemplate" />{errMsg('microTemplate')}</div>
          </div>
        </div>
      )}

      {/* Section E: Any other */}
      {step1.applicationFor === APPLICATION_FOR_OPTIONS[4] && (
        <div style={secCard}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>e) Any Other Non-Specified Food</div>
          <div style={row}>
            <label style={fieldLabel}>Upload *</label>
            <div><UB value={step4.anyOtherDoc} stepKey="step4" field="anyOtherDoc" />{errMsg('anyOtherDoc')}</div>
          </div>
        </div>
      )}
    </div>,

    // ── Step 4: Review & Submit ─────────────────────────────────────────────
    <div key={4} style={secCard}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Review &amp; Submission</div>

      <div style={{ background: COLORS.primaryLight, border: `1px solid ${COLORS.primary}33`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: COLORS.primary, marginBottom: 6 }}>Application Fee</div>
        <div style={{ fontSize: 13, color: COLORS.text }}>
          This application type has <strong>no fee</strong>. You may submit directly.
        </div>
      </div>

      <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 6, padding: 12, fontSize: 12, lineHeight: 1.6 }}>
        ℹ️ By submitting this application, I declare that the information provided is true and accurate. I understand that false information may lead to rejection or cancellation of approval.
      </div>
    </div>,
  ];

  const sectionTitles = ['Application Type', 'General Information', 'Documents & Regulatory', 'Additional Specific Information', 'Review & Submit'];

  return (
    <div>
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16, paddingLeft: 12, borderLeft: `4px solid ${COLORS.primary}` }}>
        <div style={S.roleLabel}>START NEW APPLICATION</div>
        <div style={S.pageTitle}>Application Form ({typeParam})</div>
        <div style={S.pageDesc}>Stage-driven workspace for Draft Submission. All data is auto-saved on each step.</div>
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

        {/* Step content */}
        {stepContent[step]}

        {/* Navigation bar */}
        <div style={{ position: 'sticky', bottom: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '12px 20px', borderTop: `1px solid ${COLORS.border}`, background: '#fff', boxShadow: '0 -2px 12px rgba(0,0,0,0.06)' }}>
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
                  setDialog({ msg: 'Are you sure you want to submit this application? This action cannot be undone.', action: handleSubmit });
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
      {dialog && <ConfirmDialog message={dialog.msg} onConfirm={() => { setDialog(null); dialog.action(); }} onCancel={() => setDialog(null)} />}
    </div>
  );
}

import type React from 'react';
