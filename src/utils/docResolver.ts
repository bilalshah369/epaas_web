/**
 * Centralised document + compliance resolver.
 *
 * Each applicant form stores formData with a different shape:
 *   NSF / RPET / AnyOther — nested { step2, step3, step4, step5 }
 *   ClaimApproval (CA)    — flat object
 *   AyurvedaAahara (AA)   — flat object
 *
 * Every officer page must use getDocRows() / getComplianceItems() instead of
 * reading fd.step3?.[key] directly so that adding a new form type never
 * requires touching individual officer pages again.
 */
import type { Application, AppFormData } from '@/services/application.service';

export type DocRow        = { label: string; val: string };
export type ComplianceRow = { label: string; passed: boolean };

// ── Shared field extractors ───────────────────────────────────────────────────
// Used by officer dashboards that read a.foodCategory / a.address directly.
// Falls back to formData when the DB column is empty (pre-existing records).

export function resolveAddress(app: Application): string {
  if (app.address && app.address.trim()) return app.address;
  const fd = app.formData as Record<string, unknown> | null;
  if (!fd) return '—';
  const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  // AA
  if (s(fd.registeredOfficeAddress)) return s(fd.registeredOfficeAddress);
  if (s(fd.manufacturingAddress))    return s(fd.manufacturingAddress);
  // CA
  if (s(fd.applicantAddress))        return s(fd.applicantAddress);
  // RPET flat
  if (s(fd.addressOfPremise))        return s(fd.addressOfPremise);
  // NSF / AnyOther
  if (fd.step2 && typeof fd.step2 === 'object') {
    const s2 = fd.step2 as Record<string, unknown>;
    if (s(s2.orgAddress))  return s(s2.orgAddress);
    if (s(s2.mfgAddress))  return s(s2.mfgAddress);
  }
  return '—';
}

export function resolveFoodCategory(app: Application): string {
  if (app.foodCategory && app.foodCategory.trim()) return app.foodCategory;
  const fd = app.formData as Record<string, unknown> | null;
  if (!fd) return '—';
  const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  // AA
  if (s(fd.ayurvedaCategory)) return s(fd.ayurvedaCategory);
  // CA
  if (s(fd.productCategory))  return s(fd.productCategory);
  // NSF / RPET / AnyOther
  if (fd.step2 && typeof fd.step2 === 'object') {
    const v = (fd.step2 as Record<string, unknown>).productCategory;
    if (s(v)) return s(v);
  }
  return '—';
}

