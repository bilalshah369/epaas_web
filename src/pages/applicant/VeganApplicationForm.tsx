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
  createDraftApplication, fetchApplication,
  fetchMyApplications, saveDraftApplication, submitDraftApplication,
  type AppFormData,
} from '@/services/application.service';
import { openRazorpayCheckout, getPayment } from '@/services/payment.service';

// ── Constants ─────────────────────────────────────────────────────────────────
const STEPS = ['Applicant Details', 'Manufacturing Facility', 'Product Details', 'Certification', 'Declaration & Payment'];

const FOOD_CATEGORIES = [
  'Dairy & Products', 'Cereals & Pulse Products', 'Bakery Products',
  'Beverages', 'Meat & Poultry', 'Fish & Marine Products', 'Fruits & Vegetables',
  'Fats & Oils', 'Confectionery', 'Health & Nutritional Foods',
  'Herbal & Ayurvedic Products', 'Novel Foods', 'Fortified Foods',
  'Infant Foods', 'Food Additives & Processing Aids', 'Packaging Materials',
];

const VEGAN_FEE = { fee: '₹10,000', gst: '₹1,800', total: '₹11,800' };

// ── Vegan flat form data ──────────────────────────────────────────────────────
interface VeganFormData {
  // Step 0 — Applicant Details (Part A-i)
  fboName:              string;
  fboAddress:           string;
  licenseNo:            string;
  authorisedPerson:     string;
  authorisedContact:    string;
  authorisedEmail:      string;

  // Step 1 — Manufacturing Facility (Part A-ii)
  mfgFboName:           string;
  mfgAddress:           string;
  mfgLicenseNo:         string;
  mfgAuthorisedPerson:  string;
  mfgContact:           string;
  mfgEmail:             string;

  // Step 2 — Product Details (Part B)
  productName:          string;
  foodCategory:         string;
  ingredients:          string;
  sourceDoc:            string;
  manufacturingProcess: string;
  coaFile:              string;
  domesticImported:     string;
  existingLabel:        string;
  prototypeLabel:       string;
  finalCoaFile:         string;

  // Step 3 — Third Party Certification (Part B cont.)
  thirdPartyCoA1:       string;
  thirdPartyCoA2:       string;
  isThirdPartyCertified:string;
  certifyingBody:       string;
  certificationDoc:     string;
  certificationValidity:string;

  // Step 4 — Declaration & Payment
  annexureDFile:        string;
  paymentMethod:        string;
  paymentReference:     string;
}

function emptyVeganFormData(): VeganFormData {
  return {
    fboName: '', fboAddress: '', licenseNo: '', authorisedPerson: '',
    authorisedContact: '', authorisedEmail: '',
    mfgFboName: '', mfgAddress: '', mfgLicenseNo: '', mfgAuthorisedPerson: '',
    mfgContact: '', mfgEmail: '',
    productName: '', foodCategory: '', ingredients: '',
    sourceDoc: '', manufacturingProcess: '', coaFile: '',
    domesticImported: '', existingLabel: '', prototypeLabel: '', finalCoaFile: '',
    thirdPartyCoA1: '', thirdPartyCoA2: '',
    isThirdPartyCertified: '', certifyingBody: '', certificationDoc: '', certificationValidity: '',
    annexureDFile: '', paymentMethod: 'Online Payment (NEFT/RTGS/UPI)', paymentReference: '',
  };
}

// ── Inline styles ─────────────────────────────────────────────────────────────
const input: React.CSSProperties = {
  width: '100%', border: `1px solid ${COLORS.border}`, borderRadius: 6,
  padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  fontFamily: "'Noto Sans','Segoe UI',sans-serif",
};
const textarea: React.CSSProperties = { ...input, resize: 'vertical', minHeight: 80 };
const select: React.CSSProperties   = { ...S.select };
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

