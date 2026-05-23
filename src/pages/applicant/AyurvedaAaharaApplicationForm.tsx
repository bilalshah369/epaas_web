// Ayurveda Aahara (AA) application form. Separate from NSF/CA flows.
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

// ── Constants ─────────────────────────────────────────────────────────────────
const STEPS = ['Category & Basic Info', 'Ingredients / Composition', 'Claims / Usage', 'Uploads / Evidence', 'Payment'];

const AYURVEDA_CATEGORIES = [
  'Category A — Classical Ayurvedic formulations listed in Ayurvedic Pharmacopoeia of India / Formulary',
  'Category B — Proprietary Ayurvedic food products with permitted ingredients',
  'Category B1 — Products with new Ayurvedic ingredients not listed in API/AF',
  'Category B2 — Products with ingredients from other traditional systems',
];


const REFERENCE_BOOKS = [
  'API — Ayurvedic Pharmacopoeia of India',
  'AF — Ayurvedic Formulary of India',
  'Bhavprakash Nighantu',
  'Charaka Samhita',
  'Sushruta Samhita',
  'Ashtanga Hridayam',
  'Dravyaguna Vijnana',
  'Raj Nighantu',
  'Kaiyadev Nighantu',
  'Materia Medica of Ayurveda',
  'National Formulary of Ayurvedic Medicine',
  'Siddha Pharmacopoeia of India',
  'Unani Pharmacopoeia of India',
  'Other (specify)',
];

const COMMON_ADDITIVES = [
  'Acacia Gum (E414)', 'Agar (E406)', 'Carrageenan (E407)',
  'Citric Acid (E330)', 'Sodium Benzoate (E211)', 'Potassium Sorbate (E202)',
  'Ascorbic Acid (E300)', 'Tocopherols (E306)', 'Lecithin (E322)',
  'Pectin (E440)', 'Xanthan Gum (E415)', 'Guar Gum (E412)',
  'Sodium Chloride', 'Honey', 'Jaggery',
];

const UNITS = ['mg', 'g', 'kg', 'ml', 'L', '%w/w', '%v/v', 'IU', 'mcg', 'ppm'];

const WORD_LIMIT = 100;

// ── Interfaces ────────────────────────────────────────────────────────────────
interface IngredientRow {
  ingredientName:    string;
  quantity:          string;
  unit:              string;
  referenceBook:     string;
  // Category A extended fields
  referenceSource:   string;
  classicalReference: string;
  ingredientPurpose: string;
}

interface AdditiveRow {
  additiveName: string;
  quantity:     string;
  purpose:      string;
}

interface OtherBotanicalRow {
  botanicalName: string;
  quantity:      string;
  unit:          string;
  rationale:     string;
  botanicalNameOfAuthoritativeText: string;
  botanicalBookEditor:        string;
  botanicalBookAuthor:        string;
  botanicalBookVolume:        string;
  botanicalBookSthana:        string;
  botanicalReferenceChapter:  string;
  botanicalReferenceVerse:    string;
  botanicalBookPageNumbers:   string;
  botanicalBookPublisher:     string;
  botanicalPublicationYear:   string;
  botanicalPublicationPlace:  string;
  botanicalReferenceFile:     string;
}

interface EfficacyRow {
  nameOfAuthoritativeText:           string;
  referenceInAuthoritativeText:      string;
  justificationRasaGunaViryaVipaka:  string;
}

interface EvidenceWithDosageRow {
  typeOfEvidence:               string;
  nameOfJournalImpactFactor:    string;
  geographicalLocationOfStudy:  string;
  humanStudiesNumberOfSubjects: string;
  dosageAndDuration:            string;
  conclusion:                   string;
}

interface AAFormData {
  // Step 0 — Category & Basic Info
  ayurvedaCategory:   string;
  // Applicant Details
  applicantPrefix:    string;
  applicantName:      string;
   nameOfOrganization: string;
  registeredOfficeAddress: string;
  manufacturingAddress: string;
  manufacturingPremisesContactDetails: string;
  authorisedPersonPrefix: string;
  authorisedPerson:   string;
  authorisedEmail:    string;
  authorisedEmail2:   string;
  authorisedEmail3:   string;
  authorisedContact:  string;
  natureOfBusiness:   string;
  // Product Details
  productName:        string;
 justificationOfProposedAyurvedaAahara: string;
  functionalUse:      string;
  functionalUseFile:  string;
  intendedUse:        string;
  certificateOfAnalysis: string;
  manufacturingProcessFile: string;
  // Step 1 — Ingredients / Additives / Composition
  ingredients:            IngredientRow[];
  additives:              AdditiveRow[];
  otherBotanicals:        OtherBotanicalRow[];
  compositionFile:        string;
  ingredientListFile:     string;
  hasSpecifications:      string;
  specificationsFile:     string;
  // Category A — Traditional Reference (Step 1)
  ayurvedaReferenceBook:  string;
  referenceChapter:       string;
  referenceVerse:         string;
  bookEditor:             string;
  bookAuthor:             string;
  bookVolume:             string;
  bookSthana:             string;
  bookPageNumbers:        string;
  bookPublisher:          string;
  bookPublicationYear:    string;
  bookPublicationPlace:   string;
  authoritativeBookScanFile: string;
  // Category A — Book multi-select + name of text + recipe
  ayurvedaBookMultiSelect:        string;
  ayurvedaAaharaNameOfText:       string;
  ayurvedaAaharaRecipe:           string;
  // Category B — Traditional Reference (Step 1)
  catBNameOfAyurvedaAahara:       string;
  catBFormatOfAyurvedaAahara:     string;
  catBAyurvedaBookMultiSelect:    string;
  catBAyurvedaAaharaRecipe:       string;
  catBNameOfAuthoritativeText:    string;
  catBBookEditor:                 string;
  catBBookAuthor:                 string;
  catBBookVolume:                 string;
  catBBookSthana:                 string;
  catBReferenceChapter:           string;
  catBReferenceVerse:             string;
  catBBookPageNumbers:            string;
  catBBookPublisher:              string;
  catBBookPublicationYear:        string;
  catBBookPublicationPlace:       string;
  catBAuthoritativeBookScanFile:  string;
  // Category B1 — Traditional Reference (Step 1)
  catB1NameOfAyurvedaAahara:      string;
  catB1FormatOfAyurvedaAahara:    string;
  catB1AyurvedaBookMultiSelect:   string;
  catB1AyurvedaAaharaRecipe:      string;
  catB1NameOfAuthoritativeText:   string;
  catB1BookEditor:                string;
  catB1BookAuthor:                string;
  catB1BookVolume:                string;
  catB1BookSthana:                string;
  catB1ReferenceChapter:          string;
  catB1ReferenceVerse:            string;
  catB1BookPageNumbers:           string;
  catB1BookPublisher:             string;
  catB1BookPublicationYear:       string;
  catB1BookPublicationPlace:      string;
  catB1AuthoritativeBookScanFile: string;
  // Category B2 — Traditional Reference (Step 1)
  catB2NameOfAyurvedaAahara:      string;
  catB2FormatOfAyurvedaAahara:    string;
  catB2AyurvedaBookMultiSelect:   string;
  catB2AyurvedaAaharaRecipe:      string;
  catB2NameOfAuthoritativeText:   string;
  catB2BookEditor:                string;
  catB2BookAuthor:                string;
  catB2BookVolume:                string;
  catB2BookSthana:                string;
  catB2ReferenceChapter:          string;
  catB2ReferenceVerse:            string;
  catB2BookPageNumbers:           string;
  catB2BookPublisher:             string;
  catB2BookPublicationYear:       string;
  catB2BookPublicationPlace:      string;
  catB2AuthoritativeBookScanFile: string;
  // Step 2 — Claims / Usage / Population
  targetPopulation:  string;
  servingSize:       string;
  durationOfUse:     string;
  directionsForUse:  string;
  // Shared usage uploads (Step 2)
  servingSizeFile:        string;
  targetPopulationFile:   string;
  directionsForUseFile:   string;
  durationOfUseFile:      string;
  packageMaterial:        string;
  fssConformance:         string;
  // Category A — Name & Format (Step 2)
  catANameOfAyurvedaAahara:      string;
  catAFormatOfAyurvedaAahara:    string;
  catAHealthBenefitYesNo:    string;
  // Category A — Label Claims (Step 2)
  catAHealthBenefitClaim:    string;
  catAHealthBenefitFile:     string;
  catAHealthBenefitAbstract: string;
  catADiseaseRiskYesNo:      string;
  catADiseaseRiskStatement1: string;
  catADiseaseRiskStatement2: string;
  catADiseaseRiskStatement3: string;
  catADiseaseRiskFile:       string;
  catADiseaseRiskAbstract:       string;
  catAHealthBenefitEfficacyRows: EfficacyRow[];
  catADiseaseRiskEvidenceRows:   EvidenceWithDosageRow[];
  otherBotanicalsRationale:     string;
  otherBotanicalsRationaleFile: string;
  catBHealthBenefitYesNo:    string;
  // Category B — Label Claims (Step 2)
  catBHealthBenefitClaim:    string;
  catBHealthBenefitFile:     string;
  catBHealthBenefitAbstract: string;
  catBDiseaseRiskYesNo:      string;
  catBDiseaseRiskStatement1: string;
  catBDiseaseRiskStatement2: string;
  catBDiseaseRiskStatement3: string;
  catBDiseaseRiskFile:       string;
  catBDiseaseRiskAbstract:        string;
  catBHealthBenefitEfficacyRows:  EfficacyRow[];
  catBDiseaseRiskEvidenceRows:    EvidenceWithDosageRow[];
  catBSafetyDataFile:             string;
  catBSafetyDataAbstract:         string;
  catBSafetyEvidenceRows:         EvidenceWithDosageRow[];
  // Category B1 — Disease Risk Reduction (Step 3)
  diseaseRiskStatement1:           string;
  diseaseRiskStatement2:           string;
  diseaseRiskStatement3:           string;
  humanInterventionStudies:        string;
  humanInterventionStudiesFile:    string;
  differentFormatRationale:        string;
  differentFormatRationaleFile:    string;
  efficacyDataFile:                string;
  efficacyDataAbstract:            string;
  catB1EfficacyEvidenceRows:       EvidenceWithDosageRow[];
  b1LabelHealthBenefitYesNo:       string;
  b1HealthBenefitFile:             string;
  b1HealthBenefitAbstract:         string;
  catB1HealthBenefitEvidenceRows:  EvidenceWithDosageRow[];
  b1LabelDiseaseRiskYesNo:       string;
  b1LabelDiseaseRiskStatement1:  string;
  b1LabelDiseaseRiskStatement2:  string;
  b1LabelDiseaseRiskStatement3:  string;
  b1LabelDiseaseRiskFile:        string;
  b1LabelDiseaseRiskAbstract:    string;
  catB1HealthBenefitRationale:   string;
  catB1DiseaseRiskEvidenceRows:  EvidenceWithDosageRow[];
  catB1SafetyDataFile:           string;
  catB1SafetyDataAbstract:       string;
  catB1SafetyEvidenceRows:       EvidenceWithDosageRow[];
  catB2HealthBenefit1YesNo:    string;
  catB2HealthBenefit1File:     string;
  catB2HealthBenefit1Abstract: string;
  catB2HealthBenefit1EvidenceRows: EvidenceWithDosageRow[];
  catB2HealthBenefit2YesNo:    string;
  catB2HealthBenefit2File:     string;
  catB2HealthBenefit2Abstract: string;
  catB2HealthBenefit2EvidenceRows: EvidenceWithDosageRow[];
  catB2DiseaseRisk1YesNo:      string;
  catB2DiseaseRisk1Statement1: string;
  catB2DiseaseRisk1Statement2: string;
  catB2DiseaseRisk1Statement3: string;
  catB2DiseaseRisk1File:       string;
  catB2DiseaseRisk1Abstract:   string;
  catB2DiseaseRisk2YesNo:      string;
  catB2DiseaseRisk2Statement1: string;
  catB2DiseaseRisk2Statement2: string;
  catB2DiseaseRisk2Statement3: string;
  catB2DiseaseRisk2File:       string;
  catB2DiseaseRisk2Abstract:      string;
  catB2HealthBenefit1Rationale:   string;
  catB2HealthBenefit2Rationale:   string;
  catB2DiseaseRisk1EvidenceRows:  EvidenceWithDosageRow[];
  catB2DiseaseRisk2EvidenceRows:  EvidenceWithDosageRow[];
  catB2SafetyDataFile:            string;
  catB2SafetyDataAbstract:        string;
  catB2SafetyEvidenceRows:        EvidenceWithDosageRow[];
  // Step 3 — Uploads / Scientific Support (shared)
  productLabel:                string;
  // Step 4 — Payment
  paymentMethod:    string;
  paymentReference: string;
  // Part III — Existing Registration Details (Step 3)
  hasExistingRegistration:    string;
  registrationNumber:         string;
  registrationDate:           string;
  licenseNumberExisting:      string;
  licenseDate:                string;
  registrationCertificate:    string;
  licenseCertificate:         string;
}

function emptyAAFormData(): AAFormData {
  return {
    ayurvedaCategory: '',
    applicantPrefix: '', applicantName: '',
    nameOfOrganization: '', registeredOfficeAddress: '', manufacturingAddress: '', manufacturingPremisesContactDetails: '',
    authorisedPersonPrefix: '', authorisedPerson: '',
    authorisedEmail: '', authorisedEmail2: '', authorisedEmail3: '', authorisedContact: '',
    natureOfBusiness: '',
    productName: '',
    justificationOfProposedAyurvedaAahara: '', functionalUse: '', functionalUseFile: '',
    intendedUse: '', certificateOfAnalysis: '', manufacturingProcessFile: '',
    ingredients: [], additives: [], otherBotanicals: [],
    compositionFile: '',
    ingredientListFile: '', hasSpecifications: '', specificationsFile: '',
    ayurvedaReferenceBook: '', referenceChapter: '', referenceVerse: '',
    bookEditor: '', bookAuthor: '', bookVolume: '', bookSthana: '',
    bookPageNumbers: '', bookPublisher: '', bookPublicationYear: '', bookPublicationPlace: '',
    authoritativeBookScanFile: '',
    ayurvedaBookMultiSelect: '', ayurvedaAaharaNameOfText: '', ayurvedaAaharaRecipe: '',
    catBNameOfAyurvedaAahara: '', catBFormatOfAyurvedaAahara: '',
    catBAyurvedaBookMultiSelect: '', catBAyurvedaAaharaRecipe: '', catBNameOfAuthoritativeText: '',
    catBBookEditor: '', catBBookAuthor: '', catBBookVolume: '', catBBookSthana: '',
    catBReferenceChapter: '', catBReferenceVerse: '', catBBookPageNumbers: '',
    catBBookPublisher: '', catBBookPublicationYear: '', catBBookPublicationPlace: '',
    catBAuthoritativeBookScanFile: '',
    catB1NameOfAyurvedaAahara: '', catB1FormatOfAyurvedaAahara: '',
    catB1AyurvedaBookMultiSelect: '', catB1AyurvedaAaharaRecipe: '', catB1NameOfAuthoritativeText: '',
    catB1BookEditor: '', catB1BookAuthor: '', catB1BookVolume: '', catB1BookSthana: '',
    catB1ReferenceChapter: '', catB1ReferenceVerse: '', catB1BookPageNumbers: '',
    catB1BookPublisher: '', catB1BookPublicationYear: '', catB1BookPublicationPlace: '',
    catB1AuthoritativeBookScanFile: '',
    catB2NameOfAyurvedaAahara: '', catB2FormatOfAyurvedaAahara: '',
    catB2AyurvedaBookMultiSelect: '', catB2AyurvedaAaharaRecipe: '', catB2NameOfAuthoritativeText: '',
    catB2BookEditor: '', catB2BookAuthor: '', catB2BookVolume: '', catB2BookSthana: '',
    catB2ReferenceChapter: '', catB2ReferenceVerse: '', catB2BookPageNumbers: '',
    catB2BookPublisher: '', catB2BookPublicationYear: '', catB2BookPublicationPlace: '',
    catB2AuthoritativeBookScanFile: '',
    targetPopulation: '', servingSize: '',
    durationOfUse: '', directionsForUse: '',
    servingSizeFile: '', targetPopulationFile: '', directionsForUseFile: '', durationOfUseFile: '',
    packageMaterial: '', fssConformance: '',
    catANameOfAyurvedaAahara: '', catAFormatOfAyurvedaAahara: '',
   catAHealthBenefitYesNo: '', catAHealthBenefitClaim: '', catAHealthBenefitFile: '', catAHealthBenefitAbstract: '',
    catADiseaseRiskYesNo: '', catADiseaseRiskStatement1: '', catADiseaseRiskStatement2: '',
    catADiseaseRiskStatement3: '', catADiseaseRiskFile: '', catADiseaseRiskAbstract: '',
    catAHealthBenefitEfficacyRows: [], catADiseaseRiskEvidenceRows: [],
    otherBotanicalsRationale: '', otherBotanicalsRationaleFile: '',
    catBHealthBenefitYesNo: '', catBHealthBenefitClaim: '', catBHealthBenefitFile: '', catBHealthBenefitAbstract: '',
    catBDiseaseRiskYesNo: '', catBDiseaseRiskStatement1: '', catBDiseaseRiskStatement2: '',
    catBDiseaseRiskStatement3: '', catBDiseaseRiskFile: '', catBDiseaseRiskAbstract: '',
    catBHealthBenefitEfficacyRows: [], catBDiseaseRiskEvidenceRows: [],
    catBSafetyDataFile: '', catBSafetyDataAbstract: '', catBSafetyEvidenceRows: [],
    diseaseRiskStatement1: '', diseaseRiskStatement2: '', diseaseRiskStatement3: '',
    humanInterventionStudies: '', humanInterventionStudiesFile: '',
    differentFormatRationale: '', differentFormatRationaleFile: '',
    efficacyDataFile: '', efficacyDataAbstract: '', catB1EfficacyEvidenceRows: [],
    b1LabelHealthBenefitYesNo: '', b1HealthBenefitFile: '', b1HealthBenefitAbstract: '',
    catB1HealthBenefitEvidenceRows: [],
    b1LabelDiseaseRiskYesNo: '', b1LabelDiseaseRiskStatement1: '', b1LabelDiseaseRiskStatement2: '',
    b1LabelDiseaseRiskStatement3: '', b1LabelDiseaseRiskFile: '', b1LabelDiseaseRiskAbstract: '',
    catB1HealthBenefitRationale: '', catB1DiseaseRiskEvidenceRows: [],
    catB1SafetyDataFile: '', catB1SafetyDataAbstract: '', catB1SafetyEvidenceRows: [],
    catB2HealthBenefit1YesNo: '', catB2HealthBenefit1File: '', catB2HealthBenefit1Abstract: '',
    catB2HealthBenefit1EvidenceRows: [],
    catB2HealthBenefit2YesNo: '', catB2HealthBenefit2File: '', catB2HealthBenefit2Abstract: '',
    catB2HealthBenefit2EvidenceRows: [],
    catB2DiseaseRisk1YesNo: '', catB2DiseaseRisk1Statement1: '', catB2DiseaseRisk1Statement2: '',
    catB2DiseaseRisk1Statement3: '', catB2DiseaseRisk1File: '', catB2DiseaseRisk1Abstract: '',
    catB2DiseaseRisk2YesNo: '', catB2DiseaseRisk2Statement1: '', catB2DiseaseRisk2Statement2: '',
    catB2DiseaseRisk2Statement3: '', catB2DiseaseRisk2File: '', catB2DiseaseRisk2Abstract: '',
    catB2HealthBenefit1Rationale: '', catB2HealthBenefit2Rationale: '',
    catB2DiseaseRisk1EvidenceRows: [], catB2DiseaseRisk2EvidenceRows: [],
    catB2SafetyDataFile: '', catB2SafetyDataAbstract: '', catB2SafetyEvidenceRows: [],
    productLabel: '',
    paymentMethod: 'Online Payment (NEFT/RTGS/UPI)', paymentReference: '',
    hasExistingRegistration: '', registrationNumber: '', registrationDate: '',
    licenseNumberExisting: '', licenseDate: '', registrationCertificate: '', licenseCertificate: '',
  };
}

function emptyIng(): IngredientRow {
  return { ingredientName: '', quantity: '', unit: '', referenceBook: '', referenceSource: '', classicalReference: '', ingredientPurpose: '' };
}
function emptyAdd(): AdditiveRow         { return { additiveName: '', quantity: '', purpose: '' }; }
function emptyBotanical(): OtherBotanicalRow { return { botanicalName: '', quantity: '', unit: '', rationale: '', botanicalNameOfAuthoritativeText: '', botanicalBookEditor: '', botanicalBookAuthor: '', botanicalBookVolume: '', botanicalBookSthana: '', botanicalReferenceChapter: '', botanicalReferenceVerse: '', botanicalBookPageNumbers: '', botanicalBookPublisher: '', botanicalPublicationYear: '', botanicalPublicationPlace: '', botanicalReferenceFile: '' }; }
function emptyEfficacy(): EfficacyRow { return { nameOfAuthoritativeText: '', referenceInAuthoritativeText: '', justificationRasaGunaViryaVipaka: '' }; }
function emptyEvidenceDosage(): EvidenceWithDosageRow { return { typeOfEvidence: '', nameOfJournalImpactFactor: '', geographicalLocationOfStudy: '', humanStudiesNumberOfSubjects: '', dosageAndDuration: '', conclusion: '' }; }
function countWords(text: string | null | undefined) { if (!text || text.trim() === '') return 0; return text.trim().split(/\s+/).length; }

