import { api } from './api';

export interface Application {
  id:              string;
  referenceNumber: string;
  companyName:     string;
  address:         string;
  applicationType: string;
  workflowType:    string;
  foodCategory:    string;
  productName:     string | null;
  stage:           string;
  formData:        AppFormData | null;
  ecAssessment:    { checklist: Record<string, boolean>; notes: string } | null;
  toDecision:      Record<string, unknown> | null;
  submittedAt:     string | null;
  createdAt:       string;
  updatedAt:       string;
  documents?:      ApplicationDocument[];
}

export interface ApplicationDocument {
  id:            string;
  applicationId: string;
  fieldName:     string;
  originalName:  string;
  storedName:    string;
  mimeType:      string;
  size:          number;
  uploadedById:  string;
  uploadedAt:    string;
}

export type Bin = 'all' | 'incomplete' | 'submitted' | 'reverted' | 'rejected' | 'approved';

// ── Form data shape (mirrors 5-step ApplicationForm) ─────────────────────────
export interface Step1Data {
  applicationFor:   string;
  specifyFood:      string;
  ingredients:      Array<{ name: string; quantity: string; standardize: string }>;
  additives:        Array<{ name: string; quantity: string; standardize: string }>;
}
export interface Step2Data {
  applicantName:          string;
  authorisedPerson:       string;
  authorisedPersonOther:  string;
  mobileNo:               string;
  email:                  string;
  orgName:                string;
  orgAddress:             string;
  licenseNumber:          string;
  mfgAddress:             string;
  natureOfBusiness:       string;
  productName:            string;
  justification:          string;
  productCategory:        string;
  subCategory:            string;
  source:                 string;
  genusSp:                string;
  functionalBenefits:     string;
  healthBenefits:         string;
  endUseDeclaration:      string;
}
export interface Step3Data {
  certOfAnalysis:       string;
  manufacturingProcess: string;
  regulatoryStatus:     string;
  regulatoryStatusFile: string;
  relationshipType:     string;
  agreementDoc:         string;
  safetyFile1:          string;
  safetyFile2:          string;
  claimFile1:           string;
  claimFile2:           string;
  prototypeLabel:       string;
  postMarketingDecl:    string;
  confidentialityDecl:  string;
  gstNo:                string;
}
export interface Step4Data {
  targetGroup:     string;
  composition:     string;
  newTechnology:   string;
  chemicalName:    string;
  purity:          string;
  adi:             string;
  proposedLevel:   string;
  colorIndex:      string;
  specificationDoc:      string;
  enzymeActivity:        string;
  enzymePurity:          string;
  residualLimit:         string;
  microTemplate:         string;
  anyOtherDoc:           string;
  humanStudies:          string;
  humanStudiesFile:      string;
  toxicologyStudies:     string;
  toxicologyStudiesFile: string;
}
export interface Step5Data {
  paymentMethod:    string;
  paymentReference: string;
}
export interface AppFormData {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  step5: Step5Data;
}

export function emptyFormData(): AppFormData {
  return {
    step1: { applicationFor: '', specifyFood: '', ingredients: [], additives: [] },
    step2: { applicantName: '', authorisedPerson: '', authorisedPersonOther: '', mobileNo: '', email: '', orgName: '', orgAddress: '', licenseNumber: '', mfgAddress: '', natureOfBusiness: 'Manufacturer', productName: '', justification: '', productCategory: '', subCategory: '', source: 'Animal', genusSp: '', functionalBenefits: '', healthBenefits: '', endUseDeclaration: '' },
    step3: { certOfAnalysis: '', manufacturingProcess: '', regulatoryStatus: '', regulatoryStatusFile: '', relationshipType: 'Brand Owner', agreementDoc: '', safetyFile1: '', safetyFile2: '', claimFile1: '', claimFile2: '', prototypeLabel: '', postMarketingDecl: '', confidentialityDecl: '', gstNo: '' },
    step4: { targetGroup: '', composition: '', newTechnology: '', chemicalName: '', purity: '', adi: '', proposedLevel: '', colorIndex: '', specificationDoc: '', enzymeActivity: '', enzymePurity: '', residualLimit: '', microTemplate: '', anyOtherDoc: '', humanStudies: '', humanStudiesFile: '', toxicologyStudies: '', toxicologyStudiesFile: '' },
    step5: { paymentMethod: 'Online Payment (NEFT/RTGS/UPI)', paymentReference: '' },
  };
}

// ── Stage bins ────────────────────────────────────────────────────────────────
const SUBMITTED_STAGES = [
  'Submitted', 'WithNodalOfficerA', 'WithTechnicalOfficer',
  'WithExpertCommittee', 'WithNodalPointB', 'DecisionPending',
  'WithCEO', 'WithChairperson',
];