// ── Vegan Application Form ────────────────────────────────────────────────────
export default function VeganApplicationForm() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const { user }   = useAuthStore();

  const idParam = params.get('id');

  const [appId, setAppId]       = useState<string | null>(idParam);
  const [step, setStep]         = useState(0);
  const [saving, setSaving]     = useState(false);
  const [dialog, setDialog]     = useState<{ msg: string; action: () => void } | null>(null);
  const [formData, setFormData] = useState<VeganFormData>(emptyVeganFormData);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [paymentDone, setPaymentDone] = useState(false);
  const [invoiceNo, setInvoiceNo]     = useState<string | null>(null);
  const [payPending, setPayPending]   = useState(false);

  useEffect(() => {
    const loadPayment = (id: string) =>
      getPayment(id).then((p) => {
        if (p?.status === 'Completed') { setPaymentDone(true); setInvoiceNo(p.invoiceNo); }
      }).catch(() => {});

    if (idParam) {
      fetchApplication(idParam).then((app) => {
        setAppId(app.id);
        if (app.formData) setFormData(app.formData as unknown as VeganFormData);
        loadPayment(app.id);
      }).catch(() => toast.error('Could not load draft'));
    } else {
      fetchMyApplications()
        .then((apps) => {
          const existing = apps.find((a) => a.stage === 'Draft' && a.applicationType === 'Vegan');
          if (existing) {
            setAppId(existing.id);
            if (existing.formData) setFormData(existing.formData as unknown as VeganFormData);
            loadPayment(existing.id);
          } else {
            return createDraftApplication('Vegan', user?.username || 'Draft').then((app) => setAppId(app.id));
          }
        })
        .catch(() => toast.error('Could not start application'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setField(field: keyof VeganFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setStepErrors((p) => { const n = { ...p }; delete n[field as string]; return n; });
  }

  const errMsg = (field: string) =>
    stepErrors[field]
      ? <div style={{ fontSize: 11, color: COLORS.danger, marginTop: 3 }}>{stepErrors[field]}</div>
      : null;

  const eb = (base: React.CSSProperties, field: string): React.CSSProperties =>
    stepErrors[field] ? { ...base, borderColor: COLORS.danger } : base;

  function UB({ value, field }: { value: string; field: keyof VeganFormData }) {
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

  function radioGroup(field: keyof VeganFormData, currentValue: string) {
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
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Submission failed');
    } finally {
      setSaving(false);
    }
  }

  function validateStep(stepIndex: number): Record<string, string> {
    const errs: Record<string, string> = {};
    const d = formData;

    if (stepIndex === 0) {
      if (!d.fboName.trim())           errs.fboName           = 'This field is required';
      if (!d.fboAddress.trim())        errs.fboAddress        = 'This field is required';
      if (!d.licenseNo.trim())         errs.licenseNo         = 'This field is required';
      if (!d.authorisedPerson.trim())  errs.authorisedPerson  = 'This field is required';
      const phoneErr = validatePhone(d.authorisedContact);
      if (phoneErr) errs.authorisedContact = phoneErr;
      const emailErr = validateEmail(d.authorisedEmail);
      if (emailErr) errs.authorisedEmail = emailErr;
    }

    if (stepIndex === 1) {
      if (!d.mfgFboName.trim())           errs.mfgFboName           = 'This field is required';
      if (!d.mfgAddress.trim())           errs.mfgAddress           = 'This field is required';
      if (!d.mfgLicenseNo.trim())         errs.mfgLicenseNo         = 'This field is required';
      if (!d.mfgAuthorisedPerson.trim())  errs.mfgAuthorisedPerson  = 'This field is required';
      const phoneErr = validatePhone(d.mfgContact);
      if (phoneErr) errs.mfgContact = phoneErr;
      const emailErr = validateEmail(d.mfgEmail);
      if (emailErr) errs.mfgEmail = emailErr;
    }

    if (stepIndex === 2) {
      if (!d.productName.trim())          errs.productName          = 'This field is required';
      if (!d.foodCategory)                errs.foodCategory         = 'Please select a category';
      if (!d.ingredients.trim())          errs.ingredients          = 'This field is required';
      if (!d.sourceDoc)                   errs.sourceDoc            = 'Document is required';
      if (!d.manufacturingProcess)        errs.manufacturingProcess = 'Document is required';
      if (!d.coaFile)                     errs.coaFile              = 'Document is required';
      if (!d.domesticImported)            errs.domesticImported     = 'Please select an option';
      if (!d.prototypeLabel)              errs.prototypeLabel       = 'Document is required';
      if (!d.finalCoaFile)                errs.finalCoaFile         = 'Document is required';
    }

    if (stepIndex === 3) {
      if (!d.thirdPartyCoA1)                errs.thirdPartyCoA1       = 'Document is required';
      if (!d.isThirdPartyCertified)         errs.isThirdPartyCertified = 'Please select Yes or No';
      if (d.isThirdPartyCertified === 'Yes') {
        if (!d.certifyingBody.trim())       errs.certifyingBody       = 'This field is required';
        if (!d.certificationDoc)            errs.certificationDoc     = 'Document is required';
        if (!d.certificationValidity.trim()) errs.certificationValidity = 'This field is required';
      }
    }

    if (stepIndex === 4) {
      if (!d.annexureDFile)  errs.annexureDFile = 'Signed Annexure D is required';
      if (!paymentDone)      errs.payment       = 'Please complete the payment before submitting';
    }

    return errs;
  }

  function advanceStep() {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) { setStepErrors(errs); scrollToFirstError(); return; }
    setStepErrors({});
    setStep(step + 1);
  }

  const d = formData;

  // ── Step content ───────────────────────────────────────────────────────────
  const stepContent = [
    // ── Step 0: Applicant Details (Part A-i) ──────────────────────────────
    <div key={0}>
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Part A-i: Details of the Food Business Operator (Applicant)</div>
        <div style={row}>
          <label style={fieldLabel}>Name of the FBO *</label>
          <div>
            <input style={eb(input, 'fboName')} value={d.fboName} onChange={(e) => setField('fboName', e.target.value)} />
            {errMsg('fboName')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Address of the FBO *</label>
          <div>
            <textarea style={eb(textarea, 'fboAddress')} value={d.fboAddress} onChange={(e) => setField('fboAddress', e.target.value)} />
            {errMsg('fboAddress')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>FSSAI License / Registration No. *</label>
          <div>
            <input style={eb(input, 'licenseNo')} value={d.licenseNo} onChange={(e) => setField('licenseNo', e.target.value)} />
            {errMsg('licenseNo')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Name of Authorised Person *</label>
          <div>
            <input style={eb(input, 'authorisedPerson')} value={d.authorisedPerson} onChange={(e) => setField('authorisedPerson', e.target.value)} />
            {errMsg('authorisedPerson')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Contact Number *</label>
          <div>
            <input style={eb(input, 'authorisedContact')} value={d.authorisedContact} placeholder="10-digit mobile number" inputMode="numeric" maxLength={10} onChange={(e) => setField('authorisedContact', filterPhone(e.target.value))} />
            {errMsg('authorisedContact')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Email *</label>
          <div>
            <input style={eb(input, 'authorisedEmail')} value={d.authorisedEmail} placeholder="officer@example.com" onChange={(e) => setField('authorisedEmail', e.target.value)} />
            {errMsg('authorisedEmail')}
          </div>
        </div>
      </div>
    </div>,

    // ── Step 1: Manufacturing Facility (Part A-ii) ─────────────────────────
    <div key={1}>
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Part A-ii: Details of the Manufacturing Facility</div>
        <div style={row}>
          <label style={fieldLabel}>Name of the FBO (Manufacturer) *</label>
          <div>
            <input style={eb(input, 'mfgFboName')} value={d.mfgFboName} onChange={(e) => setField('mfgFboName', e.target.value)} />
            {errMsg('mfgFboName')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Address of Manufacturing Facility *</label>
          <div>
            <textarea style={eb(textarea, 'mfgAddress')} value={d.mfgAddress} onChange={(e) => setField('mfgAddress', e.target.value)} />
            {errMsg('mfgAddress')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>FSSAI License / Registration No. *</label>
          <div>
            <input style={eb(input, 'mfgLicenseNo')} value={d.mfgLicenseNo} onChange={(e) => setField('mfgLicenseNo', e.target.value)} />
            {errMsg('mfgLicenseNo')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Name of Authorised Person *</label>
          <div>
            <input style={eb(input, 'mfgAuthorisedPerson')} value={d.mfgAuthorisedPerson} onChange={(e) => setField('mfgAuthorisedPerson', e.target.value)} />
            {errMsg('mfgAuthorisedPerson')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Contact Number *</label>
          <div>
            <input style={eb(input, 'mfgContact')} value={d.mfgContact} placeholder="10-digit mobile number" inputMode="numeric" maxLength={10} onChange={(e) => setField('mfgContact', filterPhone(e.target.value))} />
            {errMsg('mfgContact')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Email *</label>
          <div>
            <input style={eb(input, 'mfgEmail')} value={d.mfgEmail} placeholder="officer@example.com" onChange={(e) => setField('mfgEmail', e.target.value)} />
            {errMsg('mfgEmail')}
          </div>
        </div>
      </div>
    </div>,

    // ── Step 2: Product Details (Part B) ───────────────────────────────────
    <div key={2}>
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Part B: Product Details</div>
        <div style={row}>
          <label style={fieldLabel}>Name of the Product *</label>
          <div>
            <input style={eb(input, 'productName')} value={d.productName} onChange={(e) => setField('productName', e.target.value)} />
            {errMsg('productName')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Food Category *</label>
          <div>
            <select style={eb(select, 'foodCategory')} value={d.foodCategory} onChange={(e) => setField('foodCategory', e.target.value)}>
              <option value="">Select a category</option>
              {FOOD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errMsg('foodCategory')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>List of Ingredients (with quantity) *</label>
          <div>
            <textarea style={eb(textarea, 'ingredients')} value={d.ingredients} placeholder="List each ingredient with quantity/percentage" onChange={(e) => setField('ingredients', e.target.value)} />
            {errMsg('ingredients')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Source / Origin of Ingredients *<span style={{ fontWeight: 400, color: COLORS.textMuted, fontSize: 11, display: 'block', marginTop: 2 }}>Upload supporting document</span></label>
          <UB value={d.sourceDoc} field="sourceDoc" />
        </div>
        <div style={row}>
          <label style={fieldLabel}>Manufacturing Process *<span style={{ fontWeight: 400, color: COLORS.textMuted, fontSize: 11, display: 'block', marginTop: 2 }}>Flow chart / SOP document</span></label>
          <UB value={d.manufacturingProcess} field="manufacturingProcess" />
        </div>
        <div style={row}>
          <label style={fieldLabel}>Certificate of Analysis (CoA) — Ingredients *</label>
          <UB value={d.coaFile} field="coaFile" />
        </div>
        <div style={row}>
          <label style={fieldLabel}>Product Origin *</label>
          <div>
            <select style={eb(select, 'domesticImported')} value={d.domesticImported} onChange={(e) => setField('domesticImported', e.target.value)}>
              <option value="">Select</option>
              <option value="Domestic">Domestic</option>
              <option value="Imported">Imported</option>
            </select>
            {errMsg('domesticImported')}
          </div>
        </div>
        {d.domesticImported === 'Imported' && (
          <div style={row}>
            <label style={fieldLabel}>Existing Label (for imported products)</label>
            <UB value={d.existingLabel} field="existingLabel" />
          </div>
        )}
        <div style={row}>
          <label style={fieldLabel}>Prototype Label *<span style={{ fontWeight: 400, color: COLORS.textMuted, fontSize: 11, display: 'block', marginTop: 2 }}>Draft label with all FSSAI-required declarations</span></label>
          <UB value={d.prototypeLabel} field="prototypeLabel" />
        </div>
        <div style={row}>
          <label style={fieldLabel}>Certificate of Analysis (CoA) — Final Product *</label>
          <UB value={d.finalCoaFile} field="finalCoaFile" />
        </div>
      </div>
    </div>,

    // ── Step 3: Third Party Certification ─────────────────────────────────
    <div key={3}>
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Third Party Certification Details</div>
        <div style={row}>
          <label style={fieldLabel}>Certificate of Analysis (CoA) — Copy 1 *</label>
          <UB value={d.thirdPartyCoA1} field="thirdPartyCoA1" />
        </div>
        <div style={row}>
          <label style={fieldLabel}>Certificate of Analysis (CoA) — Copy 2</label>
          <UB value={d.thirdPartyCoA2} field="thirdPartyCoA2" />
        </div>
        <div style={row}>
          <label style={fieldLabel}>Is the product certified by a third-party Vegan certifying body? *</label>
          <div>
            {radioGroup('isThirdPartyCertified', d.isThirdPartyCertified)}
            {errMsg('isThirdPartyCertified')}
          </div>
        </div>
        {d.isThirdPartyCertified === 'Yes' && (
          <>
            <div style={row}>
              <label style={fieldLabel}>Name of the Certifying Body *</label>
              <div>
                <input style={eb(input, 'certifyingBody')} value={d.certifyingBody} onChange={(e) => setField('certifyingBody', e.target.value)} />
                {errMsg('certifyingBody')}
              </div>
            </div>
            <div style={row}>
              <label style={fieldLabel}>Certification Document *</label>
              <UB value={d.certificationDoc} field="certificationDoc" />
            </div>
            <div style={row}>
              <label style={fieldLabel}>Validity of Certification *</label>
              <div>
                <input type="date" style={eb(input, 'certificationValidity')} value={d.certificationValidity} onChange={(e) => setField('certificationValidity', e.target.value)} />
                {errMsg('certificationValidity')}
              </div>
            </div>
          </>
        )}
      </div>
    </div>,

    // ── Step 4: Declaration & Payment ─────────────────────────────────────
    <div key={4}>
      {/* Declaration */}
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Declaration (Annexure D)</div>
        <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
          Please download the Annexure D declaration form, sign it, and upload the scanned copy below.
        </div>
        <div style={row}>
          <label style={fieldLabel}>Signed Annexure D *</label>
          <UB value={d.annexureDFile} field="annexureDFile" />
        </div>
      </div>

      {/* Payment */}
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Application Fee</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Application Fee', value: VEGAN_FEE.fee },
            { label: 'GST (18%)',        value: VEGAN_FEE.gst },
            { label: 'Total Payable',    value: VEGAN_FEE.total },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.primary, fontFamily: "'Libre Baskerville', Georgia, serif" }}>{value}</div>
            </div>
          ))}
        </div>

        {paymentDone ? (
          <div style={{ background: COLORS.successLight, border: `1px solid ${COLORS.success}`, borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>✓</span>
            <div>
              <div style={{ fontWeight: 700, color: COLORS.success, fontSize: 13 }}>Payment Completed</div>
              {invoiceNo && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Invoice: {invoiceNo}</div>}
            </div>
          </div>
        ) : (
          <div>
            <button
              disabled={payPending}
              onClick={async () => {
                if (!appId) return;
                setPayPending(true);
                try {
                  await saveDraftApplication(appId, formData as unknown as AppFormData, formData.productName || undefined);
                  const inv = await openRazorpayCheckout({
                    applicationId:   appId,
                    referenceNumber: formData.productName || appId,
                    companyName:     formData.fboName || user?.username || '',
                    email:           formData.authorisedEmail || user?.email || '',
                    contact:         formData.authorisedContact,
                  });
                  setPaymentDone(true);
                  setInvoiceNo(inv);
                  toast.success('Payment successful!');
                } catch (err: unknown) {
                  if ((err as Error)?.message !== 'Payment cancelled') {
                    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
                    toast.error(msg ?? 'Payment could not be completed');
                  }
                } finally {
                  setPayPending(false);
                }
              }}
              style={{
                background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6,
                padding: '10px 28px', fontSize: 13, fontWeight: 700, cursor: payPending ? 'not-allowed' : 'pointer',
                opacity: payPending ? 0.7 : 1,
              }}
            >
              {payPending ? 'Processing…' : 'Pay ₹11,800 Online'}
            </button>
            {errMsg('payment')}
          </div>
        )}
      </div>
    </div>,
  ];

  // ── Nav buttons ────────────────────────────────────────────────────────────
  const isLast = step === STEPS.length - 1;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20, paddingLeft: 12, borderLeft: `4px solid ${COLORS.primary}` }}>
        <div style={S.roleLabel}>NEW APPLICATION</div>
        <div style={S.pageTitle}>Vegan</div>
        <div style={S.pageDesc}>For the endorsement of Vegan logo as per the Food Safety and Standards (Vegan Foods) Regulations, 2022</div>
      </div>

      <Stepper steps={STEPS} current={step} />

      <div style={{ marginTop: 20 }}>{stepContent[step]}</div>

      {/* Action buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} style={{ background: 'transparent', color: COLORS.text, border: `1.5px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              ← Back
            </button>
          )}
          <button onClick={handleSave} disabled={saving} style={{ background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/app/dashboard')} style={{ background: 'transparent', color: COLORS.textMuted, border: `1.5px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 20px', fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
          {isLast ? (
            <button
              disabled={saving || !paymentDone}
              onClick={() => setDialog({ msg: 'Submit this Vegan application? Once submitted you cannot make changes.', action: handleSubmit })}
              style={{ background: saving || !paymentDone ? COLORS.border : COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 24px', fontSize: 13, fontWeight: 700, cursor: saving || !paymentDone ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Submitting…' : 'Submit Application'}
            </button>
          ) : (
            <button onClick={advanceStep} style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Next →
            </button>
          )}
        </div>
      </div>

      {dialog && (
        <ConfirmDialog
          message={dialog.msg}
          onConfirm={() => { setDialog(null); dialog.action(); }}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}
