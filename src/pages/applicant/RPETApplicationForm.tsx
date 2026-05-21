// rPET (Recycled PET Packaging) application form. Flat 4-step structure — same pattern as CA form.
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { COLORS, S } from '@/utils/colors';
import { scrollToFirstError } from '@/utils/scrollToError';
import Stepper from '@/components/ui/Stepper';
import UploadBox from '@/components/ui/UploadBox';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  createDraftApplication, fetchApplication,
  fetchMyApplications, saveDraftApplication, submitDraftApplication,
  type AppFormData,
} from '@/services/application.service';

// ── Constants ─────────────────────────────────────────────────────────────────
const STEPS = ['Manufacturer & Licenses', 'Recycling Technology', 'Validation & Declarations', 'Payment'];

const RPET_FEE = { fee: '₹50,000', gst: '₹9,000', total: '₹59,000' };

// ── rPET-specific flat form data ──────────────────────────────────────────────
interface RPETFormData {
  // Step 0 — Manufacturer Details & Operational Licenses
  manufacturerName:       string;
  addressOfPremise:       string;
  authorizedPersonnel:    string;
  factoryLicensesFile:    string;
  labourLicenseFile:      string;
  pollutionLicenseFile:   string;
  gstLicenseFile:         string;
  // Step 1 — Recycling Technology & Global Regulatory
  recyclingTechnologyDetails: string;
  recyclingTechnologyFile:    string;
  plantMachineryDetails:      string;
  plantMachineryFile:         string;
  globalRegulatoryText:       string;
  globalRegulatoryFile:       string;
  // Step 2 — Validation, Quality, Safety & Declarations
  facilityApprovalFile:         string;
  vendorAuditFile:              string;
  qualitySafetyTestReportFile:  string;
  fssPackagingRegFile:          string;
  sensoryAnalysisFile:          string;
  declPostConsumer:             boolean;
  declAuditReport:              boolean;
  declDocuments:                boolean;
  declFcmSymbol:                boolean;
  // Step 3 — Payment
  paymentMethod:    string;
  paymentReference: string;
}

function emptyRPETFormData(): RPETFormData {
  return {
    manufacturerName: '', addressOfPremise: '', authorizedPersonnel: '',
    factoryLicensesFile: '', labourLicenseFile: '', pollutionLicenseFile: '', gstLicenseFile: '',
    recyclingTechnologyDetails: '', recyclingTechnologyFile: '',
    plantMachineryDetails: '', plantMachineryFile: '',
    globalRegulatoryText: '', globalRegulatoryFile: '',
    facilityApprovalFile: '', vendorAuditFile: '', qualitySafetyTestReportFile: '',
    fssPackagingRegFile: '', sensoryAnalysisFile: '',
    declPostConsumer: false, declAuditReport: false, declDocuments: false, declFcmSymbol: false,
    paymentMethod: 'Online Payment (NEFT/RTGS/UPI)', paymentReference: '',
  };
}

// ── Inline styles ─────────────────────────────────────────────────────────────
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