export function getBin(stage: string): Bin {
  if (stage === 'Draft') return 'incomplete';
  if (stage === 'QuerySent') return 'reverted';
  if (stage === 'Rejected') return 'rejected';
  if (['Approved', 'Closed'].includes(stage)) return 'approved';
  if (['Withdrawn', 'WithdrawnByAuthority'].includes(stage)) return 'submitted';
  if (SUBMITTED_STAGES.includes(stage)) return 'submitted';
  return 'submitted';
}

// ── Query type ────────────────────────────────────────────────────────────────
export interface QueryAskedBy {
  id:             string;
  username:       string;
  officeLocation: string | null;
}
export interface Query {
  id:                  string;
  applicationId:       string;
  text:                string;
  askedById:           string;
  askedBy:             QueryAskedBy;
  response:            string | null;
  respondedById:       string | null;
  respondedBy:         { id: string; username: string } | null;
  respondedAt:         string | null;
  revertedFromStage:   string;
  originStage:         string | null;
  nodalForwardedAt:    string | null;
  nodalFwdResponseAt:  string | null;
  createdAt:           string;
}

export interface ApplicationFilters {
  applicationType?: string;
  workflowType?:    string;
  stage?:           string;
}

// ── API calls ─────────────────────────────────────────────────────────────────
export async function fetchMyApplications(filters: ApplicationFilters = {}): Promise<Application[]> {
  const params = new URLSearchParams();
  if (filters.applicationType) params.set('applicationType', filters.applicationType);
  if (filters.workflowType)    params.set('workflowType', filters.workflowType);
  if (filters.stage)           params.set('stage', filters.stage);
  const qs = params.toString();
  const { data } = await api.get<{ applications: Application[] }>(`/applications/my${qs ? `?${qs}` : ''}`);
  return data.applications;
}

export async function fetchApplication(id: string): Promise<Application> {
  const { data } = await api.get<{ application: Application }>(`/applications/${id}`);
  return data.application;
}

export async function createDraftApplication(applicationType: string, companyName: string): Promise<Application> {
  const { data } = await api.post<{ application: Application }>('/applications', { applicationType, companyName });
  return data.application;
}

export async function saveDraftApplication(id: string, formData: AppFormData, productName?: string): Promise<Application> {
  const { data } = await api.put<{ application: Application }>(`/applications/${id}`, { formData, productName });
  return data.application;
}

export async function submitDraftApplication(id: string): Promise<Application> {
  const { data } = await api.post<{ application: Application }>(`/applications/${id}/submit`);
  return data.application;
}

export async function deleteDraftApplication(id: string): Promise<void> {
  await api.delete(`/applications/${id}`);
}

export async function requestWithdrawal(id: string, justification: string): Promise<void> {
  await api.post(`/applications/${id}/request-withdrawal`, { justification });
}

export async function sendCertificateEmail(id: string): Promise<{ sentTo: string }> {
  const { data } = await api.post<{ success: boolean; sentTo: string }>(`/applications/${id}/send-certificate`);
  return data;
}

export async function submitPmsReport(id: string, storedName: string, originalName: string): Promise<void> {
  await api.post(`/applications/${id}/submit-pms-report`, { storedName, originalName });
}

export async function fetchQueries(applicationId: string): Promise<Query[]> {
  const { data } = await api.get<{ queries: Query[] }>(`/applications/${applicationId}/queries`);
  return data.queries;
}

export async function respondToQuery(applicationId: string, queryId: string, response: string): Promise<Query> {
  const { data } = await api.post<{ query: Query }>(`/applications/${applicationId}/queries/${queryId}/respond`, { response });
  return data.query;
}

export async function nodalForwardQueryToApplicant(applicationId: string, queryId: string): Promise<Query> {
  const { data } = await api.post<{ query: Query }>(`/applications/${applicationId}/queries/${queryId}/nodal-forward`);
  return data.query;
}

export async function nodalForwardResponseToTech(applicationId: string, queryId: string): Promise<Query> {
  const { data } = await api.post<{ query: Query }>(`/applications/${applicationId}/queries/${queryId}/nodal-forward-response`);
  return data.query;
}

// Returns the storedName (UUID-prefixed filename) stored on the server
export async function uploadFile(file: File, applicationId?: string, fieldName?: string): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  if (applicationId) form.append('applicationId', applicationId);
  if (fieldName)     form.append('fieldName', fieldName);
  const { data } = await api.post<{ storedName: string }>('/uploads', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.storedName;
}