export function resolveWorkflowType(app: Application): string {
  return app.workflowType && app.workflowType.trim() ? app.workflowType : 'New';
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

function docValue(app: Application, fieldName: string, fallback: unknown): string {
  const uploaded = app.documents?.find((d) => d.fieldName === fieldName)?.storedName;
  return uploaded || str(fallback);
}

// ── Document rows ─────────────────────────────────────────────────────────────

export function getDocRows(app: Application | null): DocRow[] {
  if (!app) return [];
  const raw = app.formData as Record<string, unknown> | null;
  if (!raw) return [];

  const type = app.applicationType;

  // ── Ayurveda Aahara ──────────────────────────────────────────────────────
  if (type === 'AyurvedaAahara' || type === 'AA') {
    return [
      // Step 0 — Basic product info
      { label: 'Functional Use Supporting Document',          val: docValue(app, 'functionalUseFile', raw.functionalUseFile) },
      { label: 'Certificate of Analysis',                     val: docValue(app, 'certificateOfAnalysis', raw.certificateOfAnalysis) },
      { label: 'Manufacturing Process Document',              val: docValue(app, 'manufacturingProcessFile', raw.manufacturingProcessFile) },
      // Step 1 — Ingredients / Composition
      { label: 'Composition of Proposed Ayurveda Aahara',    val: docValue(app, 'compositionFile', raw.compositionFile) },
      { label: 'Ingredient List PDF',                         val: docValue(app, 'ingredientListFile', raw.ingredientListFile) },
      { label: 'Specifications Document',                     val: docValue(app, 'specificationsFile', raw.specificationsFile) },
      { label: 'Authoritative Book Scan (Cat. A)',            val: docValue(app, 'authoritativeBookScanFile', raw.authoritativeBookScanFile) },
      { label: 'Authoritative Book Scan (Cat. B)',            val: docValue(app, 'catBAuthoritativeBookScanFile', raw.catBAuthoritativeBookScanFile) },
      { label: 'Authoritative Book Scan (Cat. B1)',           val: docValue(app, 'catB1AuthoritativeBookScanFile', raw.catB1AuthoritativeBookScanFile) },
      { label: 'Authoritative Book Scan (Cat. B2)',           val: docValue(app, 'catB2AuthoritativeBookScanFile', raw.catB2AuthoritativeBookScanFile) },
      { label: 'Other Botanicals Supporting Document',        val: docValue(app, 'otherBotanicalsRationaleFile', raw.otherBotanicalsRationaleFile) },
      // Step 2 — Claims / Usage
      { label: 'Product Label',                               val: docValue(app, 'productLabel', raw.productLabel) },
      { label: 'Serving Size Document',                       val: docValue(app, 'servingSizeFile', raw.servingSizeFile) },
      { label: 'Target Population Document',                  val: docValue(app, 'targetPopulationFile', raw.targetPopulationFile) },
      { label: 'Directions for Use Document',                 val: docValue(app, 'directionsForUseFile', raw.directionsForUseFile) },
      { label: 'Duration of Use Document',                    val: docValue(app, 'durationOfUseFile', raw.durationOfUseFile) },
      { label: 'Health Benefit Claim Document (Cat. A)',      val: docValue(app, 'catAHealthBenefitFile', raw.catAHealthBenefitFile) },
      { label: 'Disease Risk Claim Document (Cat. A)',        val: docValue(app, 'catADiseaseRiskFile', raw.catADiseaseRiskFile) },
      { label: 'Health Benefit Claim Document (Cat. B)',      val: docValue(app, 'catBHealthBenefitFile', raw.catBHealthBenefitFile) },
      { label: 'Disease Risk Claim Document (Cat. B)',        val: docValue(app, 'catBDiseaseRiskFile', raw.catBDiseaseRiskFile) },
      { label: 'Safety Data Document (Cat. B)',               val: docValue(app, 'catBSafetyDataFile', raw.catBSafetyDataFile) },
      { label: 'Health Benefit Document (Cat. B1)',           val: docValue(app, 'b1HealthBenefitFile', raw.b1HealthBenefitFile) },
      { label: 'Disease Risk Reduction Document (Cat. B1)',   val: docValue(app, 'b1LabelDiseaseRiskFile', raw.b1LabelDiseaseRiskFile) },
      { label: 'Specified Health Benefit Document (Cat. B2)', val: docValue(app, 'catB2HealthBenefit1File', raw.catB2HealthBenefit1File) },
      { label: 'Non-specified Health Benefit Doc (Cat. B2)',  val: docValue(app, 'catB2HealthBenefit2File', raw.catB2HealthBenefit2File) },
      { label: 'Disease Risk Claim 1 Document (Cat. B2)',     val: docValue(app, 'catB2DiseaseRisk1File', raw.catB2DiseaseRisk1File) },
      { label: 'Disease Risk Claim 2 Document (Cat. B2)',     val: docValue(app, 'catB2DiseaseRisk2File', raw.catB2DiseaseRisk2File) },
      // Step 3 — Scientific Support (B1)
      { label: 'Format Rationale Document (Cat. B1)',         val: docValue(app, 'differentFormatRationaleFile', raw.differentFormatRationaleFile) },
      { label: 'Efficacy Data Document (Cat. B1)',            val: docValue(app, 'efficacyDataFile', raw.efficacyDataFile) },
      { label: 'Safety Data Document (Cat. B1)',              val: docValue(app, 'catB1SafetyDataFile', raw.catB1SafetyDataFile) },
      // Part III — Registration
      { label: 'Registration Certificate',                    val: docValue(app, 'registrationCertificate', raw.registrationCertificate) },
      { label: 'License Certificate',                         val: docValue(app, 'licenseCertificate', raw.licenseCertificate) },
    ].filter(d => d.val);
  }

  // ── Claim Approval ───────────────────────────────────────────────────────
  if (type === 'ClaimApproval' || type === 'CA') {
    return [
      { label: 'License Copy',                    val: docValue(app, 'licenseCopy', raw.licenseCopy) },
      { label: 'FSSAI Approval Letter',           val: docValue(app, 'approvalLetter', raw.approvalLetter) },
      { label: 'IPR Supporting Document',         val: docValue(app, 'iprSupportingDoc', raw.iprSupportingDoc) },
      { label: 'Scientific Substantiation',       val: docValue(app, 'scientificSubstantiationFile', raw.scientificSubstantiationFile) },
      { label: 'Disease Risk Studies',            val: docValue(app, 'diseaseRiskStudiesFile', raw.diseaseRiskStudiesFile) },
      { label: 'Analysis Method',                 val: docValue(app, 'analysisMethodFile', raw.analysisMethodFile) },
      { label: 'Adverse Effects Evidence',        val: docValue(app, 'adverseEffectsFile', raw.adverseEffectsFile) },
      { label: 'Additional Information',          val: docValue(app, 'additionalInfoFile', raw.additionalInfoFile) },
    ].filter(d => d.val);
  }

  // ── RPET (flat structure) ──────────────────────────────────────────────
  if (type === 'RPET') {
    return [
      { label: 'All Licences – Factory',                              val: docValue(app, 'factoryLicensesFile', raw.factoryLicensesFile) },
      { label: 'Labour Licence',                                      val: docValue(app, 'labourLicenseFile', raw.labourLicenseFile) },
      { label: 'Pollution Licence',                                   val: docValue(app, 'pollutionLicenseFile', raw.pollutionLicenseFile) },
      { label: 'GST Certificate',                                     val: docValue(app, 'gstLicenseFile', raw.gstLicenseFile) },
      { label: 'Recycling Technology Document',                       val: docValue(app, 'recyclingTechnologyFile', raw.recyclingTechnologyFile) },
      { label: 'Plant & Machinery Document',                          val: docValue(app, 'plantMachineryFile', raw.plantMachineryFile) },
      { label: 'NOL/NOC/Safety Assessment Document',                  val: docValue(app, 'globalRegulatoryFile', raw.globalRegulatoryFile) },
      { label: 'Facility Approval/Clearance (Competent Authority)',   val: docValue(app, 'facilityApprovalFile', raw.facilityApprovalFile) },
      { label: 'Vendor & Internal Audit Reports',                     val: docValue(app, 'vendorAuditFile', raw.vendorAuditFile) },
      { label: 'Quality & Safety Test Reports (NABL Accredited)',     val: docValue(app, 'qualitySafetyTestReportFile', raw.qualitySafetyTestReportFile) },
      { label: 'FSS(Packaging) Regulations 2018 Compliance',         val: docValue(app, 'fssPackagingRegFile', raw.fssPackagingRegFile) },
      { label: 'Sensory Analysis (ISO 13302 / GMP/QMS)',              val: docValue(app, 'sensoryAnalysisFile', raw.sensoryAnalysisFile) },
    ].filter(d => d.val);
  }

  // ── NSF / AnyOther — nested step3 ───────────────────────────────────────
  const fd    = raw as unknown as AppFormData;
  const step3 = fd.step3;
  return [
    { label: 'Certificate of Analysis',          val: docValue(app, 'certOfAnalysis', step3?.certOfAnalysis) },
    { label: 'Manufacturing Process Flow',       val: docValue(app, 'manufacturingProcess', step3?.manufacturingProcess) },
    { label: 'Regulatory Status Document',       val: docValue(app, 'regulatoryStatusFile', step3?.regulatoryStatusFile) },
    { label: 'Agreement Document',               val: docValue(app, 'agreementDoc', step3?.agreementDoc) },
    { label: 'Safety Information — File 1',      val: step3?.safetyFile1            ?? '' },
    { label: 'Safety Information — File 2',      val: step3?.safetyFile2            ?? '' },
    { label: 'Claim Support — File 1',           val: step3?.claimFile1             ?? '' },
    { label: 'Claim Support — File 2',           val: step3?.claimFile2             ?? '' },
    { label: 'Prototype Label',                  val: step3?.prototypeLabel         ?? '' },
    { label: 'Post-Marketing Declaration',       val: step3?.postMarketingDecl      ?? '' },
    { label: 'Confidentiality Declaration',      val: step3?.confidentialityDecl    ?? '' },
  ].filter(d => d.val);
}

// ── Compliance items ──────────────────────────────────────────────────────────

export function getComplianceItems(app: Application | null): ComplianceRow[] {
  if (!app) return [];
  const raw = app.formData as Record<string, unknown> | null;
  if (!raw) return [];

  const has  = (k: string): boolean => typeof raw[k] === 'string' && (raw[k] as string).length > 0;
  const type = app.applicationType;

  // ── Ayurveda Aahara ──────────────────────────────────────────────────────
  if (type === 'AyurvedaAahara' || type === 'AA') {
    return [
      { label: 'Application Form Complete',           passed: has('applicantName') && has('nameOfOrganization') && has('productName') },
      { label: 'Ayurveda Category Selected',          passed: has('ayurvedaCategory') },
      { label: 'Composition / Formulation Uploaded',  passed: has('compositionFile') || has('ingredientListFile') },
      { label: 'Certificate of Analysis Attached',    passed: has('certificateOfAnalysis') },
      { label: 'Manufacturing Process Attached',      passed: has('manufacturingProcessFile') },
      { label: 'Specifications Document Attached',    passed: has('specificationsFile') },
      { label: 'Product Label Uploaded',              passed: has('productLabel') },
      { label: 'Payment Reference Provided',          passed: has('paymentReference') },
    ];
  }

  // ── Claim Approval ───────────────────────────────────────────────────────
  if (type === 'ClaimApproval' || type === 'CA') {
    return [
      { label: 'Application Form Complete',           passed: has('applicantName') && has('productName') },
      { label: 'FSSAI License Number Provided',       passed: has('licenseNumber') },
      { label: 'License Copy Attached',               passed: has('licenseCopy') },
      { label: 'Claim Statement Provided',            passed: has('claimStatement') },
      { label: 'Scientific Substantiation Attached',  passed: has('scientificSubstantiationFile') },
      { label: 'Adverse Effects Evidence Provided',   passed: has('adverseEffectsFile') },
      { label: 'Analysis Method Document Provided',   passed: has('analysisMethodFile') },
      { label: 'Disease Risk Studies Provided',       passed: has('diseaseRiskStudiesFile') },
      { label: 'Product Category Identified',         passed: has('productCategory') },
      { label: 'Payment Reference Provided',          passed: has('paymentReference') },
    ];
  }

  // ── RPET (flat structure) ────────────────────────────────────────────────
  if (type === 'RPET') {
    return [
      { label: 'Manufacturer Details Complete',          passed: has('manufacturerName') && has('addressOfPremise') && has('authorizedPersonnel') },
      { label: 'Factory Licence Attached',               passed: has('factoryLicensesFile') },
      { label: 'Labour Licence Attached',                passed: has('labourLicenseFile') },
      { label: 'Pollution Licence Attached',             passed: has('pollutionLicenseFile') },
      { label: 'GST Certificate Attached',               passed: has('gstLicenseFile') },
      { label: 'Recycling Technology Details Provided',  passed: has('recyclingTechnologyDetails') && has('recyclingTechnologyFile') },
      { label: 'Plant & Machinery Details Provided',     passed: has('plantMachineryDetails') && has('plantMachineryFile') },
      { label: 'Global Regulatory Approval Provided',    passed: has('globalRegulatoryText') && has('globalRegulatoryFile') },
      { label: 'Facility Approval Attached',             passed: has('facilityApprovalFile') },
      { label: 'Vendor Audit Report Attached',           passed: has('vendorAuditFile') },
      { label: 'Quality & Safety Test Report Attached',  passed: has('qualitySafetyTestReportFile') },
      { label: 'FSS Packaging Compliance Attached',      passed: has('fssPackagingRegFile') },
      { label: 'Sensory Analysis Attached',              passed: has('sensoryAnalysisFile') },
      { label: 'All Manufacturer Declarations Signed',   passed: !!(raw.declPostConsumer && raw.declAuditReport && raw.declDocuments && raw.declFcmSymbol) },
      { label: 'Payment Reference Provided',             passed: has('paymentReference') },
    ];
  }

  // ── NSF / RPET / AnyOther — nested ──────────────────────────────────────
  const fd    = raw as unknown as AppFormData;
  const step2 = fd.step2;
  const step3 = fd.step3;
  const step5 = fd.step5;
  return [
    { label: 'Application Form Complete',           passed: !!(step2?.applicantName && step2.orgName && step2.productName) },
    { label: 'GST Number Provided',                 passed: !!(step3?.gstNo) },
    { label: 'FSSAI License Valid',                 passed: !!(step2?.licenseNumber) },
    { label: 'Product Formulation Submitted',       passed: !!(step2?.functionalBenefits || fd.step4?.composition) },
    { label: 'Certificate of Analysis Attached',    passed: !!(step3?.certOfAnalysis) },
    { label: 'Safety Information Attached',         passed: !!(step3?.safetyFile1) },
    { label: 'Manufacturing Process Flow Attached', passed: !!(step3?.manufacturingProcess) },
    { label: 'Prototype Label Uploaded',            passed: !!(step3?.prototypeLabel) },
    { label: 'Regulatory Status Document Provided', passed: !!(step3?.regulatoryStatusFile) },
    { label: 'Payment Reference Provided',          passed: !!(step5?.paymentReference) },
  ];
}

// ── Profile display fields ────────────────────────────────────────────────────
// Normalises the key applicant/product fields shown in every officer profile tab.

export interface ProfileDisplay {
  applicantName:    string;
  orgName:          string;
  licenseNumber:    string;
  mobileNo:         string;
  email:            string;
  natureOfBusiness: string;
  productName:      string;
  productCategory:  string;
  source:           string;
  gstNo:            string;
  paymentReference: string;
  mfgAddress:       string;
  justification:    string;
}

export function getProfileDisplay(app: Application | null): ProfileDisplay {
  const empty: ProfileDisplay = {
    applicantName: '', orgName: '', licenseNumber: '', mobileNo: '', email: '',
    natureOfBusiness: '', productName: '', productCategory: '', source: '',
    gstNo: '', paymentReference: '', mfgAddress: '', justification: '',
  };
  if (!app) return empty;
  const raw  = app.formData as Record<string, unknown> | null;
  if (!raw) return empty;

  const type = app.applicationType;

  if (type === 'AyurvedaAahara' || type === 'AA') {
    return {
      applicantName:    str(raw.applicantName),
      orgName:          str(raw.nameOfOrganization),
      licenseNumber:    str(raw.licenseNumber),
      mobileNo:         str(raw.authorisedContact),
      email:            str(raw.authorisedEmail),
      natureOfBusiness: str(raw.natureOfBusiness),
      productName:      str(raw.productName),
      productCategory:  str(raw.productCategory),
      source:           '',
      gstNo:            '',
      paymentReference: str(raw.paymentReference),
      mfgAddress:       str(raw.manufacturingAddress),
      justification:    str(raw.justificationOfProposedAyurvedaAahara),
    };
  }

  if (type === 'ClaimApproval' || type === 'CA') {
    return {
      applicantName:    str(raw.applicantName),
      orgName:          '',
      licenseNumber:    str(raw.licenseNumber),
      mobileNo:         str(raw.authorisedContact),
      email:            str(raw.authorisedEmail),
      natureOfBusiness: '',
      productName:      str(raw.productName),
      productCategory:  str(raw.productCategory),
      source:           '',
      gstNo:            '',
      paymentReference: str(raw.paymentReference),
      mfgAddress:       '',
      justification:    str(raw.claimJustification),
    };
  }

  // ── RPET (flat structure) ────────────────────────────────────────────────
  if (type === 'RPET') {
    return {
      applicantName:    str(raw.manufacturerName),
      orgName:          str(raw.manufacturerName),
      licenseNumber:    str(raw.gstLicenseFile) ? 'GST Attached' : '',
      mobileNo:         '',
      email:            '',
      natureOfBusiness: 'rPET Manufacturer',
      productName:      'FCM-rPET Packaging',
      productCategory:  'FCM-rPET Packaging',
      source:           '',
      gstNo:            '',
      paymentReference: str(raw.paymentReference),
      mfgAddress:       str(raw.addressOfPremise),
      justification:    str(raw.recyclingTechnologyDetails),
    };
  }

  // NSF / AnyOther — nested
  const fd    = raw as unknown as AppFormData;
  const step2 = fd.step2;
  const step3 = fd.step3;
  const step5 = fd.step5;
  return {
    applicantName:    step2?.applicantName    ?? '',
    orgName:          step2?.orgName          ?? '',
    licenseNumber:    step2?.licenseNumber    ?? '',
    mobileNo:         step2?.mobileNo         ?? '',
    email:            step2?.email            ?? '',
    natureOfBusiness: step2?.natureOfBusiness ?? '',
    productName:      step2?.productName      ?? '',
    productCategory:  step2?.productCategory  ?? '',
    source:           step2?.source           ?? '',
    gstNo:            step3?.gstNo            ?? '',
    paymentReference: step5?.paymentReference ?? '',
    mfgAddress:       step2?.mfgAddress       ?? '',
    justification:    step2?.justification    ?? '',
  };
}