// Returns 'A' | 'B' | 'B1' | 'B2' | ''
function getCatKey(cat: string): string {
  if (cat.startsWith('Category B2')) return 'B2';
  if (cat.startsWith('Category B1')) return 'B1';
  if (cat.startsWith('Category B'))  return 'B';
  if (cat.startsWith('Category A'))  return 'A';
  return '';
}

// ── Inline styles ─────────────────────────────────────────────────────────────
const input: React.CSSProperties = {
  width: '100%', border: `1px solid ${COLORS.border}`, borderRadius: 6,
  padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  fontFamily: "'Noto Sans','Segoe UI',sans-serif",
};
const textarea: React.CSSProperties = { ...input, resize: 'vertical', minHeight: 80 };
const select: React.CSSProperties   = { ...input, cursor: 'pointer', appearance: 'auto', background: '#fff', color: COLORS.text };
const secCard: React.CSSProperties  = {
  background: COLORS.white, border: `1px solid ${COLORS.border}`,
  borderRadius: 10, padding: 16, marginBottom: 12,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};
const catCard = (color: string): React.CSSProperties => ({
  ...secCard, borderLeft: `4px solid ${color}`,
});
const row: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
  marginBottom: 12, alignItems: 'start',
};
const fieldLabel: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: COLORS.text,
  paddingTop: 4, lineHeight: 1.5,
};
const tblTh: React.CSSProperties = {
  padding: '7px 8px', fontSize: 11, fontWeight: 700,
  background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}`,
  textAlign: 'left',
};
const tblTd: React.CSSProperties = {
  padding: '5px 6px', fontSize: 12, verticalAlign: 'middle',
};
const tblInput: React.CSSProperties = {
  width: '100%', border: `1px solid ${COLORS.border}`, borderRadius: 4,
  padding: '5px 7px', fontSize: 12, outline: 'none', boxSizing: 'border-box',
};

// Category accent colours
const CAT_COLORS: Record<string, string> = {
  A: '#1565C0', B: '#2E7D32', B1: '#6A1E55', B2: '#546E7A',
};

// ── Ayurveda Aahara Application Form ──────────────────────────────────────────
export default function AyurvedaAaharaApplicationForm() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const { user }  = useAuthStore();

  const idParam = params.get('id');

  const [appId, setAppId]           = useState<string | null>(idParam);
  const [step, setStep]             = useState(0);
  const [saving, setSaving]         = useState(false);
  const [dialog, setDialog]         = useState<{ msg: string; action: () => void } | null>(null);
  const [formData, setFormData]     = useState<AAFormData>(emptyAAFormData);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const [pendingIng, setPendingIng] = useState<IngredientRow>(emptyIng());
  const [pendingAdd, setPendingAdd] = useState<AdditiveRow>(emptyAdd());
  const [pendingBotanical, setPendingBotanical] = useState<OtherBotanicalRow>(emptyBotanical());
  const [pendingCatAEfficacy, setPendingCatAEfficacy] = useState<EfficacyRow>(emptyEfficacy());
  const [pendingCatAEvidence, setPendingCatAEvidence] = useState<EvidenceWithDosageRow>(emptyEvidenceDosage());
  const [pendingCatBEfficacy, setPendingCatBEfficacy] = useState<EfficacyRow>(emptyEfficacy());
  const [pendingCatBDiseaseEvidence, setPendingCatBDiseaseEvidence] = useState<EvidenceWithDosageRow>(emptyEvidenceDosage());
  const [pendingCatBSafetyEvidence, setPendingCatBSafetyEvidence] = useState<EvidenceWithDosageRow>(emptyEvidenceDosage());
  const [pendingCatB1EfficacyEvidence, setPendingCatB1EfficacyEvidence] = useState<EvidenceWithDosageRow>(emptyEvidenceDosage());
  const [pendingCatB1HealthBenefitEvidence, setPendingCatB1HealthBenefitEvidence] = useState<EvidenceWithDosageRow>(emptyEvidenceDosage());
  const [pendingCatB1DiseaseEvidence, setPendingCatB1DiseaseEvidence] = useState<EvidenceWithDosageRow>(emptyEvidenceDosage());
  const [pendingCatB1SafetyEvidence, setPendingCatB1SafetyEvidence] = useState<EvidenceWithDosageRow>(emptyEvidenceDosage());
  const [pendingCatB2HealthBenefit1Evidence, setPendingCatB2HealthBenefit1Evidence] = useState<EvidenceWithDosageRow>(emptyEvidenceDosage());
  const [pendingCatB2HealthBenefit2Evidence, setPendingCatB2HealthBenefit2Evidence] = useState<EvidenceWithDosageRow>(emptyEvidenceDosage());
  const [pendingCatB2Risk1Evidence, setPendingCatB2Risk1Evidence] = useState<EvidenceWithDosageRow>(emptyEvidenceDosage());
  const [pendingCatB2Risk2Evidence, setPendingCatB2Risk2Evidence] = useState<EvidenceWithDosageRow>(emptyEvidenceDosage());
  const [pendingCatB2SafetyEvidence, setPendingCatB2SafetyEvidence] = useState<EvidenceWithDosageRow>(emptyEvidenceDosage());

  useEffect(() => {
    if (idParam) {
      fetchApplication(idParam).then((app) => {
        setAppId(app.id);
        if (app.formData) setFormData({ ...emptyAAFormData(), ...(app.formData as unknown as AAFormData) });
      }).catch(() => toast.error('Could not load draft'));
    } else {
      fetchMyApplications()
        .then((apps) => {
          const existing = apps.find((a) => a.stage === 'Draft' && a.applicationType === 'AyurvedaAahara');
          if (existing) {
            setAppId(existing.id);
            if (existing.formData) setFormData({ ...emptyAAFormData(), ...(existing.formData as unknown as AAFormData) });
          } else {
            return createDraftApplication('AyurvedaAahara', user?.username || 'Draft').then((app) => setAppId(app.id));
          }
        })
        .catch(() => toast.error('Could not start application'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setField(field: keyof AAFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setStepErrors((p) => { const n = { ...p }; delete n[field as string]; return n; });
  }

  const errMsg = (field: string) =>
    stepErrors[field]
      ? <div className="form-field-error" style={{ fontSize: 11, color: COLORS.danger, marginTop: 3 }}>{stepErrors[field]}</div>
      : null;

  const eb = (base: React.CSSProperties, field: string): React.CSSProperties =>
    stepErrors[field] ? { ...base, borderColor: COLORS.danger } : base;

  function UB({ value, field }: { value: string; field: keyof AAFormData }) {
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

  function radioGroup(field: keyof AAFormData, currentValue: string) {
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

  function WordCounter({ value, limit = WORD_LIMIT }: { value: string; limit?: number }) {
    const wc = countWords(value);
    const over = wc > limit;
    return (
      <div style={{ fontSize: 10, color: over ? COLORS.danger : COLORS.textMuted, marginTop: 2, textAlign: 'right' }}>
        {wc} / {limit} words{over ? ' — exceeds limit' : ''}
      </div>
    );
  }

  // Inline textarea+upload block (avoids nesting components)
  function TaUB({ titleField, titleLabel, titleRequired, fileField, fileLabel, placeholder, wordLimit }: {
    titleField: keyof AAFormData; titleLabel: string; titleRequired?: boolean;
    fileField: keyof AAFormData; fileLabel?: string;
    placeholder?: string; wordLimit?: number;
  }) {
    const val = formData[titleField] as string;
    return (
      <>
        <div style={{ marginBottom: 10 }}>
          <label style={S.label}>{titleLabel}{titleRequired ? ' *' : ''}</label>
          <textarea
            style={eb(textarea, titleField as string)}
            placeholder={placeholder}
            value={val}
            onChange={(e) => setField(titleField, e.target.value)}
          />
          {wordLimit && <WordCounter value={val} limit={wordLimit} />}
          {errMsg(titleField as string)}
        </div>
        {fileLabel && (
          <div style={{ marginBottom: 10 }}>
            <label style={S.label}>{fileLabel}{titleRequired ? ' *' : ''}</label>
            <UB value={formData[fileField] as string} field={fileField} />
          </div>
        )}
      </>
    );
  }

  // Category label chip
  function CatBadge({ cat }: { cat: string }) {
    const color = CAT_COLORS[cat] ?? COLORS.primary;
    return (
      <span style={{ background: color + '15', color, border: `1px solid ${color}33`, borderRadius: 4, fontSize: 10, fontWeight: 700, padding: '2px 7px', marginLeft: 8, verticalAlign: 'middle' }}>
        Category {cat}
      </span>
    );
  }

  // ── Ingredient row helpers ─────────────────────────────────────────────────
  function addIngredient() {
    if (!pendingIng.ingredientName.trim()) {
      setStepErrors((p) => ({ ...p, pendingIng: 'Ingredient name is required' }));
      return;
    }
    setFormData((prev) => ({ ...prev, ingredients: [...prev.ingredients, { ...pendingIng }] }));
    setPendingIng(emptyIng());
    setStepErrors((p) => { const n = { ...p }; delete n.pendingIng; return n; });
  }

  function removeIngredient(idx: number) {
    setFormData((prev) => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== idx) }));
  }

  function updateIngredient(idx: number, field: keyof IngredientRow, value: string) {
    setFormData((prev) => {
      const rows = prev.ingredients.map((r, i) => i === idx ? { ...r, [field]: value } : r);
      return { ...prev, ingredients: rows };
    });
  }

  // ── Additive row helpers ───────────────────────────────────────────────────
  function addAdditive() {
    if (!pendingAdd.additiveName.trim()) {
      setStepErrors((p) => ({ ...p, pendingAdd: 'Additive name is required' }));
      return;
    }
    setFormData((prev) => ({ ...prev, additives: [...prev.additives, { ...pendingAdd }] }));
    setPendingAdd(emptyAdd());
    setStepErrors((p) => { const n = { ...p }; delete n.pendingAdd; return n; });
  }

  function removeAdditive(idx: number) {
    setFormData((prev) => ({ ...prev, additives: prev.additives.filter((_, i) => i !== idx) }));
  }

  function updateAdditive(idx: number, field: keyof AdditiveRow, value: string) {
    setFormData((prev) => {
      const rows = prev.additives.map((r, i) => i === idx ? { ...r, [field]: value } : r);
      return { ...prev, additives: rows };
    });
  }

  // ── Other Botanical row helpers (Cat B) ───────────────────────────────────
  function addBotanical() {
    if (!pendingBotanical.botanicalName.trim()) {
      setStepErrors((p) => ({ ...p, pendingBotanical: 'Botanical name is required' }));
      return;
    }
    setFormData((prev) => ({ ...prev, otherBotanicals: [...prev.otherBotanicals, { ...pendingBotanical }] }));
    setPendingBotanical(emptyBotanical());
    setStepErrors((p) => { const n = { ...p }; delete n.pendingBotanical; return n; });
  }

  function removeBotanical(idx: number) {
    setFormData((prev) => ({ ...prev, otherBotanicals: prev.otherBotanicals.filter((_, i) => i !== idx) }));
  }

  function updateBotanical(idx: number, field: keyof OtherBotanicalRow, value: string) {
    setFormData((prev) => {
      const rows = prev.otherBotanicals.map((r, i) => i === idx ? { ...r, [field]: value } : r);
      return { ...prev, otherBotanicals: rows };
    });
  }

  // ── Generic helpers for repeatable evidence / efficacy rows ──────────────
  type ArrField = keyof { [K in keyof AAFormData as AAFormData[K] extends unknown[] ? K : never]: AAFormData[K] };

  function addEfficacyRow(field: ArrField, pending: EfficacyRow, clearFn: () => void) {
    setFormData((prev) => ({ ...prev, [field]: [...(prev[field] as EfficacyRow[]), { ...pending }] }));
    clearFn();
  }
  function removeEfficacyRow(field: ArrField, idx: number) {
    setFormData((prev) => ({ ...prev, [field]: (prev[field] as EfficacyRow[]).filter((_, i) => i !== idx) }));
  }
  function updateEfficacyRow(field: ArrField, idx: number, col: keyof EfficacyRow, value: string) {
    setFormData((prev) => ({ ...prev, [field]: (prev[field] as EfficacyRow[]).map((r, i) => i === idx ? { ...r, [col]: value } : r) }));
  }

  function addEvidenceDosageRow(field: ArrField, pending: EvidenceWithDosageRow, clearFn: () => void) {
    setFormData((prev) => ({ ...prev, [field]: [...(prev[field] as EvidenceWithDosageRow[]), { ...pending }] }));
    clearFn();
  }
  function removeEvidenceDosageRow(field: ArrField, idx: number) {
    setFormData((prev) => ({ ...prev, [field]: (prev[field] as EvidenceWithDosageRow[]).filter((_, i) => i !== idx) }));
  }
  function updateEvidenceDosageRow(field: ArrField, idx: number, col: keyof EvidenceWithDosageRow, value: string) {
    setFormData((prev) => ({ ...prev, [field]: (prev[field] as EvidenceWithDosageRow[]).map((r, i) => i === idx ? { ...r, [col]: value } : r) }));
  }

  function EvidenceDosageTable({
    field,
    rows,
    pending,
    setPending,
  }: {
    field: ArrField;
    rows: EvidenceWithDosageRow[];
    pending: EvidenceWithDosageRow;
    setPending: React.Dispatch<React.SetStateAction<EvidenceWithDosageRow>>;
  }) {
    return (
      <>
        {rows.length > 0 && (
          <div style={{ overflowX: 'auto', marginBottom: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['#', 'Type of Evidence', 'Journal / IF', 'Location', 'Subjects', 'Dosage & Duration', 'Conclusion', 'Remove'].map((h) => <th key={h} style={tblTh}>{h}</th>)}</tr></thead>
              <tbody>{rows.map((r, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : COLORS.bg }}>
                  <td style={tblTd}>{idx + 1}</td>
                  <td style={tblTd}><input style={tblInput} value={r.typeOfEvidence} onChange={(e) => updateEvidenceDosageRow(field, idx, 'typeOfEvidence', e.target.value)} /></td>
                  <td style={tblTd}><input style={tblInput} value={r.nameOfJournalImpactFactor} onChange={(e) => updateEvidenceDosageRow(field, idx, 'nameOfJournalImpactFactor', e.target.value)} /></td>
                  <td style={tblTd}><input style={tblInput} value={r.geographicalLocationOfStudy} onChange={(e) => updateEvidenceDosageRow(field, idx, 'geographicalLocationOfStudy', e.target.value)} /></td>
                  <td style={tblTd}><input style={{ ...tblInput, width: 60 }} value={r.humanStudiesNumberOfSubjects} onChange={(e) => updateEvidenceDosageRow(field, idx, 'humanStudiesNumberOfSubjects', e.target.value)} /></td>
                  <td style={tblTd}><input style={tblInput} value={r.dosageAndDuration} onChange={(e) => updateEvidenceDosageRow(field, idx, 'dosageAndDuration', e.target.value)} /></td>
                  <td style={tblTd}><input style={tblInput} value={r.conclusion} onChange={(e) => updateEvidenceDosageRow(field, idx, 'conclusion', e.target.value)} /></td>
                  <td style={tblTd}><button onClick={() => removeEvidenceDosageRow(field, idx)} style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer', fontSize: 16 }}>×</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <div style={{ background: COLORS.bg, border: `1px dashed ${COLORS.border}`, borderRadius: 6, padding: 8, marginBottom: 4 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 60px 1fr 1fr auto', gap: 6 }}>
            <input style={tblInput} placeholder="Type of evidence" value={pending.typeOfEvidence} onChange={(e) => setPending((p) => ({ ...p, typeOfEvidence: e.target.value }))} />
            <input style={tblInput} placeholder="Journal / IF" value={pending.nameOfJournalImpactFactor} onChange={(e) => setPending((p) => ({ ...p, nameOfJournalImpactFactor: e.target.value }))} />
            <input style={tblInput} placeholder="Location" value={pending.geographicalLocationOfStudy} onChange={(e) => setPending((p) => ({ ...p, geographicalLocationOfStudy: e.target.value }))} />
            <input style={tblInput} placeholder="Subj." value={pending.humanStudiesNumberOfSubjects} onChange={(e) => setPending((p) => ({ ...p, humanStudiesNumberOfSubjects: e.target.value }))} />
            <input style={tblInput} placeholder="Dosage & duration" value={pending.dosageAndDuration} onChange={(e) => setPending((p) => ({ ...p, dosageAndDuration: e.target.value }))} />
            <input style={tblInput} placeholder="Conclusion" value={pending.conclusion} onChange={(e) => setPending((p) => ({ ...p, conclusion: e.target.value }))} />
            <button onClick={() => addEvidenceDosageRow(field, pending, () => setPending(emptyEvidenceDosage()))} style={{ background: catColor, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
          </div>
        </div>
      </>
    );
  }

  type ReferenceTarget = 'B' | 'B1' | 'B2';
  const referenceFieldMap: Record<ReferenceTarget, {
    name: keyof AAFormData;
    format: keyof AAFormData;
    books: keyof AAFormData;
    text: keyof AAFormData;
    editor: keyof AAFormData;
    author: keyof AAFormData;
    volume: keyof AAFormData;
    sthana: keyof AAFormData;
    chapter: keyof AAFormData;
    verse: keyof AAFormData;
    pages: keyof AAFormData;
    publisher: keyof AAFormData;
    year: keyof AAFormData;
    place: keyof AAFormData;
    recipe: keyof AAFormData;
    scan: keyof AAFormData;
  }> = {
    B: {
      name: 'catBNameOfAyurvedaAahara', format: 'catBFormatOfAyurvedaAahara',
      books: 'catBAyurvedaBookMultiSelect', text: 'catBNameOfAuthoritativeText',
      editor: 'catBBookEditor', author: 'catBBookAuthor', volume: 'catBBookVolume', sthana: 'catBBookSthana',
      chapter: 'catBReferenceChapter', verse: 'catBReferenceVerse', pages: 'catBBookPageNumbers',
      publisher: 'catBBookPublisher', year: 'catBBookPublicationYear', place: 'catBBookPublicationPlace',
      recipe: 'catBAyurvedaAaharaRecipe', scan: 'catBAuthoritativeBookScanFile',
    },
    B1: {
      name: 'catB1NameOfAyurvedaAahara', format: 'catB1FormatOfAyurvedaAahara',
      books: 'catB1AyurvedaBookMultiSelect', text: 'catB1NameOfAuthoritativeText',
      editor: 'catB1BookEditor', author: 'catB1BookAuthor', volume: 'catB1BookVolume', sthana: 'catB1BookSthana',
      chapter: 'catB1ReferenceChapter', verse: 'catB1ReferenceVerse', pages: 'catB1BookPageNumbers',
      publisher: 'catB1BookPublisher', year: 'catB1BookPublicationYear', place: 'catB1BookPublicationPlace',
      recipe: 'catB1AyurvedaAaharaRecipe', scan: 'catB1AuthoritativeBookScanFile',
    },
    B2: {
      name: 'catB2NameOfAyurvedaAahara', format: 'catB2FormatOfAyurvedaAahara',
      books: 'catB2AyurvedaBookMultiSelect', text: 'catB2NameOfAuthoritativeText',
      editor: 'catB2BookEditor', author: 'catB2BookAuthor', volume: 'catB2BookVolume', sthana: 'catB2BookSthana',
      chapter: 'catB2ReferenceChapter', verse: 'catB2ReferenceVerse', pages: 'catB2BookPageNumbers',
      publisher: 'catB2BookPublisher', year: 'catB2BookPublicationYear', place: 'catB2BookPublicationPlace',
      recipe: 'catB2AyurvedaAaharaRecipe', scan: 'catB2AuthoritativeBookScanFile',
    },
  };

  function stringField(field: keyof AAFormData) {
    return String(d[field] ?? '');
  }

  function CategoryReferenceBlock({ target }: { target: ReferenceTarget }) {
    const fields = referenceFieldMap[target];
    const selectedBooks = stringField(fields.books);

    return (
      <div style={catCard(catColor)}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: catColor }}>
          Traditional Ayurveda Reference <CatBadge cat={target} />
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
          Provide the authoritative Ayurvedic text reference for this formulation.
        </div>
        <div style={row}>
          <label style={fieldLabel}>Name of the Ayurveda Aahara
            <span style={{ fontWeight: 400, color: COLORS.textMuted, fontSize: 11, display: 'block', marginTop: 2 }}>Max 50 words</span>
          </label>
          <div>
            <textarea style={eb(textarea, fields.name as string)} value={stringField(fields.name)} onChange={(e) => setField(fields.name, e.target.value)} />
            <WordCounter value={stringField(fields.name)} limit={50} />
            {errMsg(fields.name as string)}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Format of Proposed Ayurveda Aahara</label>
          <div>
            <input style={eb(input, fields.format as string)} placeholder="e.g. Powder, Tablet, Capsule, Liquid" value={stringField(fields.format)} onChange={(e) => setField(fields.format, e.target.value)} />
            {errMsg(fields.format as string)}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Authoritative Books (select all applicable) *</label>
          <div>
            <select
              multiple
              style={{ ...select, minHeight: 120 }}
              value={selectedBooks ? selectedBooks.split('||') : []}
              onChange={(e) => {
                const sel = Array.from(e.target.selectedOptions).map((o) => o.value);
                setField(fields.books, sel.join('||'));
              }}
            >
              {REFERENCE_BOOKS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>Hold Ctrl / Cmd to select multiple</div>
            {errMsg(fields.books as string)}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Name of Authoritative Text</label>
          <input style={input} value={stringField(fields.text)} onChange={(e) => setField(fields.text, e.target.value)} placeholder="As it appears in the book..." />
        </div>
        <div style={{ marginTop: 8, marginBottom: 4, fontWeight: 600, fontSize: 12, color: catColor }}>Bibliographic Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div><label style={S.label}>Editor(s)</label><input style={input} placeholder="e.g. P.V. Sharma" value={stringField(fields.editor)} onChange={(e) => setField(fields.editor, e.target.value)} /></div>
          <div><label style={S.label}>Author(s)</label><input style={input} placeholder="e.g. Charaka, Sushruta" value={stringField(fields.author)} onChange={(e) => setField(fields.author, e.target.value)} /></div>
          <div><label style={S.label}>Volume / Part</label><input style={input} placeholder="e.g. Volume I, Part II" value={stringField(fields.volume)} onChange={(e) => setField(fields.volume, e.target.value)} /></div>
          <div><label style={S.label}>Sthana (Section)</label><input style={input} placeholder="e.g. Sutrasthana" value={stringField(fields.sthana)} onChange={(e) => setField(fields.sthana, e.target.value)} /></div>
          <div><label style={S.label}>Chapter (Adhyaya) Name &amp; Number</label><input style={input} placeholder="e.g. Ahara Vidhi, Chapter 5" value={stringField(fields.chapter)} onChange={(e) => setField(fields.chapter, e.target.value)} /></div>
          <div><label style={S.label}>Verse (Shloka) Number(s)</label><input style={input} placeholder="e.g. 10–15" value={stringField(fields.verse)} onChange={(e) => setField(fields.verse, e.target.value)} /></div>
          <div><label style={S.label}>Page Numbers</label><input style={input} placeholder="e.g. 234–240" value={stringField(fields.pages)} onChange={(e) => setField(fields.pages, e.target.value)} /></div>
          <div><label style={S.label}>Publisher</label><input style={input} placeholder="e.g. CCRAS, Govt. Publication" value={stringField(fields.publisher)} onChange={(e) => setField(fields.publisher, e.target.value)} /></div>
          <div><label style={S.label}>Publication Year</label><input style={input} placeholder="e.g. 2015" value={stringField(fields.year)} onChange={(e) => setField(fields.year, e.target.value)} /></div>
          <div><label style={S.label}>Publication Place</label><input style={input} placeholder="e.g. New Delhi, India" value={stringField(fields.place)} onChange={(e) => setField(fields.place, e.target.value)} /></div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={S.label}>Ayurveda Aahara Recipe</label>
          <select style={select} value={stringField(fields.recipe)} onChange={(e) => setField(fields.recipe, e.target.value)}>
            <option value="">Select...</option>
            <option value="To be placed in Annexure">To be placed in Annexure</option>
          </select>
          {errMsg(fields.recipe as string)}
        </div>
        <div>
          <label style={S.label}>Upload Scanned Pages of Authoritative Book *</label>
          <UB value={stringField(fields.scan)} field={fields.scan} />
          {errMsg(fields.scan as string)}
        </div>
      </div>
    );
  }

  function B1FormatRationaleBlock() {
    return (
      <div style={catCard(catColor)}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: catColor }}>
          Format Rationale &amp; Efficacy Data <CatBadge cat="B1" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Rationale for Different Format *</label>
          <textarea style={eb(textarea, 'differentFormatRationale')} value={d.differentFormatRationale} onChange={(e) => setField('differentFormatRationale', e.target.value)} placeholder="Explain why the proposed format differs from classical Ayurvedic preparations and why it is justified..." />
          <WordCounter value={d.differentFormatRationale} limit={500} />
          {errMsg('differentFormatRationale')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={S.label}>Supporting Document for Format Rationale</label>
            <UB value={d.differentFormatRationaleFile} field="differentFormatRationaleFile" />
          </div>
          <div>
            <label style={S.label}>Efficacy Data Upload *</label>
            <UB value={d.efficacyDataFile} field="efficacyDataFile" />
            {errMsg('efficacyDataFile')}
          </div>
        </div>
        <div>
          <label style={S.label}>Efficacy Data Abstract *</label>
          <textarea style={eb(textarea, 'efficacyDataAbstract')} value={d.efficacyDataAbstract} onChange={(e) => setField('efficacyDataAbstract', e.target.value)} placeholder="250-300 word abstract summarising efficacy evidence..." />
          <WordCounter value={d.efficacyDataAbstract} limit={300} />
          {errMsg('efficacyDataAbstract')}
        </div>
        <div style={{ marginTop: 12, marginBottom: 4, fontWeight: 600, fontSize: 12, color: catColor }}>Efficacy Evidence</div>
        <EvidenceDosageTable field="catB1EfficacyEvidenceRows" rows={d.catB1EfficacyEvidenceRows} pending={pendingCatB1EfficacyEvidence} setPending={setPendingCatB1EfficacyEvidence} />
        {errMsg('catB1EfficacyEvidenceRows')}
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
    const cat = getCatKey(d.ayurvedaCategory);
    const hasIncompleteDosageRows = (rows: EvidenceWithDosageRow[]) =>
      rows.some((r) =>
        !r.typeOfEvidence.trim() ||
        !r.nameOfJournalImpactFactor.trim() ||
        !r.geographicalLocationOfStudy.trim() ||
        !r.humanStudiesNumberOfSubjects.trim() ||
        !r.dosageAndDuration.trim() ||
        !r.conclusion.trim()
      );

    if (stepIndex === 0) {
      if (!d.ayurvedaCategory)                    errs.ayurvedaCategory      = 'Please select a category';
      if (!d.applicantName.trim())                errs.applicantName         = 'This field is required';
      if (!d.nameOfOrganization.trim())             errs.nameOfOrganization    = 'This field is required';
      if (!d.registeredOfficeAddress.trim())       errs.registeredOfficeAddress = 'This field is required';
      if (!d.manufacturingAddress.trim())         errs.manufacturingAddress  = 'This field is required';
      if (!d.manufacturingPremisesContactDetails.trim()) errs.manufacturingPremisesContactDetails = 'This field is required';
      if (!d.authorisedPerson.trim())             errs.authorisedPerson      = 'This field is required';
      const emailErr = validateEmail(d.authorisedEmail);
      if (emailErr) errs.authorisedEmail = emailErr;
      const phoneErr = validatePhone(d.authorisedContact);
      if (phoneErr) errs.authorisedContact = phoneErr;
      if (!d.natureOfBusiness.trim())             errs.natureOfBusiness      = 'This field is required';
      if (countWords(d.natureOfBusiness) > 100)   errs.natureOfBusiness      = 'Nature of business exceeds 100 words';
      if (!d.productName.trim())                  errs.productName           = 'This field is required';
      if (!d.justificationOfProposedAyurvedaAahara.trim()) errs.justificationOfProposedAyurvedaAahara = 'This field is required';
      if (countWords(d.justificationOfProposedAyurvedaAahara) > 100) errs.justificationOfProposedAyurvedaAahara = 'Justification exceeds 100 words';
      if (!d.functionalUse.trim())                errs.functionalUse         = 'This field is required';
      if (countWords(d.functionalUse) > 500)      errs.functionalUse         = 'Functional use exceeds 500 words';
      if (!d.intendedUse.trim())                  errs.intendedUse           = 'This field is required';
      if (countWords(d.intendedUse) > 100)        errs.intendedUse           = 'Intended use exceeds 100 words';
      if (!d.certificateOfAnalysis)               errs.certificateOfAnalysis = 'Certificate of Analysis is required';
    }

    if (stepIndex === 1) {
      if (d.ingredients.length === 0)   errs.ingredients        = 'At least one ingredient is required';
      if (pendingIng.ingredientName.trim())
        errs.pendingIng = 'Please click "+ Add" to add the pending ingredient, or clear it first';
      if (pendingAdd.additiveName.trim())
        errs.pendingAdd = 'Please click "+ Add" to add the pending additive, or clear it first';
      if (pendingBotanical.botanicalName.trim())
        errs.pendingBotanical = 'Please click "+ Add" to add the pending botanical, or clear it first';
      if (!d.ingredientListFile)        errs.ingredientListFile = 'Ingredient list PDF is required';
      if (!d.hasSpecifications)         errs.hasSpecifications  = 'Please select Yes or No';
      if (d.hasSpecifications === 'Yes' && !d.specificationsFile)
        errs.specificationsFile = 'Specifications document is required';
      // Category A: traditional reference book + book scan required
      if (cat === 'A') {
        if (!d.catANameOfAyurvedaAahara.trim())
          errs.catANameOfAyurvedaAahara = 'Name of Ayurveda Aahara is required for Category A';
        if (countWords(d.catANameOfAyurvedaAahara) > 50)
          errs.catANameOfAyurvedaAahara = 'Name of Ayurveda Aahara must not exceed 50 words';
        if (!d.catAFormatOfAyurvedaAahara.trim())
          errs.catAFormatOfAyurvedaAahara = 'Format of proposed Ayurveda Aahara is required for Category A';
        if (!d.ayurvedaReferenceBook.trim())
          errs.ayurvedaReferenceBook = 'Reference book is required for Category A';
        if (!d.ayurvedaBookMultiSelect)
          errs.ayurvedaBookMultiSelect = 'Please select at least one authoritative book for Category A';
        if (!d.ayurvedaAaharaRecipe)
          errs.ayurvedaAaharaRecipe = 'Please indicate the Ayurveda Aahara recipe placement for Category A';
        if (!d.authoritativeBookScanFile)
          errs.authoritativeBookScanFile = 'Scanned book pages are required for Category A';
        // Ingredient Reference Mapping — each row must have referenceSource, classicalReference, and ingredientPurpose
        d.ingredients.forEach((ing, idx) => {
          if (!ing.referenceSource.trim())
            errs[`ing_referenceSource_${idx}`] = `Ingredient ${idx + 1}: Reference Source is required for Category A`;
          if (!ing.classicalReference.trim())
            errs[`ing_classicalReference_${idx}`] = `Ingredient ${idx + 1}: Classical Reference is required for Category A`;
          if (!ing.ingredientPurpose.trim())
            errs[`ing_ingredientPurpose_${idx}`] = `Ingredient ${idx + 1}: Ayurvedic Purpose is required for Category A`;
        });
      }
      if (cat === 'B') {
        if (!d.catBNameOfAyurvedaAahara.trim()) errs.catBNameOfAyurvedaAahara = 'Name of Ayurveda Aahara is required for Category B';
        if (countWords(d.catBNameOfAyurvedaAahara) > 50) errs.catBNameOfAyurvedaAahara = 'Name of Ayurveda Aahara must not exceed 50 words';
        if (!d.catBFormatOfAyurvedaAahara.trim()) errs.catBFormatOfAyurvedaAahara = 'Format of proposed Ayurveda Aahara is required for Category B';
        if (!d.catBAyurvedaBookMultiSelect)   errs.catBAyurvedaBookMultiSelect   = 'Please select at least one authoritative book for Category B';
        if (!d.catBAyurvedaAaharaRecipe)      errs.catBAyurvedaAaharaRecipe      = 'Please indicate the Ayurveda Aahara recipe placement for Category B';
        if (!d.catBAuthoritativeBookScanFile) errs.catBAuthoritativeBookScanFile = 'Scanned book pages are required for Category B';
      }
      if (cat === 'B1') {
        if (!d.catB1NameOfAyurvedaAahara.trim()) errs.catB1NameOfAyurvedaAahara = 'Name of Ayurveda Aahara is required for Category B1';
        if (countWords(d.catB1NameOfAyurvedaAahara) > 50) errs.catB1NameOfAyurvedaAahara = 'Name of Ayurveda Aahara must not exceed 50 words';
        if (!d.catB1FormatOfAyurvedaAahara.trim()) errs.catB1FormatOfAyurvedaAahara = 'Format of proposed Ayurveda Aahara is required for Category B1';
        if (!d.catB1AyurvedaBookMultiSelect)   errs.catB1AyurvedaBookMultiSelect   = 'Please select at least one authoritative book for Category B1';
        if (!d.catB1AyurvedaAaharaRecipe)      errs.catB1AyurvedaAaharaRecipe      = 'Please indicate the Ayurveda Aahara recipe placement for Category B1';
        if (!d.catB1AuthoritativeBookScanFile) errs.catB1AuthoritativeBookScanFile = 'Scanned book pages are required for Category B1';
        if (!d.differentFormatRationale.trim())       errs.differentFormatRationale      = 'This field is required for Category B1';
        if (!d.efficacyDataFile)                      errs.efficacyDataFile              = 'Efficacy data document is required for Category B1';
        if (!d.efficacyDataAbstract.trim())           errs.efficacyDataAbstract          = 'Efficacy data abstract is required for Category B1';
        if (d.catB1EfficacyEvidenceRows.length === 0)
          errs.catB1EfficacyEvidenceRows = 'At least one efficacy evidence row is required for Category B1';
        if (hasIncompleteDosageRows(d.catB1EfficacyEvidenceRows))
          errs.catB1EfficacyEvidenceRows = 'Complete all efficacy evidence columns';
      }
      if (cat === 'B2') {
        if (!d.catB2NameOfAyurvedaAahara.trim()) errs.catB2NameOfAyurvedaAahara = 'Name of Ayurveda Aahara is required for Category B2';
        if (countWords(d.catB2NameOfAyurvedaAahara) > 50) errs.catB2NameOfAyurvedaAahara = 'Name of Ayurveda Aahara must not exceed 50 words';
        if (!d.catB2FormatOfAyurvedaAahara.trim()) errs.catB2FormatOfAyurvedaAahara = 'Format of proposed Ayurveda Aahara is required for Category B2';
        if (!d.catB2AyurvedaBookMultiSelect)   errs.catB2AyurvedaBookMultiSelect   = 'Please select at least one authoritative book for Category B2';
        if (!d.catB2AyurvedaAaharaRecipe)      errs.catB2AyurvedaAaharaRecipe      = 'Please indicate the Ayurveda Aahara recipe placement for Category B2';
        if (!d.catB2AuthoritativeBookScanFile) errs.catB2AuthoritativeBookScanFile = 'Scanned book pages are required for Category B2';
      }
    }

    if (stepIndex === 2) {
      if (!d.targetPopulation.trim())   errs.targetPopulation  = 'This field is required';
      if (!d.servingSize.trim())        errs.servingSize       = 'This field is required';
      if (!d.directionsForUse.trim())   errs.directionsForUse  = 'This field is required';
      if (!d.packageMaterial.trim())    errs.packageMaterial   = 'Type of package / packaging material is required';
      if (!d.fssConformance)            errs.fssConformance    = 'Please indicate FSS(P)R 2018 conformance';
      if (cat !== 'B' && !d.productLabel) errs.productLabel     = 'Product label is required';
      // Category A claim support
      if (cat === 'A') {
        if (!d.catANameOfAyurvedaAahara.trim())
          errs.catANameOfAyurvedaAahara = 'Name of Ayurveda Aahara is required for Category A';
        if (countWords(d.catANameOfAyurvedaAahara) > 50)
          errs.catANameOfAyurvedaAahara = 'Name of Ayurveda Aahara must not exceed 50 words';
        if (!d.catAFormatOfAyurvedaAahara.trim())
          errs.catAFormatOfAyurvedaAahara = 'Format of proposed Ayurveda Aahara is required for Category A';
        // catAHealthBenefitYesNo radio must be answered
        if (!d.catAHealthBenefitYesNo)               errs.catAHealthBenefitYesNo        = 'Please indicate whether a health benefit claim is proposed';
        if (d.catAHealthBenefitYesNo === 'Yes') {
          if (!d.catAHealthBenefitClaim.trim())      errs.catAHealthBenefitClaim        = 'Health Benefit Claim text is required';
          if (!d.catAHealthBenefitFile)              errs.catAHealthBenefitFile         = 'Supporting document is required';
          if (!d.catAHealthBenefitAbstract.trim())   errs.catAHealthBenefitAbstract     = 'Abstract / Summary is required';
        }
        // catADiseaseRiskYesNo radio must be answered
        if (!d.catADiseaseRiskYesNo)                 errs.catADiseaseRiskYesNo          = 'Please indicate whether a disease risk reduction claim is proposed';
        if (d.catADiseaseRiskYesNo === 'Yes') {
          if (!d.catADiseaseRiskStatement1.trim())   errs.catADiseaseRiskStatement1     = 'At least one disease risk statement is required';
          if (!d.catADiseaseRiskFile)                errs.catADiseaseRiskFile           = 'Supporting document is required for disease risk claim';
          if (!d.catADiseaseRiskAbstract.trim())     errs.catADiseaseRiskAbstract       = 'Abstract / Summary is required for disease risk claim';
          if (d.catADiseaseRiskEvidenceRows.length === 0)
            errs.catADiseaseRiskEvidenceRows = 'At least one disease risk evidence row is required';
          if (hasIncompleteDosageRows(d.catADiseaseRiskEvidenceRows))
            errs.catADiseaseRiskEvidenceRows = 'Complete all disease risk evidence columns, including dosage and duration';
        }
      }
      // Category B
      if (cat === 'B') {
        if (!d.catBNameOfAyurvedaAahara.trim()) errs.catBNameOfAyurvedaAahara = 'Name of Ayurveda Aahara is required for Category B';
        if (countWords(d.catBNameOfAyurvedaAahara) > 50) errs.catBNameOfAyurvedaAahara = 'Name of Ayurveda Aahara must not exceed 50 words';
        if (!d.catBFormatOfAyurvedaAahara.trim()) errs.catBFormatOfAyurvedaAahara = 'Format of proposed Ayurveda Aahara is required for Category B';
        if (!d.catBAyurvedaBookMultiSelect)   errs.catBAyurvedaBookMultiSelect   = 'Please select at least one authoritative book for Category B';
        if (!d.catBAyurvedaAaharaRecipe)      errs.catBAyurvedaAaharaRecipe      = 'Please indicate the Ayurveda Aahara recipe placement for Category B';
        if (!d.catBAuthoritativeBookScanFile) errs.catBAuthoritativeBookScanFile = 'Scanned book pages are required for Category B';
        // catBHealthBenefitYesNo radio must be answered
        if (!d.catBHealthBenefitYesNo)               errs.catBHealthBenefitYesNo        = 'Please indicate whether a health benefit claim is proposed';
        if (d.catBHealthBenefitYesNo === 'Yes') {
          if (!d.catBHealthBenefitClaim.trim())      errs.catBHealthBenefitClaim        = 'Health Benefit Claim text is required';
          if (!d.catBHealthBenefitFile)              errs.catBHealthBenefitFile         = 'Supporting document is required';
          if (!d.catBHealthBenefitAbstract.trim())   errs.catBHealthBenefitAbstract     = 'Abstract / Summary is required';
        }
        // catBDiseaseRiskYesNo radio must be answered
        if (!d.catBDiseaseRiskYesNo)                 errs.catBDiseaseRiskYesNo          = 'Please indicate whether a disease risk reduction claim is proposed';
        if (d.catBDiseaseRiskYesNo === 'Yes') {
          if (!d.catBDiseaseRiskStatement1.trim())   errs.catBDiseaseRiskStatement1     = 'At least one disease risk statement is required';
          if (!d.catBDiseaseRiskFile)                errs.catBDiseaseRiskFile           = 'Supporting document is required for disease risk claim';
          if (!d.catBDiseaseRiskAbstract.trim())     errs.catBDiseaseRiskAbstract       = 'Abstract / Summary is required for disease risk claim';
        }
      }
      // Category B1
      if (cat === 'B1') {
        if (!d.catB1NameOfAyurvedaAahara.trim()) errs.catB1NameOfAyurvedaAahara = 'Name of Ayurveda Aahara is required for Category B1';
        if (countWords(d.catB1NameOfAyurvedaAahara) > 50) errs.catB1NameOfAyurvedaAahara = 'Name of Ayurveda Aahara must not exceed 50 words';
        if (!d.catB1FormatOfAyurvedaAahara.trim()) errs.catB1FormatOfAyurvedaAahara = 'Format of proposed Ayurveda Aahara is required for Category B1';
        if (!d.catB1AyurvedaBookMultiSelect)   errs.catB1AyurvedaBookMultiSelect   = 'Please select at least one authoritative book for Category B1';
        if (!d.catB1AyurvedaAaharaRecipe)      errs.catB1AyurvedaAaharaRecipe      = 'Please indicate the Ayurveda Aahara recipe placement for Category B1';
        if (!d.catB1AuthoritativeBookScanFile) errs.catB1AuthoritativeBookScanFile = 'Scanned book pages are required for Category B1';
        if (!d.b1LabelHealthBenefitYesNo)              errs.b1LabelHealthBenefitYesNo   = 'Please indicate whether a health benefit claim is proposed';
        if (d.b1LabelHealthBenefitYesNo === 'Yes') {
          if (!d.b1HealthBenefitFile)                  errs.b1HealthBenefitFile         = 'Supporting document is required';
          if (!d.b1HealthBenefitAbstract.trim())       errs.b1HealthBenefitAbstract     = 'Abstract / Summary is required';
          if (d.catB1HealthBenefitEvidenceRows.length === 0)
            errs.catB1HealthBenefitEvidenceRows = 'At least one health benefit evidence row is required';
          if (hasIncompleteDosageRows(d.catB1HealthBenefitEvidenceRows))
            errs.catB1HealthBenefitEvidenceRows = 'Complete all health benefit evidence columns';
        }
        if (!d.b1LabelDiseaseRiskYesNo)                errs.b1LabelDiseaseRiskYesNo     = 'Please indicate whether a disease risk reduction claim is proposed';
        if (d.b1LabelDiseaseRiskYesNo === 'Yes') {
          if (!d.b1LabelDiseaseRiskStatement1.trim())  errs.b1LabelDiseaseRiskStatement1 = 'At least one disease risk statement is required';
          if (!d.b1LabelDiseaseRiskFile)               errs.b1LabelDiseaseRiskFile       = 'Supporting document is required for disease risk claim';
          if (!d.b1LabelDiseaseRiskAbstract.trim())    errs.b1LabelDiseaseRiskAbstract   = 'Abstract / Summary is required for disease risk claim';
        }
      }
      // Category B2
      if (cat === 'B2') {
        if (!d.catB2NameOfAyurvedaAahara.trim()) errs.catB2NameOfAyurvedaAahara = 'Name of Ayurveda Aahara is required for Category B2';
        if (countWords(d.catB2NameOfAyurvedaAahara) > 50) errs.catB2NameOfAyurvedaAahara = 'Name of Ayurveda Aahara must not exceed 50 words';
        if (!d.catB2FormatOfAyurvedaAahara.trim()) errs.catB2FormatOfAyurvedaAahara = 'Format of proposed Ayurveda Aahara is required for Category B2';
        if (!d.catB2AyurvedaBookMultiSelect)   errs.catB2AyurvedaBookMultiSelect   = 'Please select at least one authoritative book for Category B2';
        if (!d.catB2AyurvedaAaharaRecipe)      errs.catB2AyurvedaAaharaRecipe      = 'Please indicate the Ayurveda Aahara recipe placement for Category B2';
        if (!d.catB2AuthoritativeBookScanFile) errs.catB2AuthoritativeBookScanFile = 'Scanned book pages are required for Category B2';
        if (!d.catB2HealthBenefit1YesNo)               errs.catB2HealthBenefit1YesNo    = 'Please indicate whether Health Benefit Claim 1 is proposed';
        if (d.catB2HealthBenefit1YesNo === 'Yes') {
          if (!d.catB2HealthBenefit1File)              errs.catB2HealthBenefit1File     = 'Supporting document is required for Claim 1';
          if (!d.catB2HealthBenefit1Abstract.trim())   errs.catB2HealthBenefit1Abstract = 'Abstract / Summary is required for Claim 1';
          if (d.catB2HealthBenefit1EvidenceRows.length === 0)
            errs.catB2HealthBenefit1EvidenceRows = 'At least one evidence row is required for Claim 1';
          if (hasIncompleteDosageRows(d.catB2HealthBenefit1EvidenceRows))
            errs.catB2HealthBenefit1EvidenceRows = 'Complete all evidence columns for Claim 1';
        }
        if (!d.catB2HealthBenefit2YesNo)               errs.catB2HealthBenefit2YesNo    = 'Please indicate whether Health Benefit Claim 2 is proposed';
        if (d.catB2HealthBenefit2YesNo === 'Yes') {
          if (!d.catB2HealthBenefit2File)              errs.catB2HealthBenefit2File     = 'Supporting document is required for Claim 2';
          if (!d.catB2HealthBenefit2Abstract.trim())   errs.catB2HealthBenefit2Abstract = 'Abstract / Summary is required for Claim 2';
          if (d.catB2HealthBenefit2EvidenceRows.length === 0)
            errs.catB2HealthBenefit2EvidenceRows = 'At least one evidence row is required for Claim 2';
          if (hasIncompleteDosageRows(d.catB2HealthBenefit2EvidenceRows))
            errs.catB2HealthBenefit2EvidenceRows = 'Complete all evidence columns for Claim 2';
        }
        if (!d.catB2DiseaseRisk1YesNo)                 errs.catB2DiseaseRisk1YesNo      = 'Please indicate whether Disease Risk Reduction Claim 1 is proposed';
        if (d.catB2DiseaseRisk1YesNo === 'Yes') {
          if (!d.catB2DiseaseRisk1Statement1.trim())   errs.catB2DiseaseRisk1Statement1 = 'At least one statement is required for Disease Risk Claim 1';
          if (!d.catB2DiseaseRisk1File)                errs.catB2DiseaseRisk1File       = 'Supporting document is required for Disease Risk Claim 1';
          if (!d.catB2DiseaseRisk1Abstract.trim())     errs.catB2DiseaseRisk1Abstract   = 'Abstract / Summary is required for Disease Risk Claim 1';
        }
        if (!d.catB2DiseaseRisk2YesNo)                 errs.catB2DiseaseRisk2YesNo      = 'Please indicate whether Disease Risk Reduction Claim 2 is proposed';
        if (d.catB2DiseaseRisk2YesNo === 'Yes') {
          if (!d.catB2DiseaseRisk2Statement1.trim())   errs.catB2DiseaseRisk2Statement1 = 'At least one statement is required for Disease Risk Claim 2';
          if (!d.catB2DiseaseRisk2File)                errs.catB2DiseaseRisk2File       = 'Supporting document is required for Disease Risk Claim 2';
          if (!d.catB2DiseaseRisk2Abstract.trim())     errs.catB2DiseaseRisk2Abstract   = 'Abstract / Summary is required for Disease Risk Claim 2';
        }
      }
    }

    if (stepIndex === 3) {
      if (cat !== 'B' && !d.productLabel)         errs.productLabel                = 'Product label is required';
      // hasExistingRegistration radio must be answered
      if (!d.hasExistingRegistration)             errs.hasExistingRegistration     = 'Please indicate whether you have an existing registration or license';
      // Part III: if existing registration selected as Yes
      if (d.hasExistingRegistration === 'Yes') {
        if (!d.registrationNumber.trim()) errs.registrationNumber = 'Registration number is required';
        if (!d.registrationDate)          errs.registrationDate   = 'Registration date is required';
      }
    }

    if (stepIndex === 4) {
      if (!d.paymentReference.trim()) errs.paymentReference = 'Please enter a transaction reference number';
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
  const cat = getCatKey(d.ayurvedaCategory);
  const catColor = CAT_COLORS[cat] ?? COLORS.primary;

  // ── Step content ───────────────────────────────────────────────────────────
  const stepContent = [

    // ── Step 0: Category & Basic Information ──────────────────────────────
    <div key={0}>
      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Ayurveda Category</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 10, lineHeight: 1.6 }}>
          Select the applicable Ayurveda Aahara category. The category determines the additional sections and evidence required in subsequent steps.
        </div>
        <div style={row}>
          <label style={fieldLabel}>Ayurveda Aahara Category *</label>
          <div>
            <select style={eb(select, 'ayurvedaCategory')} value={d.ayurvedaCategory} onChange={(e) => setField('ayurvedaCategory', e.target.value)}>
              <option value="">Select a category</option>
              {AYURVEDA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errMsg('ayurvedaCategory')}
          </div>
        </div>
      </div>

      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Applicant Details</div>
        <div style={row}>
          <label style={fieldLabel}>Name of the Applicant *</label>
          <div>
            <div style={{ display: 'flex', gap: 6 }}>
              <select style={{ ...select, width: 110, flexShrink: 0 }} value={d.applicantPrefix} onChange={(e) => setField('applicantPrefix', e.target.value)}>
                <option value="">Prefix</option>
                {['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'M/s'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <input style={{ ...eb(input, 'applicantName'), flex: 1 }} placeholder="Full name" value={d.applicantName} onChange={(e) => setField('applicantName', e.target.value)} />
            </div>
            {errMsg('applicantName')}
          </div>
        </div>

        {/* ii. Authorised Person — immediately after applicant name per PDF */}
        <div style={row}>
          <label style={fieldLabel}>
            Name of the Authorised Person *
            <span style={{ fontWeight: 400, color: COLORS.textMuted, fontSize: 11, display: 'block', marginTop: 2 }}>All official communications will be sent to the provided email and phone.</span>
          </label>
          <div>
            <div style={{ display: 'flex', gap: 6 }}>
              <select style={{ ...select, width: 110, flexShrink: 0 }} value={d.authorisedPersonPrefix} onChange={(e) => setField('authorisedPersonPrefix', e.target.value)}>
                <option value="">Prefix</option>
                {['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'M/s'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <input style={{ ...eb(input, 'authorisedPerson'), flex: 1 }} placeholder="Full name" value={d.authorisedPerson} onChange={(e) => setField('authorisedPerson', e.target.value)} />
            </div>
            {errMsg('authorisedPerson')}
          </div>
        </div>
        {/* iii. Mobile No. */}
        <div style={row}>
          <label style={fieldLabel}>Contact Number of the Authorised Person *</label>
          <div>
            <input style={eb(input, 'authorisedContact')} value={d.authorisedContact} placeholder="10-digit mobile number" inputMode="numeric" maxLength={10} onChange={(e) => setField('authorisedContact', filterPhone(e.target.value))} />
            {errMsg('authorisedContact')}
          </div>
        </div>
        {/* iv. E-mail */}
        <div style={row}>
          <label style={fieldLabel}>Email of the Authorised Person *</label>
          <div>
            <input style={eb(input, 'authorisedEmail')} value={d.authorisedEmail} placeholder="officer@example.com" onChange={(e) => setField('authorisedEmail', e.target.value)} />
            {errMsg('authorisedEmail')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Alternate Email 2</label>
          <input type="email" style={input} placeholder="alternate@example.com" value={d.authorisedEmail2} onChange={(e) => setField('authorisedEmail2', e.target.value)} />
        </div>
        <div style={row}>
          <label style={fieldLabel}>Alternate Email 3</label>
          <input type="email" style={input} placeholder="alternate@example.com" value={d.authorisedEmail3} onChange={(e) => setField('authorisedEmail3', e.target.value)} />
        </div>
        {/* v. Name of organisation */}
        <div style={row}>
          <label style={fieldLabel}>Name of the Organisation *</label>
          <div>
            <input style={eb(input, 'nameOfOrganization')} placeholder="Enter organisation name" value={d.nameOfOrganization} onChange={(e) => setField('nameOfOrganization', e.target.value)} />
            {errMsg('nameOfOrganization')}
          </div>
        </div>
        {/* vi. Address of organisation */}
        <div style={row}>
          <label style={fieldLabel}>Registered Office Address *</label>
          <div>
            <textarea style={eb(textarea, 'registeredOfficeAddress')} value={d.registeredOfficeAddress} onChange={(e) => setField('registeredOfficeAddress', e.target.value)} />
            {errMsg('registeredOfficeAddress')}
          </div>
        </div>
        {/* vii. Manufacturing Premises */}
        <div style={row}>
          <label style={fieldLabel}>Manufacturing / Processing Address *</label>
          <div>
            <textarea style={eb(textarea, 'manufacturingAddress')} value={d.manufacturingAddress} onChange={(e) => setField('manufacturingAddress', e.target.value)} />
            {errMsg('manufacturingAddress')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Manufacturing Premises Contact Details *</label>
          <div>
            <input style={eb(input, 'manufacturingPremisesContactDetails')} placeholder="Phone / email / contact person" value={d.manufacturingPremisesContactDetails} onChange={(e) => setField('manufacturingPremisesContactDetails', e.target.value)} />
            {errMsg('manufacturingPremisesContactDetails')}
          </div>
        </div>
        {/* viii. Nature of Business */}
        <div style={row}>
          <label style={fieldLabel}>Nature of Business *
            <span style={{ fontWeight: 400, color: COLORS.textMuted, fontSize: 11, display: 'block', marginTop: 2 }}>Max 100 words</span>
          </label>
          <div>
            <textarea style={eb(textarea, 'natureOfBusiness')} value={d.natureOfBusiness} onChange={(e) => setField('natureOfBusiness', e.target.value)} placeholder="Describe the primary business activity, products manufactured, and relevant food sector..." />
            <WordCounter value={d.natureOfBusiness} limit={100} />
            {errMsg('natureOfBusiness')}
          </div>
        </div>
      </div>

      <div style={secCard}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Product Details</div>
        <div style={row}>
          <label style={fieldLabel}>Name of the Food Product *</label>
          <div>
            <input style={eb(input, 'productName')} placeholder="Enter product name" value={d.productName} onChange={(e) => setField('productName', e.target.value)} />
            <WordCounter value={d.productName} limit={50} />
            {errMsg('productName')}
          </div>
        </div>

       <div style={row}>
          <label style={fieldLabel}>Justification of Proposed Ayurveda Aahara *
            <span style={{ fontWeight: 400, color: COLORS.textMuted, fontSize: 11, display: 'block', marginTop: 2 }}>Max 100 words</span>
          </label>
          <div>
            <textarea style={eb(textarea, 'justificationOfProposedAyurvedaAahara')} value={d.justificationOfProposedAyurvedaAahara} onChange={(e) => setField('justificationOfProposedAyurvedaAahara', e.target.value)} placeholder="Explain why this product qualifies as Ayurveda Aahara and not a conventional food or drug..." />
            <WordCounter value={d.justificationOfProposedAyurvedaAahara} limit={100} />
            {errMsg('justificationOfProposedAyurvedaAahara')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Functional Use *
            <span style={{ fontWeight: 400, color: COLORS.textMuted, fontSize: 11, display: 'block', marginTop: 2 }}>Max 500 words</span>
          </label>
          <div>
            <textarea style={eb(textarea, 'functionalUse')} value={d.functionalUse} onChange={(e) => setField('functionalUse', e.target.value)} placeholder="Describe the primary functional use and health benefit of this product..." />
            <WordCounter value={d.functionalUse} limit={500} />
            {errMsg('functionalUse')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Functional Use Supporting Document</label>
          <UB value={d.functionalUseFile} field="functionalUseFile" />
        </div>
        <div style={row}>
          <label style={fieldLabel}>Intended Use *
            <span style={{ fontWeight: 400, color: COLORS.textMuted, fontSize: 11, display: 'block', marginTop: 2 }}>Max 100 words</span>
          </label>
          <div>
            <textarea style={eb(textarea, 'intendedUse')} value={d.intendedUse} onChange={(e) => setField('intendedUse', e.target.value)} placeholder="Describe who this product is intended for and for what purpose..." />
            <WordCounter value={d.intendedUse} limit={100} />
            {errMsg('intendedUse')}
          </div>
        </div>
        <div style={row}>
          <label style={fieldLabel}>Certificate of Analysis *</label>
          <UB value={d.certificateOfAnalysis} field="certificateOfAnalysis" />
        </div>
        <div style={row}>
          <label style={fieldLabel}>Manufacturing Process Flow Chart / Brief</label>
          <UB value={d.manufacturingProcessFile} field="manufacturingProcessFile" />
        </div>
      </div>
    </div>,

    // ── Step 1: Ingredients / Additives / Composition ─────────────────────
    <div key={1} style={{ display: 'flex', flexDirection: 'column' }}>
      {(cat === 'B' || cat === 'B1' || cat === 'B2') && <CategoryReferenceBlock target={cat} />}
      {cat === 'B1' && <B1FormatRationaleBlock />}

      {/* Category B — Other Botanicals (repeatable) — PDF Part II item i.d */}
      {cat === 'B' && (
        <div style={catCard(catColor)}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: catColor }}>
            d) Other Botanicals <CatBadge cat="B" />
          </div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 10, lineHeight: 1.6 }}>
            List any other botanicals included that are not in the standard permitted list, with rationale and textual reference.
          </div>
          {d.otherBotanicals.length > 0 && (
            <div style={{ overflowX: 'auto', marginBottom: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['#', 'Botanical Name', 'Quantity', 'Unit', 'Rationale', 'Remove'].map((h) => <th key={h} style={tblTh}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {d.otherBotanicals.map((bot, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : COLORS.bg }}>
                      <td style={tblTd}>{idx + 1}</td>
                      <td style={tblTd}><input style={tblInput} value={bot.botanicalName} onChange={(e) => updateBotanical(idx, 'botanicalName', e.target.value)} /></td>
                      <td style={tblTd}><input type="number" min="0" style={{ ...tblInput, width: 70 }} value={bot.quantity} onChange={(e) => updateBotanical(idx, 'quantity', e.target.value)} /></td>
                      <td style={tblTd}>
                        <select style={{ ...tblInput, width: 75 }} value={bot.unit} onChange={(e) => updateBotanical(idx, 'unit', e.target.value)}>
                          <option value="">—</option>
                          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td style={tblTd}><input style={tblInput} value={bot.rationale} onChange={(e) => updateBotanical(idx, 'rationale', e.target.value)} placeholder="Rationale for inclusion…" /></td>
                      <td style={tblTd}><button onClick={() => removeBotanical(idx)} style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer', fontSize: 16 }} title="Remove">×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ background: COLORS.bg, border: `1px dashed ${COLORS.border}`, borderRadius: 6, padding: 10, marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, marginBottom: 6 }}>New Botanical</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 70px 75px 2fr auto', gap: 8, alignItems: 'center' }}>
              <input style={eb(tblInput, 'pendingBotanical')} placeholder="Botanical name *" value={pendingBotanical.botanicalName}
                onChange={(e) => { setPendingBotanical((p) => ({ ...p, botanicalName: e.target.value })); setStepErrors((p) => { const n = { ...p }; delete n.pendingBotanical; return n; }); }} />
              <input type="number" min="0" style={tblInput} placeholder="Qty" value={pendingBotanical.quantity} onChange={(e) => setPendingBotanical((p) => ({ ...p, quantity: e.target.value }))} />
              <select style={tblInput} value={pendingBotanical.unit} onChange={(e) => setPendingBotanical((p) => ({ ...p, unit: e.target.value }))}>
                <option value="">Unit</option>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <input style={tblInput} placeholder="Rationale for inclusion" value={pendingBotanical.rationale} onChange={(e) => setPendingBotanical((p) => ({ ...p, rationale: e.target.value }))} />
              <button onClick={addBotanical} style={{ background: catColor, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
            </div>
          </div>
          {errMsg('pendingBotanical')}
          {d.otherBotanicals.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, color: catColor }}>Textual Reference Details for Each Botanical</div>
              {d.otherBotanicals.map((bot, idx) => (
                <div key={idx} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 10, marginBottom: 10, background: COLORS.white }}>
                  <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>
                    Botanical {idx + 1}: {bot.botanicalName || 'Unnamed botanical'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ gridColumn: '1 / -1' }}><label style={S.label}>Name of Authoritative Text *</label><input style={input} value={bot.botanicalNameOfAuthoritativeText} onChange={(e) => updateBotanical(idx, 'botanicalNameOfAuthoritativeText', e.target.value)} placeholder="e.g. Charaka Samhita" /></div>
                    <div><label style={S.label}>Editor of Authoritative Text</label><input style={input} placeholder="e.g. P.V. Sharma" value={bot.botanicalBookEditor} onChange={(e) => updateBotanical(idx, 'botanicalBookEditor', e.target.value)} /></div>
                    <div><label style={S.label}>Original Author of Authoritative Text</label><input style={input} placeholder="e.g. Charaka" value={bot.botanicalBookAuthor} onChange={(e) => updateBotanical(idx, 'botanicalBookAuthor', e.target.value)} /></div>
                    <div><label style={S.label}>Volume of Authoritative Text</label><input style={input} placeholder="e.g. Volume I" value={bot.botanicalBookVolume} onChange={(e) => updateBotanical(idx, 'botanicalBookVolume', e.target.value)} /></div>
                    <div><label style={S.label}>Sthana (Section)</label><input style={input} placeholder="e.g. Sutrasthana" value={bot.botanicalBookSthana} onChange={(e) => updateBotanical(idx, 'botanicalBookSthana', e.target.value)} /></div>
                    <div><label style={S.label}>Adhyaya (Chapter) Name &amp; Number</label><input style={input} placeholder="e.g. Chapter 5" value={bot.botanicalReferenceChapter} onChange={(e) => updateBotanical(idx, 'botanicalReferenceChapter', e.target.value)} /></div>
                    <div><label style={S.label}>Verse Number(s)</label><input style={input} placeholder="e.g. 10–15" value={bot.botanicalReferenceVerse} onChange={(e) => updateBotanical(idx, 'botanicalReferenceVerse', e.target.value)} /></div>
                    <div><label style={S.label}>Page Number(s)</label><input style={input} placeholder="e.g. 234–240" value={bot.botanicalBookPageNumbers} onChange={(e) => updateBotanical(idx, 'botanicalBookPageNumbers', e.target.value)} /></div>
                    <div><label style={S.label}>Publisher</label><input style={input} placeholder="e.g. CCRAS" value={bot.botanicalBookPublisher} onChange={(e) => updateBotanical(idx, 'botanicalBookPublisher', e.target.value)} /></div>
                    <div><label style={S.label}>Publication Year</label><input style={input} placeholder="e.g. 2015" value={bot.botanicalPublicationYear} onChange={(e) => updateBotanical(idx, 'botanicalPublicationYear', e.target.value)} /></div>
                    <div><label style={S.label}>Publication Place</label><input style={input} placeholder="e.g. New Delhi" value={bot.botanicalPublicationPlace} onChange={(e) => updateBotanical(idx, 'botanicalPublicationPlace', e.target.value)} /></div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <label style={S.label}>Upload Textual Reference *</label>
                    <UploadBox
                      value={bot.botanicalReferenceFile}
                      onChange={(v) => updateBotanical(idx, 'botanicalReferenceFile', v)}
                      applicationId={appId ?? undefined}
                      fieldName={`otherBotanicalReferenceFile_${idx}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <label style={S.label}>Overall Rationale for Other Botanicals</label>
            <textarea style={textarea} value={d.otherBotanicalsRationale} onChange={(e) => setField('otherBotanicalsRationale', e.target.value)} placeholder="Provide scientific and Ayurvedic rationale for inclusion of non-listed botanicals…" />
            <WordCounter value={d.otherBotanicalsRationale} limit={500} />
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={S.label}>Supporting Document for Other Botanicals</label>
            <UB value={d.otherBotanicalsRationaleFile} field="otherBotanicalsRationaleFile" />
          </div>
        </div>
      )}

      {/* Ingredients Table */}
      <div style={{ ...secCard, order: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: COLORS.primary }}>Ingredients *</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 10 }}>
          List all Ayurvedic and food-grade ingredients with their quantities and reference text.
        </div>

        {d.ingredients.length > 0 && (
          <div style={{ overflowX: 'auto', marginBottom: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['#', 'Ingredient Name', 'Quantity', 'Unit', 'Reference Book / Pharmacopoeia', 'Remove'].map((h) => (
                    <th key={h} style={tblTh}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.ingredients.map((ing, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={tblTd}>{idx + 1}</td>
                    <td style={tblTd}><input style={tblInput} value={ing.ingredientName} onChange={(e) => updateIngredient(idx, 'ingredientName', e.target.value)} /></td>
                    <td style={tblTd}><input type="number" min="0" style={{ ...tblInput, width: 70 }} value={ing.quantity} onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)} /></td>
                    <td style={tblTd}>
                      <select style={{ ...tblInput, width: 75 }} value={ing.unit} onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}>
                        <option value="">—</option>
                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td style={tblTd}>
                      <input list="ref-books" style={tblInput} value={ing.referenceBook} onChange={(e) => updateIngredient(idx, 'referenceBook', e.target.value)} placeholder="Type or select…" />
                      <datalist id="ref-books">{REFERENCE_BOOKS.map((b) => <option key={b} value={b} />)}</datalist>
                    </td>
                    <td style={tblTd}>
                      <button onClick={() => removeIngredient(idx)} style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer', fontSize: 16, lineHeight: 1 }} title="Remove">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ background: COLORS.bg, border: `1px dashed ${COLORS.border}`, borderRadius: 6, padding: 10, marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, marginBottom: 6 }}>New Ingredient</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 2fr auto', gap: 8, alignItems: 'center' }}>
            <input style={eb(tblInput, 'pendingIng')} placeholder="Ingredient name *" value={pendingIng.ingredientName}
              onChange={(e) => { setPendingIng((p) => ({ ...p, ingredientName: e.target.value })); setStepErrors((p) => { const n = { ...p }; delete n.pendingIng; return n; }); }} />
            <input type="number" min="0" style={tblInput} placeholder="Qty" value={pendingIng.quantity} onChange={(e) => setPendingIng((p) => ({ ...p, quantity: e.target.value }))} />
            <select style={tblInput} value={pendingIng.unit} onChange={(e) => setPendingIng((p) => ({ ...p, unit: e.target.value }))}>
              <option value="">Unit</option>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <div>
              <input list="ref-books-pending" style={tblInput} placeholder="Reference book / pharmacopoeia" value={pendingIng.referenceBook} onChange={(e) => setPendingIng((p) => ({ ...p, referenceBook: e.target.value }))} />
              <datalist id="ref-books-pending">{REFERENCE_BOOKS.map((b) => <option key={b} value={b} />)}</datalist>
            </div>
            <button onClick={addIngredient} style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
          </div>
        </div>
        {errMsg('pendingIng')}
        {errMsg('ingredients')}
      </div>

      {/* Category A — Traditional Reference & Ingredient Mapping */}
      {cat === 'A' && (
        <div style={{ ...catCard(catColor), order: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: catColor }}>
            Traditional Ayurveda Reference <CatBadge cat="A" />
          </div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
            Provide the authoritative Ayurvedic text reference for this formulation, as per Schedule A of the regulations.
          </div>
          <div style={row}>
            <label style={fieldLabel}>Name of the Ayurveda Aahara
              <span style={{ fontWeight: 400, color: COLORS.textMuted, fontSize: 11, display: 'block', marginTop: 2 }}>Max 50 words</span>
            </label>
            <div>
              <textarea style={eb(textarea, 'catANameOfAyurvedaAahara')} value={d.catANameOfAyurvedaAahara} onChange={(e) => setField('catANameOfAyurvedaAahara', e.target.value)} placeholder="Provide the name of this Ayurveda Aahara product..." />
              <WordCounter value={d.catANameOfAyurvedaAahara} limit={50} />
              {errMsg('catANameOfAyurvedaAahara')}
            </div>
          </div>
          <div style={row}>
            <label style={fieldLabel}>Format of Proposed Ayurveda Aahara</label>
            <div>
              <input style={eb(input, 'catAFormatOfAyurvedaAahara')} value={d.catAFormatOfAyurvedaAahara} onChange={(e) => setField('catAFormatOfAyurvedaAahara', e.target.value)} placeholder="e.g. Powder, Tablet, Capsule, Liquid, Granules..." />
              {errMsg('catAFormatOfAyurvedaAahara')}
            </div>
          </div>
          <div style={row}>
            <label style={fieldLabel}>Reference Book / Pharmacopoeia *</label>
            <div>
              <input
                list="ref-books-cat-a"
                style={eb(input, 'ayurvedaReferenceBook')}
                placeholder="Type or select reference book…"
                value={d.ayurvedaReferenceBook}
                onChange={(e) => setField('ayurvedaReferenceBook', e.target.value)}
              />
              <datalist id="ref-books-cat-a">{REFERENCE_BOOKS.map((b) => <option key={b} value={b} />)}</datalist>
              {errMsg('ayurvedaReferenceBook')}
            </div>
          </div>
          <div style={row}>
            <label style={fieldLabel}>Chapter (Adhyaya) Name &amp; Number</label>
            <input style={input} value={d.referenceChapter} onChange={(e) => setField('referenceChapter', e.target.value)} placeholder="e.g. Sutrasthana, Chapter 27" />
          </div>
          <div style={row}>
            <label style={fieldLabel}>Verse (Shloka) Number(s)</label>
            <input style={input} value={d.referenceVerse} onChange={(e) => setField('referenceVerse', e.target.value)} placeholder="e.g. Verse 14–16" />
          </div>

          {/* Multi-select books + name of text */}
          <div style={row}>
            <label style={fieldLabel}>Authoritative Books (select all applicable) *</label>
            <div>
              <select
                multiple
                style={{ ...select, minHeight: 120 }}
                value={d.ayurvedaBookMultiSelect ? d.ayurvedaBookMultiSelect.split('||') : []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                  setField('ayurvedaBookMultiSelect', selected.join('||'));
                }}
              >
                {REFERENCE_BOOKS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>Hold Ctrl / Cmd to select multiple</div>
              {errMsg('ayurvedaBookMultiSelect')}
            </div>
          </div>
          <div style={row}>
            <label style={fieldLabel}>Name of Authoritative Text</label>
            <input style={input} value={d.ayurvedaAaharaNameOfText} onChange={(e) => setField('ayurvedaAaharaNameOfText', e.target.value)} placeholder="As it appears in the book…" />
          </div>

          {/* Bibliographic details of authoritative book */}
          <div style={{ marginTop: 12, marginBottom: 4, fontWeight: 600, fontSize: 12, color: catColor }}>Bibliographic Details of Authoritative Book</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={S.label}>Editor(s)</label>
              <input style={input} value={d.bookEditor} onChange={(e) => setField('bookEditor', e.target.value)} placeholder="e.g. P.V. Sharma" />
            </div>
            <div>
              <label style={S.label}>Author(s)</label>
              <input style={input} value={d.bookAuthor} onChange={(e) => setField('bookAuthor', e.target.value)} placeholder="e.g. Charaka" />
            </div>
            <div>
              <label style={S.label}>Volume / Part</label>
              <input style={input} value={d.bookVolume} onChange={(e) => setField('bookVolume', e.target.value)} placeholder="e.g. Volume II" />
            </div>
            <div>
              <label style={S.label}>Sthana (Section)</label>
              <input style={input} value={d.bookSthana} onChange={(e) => setField('bookSthana', e.target.value)} placeholder="e.g. Sutrasthana" />
            </div>
            <div>
              <label style={S.label}>Page Numbers</label>
              <input style={input} value={d.bookPageNumbers} onChange={(e) => setField('bookPageNumbers', e.target.value)} placeholder="e.g. 234–238" />
            </div>
            <div>
              <label style={S.label}>Publisher</label>
              <input style={input} value={d.bookPublisher} onChange={(e) => setField('bookPublisher', e.target.value)} placeholder="e.g. CCRAS" />
            </div>
            <div>
              <label style={S.label}>Publication Year</label>
              <input style={input} value={d.bookPublicationYear} onChange={(e) => setField('bookPublicationYear', e.target.value)} placeholder="e.g. 2012" />
            </div>
            <div>
              <label style={S.label}>Publication Place</label>
              <input style={input} value={d.bookPublicationPlace} onChange={(e) => setField('bookPublicationPlace', e.target.value)} placeholder="e.g. New Delhi" />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={S.label}>Ayurveda Aahara Recipe</label>
            <select style={select} value={d.ayurvedaAaharaRecipe} onChange={(e) => setField('ayurvedaAaharaRecipe', e.target.value)}>
              <option value="">Select…</option>
              <option value="To be placed in Annexure">To be placed in Annexure</option>
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={S.label}>Upload Scanned Pages of Authoritative Book *</label>
            <UB value={d.authoritativeBookScanFile} field="authoritativeBookScanFile" />
            {errMsg('authoritativeBookScanFile')}
          </div>

          {/* Category A: Ingredient Reference Mapping */}
          {d.ingredients.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, color: catColor }}>Ingredient Reference Mapping</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>
                For each ingredient, provide its classical reference source, textual reference, and Ayurvedic purpose.
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['#', 'Ingredient', 'Reference Source', 'Classical Reference', 'Ayurvedic Purpose'].map((h) => (
                        <th key={h} style={tblTh}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {d.ingredients.map((ing, idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : COLORS.bg }}>
                        <td style={tblTd}>{idx + 1}</td>
                        <td style={{ ...tblTd, fontWeight: 600 }}>{ing.ingredientName || '—'}</td>
                        <td style={tblTd}>
                          <input list="ref-books-map" style={tblInput} value={ing.referenceSource} onChange={(e) => updateIngredient(idx, 'referenceSource', e.target.value)} placeholder="Book name…" />
                          <datalist id="ref-books-map">{REFERENCE_BOOKS.map((b) => <option key={b} value={b} />)}</datalist>
                        </td>
                        <td style={tblTd}>
                          <input style={tblInput} value={ing.classicalReference} onChange={(e) => updateIngredient(idx, 'classicalReference', e.target.value)} placeholder="Chapter/Verse ref…" />
                        </td>
                        <td style={tblTd}>
                          <input style={tblInput} value={ing.ingredientPurpose} onChange={(e) => updateIngredient(idx, 'ingredientPurpose', e.target.value)} placeholder="e.g. Rasayana, Deepana…" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Additives Table */}
      <div style={{ ...secCard, order: 30 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: COLORS.primary }}>Food Additives (if any)</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 10 }}>
          List any additives from Schedule D of Ayurveda Aahara Regulation. Leave empty if none are used.
        </div>

        {d.additives.length > 0 && (
          <div style={{ overflowX: 'auto', marginBottom: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['#', 'Additive Name (INS / Common)', 'Quantity / Level', 'Purpose / Function', 'Remove'].map((h) => (
                    <th key={h} style={tblTh}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.additives.map((add, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={tblTd}>{idx + 1}</td>
                    <td style={tblTd}>
                      <input list="additives-list" style={tblInput} value={add.additiveName} onChange={(e) => updateAdditive(idx, 'additiveName', e.target.value)} placeholder="Type or select…" />
                      <datalist id="additives-list">{COMMON_ADDITIVES.map((a) => <option key={a} value={a} />)}</datalist>
                    </td>
                    <td style={tblTd}><input type="number" min="0" style={tblInput} value={add.quantity} onChange={(e) => updateAdditive(idx, 'quantity', e.target.value)} placeholder="e.g. 0.5" /></td>
                    <td style={tblTd}><input style={tblInput} value={add.purpose} onChange={(e) => updateAdditive(idx, 'purpose', e.target.value)} placeholder="e.g. Preservative" /></td>
                    <td style={tblTd}>
                      <button onClick={() => removeAdditive(idx)} style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer', fontSize: 16, lineHeight: 1 }} title="Remove">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ background: COLORS.bg, border: `1px dashed ${COLORS.border}`, borderRadius: 6, padding: 10, marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, marginBottom: 6 }}>New Additive</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
            <div>
              <input list="additives-list-pending" style={eb(tblInput, 'pendingAdd')} placeholder="Additive name (INS / common) *" value={pendingAdd.additiveName}
                onChange={(e) => { setPendingAdd((p) => ({ ...p, additiveName: e.target.value })); setStepErrors((q) => { const n = { ...q }; delete n.pendingAdd; return n; }); }} />
              <datalist id="additives-list-pending">{COMMON_ADDITIVES.map((a) => <option key={a} value={a} />)}</datalist>
            </div>
            <input type="number" min="0" style={tblInput} placeholder="Quantity / level" value={pendingAdd.quantity} onChange={(e) => setPendingAdd((p) => ({ ...p, quantity: e.target.value }))} />
            <input style={tblInput} placeholder="Purpose / function" value={pendingAdd.purpose} onChange={(e) => setPendingAdd((p) => ({ ...p, purpose: e.target.value }))} />
            <button onClick={addAdditive} style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
          </div>
        </div>
        {errMsg('pendingAdd')}
      </div>

      {/* Composition Details */}
      <div style={{ ...secCard, order: 40 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Composition Details</div>
        
        
        <div style={{ marginTop: 10 }}>
          <label style={S.label}>Upload: Composition of Proposed Ayurveda Aahara</label>
          <UB value={d.compositionFile} field="compositionFile" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Ingredient List PDF Upload *</label>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6 }}>Upload a complete ingredient list as a PDF document.</div>
          <UB value={d.ingredientListFile} field="ingredientListFile" />
          {errMsg('ingredientListFile')}
        </div>
        <div style={{ marginBottom: 4 }}>
          <label style={S.label}>Do you have specifications for the product? *</label>
          {radioGroup('hasSpecifications', d.hasSpecifications)}
          {errMsg('hasSpecifications')}
        </div>
        {d.hasSpecifications === 'Yes' && (

          <div style={{ marginTop: 10 }}>
            <label style={S.label}>Upload Specifications Document *</label>
            <UB value={d.specificationsFile} field="specificationsFile" />
            {errMsg('specificationsFile')}
          </div>

          

        )}
      </div>
    </div>,

    // ── Step 2: Claims / Usage / Population ───────────────────────────────
    <div key={2} style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Category A — Name & Format */}
      {false && cat === 'A' && (
        <div style={catCard(catColor)}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: catColor }}>
            Name &amp; Format <CatBadge cat="A" />
          </div>
          <div style={row}>
            <label style={fieldLabel}>Name of the Ayurveda Aahara
              <span style={{ fontWeight: 400, color: COLORS.textMuted, fontSize: 11, display: 'block', marginTop: 2 }}>Max 50 words</span>
            </label>
            <div>
              <textarea style={eb(textarea, 'catANameOfAyurvedaAahara')} value={d.catANameOfAyurvedaAahara} onChange={(e) => setField('catANameOfAyurvedaAahara', e.target.value)} placeholder="Provide the name of this Ayurveda Aahara product…" />
              <WordCounter value={d.catANameOfAyurvedaAahara} limit={50} />
              {errMsg('catANameOfAyurvedaAahara')}
            </div>
          </div>
          <div style={row}>
            <label style={fieldLabel}>Format of Proposed Ayurveda Aahara</label>
            <div>
              <input style={eb(input, 'catAFormatOfAyurvedaAahara')} value={d.catAFormatOfAyurvedaAahara} onChange={(e) => setField('catAFormatOfAyurvedaAahara', e.target.value)} placeholder="e.g. Powder, Tablet, Capsule, Liquid, Granules…" />
              {errMsg('catAFormatOfAyurvedaAahara')}
            </div>
          </div>
        </div>
      )}

      {/* Category A — Label Claims */}
      {cat === 'A' && (
        <div style={catCard(catColor)}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: catColor }}>
            Label Claims <CatBadge cat="A" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={S.label}>Is a Health Benefit Claim proposed on the label?</label>
            {radioGroup('catAHealthBenefitYesNo', d.catAHealthBenefitYesNo)}
          </div>
          {d.catAHealthBenefitYesNo === 'Yes' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={S.label}>Health Benefit Claim</label>
                <textarea style={textarea} value={d.catAHealthBenefitClaim} onChange={(e) => setField('catAHealthBenefitClaim', e.target.value)} placeholder="State the proposed health benefit claim…" />
                <WordCounter value={d.catAHealthBenefitClaim} limit={100} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={S.label}>Supporting Document</label>
                  <UB value={d.catAHealthBenefitFile} field="catAHealthBenefitFile" />
                </div>
                <div>
                  <label style={S.label}>Abstract / Summary</label>
                  <textarea style={{ ...textarea, minHeight: 60 }} value={d.catAHealthBenefitAbstract} onChange={(e) => setField('catAHealthBenefitAbstract', e.target.value)} placeholder="250–300 word abstract..." />
                  <WordCounter value={d.catAHealthBenefitAbstract} limit={300} />
                </div>
              </div>
              {/* Efficacy rows table */}
              <div style={{ marginTop: 8, marginBottom: 4, fontWeight: 600, fontSize: 12, color: catColor }}>Efficacy Data (Traditional Texts)</div>
              {d.catAHealthBenefitEfficacyRows.length > 0 && (
                <div style={{ overflowX: 'auto', marginBottom: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead><tr>
                      {['#', 'Name of Authoritative Text', 'Reference in Text', 'Justification (Rasa/Guna/Virya/Vipaka)', 'Remove'].map((h) => <th key={h} style={tblTh}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {d.catAHealthBenefitEfficacyRows.map((r, idx) => (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : COLORS.bg }}>
                          <td style={tblTd}>{idx + 1}</td>
                          <td style={tblTd}><input style={tblInput} value={r.nameOfAuthoritativeText} onChange={(e) => updateEfficacyRow('catAHealthBenefitEfficacyRows', idx, 'nameOfAuthoritativeText', e.target.value)} /></td>
                          <td style={tblTd}><input style={tblInput} value={r.referenceInAuthoritativeText} onChange={(e) => updateEfficacyRow('catAHealthBenefitEfficacyRows', idx, 'referenceInAuthoritativeText', e.target.value)} /></td>
                          <td style={tblTd}><input style={tblInput} value={r.justificationRasaGunaViryaVipaka} onChange={(e) => updateEfficacyRow('catAHealthBenefitEfficacyRows', idx, 'justificationRasaGunaViryaVipaka', e.target.value)} /></td>
                          <td style={tblTd}><button onClick={() => removeEfficacyRow('catAHealthBenefitEfficacyRows', idx)} style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer', fontSize: 16 }}>×</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ background: COLORS.bg, border: `1px dashed ${COLORS.border}`, borderRadius: 6, padding: 8, marginBottom: 4 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 6 }}>
                  <input style={tblInput} placeholder="Name of authoritative text" value={pendingCatAEfficacy.nameOfAuthoritativeText} onChange={(e) => setPendingCatAEfficacy((p) => ({ ...p, nameOfAuthoritativeText: e.target.value }))} />
                  <input style={tblInput} placeholder="Reference in text" value={pendingCatAEfficacy.referenceInAuthoritativeText} onChange={(e) => setPendingCatAEfficacy((p) => ({ ...p, referenceInAuthoritativeText: e.target.value }))} />
                  <input style={tblInput} placeholder="Justification (Rasa/Guna/Virya/Vipaka)" value={pendingCatAEfficacy.justificationRasaGunaViryaVipaka} onChange={(e) => setPendingCatAEfficacy((p) => ({ ...p, justificationRasaGunaViryaVipaka: e.target.value }))} />
                  <button onClick={() => addEfficacyRow('catAHealthBenefitEfficacyRows', pendingCatAEfficacy, () => setPendingCatAEfficacy(emptyEfficacy()))} style={{ background: catColor, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
                </div>
              </div>
            </>
          )}
          <div style={{ marginBottom: 8 }}>
            <label style={S.label}>Is a Disease Risk Reduction Claim proposed?</label>


            {radioGroup('catADiseaseRiskYesNo', d.catADiseaseRiskYesNo)}
          </div>
          {d.catADiseaseRiskYesNo === 'Yes' && (
            <>
              <div style={{ marginBottom: 8 }}>
                <label style={S.label}>Disease Risk Claim Statement 1</label>
                <textarea style={textarea} value={d.catADiseaseRiskStatement1} onChange={(e) => setField('catADiseaseRiskStatement1', e.target.value)} placeholder="Alternative claim statement 1…" />
                <WordCounter value={d.catADiseaseRiskStatement1} limit={100} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={S.label}>Disease Risk Claim Statement 2</label>
                <textarea style={textarea} value={d.catADiseaseRiskStatement2} onChange={(e) => setField('catADiseaseRiskStatement2', e.target.value)} placeholder="Alternative claim statement 2…" />
                <WordCounter value={d.catADiseaseRiskStatement2} limit={100} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={S.label}>Disease Risk Claim Statement 3</label>
                <textarea style={textarea} value={d.catADiseaseRiskStatement3} onChange={(e) => setField('catADiseaseRiskStatement3', e.target.value)} placeholder="Alternative claim statement 3…" />
                <WordCounter value={d.catADiseaseRiskStatement3} limit={100} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>Supporting Document (Claim B)</label>
                  <UB value={d.catADiseaseRiskFile} field="catADiseaseRiskFile" />
                </div>
                <div>
                  <label style={S.label}>Abstract / Summary (Claim B)</label>
                  <textarea style={{ ...textarea, minHeight: 60 }} value={d.catADiseaseRiskAbstract} onChange={(e) => setField('catADiseaseRiskAbstract', e.target.value)} placeholder="250–300 word abstract..." />
                  <WordCounter value={d.catADiseaseRiskAbstract} limit={300} />
                </div>
              </div>
              {/* Evidence rows table (Cat A, with dosage/duration per PDF) */}
              <div style={{ marginTop: 12, marginBottom: 4, fontWeight: 600, fontSize: 12, color: catColor }}>Scientific Evidence</div>
              <EvidenceDosageTable field="catADiseaseRiskEvidenceRows" rows={d.catADiseaseRiskEvidenceRows} pending={pendingCatAEvidence} setPending={setPendingCatAEvidence} />
              {errMsg('catADiseaseRiskEvidenceRows')}
            </>
          )}
        </div>
      )}

      {/* Category B — Traditional Ayurveda Reference */}
      {false && cat === 'B' && (
        <div style={catCard(catColor)}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: catColor }}>
            Traditional Ayurveda Reference <CatBadge cat="B" />
          </div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
            Provide the authoritative Ayurvedic text reference for this formulation.
          </div>
          <div style={row}>
            <label style={fieldLabel}>Name of the Ayurveda Aahara
              <span style={{ fontWeight: 400, color: COLORS.textMuted, fontSize: 11, display: 'block', marginTop: 2 }}>Max 50 words</span>
            </label>
            <div>
              <textarea style={eb(textarea, 'catBNameOfAyurvedaAahara')} value={d.catBNameOfAyurvedaAahara} onChange={(e) => setField('catBNameOfAyurvedaAahara', e.target.value)} />
              <WordCounter value={d.catBNameOfAyurvedaAahara} limit={50} />
              {errMsg('catBNameOfAyurvedaAahara')}
            </div>
          </div>
          <div style={row}>
            <label style={fieldLabel}>Format of Proposed Ayurveda Aahara</label>
            <div>
              <input style={eb(input, 'catBFormatOfAyurvedaAahara')} value={d.catBFormatOfAyurvedaAahara} onChange={(e) => setField('catBFormatOfAyurvedaAahara', e.target.value)} />
              {errMsg('catBFormatOfAyurvedaAahara')}
            </div>
          </div>
          <div style={row}>
            <label style={fieldLabel}>Authoritative Books (select all applicable) *</label>
            <div>
              <select
                multiple
                style={{ ...select, minHeight: 120 }}
                value={d.catBAyurvedaBookMultiSelect ? d.catBAyurvedaBookMultiSelect.split('||') : []}
                onChange={(e) => {
                  const sel = Array.from(e.target.selectedOptions).map((o) => o.value);
                  setField('catBAyurvedaBookMultiSelect', sel.join('||'));
                }}
              >
                {REFERENCE_BOOKS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>Hold Ctrl / Cmd to select multiple</div>
              {errMsg('catBAyurvedaBookMultiSelect')}
            </div>
          </div>
          <div style={row}>
            <label style={fieldLabel}>Name of Authoritative Text</label>
            <input style={input} value={d.catBNameOfAuthoritativeText} onChange={(e) => setField('catBNameOfAuthoritativeText', e.target.value)} placeholder="As it appears in the book…" />
          </div>
          <div style={{ marginTop: 8, marginBottom: 4, fontWeight: 600, fontSize: 12, color: catColor }}>Bibliographic Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><label style={S.label}>Editor(s)</label><input style={input} value={d.catBBookEditor} onChange={(e) => setField('catBBookEditor', e.target.value)} /></div>
            <div><label style={S.label}>Author(s)</label><input style={input} value={d.catBBookAuthor} onChange={(e) => setField('catBBookAuthor', e.target.value)} /></div>
            <div><label style={S.label}>Volume / Part</label><input style={input} value={d.catBBookVolume} onChange={(e) => setField('catBBookVolume', e.target.value)} /></div>
            <div><label style={S.label}>Sthana (Section)</label><input style={input} value={d.catBBookSthana} onChange={(e) => setField('catBBookSthana', e.target.value)} /></div>
            <div><label style={S.label}>Chapter (Adhyaya) Name &amp; Number</label><input style={input} value={d.catBReferenceChapter} onChange={(e) => setField('catBReferenceChapter', e.target.value)} /></div>
            <div><label style={S.label}>Verse (Shloka) Number(s)</label><input style={input} value={d.catBReferenceVerse} onChange={(e) => setField('catBReferenceVerse', e.target.value)} /></div>
            <div><label style={S.label}>Page Numbers</label><input style={input} value={d.catBBookPageNumbers} onChange={(e) => setField('catBBookPageNumbers', e.target.value)} /></div>
            <div><label style={S.label}>Publisher</label><input style={input} value={d.catBBookPublisher} onChange={(e) => setField('catBBookPublisher', e.target.value)} /></div>
            <div><label style={S.label}>Publication Year</label><input style={input} value={d.catBBookPublicationYear} onChange={(e) => setField('catBBookPublicationYear', e.target.value)} /></div>
            <div><label style={S.label}>Publication Place</label><input style={input} value={d.catBBookPublicationPlace} onChange={(e) => setField('catBBookPublicationPlace', e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={S.label}>Ayurveda Aahara Recipe</label>
            <select style={select} value={d.catBAyurvedaAaharaRecipe} onChange={(e) => setField('catBAyurvedaAaharaRecipe', e.target.value)}>
              <option value="">Select…</option>
              <option value="To be placed in Annexure">To be placed in Annexure</option>
            </select>
          </div>
          <div>
            <label style={S.label}>Upload Scanned Pages of Authoritative Book *</label>
            <UB value={d.catBAuthoritativeBookScanFile} field="catBAuthoritativeBookScanFile" />
            {errMsg('catBAuthoritativeBookScanFile')}
          </div>
        </div>
      )}

      {/* Category B1 — Traditional Ayurveda Reference */}
      {false && cat === 'B1' && (
        <div style={catCard(catColor)}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: catColor }}>
            Traditional Ayurveda Reference <CatBadge cat="B1" />
          </div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
            Provide the authoritative Ayurvedic text reference for this formulation.
          </div>
          <div style={row}>
            <label style={fieldLabel}>Name of the Ayurveda Aahara
              <span style={{ fontWeight: 400, color: COLORS.textMuted, fontSize: 11, display: 'block', marginTop: 2 }}>Max 50 words</span>
            </label>
            <div>
              <textarea style={eb(textarea, 'catB1NameOfAyurvedaAahara')} value={d.catB1NameOfAyurvedaAahara} onChange={(e) => setField('catB1NameOfAyurvedaAahara', e.target.value)} />
              <WordCounter value={d.catB1NameOfAyurvedaAahara} limit={50} />
              {errMsg('catB1NameOfAyurvedaAahara')}
            </div>
          </div>
          <div style={row}>
            <label style={fieldLabel}>Format of Proposed Ayurveda Aahara</label>
            <div>
              <input style={eb(input, 'catB1FormatOfAyurvedaAahara')} value={d.catB1FormatOfAyurvedaAahara} onChange={(e) => setField('catB1FormatOfAyurvedaAahara', e.target.value)} />
              {errMsg('catB1FormatOfAyurvedaAahara')}
            </div>
          </div>
          <div style={row}>
            <label style={fieldLabel}>Authoritative Books (select all applicable) *</label>
            <div>
              <select
                multiple
                style={{ ...select, minHeight: 120 }}
                value={d.catB1AyurvedaBookMultiSelect ? d.catB1AyurvedaBookMultiSelect.split('||') : []}
                onChange={(e) => {
                  const sel = Array.from(e.target.selectedOptions).map((o) => o.value);
                  setField('catB1AyurvedaBookMultiSelect', sel.join('||'));
                }}
              >
                {REFERENCE_BOOKS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>Hold Ctrl / Cmd to select multiple</div>
              {errMsg('catB1AyurvedaBookMultiSelect')}
            </div>
          </div>
          <div style={row}>
            <label style={fieldLabel}>Name of Authoritative Text</label>
            <input style={input} value={d.catB1NameOfAuthoritativeText} onChange={(e) => setField('catB1NameOfAuthoritativeText', e.target.value)} placeholder="As it appears in the book…" />
          </div>
          <div style={{ marginTop: 8, marginBottom: 4, fontWeight: 600, fontSize: 12, color: catColor }}>Bibliographic Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><label style={S.label}>Editor(s)</label><input style={input} value={d.catB1BookEditor} onChange={(e) => setField('catB1BookEditor', e.target.value)} /></div>
            <div><label style={S.label}>Author(s)</label><input style={input} value={d.catB1BookAuthor} onChange={(e) => setField('catB1BookAuthor', e.target.value)} /></div>
            <div><label style={S.label}>Volume / Part</label><input style={input} value={d.catB1BookVolume} onChange={(e) => setField('catB1BookVolume', e.target.value)} /></div>
            <div><label style={S.label}>Sthana (Section)</label><input style={input} value={d.catB1BookSthana} onChange={(e) => setField('catB1BookSthana', e.target.value)} /></div>
            <div><label style={S.label}>Chapter (Adhyaya) Name &amp; Number</label><input style={input} value={d.catB1ReferenceChapter} onChange={(e) => setField('catB1ReferenceChapter', e.target.value)} /></div>
            <div><label style={S.label}>Verse (Shloka) Number(s)</label><input style={input} value={d.catB1ReferenceVerse} onChange={(e) => setField('catB1ReferenceVerse', e.target.value)} /></div>
            <div><label style={S.label}>Page Numbers</label><input style={input} value={d.catB1BookPageNumbers} onChange={(e) => setField('catB1BookPageNumbers', e.target.value)} /></div>
            <div><label style={S.label}>Publisher</label><input style={input} value={d.catB1BookPublisher} onChange={(e) => setField('catB1BookPublisher', e.target.value)} /></div>
            <div><label style={S.label}>Publication Year</label><input style={input} value={d.catB1BookPublicationYear} onChange={(e) => setField('catB1BookPublicationYear', e.target.value)} /></div>
            <div><label style={S.label}>Publication Place</label><input style={input} value={d.catB1BookPublicationPlace} onChange={(e) => setField('catB1BookPublicationPlace', e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={S.label}>Ayurveda Aahara Recipe</label>
            <select style={select} value={d.catB1AyurvedaAaharaRecipe} onChange={(e) => setField('catB1AyurvedaAaharaRecipe', e.target.value)}>
              <option value="">Select…</option>
              <option value="To be placed in Annexure">To be placed in Annexure</option>
            </select>
          </div>
          <div>
            <label style={S.label}>Upload Scanned Pages of Authoritative Book *</label>
            <UB value={d.catB1AuthoritativeBookScanFile} field="catB1AuthoritativeBookScanFile" />
            {errMsg('catB1AuthoritativeBookScanFile')}
          </div>
        </div>
      )}

      {/* Category B2 — Traditional Ayurveda Reference */}
      {false && cat === 'B2' && (
        <div style={catCard(catColor)}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: catColor }}>
            Traditional Ayurveda Reference <CatBadge cat="B2" />
          </div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
            Provide the authoritative Ayurvedic text reference for this formulation.
          </div>
          <div style={row}>
            <label style={fieldLabel}>Name of the Ayurveda Aahara
              <span style={{ fontWeight: 400, color: COLORS.textMuted, fontSize: 11, display: 'block', marginTop: 2 }}>Max 50 words</span>
            </label>
            <div>
              <textarea style={eb(textarea, 'catB2NameOfAyurvedaAahara')} value={d.catB2NameOfAyurvedaAahara} onChange={(e) => setField('catB2NameOfAyurvedaAahara', e.target.value)} />
              <WordCounter value={d.catB2NameOfAyurvedaAahara} limit={50} />
              {errMsg('catB2NameOfAyurvedaAahara')}
            </div>
          </div>
          <div style={row}>
            <label style={fieldLabel}>Format of Proposed Ayurveda Aahara</label>
            <div>
              <input style={eb(input, 'catB2FormatOfAyurvedaAahara')} value={d.catB2FormatOfAyurvedaAahara} onChange={(e) => setField('catB2FormatOfAyurvedaAahara', e.target.value)} />
              {errMsg('catB2FormatOfAyurvedaAahara')}
            </div>
          </div>
          <div style={row}>
            <label style={fieldLabel}>Authoritative Books (select all applicable) *</label>
            <div>
              <select
                multiple
                style={{ ...select, minHeight: 120 }}
                value={d.catB2AyurvedaBookMultiSelect ? d.catB2AyurvedaBookMultiSelect.split('||') : []}
                onChange={(e) => {
                  const sel = Array.from(e.target.selectedOptions).map((o) => o.value);
                  setField('catB2AyurvedaBookMultiSelect', sel.join('||'));
                }}
              >
                {REFERENCE_BOOKS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>Hold Ctrl / Cmd to select multiple</div>
              {errMsg('catB2AyurvedaBookMultiSelect')}
            </div>
          </div>
          <div style={row}>
            <label style={fieldLabel}>Name of Authoritative Text</label>
            <input style={input} value={d.catB2NameOfAuthoritativeText} onChange={(e) => setField('catB2NameOfAuthoritativeText', e.target.value)} placeholder="As it appears in the book…" />
          </div>
          <div style={{ marginTop: 8, marginBottom: 4, fontWeight: 600, fontSize: 12, color: catColor }}>Bibliographic Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><label style={S.label}>Editor(s)</label><input style={input} value={d.catB2BookEditor} onChange={(e) => setField('catB2BookEditor', e.target.value)} /></div>
            <div><label style={S.label}>Author(s)</label><input style={input} value={d.catB2BookAuthor} onChange={(e) => setField('catB2BookAuthor', e.target.value)} /></div>
            <div><label style={S.label}>Volume / Part</label><input style={input} value={d.catB2BookVolume} onChange={(e) => setField('catB2BookVolume', e.target.value)} /></div>
            <div><label style={S.label}>Sthana (Section)</label><input style={input} value={d.catB2BookSthana} onChange={(e) => setField('catB2BookSthana', e.target.value)} /></div>
            <div><label style={S.label}>Chapter (Adhyaya) Name &amp; Number</label><input style={input} value={d.catB2ReferenceChapter} onChange={(e) => setField('catB2ReferenceChapter', e.target.value)} /></div>
            <div><label style={S.label}>Verse (Shloka) Number(s)</label><input style={input} value={d.catB2ReferenceVerse} onChange={(e) => setField('catB2ReferenceVerse', e.target.value)} /></div>
            <div><label style={S.label}>Page Numbers</label><input style={input} value={d.catB2BookPageNumbers} onChange={(e) => setField('catB2BookPageNumbers', e.target.value)} /></div>
            <div><label style={S.label}>Publisher</label><input style={input} value={d.catB2BookPublisher} onChange={(e) => setField('catB2BookPublisher', e.target.value)} /></div>
            <div><label style={S.label}>Publication Year</label><input style={input} value={d.catB2BookPublicationYear} onChange={(e) => setField('catB2BookPublicationYear', e.target.value)} /></div>
            <div><label style={S.label}>Publication Place</label><input style={input} value={d.catB2BookPublicationPlace} onChange={(e) => setField('catB2BookPublicationPlace', e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={S.label}>Ayurveda Aahara Recipe</label>
            <select style={select} value={d.catB2AyurvedaAaharaRecipe} onChange={(e) => setField('catB2AyurvedaAaharaRecipe', e.target.value)}>
              <option value="">Select…</option>
              <option value="To be placed in Annexure">To be placed in Annexure</option>
            </select>
          </div>
          <div>
            <label style={S.label}>Upload Scanned Pages of Authoritative Book *</label>
            <UB value={d.catB2AuthoritativeBookScanFile} field="catB2AuthoritativeBookScanFile" />
            {errMsg('catB2AuthoritativeBookScanFile')}
          </div>
        </div>
      )}

      {/* Category B — Label Claims */}
      {cat === 'B' && (
        <div style={catCard(catColor)}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: catColor }}>
            Label Claims <CatBadge cat="B" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={S.label}>Is a Health Benefit Claim proposed on the label?</label>
            {radioGroup('catBHealthBenefitYesNo', d.catBHealthBenefitYesNo)}
          </div>
          {d.catBHealthBenefitYesNo === 'Yes' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={S.label}>Health Benefit Claim</label>
                <textarea style={textarea} value={d.catBHealthBenefitClaim} onChange={(e) => setField('catBHealthBenefitClaim', e.target.value)} placeholder="State the proposed health benefit claim…" />
                <WordCounter value={d.catBHealthBenefitClaim} limit={100} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={S.label}>Supporting Document</label>
                  <UB value={d.catBHealthBenefitFile} field="catBHealthBenefitFile" />
                </div>
                <div>
                  <label style={S.label}>Abstract / Summary</label>
                  <textarea style={{ ...textarea, minHeight: 60 }} value={d.catBHealthBenefitAbstract} onChange={(e) => setField('catBHealthBenefitAbstract', e.target.value)} placeholder="250–300 word abstract..." />
                  <WordCounter value={d.catBHealthBenefitAbstract} limit={300} />
                </div>
              </div>
              {/* Efficacy rows table (Cat B) */}
              <div style={{ marginTop: 8, marginBottom: 4, fontWeight: 600, fontSize: 12, color: catColor }}>Efficacy Data (Traditional Texts)</div>
              {d.catBHealthBenefitEfficacyRows.length > 0 && (
                <div style={{ overflowX: 'auto', marginBottom: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead><tr>{['#', 'Name of Authoritative Text', 'Reference in Text', 'Justification (Rasa/Guna/Virya/Vipaka)', 'Remove'].map((h) => <th key={h} style={tblTh}>{h}</th>)}</tr></thead>
                    <tbody>{d.catBHealthBenefitEfficacyRows.map((r, idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : COLORS.bg }}>
                        <td style={tblTd}>{idx + 1}</td>
                        <td style={tblTd}><input style={tblInput} value={r.nameOfAuthoritativeText} onChange={(e) => updateEfficacyRow('catBHealthBenefitEfficacyRows', idx, 'nameOfAuthoritativeText', e.target.value)} /></td>
                        <td style={tblTd}><input style={tblInput} value={r.referenceInAuthoritativeText} onChange={(e) => updateEfficacyRow('catBHealthBenefitEfficacyRows', idx, 'referenceInAuthoritativeText', e.target.value)} /></td>
                        <td style={tblTd}><input style={tblInput} value={r.justificationRasaGunaViryaVipaka} onChange={(e) => updateEfficacyRow('catBHealthBenefitEfficacyRows', idx, 'justificationRasaGunaViryaVipaka', e.target.value)} /></td>
                        <td style={tblTd}><button onClick={() => removeEfficacyRow('catBHealthBenefitEfficacyRows', idx)} style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer', fontSize: 16 }}>×</button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
              <div style={{ background: COLORS.bg, border: `1px dashed ${COLORS.border}`, borderRadius: 6, padding: 8, marginBottom: 4 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 6 }}>
                  <input style={tblInput} placeholder="Name of authoritative text" value={pendingCatBEfficacy.nameOfAuthoritativeText} onChange={(e) => setPendingCatBEfficacy((p) => ({ ...p, nameOfAuthoritativeText: e.target.value }))} />
                  <input style={tblInput} placeholder="Reference in text" value={pendingCatBEfficacy.referenceInAuthoritativeText} onChange={(e) => setPendingCatBEfficacy((p) => ({ ...p, referenceInAuthoritativeText: e.target.value }))} />
                  <input style={tblInput} placeholder="Justification (Rasa/Guna/Virya/Vipaka)" value={pendingCatBEfficacy.justificationRasaGunaViryaVipaka} onChange={(e) => setPendingCatBEfficacy((p) => ({ ...p, justificationRasaGunaViryaVipaka: e.target.value }))} />
                  <button onClick={() => addEfficacyRow('catBHealthBenefitEfficacyRows', pendingCatBEfficacy, () => setPendingCatBEfficacy(emptyEfficacy()))} style={{ background: catColor, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
                </div>
              </div>
            </>
          )}
          <div style={{ marginBottom: 8 }}>
            <label style={S.label}>Is a Disease Risk Reduction Claim proposed?</label>


            {radioGroup('catBDiseaseRiskYesNo', d.catBDiseaseRiskYesNo)}
          </div>
          {d.catBDiseaseRiskYesNo === 'Yes' && (
            <>
              <div style={{ marginBottom: 8 }}>
                <label style={S.label}>Disease Risk Claim Statement 1</label>
                <textarea style={textarea} value={d.catBDiseaseRiskStatement1} onChange={(e) => setField('catBDiseaseRiskStatement1', e.target.value)} placeholder="Alternative claim statement 1…" />
                <WordCounter value={d.catBDiseaseRiskStatement1} limit={100} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={S.label}>Disease Risk Claim Statement 2</label>
                <textarea style={textarea} value={d.catBDiseaseRiskStatement2} onChange={(e) => setField('catBDiseaseRiskStatement2', e.target.value)} placeholder="Alternative claim statement 2…" />
                <WordCounter value={d.catBDiseaseRiskStatement2} limit={100} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={S.label}>Disease Risk Claim Statement 3</label>
                <textarea style={textarea} value={d.catBDiseaseRiskStatement3} onChange={(e) => setField('catBDiseaseRiskStatement3', e.target.value)} placeholder="Alternative claim statement 3…" />
                <WordCounter value={d.catBDiseaseRiskStatement3} limit={100} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>Supporting Document</label>
                  <UB value={d.catBDiseaseRiskFile} field="catBDiseaseRiskFile" />
                </div>
                <div>
                  <label style={S.label}>Abstract / Summary</label>
                  <textarea style={{ ...textarea, minHeight: 60 }} value={d.catBDiseaseRiskAbstract} onChange={(e) => setField('catBDiseaseRiskAbstract', e.target.value)} placeholder="250–300 word abstract..." />
                  <WordCounter value={d.catBDiseaseRiskAbstract} limit={300} />
                </div>
              </div>
              {/* EvidenceWithDosage rows (Cat B disease risk) */}
              <div style={{ marginTop: 12, marginBottom: 4, fontWeight: 600, fontSize: 12, color: catColor }}>Scientific Evidence</div>
              {d.catBDiseaseRiskEvidenceRows.length > 0 && (
                <div style={{ overflowX: 'auto', marginBottom: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead><tr>{['#', 'Type of Evidence', 'Journal / Impact Factor', 'Location', 'Subjects', 'Dosage & Duration', 'Conclusion', 'Remove'].map((h) => <th key={h} style={tblTh}>{h}</th>)}</tr></thead>
                    <tbody>{d.catBDiseaseRiskEvidenceRows.map((r, idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : COLORS.bg }}>
                        <td style={tblTd}>{idx + 1}</td>
                        <td style={tblTd}><input style={tblInput} value={r.typeOfEvidence} onChange={(e) => updateEvidenceDosageRow('catBDiseaseRiskEvidenceRows', idx, 'typeOfEvidence', e.target.value)} /></td>
                        <td style={tblTd}><input style={tblInput} value={r.nameOfJournalImpactFactor} onChange={(e) => updateEvidenceDosageRow('catBDiseaseRiskEvidenceRows', idx, 'nameOfJournalImpactFactor', e.target.value)} /></td>
                        <td style={tblTd}><input style={tblInput} value={r.geographicalLocationOfStudy} onChange={(e) => updateEvidenceDosageRow('catBDiseaseRiskEvidenceRows', idx, 'geographicalLocationOfStudy', e.target.value)} /></td>
                        <td style={tblTd}><input style={{ ...tblInput, width: 60 }} value={r.humanStudiesNumberOfSubjects} onChange={(e) => updateEvidenceDosageRow('catBDiseaseRiskEvidenceRows', idx, 'humanStudiesNumberOfSubjects', e.target.value)} /></td>
                        <td style={tblTd}><input style={tblInput} value={r.dosageAndDuration} onChange={(e) => updateEvidenceDosageRow('catBDiseaseRiskEvidenceRows', idx, 'dosageAndDuration', e.target.value)} /></td>
                        <td style={tblTd}><input style={tblInput} value={r.conclusion} onChange={(e) => updateEvidenceDosageRow('catBDiseaseRiskEvidenceRows', idx, 'conclusion', e.target.value)} /></td>
                        <td style={tblTd}><button onClick={() => removeEvidenceDosageRow('catBDiseaseRiskEvidenceRows', idx)} style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer', fontSize: 16 }}>×</button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
              <div style={{ background: COLORS.bg, border: `1px dashed ${COLORS.border}`, borderRadius: 6, padding: 8, marginBottom: 4 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 60px 1fr 1fr auto', gap: 6 }}>
                  <input style={tblInput} placeholder="Type of evidence" value={pendingCatBDiseaseEvidence.typeOfEvidence} onChange={(e) => setPendingCatBDiseaseEvidence((p) => ({ ...p, typeOfEvidence: e.target.value }))} />
                  <input style={tblInput} placeholder="Journal / IF" value={pendingCatBDiseaseEvidence.nameOfJournalImpactFactor} onChange={(e) => setPendingCatBDiseaseEvidence((p) => ({ ...p, nameOfJournalImpactFactor: e.target.value }))} />
                  <input style={tblInput} placeholder="Location" value={pendingCatBDiseaseEvidence.geographicalLocationOfStudy} onChange={(e) => setPendingCatBDiseaseEvidence((p) => ({ ...p, geographicalLocationOfStudy: e.target.value }))} />
                  <input style={tblInput} placeholder="Subj." value={pendingCatBDiseaseEvidence.humanStudiesNumberOfSubjects} onChange={(e) => setPendingCatBDiseaseEvidence((p) => ({ ...p, humanStudiesNumberOfSubjects: e.target.value }))} />
                  <input style={tblInput} placeholder="Dosage & duration" value={pendingCatBDiseaseEvidence.dosageAndDuration} onChange={(e) => setPendingCatBDiseaseEvidence((p) => ({ ...p, dosageAndDuration: e.target.value }))} />
                  <input style={tblInput} placeholder="Conclusion" value={pendingCatBDiseaseEvidence.conclusion} onChange={(e) => setPendingCatBDiseaseEvidence((p) => ({ ...p, conclusion: e.target.value }))} />
                  <button onClick={() => addEvidenceDosageRow('catBDiseaseRiskEvidenceRows', pendingCatBDiseaseEvidence, () => setPendingCatBDiseaseEvidence(emptyEvidenceDosage()))} style={{ background: catColor, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Category B — Safety Data (PDF vi — between Package v and Usage vii) */}
      {cat === 'B' && (
        <div style={{ ...catCard(catColor), order: -15 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: catColor }}>
            Safety Data <CatBadge cat="B" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={S.label}>Safety Data Document</label>
              <UB value={d.catBSafetyDataFile} field="catBSafetyDataFile" />
            </div>
            <div>
              <label style={S.label}>Safety Data Abstract / Summary</label>
              <textarea style={{ ...textarea, minHeight: 60 }} value={d.catBSafetyDataAbstract} onChange={(e) => setField('catBSafetyDataAbstract', e.target.value)} placeholder="250–300 word abstract..." />
              <WordCounter value={d.catBSafetyDataAbstract} limit={300} />
            </div>
          </div>
          {/* Safety evidence rows */}
          <div style={{ marginBottom: 4, fontWeight: 600, fontSize: 12, color: catColor }}>Scientific Evidence for Safety</div>
          {d.catBSafetyEvidenceRows.length > 0 && (
            <div style={{ overflowX: 'auto', marginBottom: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>{['#', 'Type of Evidence', 'Journal / IF', 'Location', 'Subjects', 'Dosage & Duration', 'Conclusion', 'Remove'].map((h) => <th key={h} style={tblTh}>{h}</th>)}</tr></thead>
                <tbody>{d.catBSafetyEvidenceRows.map((r, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : COLORS.bg }}>
                    <td style={tblTd}>{idx + 1}</td>
                    <td style={tblTd}><input style={tblInput} value={r.typeOfEvidence} onChange={(e) => updateEvidenceDosageRow('catBSafetyEvidenceRows', idx, 'typeOfEvidence', e.target.value)} /></td>
                    <td style={tblTd}><input style={tblInput} value={r.nameOfJournalImpactFactor} onChange={(e) => updateEvidenceDosageRow('catBSafetyEvidenceRows', idx, 'nameOfJournalImpactFactor', e.target.value)} /></td>
                    <td style={tblTd}><input style={tblInput} value={r.geographicalLocationOfStudy} onChange={(e) => updateEvidenceDosageRow('catBSafetyEvidenceRows', idx, 'geographicalLocationOfStudy', e.target.value)} /></td>
                    <td style={tblTd}><input style={{ ...tblInput, width: 60 }} value={r.humanStudiesNumberOfSubjects} onChange={(e) => updateEvidenceDosageRow('catBSafetyEvidenceRows', idx, 'humanStudiesNumberOfSubjects', e.target.value)} /></td>
                    <td style={tblTd}><input style={tblInput} value={r.dosageAndDuration} onChange={(e) => updateEvidenceDosageRow('catBSafetyEvidenceRows', idx, 'dosageAndDuration', e.target.value)} /></td>
                    <td style={tblTd}><input style={tblInput} value={r.conclusion} onChange={(e) => updateEvidenceDosageRow('catBSafetyEvidenceRows', idx, 'conclusion', e.target.value)} /></td>
                    <td style={tblTd}><button onClick={() => removeEvidenceDosageRow('catBSafetyEvidenceRows', idx)} style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer', fontSize: 16 }}>×</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <div style={{ background: COLORS.bg, border: `1px dashed ${COLORS.border}`, borderRadius: 6, padding: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 60px 1fr 1fr auto', gap: 6 }}>
              <input style={tblInput} placeholder="Type of evidence" value={pendingCatBSafetyEvidence.typeOfEvidence} onChange={(e) => setPendingCatBSafetyEvidence((p) => ({ ...p, typeOfEvidence: e.target.value }))} />
              <input style={tblInput} placeholder="Journal / IF" value={pendingCatBSafetyEvidence.nameOfJournalImpactFactor} onChange={(e) => setPendingCatBSafetyEvidence((p) => ({ ...p, nameOfJournalImpactFactor: e.target.value }))} />
              <input style={tblInput} placeholder="Location" value={pendingCatBSafetyEvidence.geographicalLocationOfStudy} onChange={(e) => setPendingCatBSafetyEvidence((p) => ({ ...p, geographicalLocationOfStudy: e.target.value }))} />
              <input style={tblInput} placeholder="Subj." value={pendingCatBSafetyEvidence.humanStudiesNumberOfSubjects} onChange={(e) => setPendingCatBSafetyEvidence((p) => ({ ...p, humanStudiesNumberOfSubjects: e.target.value }))} />
              <input style={tblInput} placeholder="Dosage & duration" value={pendingCatBSafetyEvidence.dosageAndDuration} onChange={(e) => setPendingCatBSafetyEvidence((p) => ({ ...p, dosageAndDuration: e.target.value }))} />
              <input style={tblInput} placeholder="Conclusion" value={pendingCatBSafetyEvidence.conclusion} onChange={(e) => setPendingCatBSafetyEvidence((p) => ({ ...p, conclusion: e.target.value }))} />
              <button onClick={() => addEvidenceDosageRow('catBSafetyEvidenceRows', pendingCatBSafetyEvidence, () => setPendingCatBSafetyEvidence(emptyEvidenceDosage()))} style={{ background: catColor, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Shared: Serving Size, Target Population, Directions, Duration (PDF order: vii.1→2→3→4) */}
      <div style={{ ...secCard, order: -10 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: COLORS.primary }}>Serving Size, Target Population &amp; Usage</div>
        {/* vii.1 Serving Size */}
        <div style={row}>
          <label style={fieldLabel}>Serving Size *</label>
          <div>
            <input style={eb(input, 'servingSize')} placeholder="e.g. 5g (1 teaspoon) / 2 capsules" value={d.servingSize} onChange={(e) => setField('servingSize', e.target.value)} />
            {errMsg('servingSize')}
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={S.label}>Serving Size Document</label>
          <UB value={d.servingSizeFile} field="servingSizeFile" />
        </div>
        {/* vii.2 Target Population */}
        <div style={row}>
          <label style={fieldLabel}>Target Population *</label>
          <div>
            <input style={eb(input, 'targetPopulation')} placeholder="e.g. Adults (18+ years), excluding pregnant women" value={d.targetPopulation} onChange={(e) => setField('targetPopulation', e.target.value)} />
            {errMsg('targetPopulation')}
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={S.label}>Target Population Document</label>
          <UB value={d.targetPopulationFile} field="targetPopulationFile" />
        </div>
        {/* vii.3 Directions for Use */}
        <div style={row}>
          <label style={fieldLabel}>Directions for Use *</label>
          <div>
            <textarea style={eb(textarea, 'directionsForUse')} placeholder="e.g. Mix 5g in 200ml warm water or milk. Consume once daily before breakfast." value={d.directionsForUse} onChange={(e) => setField('directionsForUse', e.target.value)} />
            {errMsg('directionsForUse')}
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={S.label}>Directions for Use Document</label>
          <UB value={d.directionsForUseFile} field="directionsForUseFile" />
        </div>
        {/* vii.4 Duration for Use */}
        <div style={row}>
          <label style={fieldLabel}>Duration of Use</label>
          <input style={input} placeholder="e.g. 30 days, Continuous use" value={d.durationOfUse} onChange={(e) => setField('durationOfUse', e.target.value)} />
        </div>
        <div style={{ marginBottom: 4 }}>
          <label style={S.label}>Duration of Use Document</label>
          <UB value={d.durationOfUseFile} field="durationOfUseFile" />
        </div>
      </div>

      {/* Shared: FSS(P)R 2018 Conformance */}
      <div style={{ ...secCard, order: -30 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: COLORS.primary }}>Type of Package / Packaging Material</div>
        <div style={{ marginBottom: 10 }}>
          <label style={S.label}>Type of Package / Packaging Material *</label>
          <textarea style={eb(textarea, 'packageMaterial')} value={d.packageMaterial} onChange={(e) => setField('packageMaterial', e.target.value)} placeholder="Describe the package type and packaging material used for the proposed Ayurveda Aahara..." />
          <WordCounter value={d.packageMaterial} limit={500} />
          {errMsg('packageMaterial')}
        </div>
        <div style={{ marginBottom: 8, fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6 }}>
          Does the proposed Ayurveda Aahara product conform to FSS(P)R 2018?
        </div>
        <div style={{ marginBottom: 8 }}>
          {radioGroup('fssConformance', d.fssConformance)}
          {errMsg('fssConformance')}
        </div>
      </div>

      {/* Shared: Product Label — not shown for Category B */}
      {cat !== 'B' && (
        <div style={{ ...secCard, order: -20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: COLORS.primary }}>Product Label *</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>Upload the proposed product label / label artwork (jpg/pdf, max 10 MB).</div>
          <UB value={d.productLabel} field="productLabel" />
          {errMsg('productLabel')}
        </div>
      )}

      {/* Category B1 — Label Claims (Health Benefit + Disease Risk) */}
      {cat === 'B1' && (
        <div style={catCard(catColor)}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: catColor }}>
            Label Claims <CatBadge cat="B1" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={S.label}>Is a Health Benefit Claim proposed on the label?</label>
            {radioGroup('b1LabelHealthBenefitYesNo', d.b1LabelHealthBenefitYesNo)}
            {errMsg('b1LabelHealthBenefitYesNo')}
          </div>
          {d.b1LabelHealthBenefitYesNo === 'Yes' && (
            <>
              <div style={{ marginBottom: 10 }}>
                <label style={S.label}>Health Benefit Rationale</label>
                <textarea style={textarea} value={d.catB1HealthBenefitRationale} onChange={(e) => setField('catB1HealthBenefitRationale', e.target.value)} placeholder="Rationale for proposed health benefit claim…" />
                <WordCounter value={d.catB1HealthBenefitRationale} limit={300} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={S.label}>Supporting Document (Health Benefit)</label>
                  <UB value={d.b1HealthBenefitFile} field="b1HealthBenefitFile" />
                  {errMsg('b1HealthBenefitFile')}
                </div>
                <div>
                  <label style={S.label}>Abstract / Summary</label>
                  <textarea style={{ ...textarea, minHeight: 60 }} value={d.b1HealthBenefitAbstract} onChange={(e) => setField('b1HealthBenefitAbstract', e.target.value)} placeholder="250–300 word abstract..." />
                  <WordCounter value={d.b1HealthBenefitAbstract} limit={300} />
                  {errMsg('b1HealthBenefitAbstract')}
                </div>
              </div>
              <div style={{ marginTop: 8, marginBottom: 4, fontWeight: 600, fontSize: 12, color: catColor }}>Health Benefit Evidence</div>
              <EvidenceDosageTable field="catB1HealthBenefitEvidenceRows" rows={d.catB1HealthBenefitEvidenceRows} pending={pendingCatB1HealthBenefitEvidence} setPending={setPendingCatB1HealthBenefitEvidence} />
              {errMsg('catB1HealthBenefitEvidenceRows')}
            </>
          )}
          <div style={{ marginTop: 16, marginBottom: 8 }}>
            <label style={S.label}>Is a Disease Risk Reduction Claim proposed on the label?</label>
            {radioGroup('b1LabelDiseaseRiskYesNo', d.b1LabelDiseaseRiskYesNo)}
            {errMsg('b1LabelDiseaseRiskYesNo')}
          </div>
          {d.b1LabelDiseaseRiskYesNo === 'Yes' && (
            <>
              <div style={{ marginBottom: 8 }}>
                <label style={S.label}>Label Disease Risk Statement 1</label>
                <textarea style={eb(textarea, 'b1LabelDiseaseRiskStatement1')} value={d.b1LabelDiseaseRiskStatement1} onChange={(e) => setField('b1LabelDiseaseRiskStatement1', e.target.value)} placeholder="Alternative claim statement 1…" />
                <WordCounter value={d.b1LabelDiseaseRiskStatement1} limit={100} />
                {errMsg('b1LabelDiseaseRiskStatement1')}
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={S.label}>Label Disease Risk Statement 2</label>
                <textarea style={textarea} value={d.b1LabelDiseaseRiskStatement2} onChange={(e) => setField('b1LabelDiseaseRiskStatement2', e.target.value)} placeholder="Alternative claim statement 2…" />
                <WordCounter value={d.b1LabelDiseaseRiskStatement2} limit={100} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={S.label}>Label Disease Risk Statement 3</label>
                <textarea style={textarea} value={d.b1LabelDiseaseRiskStatement3} onChange={(e) => setField('b1LabelDiseaseRiskStatement3', e.target.value)} placeholder="Alternative claim statement 3…" />
                <WordCounter value={d.b1LabelDiseaseRiskStatement3} limit={100} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>Supporting Document</label>
                  <UB value={d.b1LabelDiseaseRiskFile} field="b1LabelDiseaseRiskFile" />
                  {errMsg('b1LabelDiseaseRiskFile')}
                </div>
                <div>
                  <label style={S.label}>Abstract / Summary</label>
                  <textarea style={{ ...textarea, minHeight: 60 }} value={d.b1LabelDiseaseRiskAbstract} onChange={(e) => setField('b1LabelDiseaseRiskAbstract', e.target.value)} placeholder="250–300 word abstract..." />
                  <WordCounter value={d.b1LabelDiseaseRiskAbstract} limit={300} />
                  {errMsg('b1LabelDiseaseRiskAbstract')}
                </div>
              </div>
              <div style={{ marginTop: 12, marginBottom: 4, fontWeight: 600, fontSize: 12, color: catColor }}>Scientific Evidence</div>
              <EvidenceDosageTable field="catB1DiseaseRiskEvidenceRows" rows={d.catB1DiseaseRiskEvidenceRows} pending={pendingCatB1DiseaseEvidence} setPending={setPendingCatB1DiseaseEvidence} />
            </>
          )}
        </div>
      )}

      {/* Category B2 — Health Benefit Claims */}
      {cat === 'B2' && (
        <div style={catCard(catColor)}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: catColor }}>
            Health Benefit Claims <CatBadge cat="B2" />
          </div>
          {/* Health Benefit 1 — Specified */}
          <div style={{ marginBottom: 8 }}>
            <label style={S.label}>Health Benefit Claim — Specified (proposed on label)?</label>
            {radioGroup('catB2HealthBenefit1YesNo', d.catB2HealthBenefit1YesNo)}
          </div>
          {d.catB2HealthBenefit1YesNo === 'Yes' && (
            <>
              <div style={{ marginBottom: 10 }}>
                <label style={S.label}>Health Benefit 1 Rationale</label>
                <textarea style={textarea} value={d.catB2HealthBenefit1Rationale} onChange={(e) => setField('catB2HealthBenefit1Rationale', e.target.value)} placeholder="Rationale for specified health benefit claim…" />
                <WordCounter value={d.catB2HealthBenefit1Rationale} limit={300} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={S.label}>Supporting Document (Specified)</label>
                  <UB value={d.catB2HealthBenefit1File} field="catB2HealthBenefit1File" />
                </div>
                <div>
                  <label style={S.label}>Abstract / Summary</label>
                  <textarea style={{ ...textarea, minHeight: 60 }} value={d.catB2HealthBenefit1Abstract} onChange={(e) => setField('catB2HealthBenefit1Abstract', e.target.value)} placeholder="250–300 word abstract..." />
                  <WordCounter value={d.catB2HealthBenefit1Abstract} limit={300} />
                </div>
              </div>
              <div style={{ marginTop: 8, marginBottom: 4, fontWeight: 600, fontSize: 12, color: catColor }}>Health Benefit Claim 1 Evidence</div>
              <EvidenceDosageTable field="catB2HealthBenefit1EvidenceRows" rows={d.catB2HealthBenefit1EvidenceRows} pending={pendingCatB2HealthBenefit1Evidence} setPending={setPendingCatB2HealthBenefit1Evidence} />
              {errMsg('catB2HealthBenefit1EvidenceRows')}
            </>
          )}
          {/* Health Benefit 2 — Not Specified */}
          <div style={{ marginBottom: 8 }}>
            <label style={S.label}>Health Benefit Claim — Not Specified (proposed on label)?</label>
            {radioGroup('catB2HealthBenefit2YesNo', d.catB2HealthBenefit2YesNo)}
          </div>
          {d.catB2HealthBenefit2YesNo === 'Yes' && (
            <>
              <div style={{ marginBottom: 10 }}>
                <label style={S.label}>Health Benefit 2 Rationale</label>
                <textarea style={textarea} value={d.catB2HealthBenefit2Rationale} onChange={(e) => setField('catB2HealthBenefit2Rationale', e.target.value)} placeholder="Rationale for non-specified health benefit claim…" />
                <WordCounter value={d.catB2HealthBenefit2Rationale} limit={300} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
                <div>
                  <label style={S.label}>Supporting Document (Not Specified)</label>
                  <UB value={d.catB2HealthBenefit2File} field="catB2HealthBenefit2File" />
                </div>
                <div>
                  <label style={S.label}>Abstract / Summary</label>
                  <textarea style={{ ...textarea, minHeight: 60 }} value={d.catB2HealthBenefit2Abstract} onChange={(e) => setField('catB2HealthBenefit2Abstract', e.target.value)} placeholder="250–300 word abstract..." />
                  <WordCounter value={d.catB2HealthBenefit2Abstract} limit={300} />
                </div>
              </div>
              <div style={{ marginTop: 8, marginBottom: 4, fontWeight: 600, fontSize: 12, color: catColor }}>Health Benefit Claim 2 Evidence</div>
              <EvidenceDosageTable field="catB2HealthBenefit2EvidenceRows" rows={d.catB2HealthBenefit2EvidenceRows} pending={pendingCatB2HealthBenefit2Evidence} setPending={setPendingCatB2HealthBenefit2Evidence} />
              {errMsg('catB2HealthBenefit2EvidenceRows')}
            </>
          )}
        </div>
      )}

      {/* Category B2 — Disease Risk Claims */}
      {cat === 'B2' && (
        <div style={catCard(catColor)}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: catColor }}>
            Disease Risk Reduction Claims <CatBadge cat="B2" />
          </div>
          {/* Disease Risk 1 */}
          <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 12, color: catColor }}>Disease Risk 1 (specified disease)</div>
          <div style={{ marginBottom: 8 }}>
            <label style={S.label}>Claim proposed?</label>
            {radioGroup('catB2DiseaseRisk1YesNo', d.catB2DiseaseRisk1YesNo)}
          </div>
          {d.catB2DiseaseRisk1YesNo === 'Yes' && (
            <>
              {(['catB2DiseaseRisk1Statement1', 'catB2DiseaseRisk1Statement2', 'catB2DiseaseRisk1Statement3'] as const).map((f, i) => (
                <div key={f} style={{ marginBottom: 8 }}>
                  <label style={S.label}>Statement {i + 1}</label>
                  <textarea style={textarea} value={d[f]} onChange={(e) => setField(f, e.target.value)} placeholder={`Alternative claim statement ${i + 1}…`} />
                  <WordCounter value={d[f]} limit={100} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={S.label}>Supporting Document</label>
                  <UB value={d.catB2DiseaseRisk1File} field="catB2DiseaseRisk1File" />
                </div>
                <div>
                  <label style={S.label}>Abstract</label>
                  <textarea style={{ ...textarea, minHeight: 60 }} value={d.catB2DiseaseRisk1Abstract} onChange={(e) => setField('catB2DiseaseRisk1Abstract', e.target.value)} placeholder="250–300 word abstract..." />
                  <WordCounter value={d.catB2DiseaseRisk1Abstract} limit={300} />
                </div>
              </div>
              {/* Evidence rows for B2 disease risk 1 */}
              <div style={{ marginBottom: 4, fontWeight: 600, fontSize: 12, color: catColor }}>Scientific Evidence</div>
              {d.catB2DiseaseRisk1EvidenceRows.length > 0 && (
                <div style={{ overflowX: 'auto', marginBottom: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead><tr>{['#', 'Type of Evidence', 'Journal / IF', 'Location', 'Subjects', 'Dosage & Duration', 'Conclusion', 'Remove'].map((h) => <th key={h} style={tblTh}>{h}</th>)}</tr></thead>
                    <tbody>{d.catB2DiseaseRisk1EvidenceRows.map((r, idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : COLORS.bg }}>
                        <td style={tblTd}>{idx + 1}</td>
                        <td style={tblTd}><input style={tblInput} value={r.typeOfEvidence} onChange={(e) => updateEvidenceDosageRow('catB2DiseaseRisk1EvidenceRows', idx, 'typeOfEvidence', e.target.value)} /></td>
                        <td style={tblTd}><input style={tblInput} value={r.nameOfJournalImpactFactor} onChange={(e) => updateEvidenceDosageRow('catB2DiseaseRisk1EvidenceRows', idx, 'nameOfJournalImpactFactor', e.target.value)} /></td>
                        <td style={tblTd}><input style={tblInput} value={r.geographicalLocationOfStudy} onChange={(e) => updateEvidenceDosageRow('catB2DiseaseRisk1EvidenceRows', idx, 'geographicalLocationOfStudy', e.target.value)} /></td>
                        <td style={tblTd}><input style={{ ...tblInput, width: 60 }} value={r.humanStudiesNumberOfSubjects} onChange={(e) => updateEvidenceDosageRow('catB2DiseaseRisk1EvidenceRows', idx, 'humanStudiesNumberOfSubjects', e.target.value)} /></td>
                        <td style={tblTd}><input style={tblInput} value={r.dosageAndDuration} onChange={(e) => updateEvidenceDosageRow('catB2DiseaseRisk1EvidenceRows', idx, 'dosageAndDuration', e.target.value)} /></td>
                        <td style={tblTd}><input style={tblInput} value={r.conclusion} onChange={(e) => updateEvidenceDosageRow('catB2DiseaseRisk1EvidenceRows', idx, 'conclusion', e.target.value)} /></td>
                        <td style={tblTd}><button onClick={() => removeEvidenceDosageRow('catB2DiseaseRisk1EvidenceRows', idx)} style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer', fontSize: 16 }}>×</button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
              <div style={{ background: COLORS.bg, border: `1px dashed ${COLORS.border}`, borderRadius: 6, padding: 8, marginBottom: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 60px 1fr 1fr auto', gap: 6 }}>
                  <input style={tblInput} placeholder="Type of evidence" value={pendingCatB2Risk1Evidence.typeOfEvidence} onChange={(e) => setPendingCatB2Risk1Evidence((p) => ({ ...p, typeOfEvidence: e.target.value }))} />
                  <input style={tblInput} placeholder="Journal / IF" value={pendingCatB2Risk1Evidence.nameOfJournalImpactFactor} onChange={(e) => setPendingCatB2Risk1Evidence((p) => ({ ...p, nameOfJournalImpactFactor: e.target.value }))} />
                  <input style={tblInput} placeholder="Location" value={pendingCatB2Risk1Evidence.geographicalLocationOfStudy} onChange={(e) => setPendingCatB2Risk1Evidence((p) => ({ ...p, geographicalLocationOfStudy: e.target.value }))} />
                  <input style={tblInput} placeholder="Subj." value={pendingCatB2Risk1Evidence.humanStudiesNumberOfSubjects} onChange={(e) => setPendingCatB2Risk1Evidence((p) => ({ ...p, humanStudiesNumberOfSubjects: e.target.value }))} />
                  <input style={tblInput} placeholder="Dosage & duration" value={pendingCatB2Risk1Evidence.dosageAndDuration} onChange={(e) => setPendingCatB2Risk1Evidence((p) => ({ ...p, dosageAndDuration: e.target.value }))} />
                  <input style={tblInput} placeholder="Conclusion" value={pendingCatB2Risk1Evidence.conclusion} onChange={(e) => setPendingCatB2Risk1Evidence((p) => ({ ...p, conclusion: e.target.value }))} />
                  <button onClick={() => addEvidenceDosageRow('catB2DiseaseRisk1EvidenceRows', pendingCatB2Risk1Evidence, () => setPendingCatB2Risk1Evidence(emptyEvidenceDosage()))} style={{ background: catColor, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
                </div>
              </div>
            </>
          )}
          {/* Disease Risk 2 */}
          <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 12, color: catColor }}>Disease Risk 2 (non-specified disease)</div>
          <div style={{ marginBottom: 8 }}>
            <label style={S.label}>Claim proposed?</label>
            {radioGroup('catB2DiseaseRisk2YesNo', d.catB2DiseaseRisk2YesNo)}
          </div>
          {d.catB2DiseaseRisk2YesNo === 'Yes' && (
            <>
              {(['catB2DiseaseRisk2Statement1', 'catB2DiseaseRisk2Statement2', 'catB2DiseaseRisk2Statement3'] as const).map((f, i) => (
                <div key={f} style={{ marginBottom: 8 }}>
                  <label style={S.label}>Statement {i + 1}</label>
                  <textarea style={textarea} value={d[f]} onChange={(e) => setField(f, e.target.value)} placeholder={`Alternative claim statement ${i + 1}…`} />
                  <WordCounter value={d[f]} limit={100} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>Supporting Document</label>
                  <UB value={d.catB2DiseaseRisk2File} field="catB2DiseaseRisk2File" />
                </div>
                <div>
                  <label style={S.label}>Abstract</label>
                  <textarea style={{ ...textarea, minHeight: 60 }} value={d.catB2DiseaseRisk2Abstract} onChange={(e) => setField('catB2DiseaseRisk2Abstract', e.target.value)} placeholder="250–300 word abstract..." />
                  <WordCounter value={d.catB2DiseaseRisk2Abstract} limit={300} />
                </div>
              </div>
              {/* Evidence rows for B2 disease risk 2 */}
              <div style={{ marginTop: 12, marginBottom: 4, fontWeight: 600, fontSize: 12, color: catColor }}>Scientific Evidence</div>
              {d.catB2DiseaseRisk2EvidenceRows.length > 0 && (
                <div style={{ overflowX: 'auto', marginBottom: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead><tr>{['#', 'Type of Evidence', 'Journal / IF', 'Location', 'Subjects', 'Dosage & Duration', 'Conclusion', 'Remove'].map((h) => <th key={h} style={tblTh}>{h}</th>)}</tr></thead>
                    <tbody>{d.catB2DiseaseRisk2EvidenceRows.map((r, idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : COLORS.bg }}>
                        <td style={tblTd}>{idx + 1}</td>
                        <td style={tblTd}><input style={tblInput} value={r.typeOfEvidence} onChange={(e) => updateEvidenceDosageRow('catB2DiseaseRisk2EvidenceRows', idx, 'typeOfEvidence', e.target.value)} /></td>
                        <td style={tblTd}><input style={tblInput} value={r.nameOfJournalImpactFactor} onChange={(e) => updateEvidenceDosageRow('catB2DiseaseRisk2EvidenceRows', idx, 'nameOfJournalImpactFactor', e.target.value)} /></td>
                        <td style={tblTd}><input style={tblInput} value={r.geographicalLocationOfStudy} onChange={(e) => updateEvidenceDosageRow('catB2DiseaseRisk2EvidenceRows', idx, 'geographicalLocationOfStudy', e.target.value)} /></td>
                        <td style={tblTd}><input style={{ ...tblInput, width: 60 }} value={r.humanStudiesNumberOfSubjects} onChange={(e) => updateEvidenceDosageRow('catB2DiseaseRisk2EvidenceRows', idx, 'humanStudiesNumberOfSubjects', e.target.value)} /></td>
                        <td style={tblTd}><input style={tblInput} value={r.dosageAndDuration} onChange={(e) => updateEvidenceDosageRow('catB2DiseaseRisk2EvidenceRows', idx, 'dosageAndDuration', e.target.value)} /></td>
                        <td style={tblTd}><input style={tblInput} value={r.conclusion} onChange={(e) => updateEvidenceDosageRow('catB2DiseaseRisk2EvidenceRows', idx, 'conclusion', e.target.value)} /></td>
                        <td style={tblTd}><button onClick={() => removeEvidenceDosageRow('catB2DiseaseRisk2EvidenceRows', idx)} style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer', fontSize: 16 }}>×</button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
              <div style={{ background: COLORS.bg, border: `1px dashed ${COLORS.border}`, borderRadius: 6, padding: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 60px 1fr 1fr auto', gap: 6 }}>
                  <input style={tblInput} placeholder="Type of evidence" value={pendingCatB2Risk2Evidence.typeOfEvidence} onChange={(e) => setPendingCatB2Risk2Evidence((p) => ({ ...p, typeOfEvidence: e.target.value }))} />
                  <input style={tblInput} placeholder="Journal / IF" value={pendingCatB2Risk2Evidence.nameOfJournalImpactFactor} onChange={(e) => setPendingCatB2Risk2Evidence((p) => ({ ...p, nameOfJournalImpactFactor: e.target.value }))} />
                  <input style={tblInput} placeholder="Location" value={pendingCatB2Risk2Evidence.geographicalLocationOfStudy} onChange={(e) => setPendingCatB2Risk2Evidence((p) => ({ ...p, geographicalLocationOfStudy: e.target.value }))} />
                  <input style={tblInput} placeholder="Subj." value={pendingCatB2Risk2Evidence.humanStudiesNumberOfSubjects} onChange={(e) => setPendingCatB2Risk2Evidence((p) => ({ ...p, humanStudiesNumberOfSubjects: e.target.value }))} />
                  <input style={tblInput} placeholder="Dosage & duration" value={pendingCatB2Risk2Evidence.dosageAndDuration} onChange={(e) => setPendingCatB2Risk2Evidence((p) => ({ ...p, dosageAndDuration: e.target.value }))} />
                  <input style={tblInput} placeholder="Conclusion" value={pendingCatB2Risk2Evidence.conclusion} onChange={(e) => setPendingCatB2Risk2Evidence((p) => ({ ...p, conclusion: e.target.value }))} />
                  <button onClick={() => addEvidenceDosageRow('catB2DiseaseRisk2EvidenceRows', pendingCatB2Risk2Evidence, () => setPendingCatB2Risk2Evidence(emptyEvidenceDosage()))} style={{ background: catColor, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

    </div>,

    // ── Step 3: Uploads / Scientific Support ──────────────────────────────
    <div key={3}>
      {/* Category B1 — Format Rationale & Efficacy */}
      {false && cat === 'B1' && (
        <div style={catCard(catColor)}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: catColor }}>
            Format Rationale &amp; Efficacy Data <CatBadge cat="B1" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Rationale for Different Format *</label>
            <textarea style={eb(textarea, 'differentFormatRationale')} value={d.differentFormatRationale} onChange={(e) => setField('differentFormatRationale', e.target.value)} placeholder="Explain why the proposed format differs from classical Ayurvedic preparations and why it is justified…" />
            <WordCounter value={d.differentFormatRationale} limit={500} />
            {errMsg('differentFormatRationale')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={S.label}>Supporting Document for Format Rationale</label>
              <UB value={d.differentFormatRationaleFile} field="differentFormatRationaleFile" />
            </div>
            <div>
              <label style={S.label}>Efficacy Data Upload *</label>
              <UB value={d.efficacyDataFile} field="efficacyDataFile" />
              {errMsg('efficacyDataFile')}
            </div>
          </div>
          <div>
            <label style={S.label}>Efficacy Data Abstract *</label>
            <textarea style={eb(textarea, 'efficacyDataAbstract')} value={d.efficacyDataAbstract} onChange={(e) => setField('efficacyDataAbstract', e.target.value)} placeholder="250–300 word abstract summarising efficacy evidence…" />
            <WordCounter value={d.efficacyDataAbstract} limit={300} />
            {errMsg('efficacyDataAbstract')}
          </div>
          <div style={{ marginTop: 12, marginBottom: 4, fontWeight: 600, fontSize: 12, color: catColor }}>Efficacy Evidence</div>
          <EvidenceDosageTable field="catB1EfficacyEvidenceRows" rows={d.catB1EfficacyEvidenceRows} pending={pendingCatB1EfficacyEvidence} setPending={setPendingCatB1EfficacyEvidence} />
          {errMsg('catB1EfficacyEvidenceRows')}
        </div>
      )}

      {/* Shared: Product Label */}
      <div style={{ ...secCard, display: 'none' }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: COLORS.primary }}>Product Label *</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>Upload the proposed product label / label artwork (jpg/pdf, max 10 MB).</div>
        <UB value={d.productLabel} field="productLabel" />
      </div>

      {/* Part III — Existing Registration / License Details */}
      <div style={{ ...secCard, border: `1px solid ${COLORS.primary}44`, background: COLORS.primaryLight }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: COLORS.primary }}>
          Part III — Existing Registration / License Details
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
          Indicate whether you have already obtained any registration or license for this Ayurveda Aahara prior to implementation of FSS(AA) Regulation.
        </div>
        <div style={row}>
          <label style={fieldLabel}>Have you already obtained any registration / license for this Ayurveda Aahara? *</label>
          <div>
            {radioGroup('hasExistingRegistration', d.hasExistingRegistration)}
            {errMsg('hasExistingRegistration')}
          </div>
        </div>

        {d.hasExistingRegistration === 'Yes' && (
          <>
            <div style={row}>
              <label style={fieldLabel}>Registration Number *</label>
              <div>
                <input style={eb(input, 'registrationNumber')} placeholder="Enter registration number" value={d.registrationNumber} onChange={(e) => setField('registrationNumber', e.target.value)} />
                {errMsg('registrationNumber')}
              </div>
            </div>
            <div style={row}>
              <label style={fieldLabel}>Registration Date *</label>
              <div>
                <input type="date" style={eb(input, 'registrationDate')} value={d.registrationDate} onChange={(e) => setField('registrationDate', e.target.value)} />
                {errMsg('registrationDate')}
              </div>
            </div>
            <div style={row}>
              <label style={fieldLabel}>License Number</label>
              <input style={input} placeholder="Enter license number" value={d.licenseNumberExisting} onChange={(e) => setField('licenseNumberExisting', e.target.value)} />
            </div>
            <div style={row}>
              <label style={fieldLabel}>License Date</label>
              <input type="date" style={input} value={d.licenseDate} onChange={(e) => setField('licenseDate', e.target.value)} />
            </div>
            <div style={row}>
              <label style={fieldLabel}>Upload Registration Certificate</label>
              <UB value={d.registrationCertificate} field="registrationCertificate" />
            </div>
            <div style={row}>
              <label style={fieldLabel}>Upload License Certificate</label>
              <UB value={d.licenseCertificate} field="licenseCertificate" />
            </div>
          </>
        )}
      </div>
    </div>,

    // ── Step 4: Payment & Submit ──────────────────────────────────────────
    <div key={4} style={secCard}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Payment &amp; Submission</div>

      <div style={{ background: COLORS.primaryLight, border: `1px solid ${COLORS.primary}33`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: COLORS.primary, marginBottom: 8 }}>Fee Summary</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13 }}>Ayurveda Aahara Application Fee</span>
          <span style={{ fontWeight: 700 }}>₹ 3,00,000</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13 }}>GST (18%)</span>
          <span style={{ fontWeight: 700 }}>₹ 54,000</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${COLORS.primary}33`, paddingTop: 8, marginTop: 4 }}>
          <span style={{ fontWeight: 700 }}>Total</span>
          <span style={{ fontWeight: 800, fontSize: 16, color: COLORS.primary }}>₹ 3,54,000</span>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={S.label}>Payment Method</label>
        <select style={select} value={d.paymentMethod} onChange={(e) => setField('paymentMethod', e.target.value)}>
          <option value="Online Payment (NEFT/RTGS/UPI)">Online Payment (NEFT/RTGS/UPI)</option>
          <option value="Demand Draft">Demand Draft</option>
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

  const sectionTitles = [
    'Category & Basic Information',
    'Ingredients / Additives / Composition',
    'Claims / Usage / Population',
    'Uploads / Scientific Support',
    'Payment & Submit',
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, paddingLeft: 12, borderLeft: `4px solid ${COLORS.primary}` }}>
        <div style={S.roleLabel}>START NEW APPLICATION</div>
        <div style={S.pageTitle}>Application Form (Ayurveda Aahara)</div>
        <div style={S.pageDesc}>Ayurveda Aahara application. All data is auto-saved on each step.</div>
      </div>

      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Stepper steps={STEPS} current={step} />

        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          STEP {step + 1} OF {STEPS.length}
        </div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: COLORS.text }}>
          {sectionTitles[step]}
          {cat && step > 0 && <CatBadge cat={cat} />}
        </div>
        {cat && step > 0 && (
          <div style={{ fontSize: 11, color: catColor, marginBottom: 12 }}>
            Category {cat} — category-specific sections are highlighted with a coloured left border.
          </div>
        )}

        {Object.keys(stepErrors).length > 0 && (
          <div style={{ background: COLORS.dangerLight, border: `1px solid #F5C6C6`, borderLeft: `4px solid ${COLORS.danger}`, borderRadius: 7, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: COLORS.danger }}>
            <strong>Please fill in all required fields before continuing.</strong>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: 18 }}>
              {Object.values(stepErrors).map((msg, i) => <li key={i}>{msg}</li>)}
            </ul>
          </div>
        )}

        {stepContent[step]}

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