// ── rPET Application Form ─────────────────────────────────────────────────────
export default function RPETApplicationForm() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const { user }   = useAuthStore();

  const idParam = params.get('id');

  const [appId, setAppId]       = useState<string | null>(idParam);
  const [step, setStep]         = useState(0);
  const [saving, setSaving]     = useState(false);
  const [dialog, setDialog]     = useState<{ msg: string; action: () => void } | null>(null);
  const [formData, setFormData] = useState<RPETFormData>(emptyRPETFormData);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (idParam) {
      fetchApplication(idParam).then((app) => {
        setAppId(app.id);
        if (app.formData) setFormData(app.formData as unknown as RPETFormData);
      }).catch(() => toast.error('Could not load draft'));
    } else {
      fetchMyApplications()
        .then((apps) => {
          const existing = apps.find((a) => a.stage === 'Draft' && a.applicationType === 'RPET');
          if (existing) {
            setAppId(existing.id);
            if (existing.formData) setFormData(existing.formData as unknown as RPETFormData);
          } else {
            return createDraftApplication('RPET', user?.username || 'Draft').then((app) => setAppId(app.id));
          }
        })
        .catch(() => toast.error('Could not start application'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setField(field: keyof RPETFormData, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setStepErrors((p) => { const n = { ...p }; delete n[field as string]; return n; });
  }

  function clearErr(field: string) {
    setStepErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  }

  const errMsg = (field: string) =>
    stepErrors[field]
      ? <div className="form-field-error" style={{ fontSize: 11, color: COLORS.danger, marginTop: 3 }}>{stepErrors[field]}</div>
      : null;

  const eb = (base: React.CSSProperties, field: string): React.CSSProperties =>
    stepErrors[field] ? { ...base, borderColor: COLORS.danger } : base;

  function UB({ value, field }: { value: string; field: keyof RPETFormData }) {
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

  async function handleSave() {
    if (!appId) return;
    setSaving(true);
    try {
      await saveDraftApplication(appId, formData as unknown as AppFormData, formData.manufacturerName || undefined);
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
      await saveDraftApplication(appId, formData as unknown as AppFormData, formData.manufacturerName || undefined);
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
      if (!d.manufacturerName.trim())     errs.manufacturerName     = 'This field is required';
      if (!d.addressOfPremise.trim())     errs.addressOfPremise     = 'This field is required';
      if (!d.authorizedPersonnel.trim())  errs.authorizedPersonnel  = 'This field is required';
      if (!d.factoryLicensesFile)         errs.factoryLicensesFile  = 'Factory licence document is required';
      if (!d.labourLicenseFile)           errs.labourLicenseFile    = 'Labour licence document is required';
      if (!d.pollutionLicenseFile)        errs.pollutionLicenseFile = 'Pollution licence document is required';
      if (!d.gstLicenseFile)              errs.gstLicenseFile       = 'GST certificate is required';
    }

    if (stepIndex === 1) {
      if (!d.recyclingTechnologyDetails.trim()) errs.recyclingTechnologyDetails = 'This field is required';
      if (!d.recyclingTechnologyFile)           errs.recyclingTechnologyFile    = 'Recycling technology document is required';
      if (!d.plantMachineryDetails.trim())      errs.plantMachineryDetails      = 'This field is required';
      if (!d.plantMachineryFile)                errs.plantMachineryFile         = 'Plant & machinery document is required';
      if (!d.globalRegulatoryText.trim())       errs.globalRegulatoryText       = 'This field is required';
      if (!d.globalRegulatoryFile)              errs.globalRegulatoryFile       = 'Global regulatory document is required';
    }

    if (stepIndex === 2) {
      if (!d.facilityApprovalFile)        errs.facilityApprovalFile        = 'Facility approval document is required';
      if (!d.vendorAuditFile)             errs.vendorAuditFile             = 'Vendor audit report is required';
      if (!d.qualitySafetyTestReportFile) errs.qualitySafetyTestReportFile = 'Quality & safety test report is required';
      if (!d.fssPackagingRegFile)         errs.fssPackagingRegFile         = 'FSS Packaging Regulations document is required';
      if (!d.sensoryAnalysisFile)         errs.sensoryAnalysisFile         = 'Sensory analysis document is required';
      if (!d.declPostConsumer)            errs.declPostConsumer            = 'You must accept this declaration';
      if (!d.declAuditReport)             errs.declAuditReport             = 'You must accept this declaration';
      if (!d.declDocuments)               errs.declDocuments               = 'You must accept this declaration';
      if (!d.declFcmSymbol)               errs.declFcmSymbol               = 'You must accept this declaration';
    }

    if (stepIndex === 3) {
      if (!d.paymentReference.trim())     errs.paymentReference            = 'Please enter a transaction reference number';
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
  const errs = stepErrors;

  // ── Step content ───────────────────────────────────────────────────────────
  const stepContent = [
    // ── Step 0: Manufacturer Details & Operational Licenses ────────────────
    <div key={0}>
      {/* Manufacturer Details */}
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Manufacturer Details</div>
        <div style={row}>
          <label style={fieldLabel}>Name of the Manufacturer *</label>
          <div>
            <input style={eb(input, 'manufacturerName')} value={d.manufacturerName} onChange={(e) => setField('manufacturerName', e.target.value)} />
            {errMsg('manufacturerName')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Address of the Premise *</label>
          <div>
            <textarea style={eb(textarea, 'addressOfPremise')} value={d.addressOfPremise} onChange={(e) => setField('addressOfPremise', e.target.value)} />
            {errMsg('addressOfPremise')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Name of Authorized Personnel *</label>
          <div>
            <input style={eb(input, 'authorizedPersonnel')} value={d.authorizedPersonnel} onChange={(e) => setField('authorizedPersonnel', e.target.value)} />
            {errMsg('authorizedPersonnel')}
          </div>
        </div>
      </div>

      {/* Operational Licenses */}
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Operational Licenses</div>
        <div style={row}>
          <label style={fieldLabel}>All Licences — Factory (Factories Act/State) *</label>
          <UB value={d.factoryLicensesFile} field="factoryLicensesFile" />
        </div>
        <div style={row}>
          <label style={fieldLabel}>Labour Licence *</label>
          <UB value={d.labourLicenseFile} field="labourLicenseFile" />
        </div>
        <div style={row}>
          <label style={fieldLabel}>Pollution Control Board Licence *</label>
          <UB value={d.pollutionLicenseFile} field="pollutionLicenseFile" />
        </div>
        <div style={row}>
          <label style={fieldLabel}>GST Certificate *</label>
          <UB value={d.gstLicenseFile} field="gstLicenseFile" />
        </div>
      </div>
    </div>,

    // ── Step 1: Recycling Technology & Global Regulatory ───────────────────
    <div key={1}>
      {/* Recycling Technology */}
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Recycling Technology</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8, lineHeight: 1.6 }}>
          Details of recycling technology used to manufacture FCM-rPET resin including details of the source of feedstock (post-consumer PET food packaging waste) and the intended application
        </div>
        <div style={row}>
          <label style={fieldLabel}>Recycling Technology Details *</label>
          <div>
            <textarea
              style={eb(textarea, 'recyclingTechnologyDetails')}
              placeholder="Describe the recycling technology, feedstock source and intended application..."
              value={d.recyclingTechnologyDetails}
              onChange={(e) => setField('recyclingTechnologyDetails', e.target.value)}
            />
            {errMsg('recyclingTechnologyDetails')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Recycling Technology Document *</label>
          <UB value={d.recyclingTechnologyFile} field="recyclingTechnologyFile" />
        </div>
        <div style={{ marginBottom: 12, borderTop: `1px solid ${COLORS.border}`, paddingTop: 12 }}>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8, lineHeight: 1.6 }}>
            Details of Plant and Machinery used in the manufacture of FCM-rPET resin
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Plant & Machinery Details *</label>
          <div>
            <textarea
              style={eb(textarea, 'plantMachineryDetails')}
              placeholder="Describe the plant and machinery used in the manufacture of FCM-rPET resin..."
              value={d.plantMachineryDetails}
              onChange={(e) => setField('plantMachineryDetails', e.target.value)}
            />
            {errMsg('plantMachineryDetails')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Plant & Machinery Document *</label>
          <UB value={d.plantMachineryFile} field="plantMachineryFile" />
        </div>
      </div>

      {/* Global Regulatory Approval */}
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Global Regulatory Approval</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8, lineHeight: 1.6 }}>
          NOL/NOC/Safety Assessment by any Global Regulatory Authority (e.g. EFSA, US FDA, etc.) for the use of specific technology for manufacture of FCM-rPET
        </div>
        <div style={row}>
          <label style={fieldLabel}>Global Regulatory Details *</label>
          <div>
            <textarea
              style={eb(textarea, 'globalRegulatoryText')}
              placeholder="Provide details of NOL/NOC/Safety Assessment from global regulatory authorities..."
              value={d.globalRegulatoryText}
              onChange={(e) => setField('globalRegulatoryText', e.target.value)}
            />
            {errMsg('globalRegulatoryText')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>NOL/NOC/Safety Assessment Document *</label>
          <UB value={d.globalRegulatoryFile} field="globalRegulatoryFile" />
        </div>
      </div>
    </div>,

    // ── Step 2: Validation, Quality, Safety & Declarations ─────────────────
    <div key={2}>
      {/* Validation with Indian FCM-PET */}
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Validation with Indian FCM-PET</div>
        <div style={row}>
          <label style={fieldLabel}>
            a) Facility approval/clearance by Competent Authority *
          </label>
          <UB value={d.facilityApprovalFile} field="facilityApprovalFile" />
        </div>
        <div style={row}>
          <label style={fieldLabel}>
            b) Vendor and internal audit reports to demonstrate suitability & efficiency of the technology to produce FCM-rPET resin *
          </label>
          <UB value={d.vendorAuditFile} field="vendorAuditFile" />
        </div>
      </div>

      {/* Quality & Safety Data */}
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Quality & Safety Data</div>
        <div style={row}>
          <label style={fieldLabel}>
            Test reports to confirm quality & safety of FCM-rPET as specified in Guidelines (Report shall be from a NABL accredited lab) *
          </label>
          <UB value={d.qualitySafetyTestReportFile} field="qualitySafetyTestReportFile" />
        </div>
      </div>

      {/* FSS(Packaging) Regulations 2018 Compliance */}
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>FCM-rPET Compliance to FSS(Packaging) Regulations 2018</div>
        <div style={row}>
          <label style={fieldLabel}>
            a) FSS(Packaging) regulations 2018 – General requirement & Specific requirement pertaining to plastics [Refer to Regulation 4(4)] *
          </label>
          <UB value={d.fssPackagingRegFile} field="fssPackagingRegFile" />
        </div>
        <div style={row}>
          <label style={fieldLabel}>
            b) Sensory analysis as per ISO 13302 or equivalent GMP/QMS certificates etc. *
          </label>
          <UB value={d.sensoryAnalysisFile} field="sensoryAnalysisFile" />
        </div>
      </div>

      {/* Manufacturer Declaration */}
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Manufacturer Declaration</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
          Please read and accept all declarations before proceeding.
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '10px 12px', borderRadius: 8, border: `1px solid ${errs.declPostConsumer ? COLORS.danger : COLORS.border}`, background: formData.declPostConsumer ? '#f0fdf4' : '#fff', marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={formData.declPostConsumer}
            onChange={(e) => { setField('declPostConsumer', e.target.checked); clearErr('declPostConsumer'); }}
            style={{ marginTop: 3, flexShrink: 0, accentColor: COLORS.primary, width: 16, height: 16 }}
          />
          <span style={{ fontSize: 12, lineHeight: 1.6, color: COLORS.text }}>
            I declare that only post-consumer food packaging materials are used to manufacture FCM-rPET resin and will maintain records/details of source, nature of feedstock along with intended application (converters, beverage bottlers, food packers, FBOs) for every batch/lot.
          </span>
        </label>
        {errMsg('declPostConsumer')}

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '10px 12px', borderRadius: 8, border: `1px solid ${errs.declAuditReport ? COLORS.danger : COLORS.border}`, background: formData.declAuditReport ? '#f0fdf4' : '#fff', marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={formData.declAuditReport}
            onChange={(e) => { setField('declAuditReport', e.target.checked); clearErr('declAuditReport'); }}
            style={{ marginTop: 3, flexShrink: 0, accentColor: COLORS.primary, width: 16, height: 16 }}
          />
          <span style={{ fontSize: 12, lineHeight: 1.6, color: COLORS.text }}>
            I will provide an audit report annually to demonstrate the capability of the technology & machinery to manufacture FCM-rPET as specified in Guidelines.
          </span>
        </label>
        {errMsg('declAuditReport')}

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '10px 12px', borderRadius: 8, border: `1px solid ${errs.declDocuments ? COLORS.danger : COLORS.border}`, background: formData.declDocuments ? '#f0fdf4' : '#fff', marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={formData.declDocuments}
            onChange={(e) => { setField('declDocuments', e.target.checked); clearErr('declDocuments'); }}
            style={{ marginTop: 3, flexShrink: 0, accentColor: COLORS.primary, width: 16, height: 16 }}
          />
          <span style={{ fontSize: 12, lineHeight: 1.6, color: COLORS.text }}>
            I will provide necessary documents/reports/certificates/FCMrPET symbol compliance declaration as and when required by the Food Authority.
          </span>
        </label>
        {errMsg('declDocuments')}

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '10px 12px', borderRadius: 8, border: `1px solid ${errs.declFcmSymbol ? COLORS.danger : COLORS.border}`, background: formData.declFcmSymbol ? '#f0fdf4' : '#fff', marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={formData.declFcmSymbol}
            onChange={(e) => { setField('declFcmSymbol', e.target.checked); clearErr('declFcmSymbol'); }}
            style={{ marginTop: 3, flexShrink: 0, accentColor: COLORS.primary, width: 16, height: 16 }}
          />
          <span style={{ fontSize: 12, lineHeight: 1.6, color: COLORS.text }}>
            I declare to emboss the FCM rPET symbol on rigid plastic containers (FCM) and/or imprint the FCM rPET symbol on the flexible plastic pouches.
          </span>
        </label>
        {errMsg('declFcmSymbol')}
      </div>
    </div>,

    // ── Step 3: Payment & Submit ────────────────────────────────────────────
    <div key={3} style={secCard}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Payment &amp; Submission</div>

      <div style={{ background: COLORS.primaryLight, border: `1px solid ${COLORS.primary}22`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: COLORS.primary, marginBottom: 8 }}>Fee Summary</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13 }}>rPET Application Fee</span>
          <span style={{ fontWeight: 700 }}>{RPET_FEE.fee}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13 }}>GST (18%)</span>
          <span style={{ fontWeight: 700 }}>{RPET_FEE.gst}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${COLORS.primary}22`, paddingTop: 8, marginTop: 4 }}>
          <span style={{ fontWeight: 700 }}>Total</span>
          <span style={{ fontWeight: 800, fontSize: 16, color: COLORS.primary }}>{RPET_FEE.total}</span>
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

  const sectionTitles = ['Manufacturer & Operational Licenses', 'Recycling Technology & Global Regulatory', 'Validation, Quality, Safety & Declarations', 'Payment & Submit'];

  return (
    <div>
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16, paddingLeft: 12, borderLeft: `4px solid ${COLORS.primary}` }}>
        <div style={S.roleLabel}>START NEW APPLICATION</div>
        <div style={S.pageTitle}>Application Form (rPET)</div>
        <div style={S.pageDesc}>Authorization of Recycled PET Packaging Manufacturer. All data is auto-saved on each step.</div>
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
