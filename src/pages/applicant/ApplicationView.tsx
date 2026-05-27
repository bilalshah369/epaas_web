// Mirrors ApplicantApplicationView from mock (App.jsx). Single application read-only view with tabs.
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { COLORS, S } from "@/utils/colors";
import { buildForm2Html } from "@/utils/form2Builder";
import StatusBadge from "@/components/ui/StatusBadge";
import TabBar from "@/components/ui/TabBar";
import {
  fetchApplication,
  fetchQueries,
  respondToQuery,
  uploadFile,
  sendCertificateEmail,
  submitPmsReport,
  type Application,
  type AppFormData,
  type Query,
} from "@/services/application.service";
import {
  fetchExtensions,
  type ExtensionItem,
} from "@/services/extension.service";
import { API_BASE } from "@/services/api";
import FormDataTable from "@/components/ui/FormDataTable";

// ── Constants ─────────────────────────────────────────────────────────────────
const TABS = [
  "Details",
  "Documents",
  "Queries",
  "Decision History",
  "Timeline",
];

const TYPE_LABELS: Record<string, string> = {
  NSF: "Novel & Special Foods (NSF)",
  ClaimApproval: "Claim Approval",
  AyurvedaAahara: "Ayurveda Aahara",
  RPET: "rPET",
  AnyOther: "Any Other",
};

const STAGE_LABELS: Record<string, string> = {
  Draft: "Draft",
  Submitted: "Submitted",
  WithNodalOfficerA: "With Nodal Officer",
  WithTechnicalOfficer: "With Technical Officer",
  QuerySent: "Query Sent",
  WithExpertCommittee: "With Expert Committee",
  DecisionPending: "Decision Pending",
  WithCEO: "With CEO",
  WithChairperson: "With Chairperson",
  Approved: "Approved",
  Rejected: "Rejected",
  Closed: "Closed",
};

// AA document fields (flat structure) — must match field keys in AyurvedaAaharaApplicationForm
const AA_DOC_FIELDS: { key: string; label: string }[] = [
  // Step 0 — Basic product info
  { key: "functionalUseFile", label: "Functional Use Supporting Document" },
  { key: "certificateOfAnalysis", label: "Certificate of Analysis" },
  { key: "manufacturingProcessFile", label: "Manufacturing Process Document" },
  // Step 1 — Ingredients / Composition
  { key: "compositionFile", label: "Composition of Proposed Ayurveda Aahara" },
  { key: "ingredientListFile", label: "Ingredient List PDF" },
  { key: "specificationsFile", label: "Specifications Document" },
  // Traditional reference (per category)
  {
    key: "authoritativeBookScanFile",
    label: "Scanned Pages of Authoritative Book (Cat. A)",
  },
  {
    key: "catBAuthoritativeBookScanFile",
    label: "Scanned Pages of Authoritative Book (Cat. B)",
  },
  {
    key: "catB1AuthoritativeBookScanFile",
    label: "Scanned Pages of Authoritative Book (Cat. B1)",
  },
  {
    key: "catB2AuthoritativeBookScanFile",
    label: "Scanned Pages of Authoritative Book (Cat. B2)",
  },
  {
    key: "otherBotanicalsRationaleFile",
    label: "Other Botanicals Supporting Document",
  },
  // Step 2 — Claims / Usage
  { key: "productLabel", label: "Product Label" },
  { key: "servingSizeFile", label: "Serving Size Document" },
  { key: "targetPopulationFile", label: "Target Population Document" },
  { key: "directionsForUseFile", label: "Directions for Use Document" },
  { key: "durationOfUseFile", label: "Duration of Use Document" },
  // Category A — Label Claims
  {
    key: "catAHealthBenefitFile",
    label: "Health Benefit Claim Document (Cat. A)",
  },
  { key: "catADiseaseRiskFile", label: "Disease Risk Claim Document (Cat. A)" },
  // Category B — Label Claims
  {
    key: "catBHealthBenefitFile",
    label: "Health Benefit Claim Document (Cat. B)",
  },
  { key: "catBDiseaseRiskFile", label: "Disease Risk Claim Document (Cat. B)" },
  { key: "catBSafetyDataFile", label: "Safety Data Document (Cat. B)" },
  // Category B1 — Label Claims
  { key: "b1HealthBenefitFile", label: "Health Benefit Document (Cat. B1)" },
  {
    key: "b1LabelDiseaseRiskFile",
    label: "Disease Risk Reduction Document (Cat. B1)",
  },
  // Category B2 — Health Benefit Claims
  {
    key: "catB2HealthBenefit1File",
    label: "Specified Health Benefit Document (Cat. B2)",
  },
  {
    key: "catB2HealthBenefit2File",
    label: "Non-specified Health Benefit Document (Cat. B2)",
  },
  // Category B2 — Disease Risk Claims
  {
    key: "catB2DiseaseRisk1File",
    label: "Disease Risk Claim 1 Document (Cat. B2)",
  },
  {
    key: "catB2DiseaseRisk2File",
    label: "Disease Risk Claim 2 Document (Cat. B2)",
  },
  // Step 3 — Scientific Support (B1)
  {
    key: "differentFormatRationaleFile",
    label: "Format Rationale Supporting Document (Cat. B1)",
  },
  { key: "efficacyDataFile", label: "Efficacy Data Document (Cat. B1)" },
  { key: "catB1SafetyDataFile", label: "Safety Data Document (Cat. B1)" },
  // Part III — Registration
  { key: "registrationCertificate", label: "Registration Certificate" },
  { key: "licenseCertificate", label: "License Certificate" },
];

// RPET document fields (flat structure) — must match field keys in RPETApplicationForm
const RPET_DOC_FIELDS: { key: string; label: string }[] = [
  { key: "factoryLicensesFile", label: "All Licences – Factory" },
  { key: "labourLicenseFile", label: "Labour Licence" },
  { key: "pollutionLicenseFile", label: "Pollution Licence" },
  { key: "gstLicenseFile", label: "GST Certificate" },
  { key: "recyclingTechnologyFile", label: "Recycling Technology Document" },
  { key: "plantMachineryFile", label: "Plant & Machinery Document" },
  { key: "globalRegulatoryFile", label: "NOL/NOC/Safety Assessment Document" },
  {
    key: "facilityApprovalFile",
    label: "Facility Approval/Clearance (Competent Authority)",
  },
  { key: "vendorAuditFile", label: "Vendor & Internal Audit Reports" },
  {
    key: "qualitySafetyTestReportFile",
    label: "Quality & Safety Test Reports (NABL Accredited)",
  },
  {
    key: "fssPackagingRegFile",
    label: "FSS(Packaging) Regulations 2018 Compliance",
  },
  {
    key: "sensoryAnalysisFile",
    label: "Sensory Analysis (ISO 13302 / GMP/QMS)",
  },
];

// CA document fields (flat structure)
const CA_DOC_FIELDS: { key: string; label: string }[] = [
  { key: "licenseCopy", label: "Central/State License Copy" },
  { key: "approvalLetter", label: "FSSAI Approval Letter" },
  { key: "iprSupportingDoc", label: "IPR Supporting Document" },
  {
    key: "scientificSubstantiationFile",
    label: "Scientific Substantiation Document",
  },
  { key: "diseaseRiskStudiesFile", label: "Disease Risk Studies Document" },
  { key: "analysisMethodFile", label: "Analysis Method Document" },
  { key: "adverseEffectsFile", label: "Safety / Adverse Effects Document" },
  { key: "additionalInfoFile", label: "Additional Information Document" },
];

// Document field → display label mapping (step3 + step4)
const DOC_FIELDS: {
  key: keyof AppFormData["step3"] | keyof AppFormData["step4"];
  label: string;
  step: "step3" | "step4";
}[] = [
  { step: "step3", key: "certOfAnalysis", label: "Certificate of Analysis" },
  {
    step: "step3",
    key: "manufacturingProcess",
    label: "Manufacturing Process",
  },
  {
    step: "step3",
    key: "regulatoryStatusFile",
    label: "Regulatory Status Document",
  },
  {
    step: "step3",
    key: "agreementDoc",
    label: "Agreement / Authorization Document",
  },
  { step: "step3", key: "safetyFile1", label: "Safety Document 1" },
  { step: "step3", key: "safetyFile2", label: "Safety Document 2" },
  { step: "step3", key: "claimFile1", label: "Claim Support Document 1" },
  { step: "step3", key: "claimFile2", label: "Claim Support Document 2" },
  { step: "step3", key: "prototypeLabel", label: "Prototype Label" },
  {
    step: "step3",
    key: "postMarketingDecl",
    label: "Post-Marketing Declaration",
  },
  {
    step: "step3",
    key: "confidentialityDecl",
    label: "Confidentiality Declaration",
  },
  { step: "step4", key: "specificationDoc", label: "Specification Document" },
  { step: "step4", key: "microTemplate", label: "Microorganism Template" },
  { step: "step4", key: "anyOtherDoc", label: "Any Other Document" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getCatKey(cat: string): string {
  if (cat.startsWith("Category B2")) return "B2";
  if (cat.startsWith("Category B1")) return "B1";
  if (cat.startsWith("Category B")) return "B";
  if (cat.startsWith("Category A")) return "A";
  return "";
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoChip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: "10px 16px",
        minWidth: 140,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: COLORS.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: highlight ? COLORS.primary : COLORS.text,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: COLORS.primary,
        textTransform: "uppercase",
        letterSpacing: 0.6,
        borderBottom: `2px solid ${COLORS.primaryLight}`,
        paddingBottom: 6,
        marginBottom: 10,
        marginTop: 18,
      }}
    >
      {title}
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          fontSize: 10,
          color: COLORS.textMuted,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: value ? COLORS.text : COLORS.textMuted,
          fontStyle: value ? "normal" : "italic",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "4px 24px",
      }}
    >
      {children}
    </div>
  );
}

// ── Tab: Details ──────────────────────────────────────────────────────────────
function TabSummary({
  fd,
  applicationType,
}: {
  fd: AppFormData;
  applicationType: string;
}) {
  if (applicationType === "AyurvedaAahara") {
    const aa = fd as unknown as Record<string, unknown>;
    const cat = getCatKey((aa.ayurvedaCategory as string) ?? "");
    const CAT_LABEL: Record<string, string> = {
      A: "Category A — Classical Ayurvedic Formulations",
      B: "Category B — Proprietary Ayurvedic Products",
      B1: "Category B1 — New Ayurvedic Ingredients",
      B2: "Category B2 — Traditional System Ingredients",
    };
    function str(k: string) {
      return (aa[k] as string) || undefined;
    }
    return (
      <div>
        <SectionHead title="Ayurveda Category" />
        <Field
          label="Category"
          value={cat ? CAT_LABEL[cat] : str("ayurvedaCategory")}
        />

        <SectionHead title="Applicant Details" />
        <TwoCol>
          <Field label="Applicant Name" value={str("applicantName")} />
          <Field label="Authorised Person" value={str("authorisedPerson")} />
          <Field label="Email" value={str("authorisedEmail")} />
          <Field label="Contact Number" value={str("authorisedContact")} />
          <Field label="FSSAI License Number" value={str("licenseNumber")} />
        </TwoCol>
        <Field label="Address" value={str("applicantAddress")} />

        <SectionHead title="Product Details" />
        <TwoCol>
          <Field label="Product Name" value={str("productName")} />
          <Field label="Product Category" value={str("productCategory")} />
        </TwoCol>
        <Field label="Product Description" value={str("productDescription")} />
        <Field label="Proposed Usage" value={str("proposedUsage")} />

        <SectionHead title="Ingredients" />
        {Array.isArray(aa.ingredients) &&
        (aa.ingredients as Record<string, string>[]).length > 0 ? (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 11,
              marginBottom: 8,
            }}
          >
            <thead>
              <tr>
                {[
                  "#",
                  "Ingredient Name",
                  "Quantity",
                  "Unit",
                  "Reference Book",
                ].map((h) => (
                  <th key={h} style={S.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(aa.ingredients as Record<string, string>[]).map((ing, i) => (
                <tr
                  key={i}
                  style={{ background: i % 2 === 0 ? "#fff" : "#F8F9FA" }}
                >
                  <td style={S.td}>{i + 1}</td>
                  <td style={S.td}>{ing.ingredientName}</td>
                  <td style={S.td}>{ing.quantity}</td>
                  <td style={S.td}>{ing.unit}</td>
                  <td style={S.td}>{ing.referenceBook}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div
            style={{
              fontSize: 12,
              color: "#9CA3AF",
              fontStyle: "italic",
              marginBottom: 8,
            }}
          >
            No ingredients listed.
          </div>
        )}

        {Array.isArray(aa.additives) &&
          (aa.additives as Record<string, string>[]).length > 0 && (
            <>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#6B7280",
                  marginBottom: 4,
                }}
              >
                Additives
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 11,
                  marginBottom: 8,
                }}
              >
                <thead>
                  <tr>
                    {["#", "Additive Name", "Quantity", "Purpose"].map((h) => (
                      <th key={h} style={S.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(aa.additives as Record<string, string>[]).map((add, i) => (
                    <tr
                      key={i}
                      style={{ background: i % 2 === 0 ? "#fff" : "#F8F9FA" }}
                    >
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
          <Field
            label="Nutritional Composition"
            value={str("nutritionalComposition")}
          />
          <Field label="Active Ingredients" value={str("activeIngredients")} />
        </TwoCol>
        <Field label="Formulation Details" value={str("formulationDetails")} />

        <SectionHead title="Claims / Usage" />
        <Field label="Claim Statement 1" value={str("claimStatement1")} />
        {str("claimStatement2") && (
          <Field label="Claim Statement 2" value={str("claimStatement2")} />
        )}
        {str("claimStatement3") && (
          <Field label="Claim Statement 3" value={str("claimStatement3")} />
        )}
        <TwoCol>
          <Field label="Target Population" value={str("targetPopulation")} />
          <Field label="Serving Size" value={str("servingSize")} />
          <Field label="Frequency of Use" value={str("frequencyOfUse")} />
          <Field label="Duration of Use" value={str("durationOfUse")} />
        </TwoCol>
        <Field label="Directions for Use" value={str("directionsForUse")} />
        <Field label="Warnings" value={str("warnings")} />
        <Field label="Contraindications" value={str("contraindications")} />

        {cat === "A" && (
          <>
            <SectionHead title="Category A — Traditional Reference" />
            <TwoCol>
              <Field
                label="Reference Book"
                value={str("ayurvedaReferenceBook")}
              />
              <Field
                label="Chapter (Adhyaya)"
                value={str("referenceChapter")}
              />
              <Field label="Verse (Shloka)" value={str("referenceVerse")} />
            </TwoCol>
            <Field label="Traditional Usage" value={str("traditionalUsage")} />
            <Field
              label="Classical Claim Basis"
              value={str("classicalClaimBasis")}
            />
            <Field
              label="Historical Consumption Evidence"
              value={str("historicalConsumptionEvidence")}
            />
            <Field
              label="Traditional Preparation Method"
              value={str("traditionalPreparationMethod")}
            />
          </>
        )}

        {cat === "B" && (
          <>
            <SectionHead title="Category B — Nutritional Evidence &amp; Consumption" />
            <Field
              label="Nutritional Benefit"
              value={str("nutritionalBenefit")}
            />
            <Field
              label="Scientific Rationale"
              value={str("scientificRationale")}
            />
            <Field
              label="Supporting Studies"
              value={str("supportingStudies")}
            />
            <TwoCol>
              <Field
                label="Recommended Serving"
                value={str("recommendedServing")}
              />
              <Field
                label="Maximum Daily Usage"
                value={str("maximumDailyUsage")}
              />
              <Field label="Intended Users" value={str("intendedUsers")} />
              <Field label="Restrictions" value={str("restrictions")} />
            </TwoCol>
          </>
        )}

        {cat === "B1" && (
          <>
            <SectionHead title="Category B1 — Disease Risk Reduction &amp; Clinical Evidence" />
            <Field label="Disease Risk Claim" value={str("diseaseRiskClaim")} />
            <Field
              label="Mechanism of Action"
              value={str("mechanismOfAction")}
            />
            <Field
              label="Human Intervention Studies"
              value={str("humanInterventionStudies")}
            />
            <Field
              label="Cause-Effect Relationship"
              value={str("causeEffectRelationship")}
            />
            <Field
              label="Scientific Consensus"
              value={str("b1ScientificConsensus")}
            />
            <TwoCol>
              <Field label="Study Type" value={str("studyType")} />
              <Field label="Study Duration" value={str("studyDuration")} />
              <Field label="Study Population" value={str("studyPopulation")} />
              <Field label="Outcome Summary" value={str("outcomeSummary")} />
            </TwoCol>
          </>
        )}

        {cat === "B2" && (
          <>
            <SectionHead title="Category B2 — Special Population Claims &amp; Safety" />
            <Field label="Target Condition" value={str("targetCondition")} />
            <Field
              label="Target Population Details"
              value={str("targetPopulationDetails")}
            />
            <Field
              label="Physiological Benefit"
              value={str("physiologicalBenefit")}
            />
            <Field
              label="Scientific Substantiation"
              value={str("b2ScientificSubstantiation")}
            />
            <Field
              label="Contraindication Details"
              value={str("contraindicationDetails")}
            />
            <Field
              label="Drug/Herb Interactions"
              value={str("interactionDetails")}
            />
            <Field
              label="Adverse Reaction Monitoring"
              value={str("adverseReactionMonitoring")}
            />
            <Field
              label="Medical Supervision Requirement"
              value={str("medicalSupervisionRequirement")}
            />
          </>
        )}

        <SectionHead title="Scientific Support" />
        <Field
          label="Scientific Justification"
          value={str("scientificJustification")}
        />
        <Field
          label="Traditional Reference"
          value={str("traditionalReference")}
        />
        <Field label="Published Research" value={str("publishedResearch")} />
        <Field label="Safety Evidence" value={str("safetyEvidence")} />
        <Field label="Additional Information" value={str("additionalInfo")} />

        {str("hasExistingRegistration") && (
          <>
            <SectionHead title="Part III — Existing Registration" />
            <Field
              label="Has Existing Registration"
              value={str("hasExistingRegistration")}
            />
            {str("hasExistingRegistration") === "Yes" && (
              <TwoCol>
                <Field
                  label="Registration Number"
                  value={str("registrationNumber")}
                />
                <Field
                  label="Registration Date"
                  value={str("registrationDate")}
                />
                <Field
                  label="License Number"
                  value={str("licenseNumberExisting")}
                />
                <Field label="License Date" value={str("licenseDate")} />
              </TwoCol>
            )}
          </>
        )}

        <SectionHead title="Payment" />
        <TwoCol>
          <Field label="Payment Method" value={str("paymentMethod")} />
          <Field label="Payment Reference" value={str("paymentReference")} />
        </TwoCol>
      </div>
    );
  }

  if (applicationType === "CA") {
    const ca = fd as unknown as Record<string, string>;
    return (
      <div>
        <SectionHead title="Applicant Details" />
        <TwoCol>
          <Field label="Applicant Name" value={ca.applicantName} />
          <Field label="Authorised Signatory" value={ca.authorisedSignatory} />
          <Field label="Email" value={ca.authorisedEmail} />
          <Field label="Contact Number" value={ca.authorisedContact} />
        </TwoCol>
        <Field label="Address" value={ca.applicantAddress} />

        <SectionHead title="License Information" />
        <TwoCol>
          <Field label="License Number" value={ca.licenseNumber} />
          <Field label="License Category" value={ca.licenseCategory} />
        </TwoCol>

        <SectionHead title="Product Information" />
        <TwoCol>
          <Field label="Product Name" value={ca.productName} />
          <Field label="Product Category" value={ca.productCategory} />
          <Field
            label="Non-specified Category"
            value={ca.nonSpecifiedCategory}
          />
        </TwoCol>
        <Field label="Product Composition" value={ca.productComposition} />

        <SectionHead title="Claim & IPR Details" />
        <TwoCol>
          <Field label="Claim Type" value={ca.claimType} />
          <Field
            label="Claim Ingredient/Substance"
            value={ca.claimIngredient}
          />
          <Field label="IPR Protected" value={ca.isIPRProtected} />
          <Field
            label="Claim Functions IPR Protected"
            value={ca.claimFunctionProtected}
          />
        </TwoCol>
        <Field label="Claim Statement" value={ca.claimStatement} />
        <Field label="Claim Justification" value={ca.claimJustification} />
        {ca.claimFunctionProtected === "Yes" && (
          <Field label="IPR Details" value={ca.iprDetails} />
        )}

        <SectionHead title="Payment" />
        <TwoCol>
          <Field label="Payment Method" value={ca.paymentMethod} />
          <Field label="Payment Reference" value={ca.paymentReference} />
        </TwoCol>
      </div>
    );
  }

  return (
    <div>
      <SectionHead title="Step 1 — Application Type" />
      <TwoCol>
        <Field label="Application For" value={fd.step1.applicationFor} />
        <Field label="Specify Food" value={fd.step1.specifyFood} />
      </TwoCol>

      {fd.step1.ingredients.length > 0 && (
        <>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: COLORS.textMuted,
              marginTop: 10,
              marginBottom: 4,
            }}
          >
            Ingredients
          </div>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}
          >
            <thead>
              <tr>
                {["Ingredient Name", "Quantity", "Standardize"].map((h) => (
                  <th key={h} style={S.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fd.step1.ingredients.map((ing, i) => (
                <tr
                  key={i}
                  style={{ background: i % 2 === 0 ? "#fff" : COLORS.bg }}
                >
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
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: COLORS.textMuted,
              marginTop: 10,
              marginBottom: 4,
            }}
          >
            Additives
          </div>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}
          >
            <thead>
              <tr>
                {["Additive Name", "Quantity", "Standardize"].map((h) => (
                  <th key={h} style={S.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fd.step1.additives.map((a, i) => (
                <tr
                  key={i}
                  style={{ background: i % 2 === 0 ? "#fff" : COLORS.bg }}
                >
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
        <Field label="Applicant Name" value={fd.step2.applicantName} />
        <Field label="Authorised Person" value={fd.step2.authorisedPerson} />
        <Field label="Mobile No." value={fd.step2.mobileNo} />
        <Field label="Email" value={fd.step2.email} />
        <Field label="Organisation Name" value={fd.step2.orgName} />
        <Field label="Organisation Address" value={fd.step2.orgAddress} />
        <Field label="FSSAI License Number" value={fd.step2.licenseNumber} />
        <Field label="Manufacturing Address" value={fd.step2.mfgAddress} />
        <Field label="Nature of Business" value={fd.step2.natureOfBusiness} />
        <Field label="Product Name" value={fd.step2.productName} />
        <Field label="Product Category" value={fd.step2.productCategory} />
        <Field label="Sub-Category" value={fd.step2.subCategory} />
        <Field label="Source" value={fd.step2.source} />
        <Field label="Genus / Species" value={fd.step2.genusSp} />
      </TwoCol>
      <Field
        label="Justification / Background"
        value={fd.step2.justification}
      />
      <Field label="Functional Benefits" value={fd.step2.functionalBenefits} />
      <Field label="Health Benefits" value={fd.step2.healthBenefits} />

      <SectionHead title="Step 3 — Documents & Declarations" />
      <TwoCol>
        <Field label="Regulatory Status" value={fd.step3.regulatoryStatus} />
        <Field label="Relationship Type" value={fd.step3.relationshipType} />
        <Field label="GST Number" value={fd.step3.gstNo} />
      </TwoCol>

      <SectionHead title="Step 4 — Additional Information" />
      <TwoCol>
        <Field label="Target Group" value={fd.step4.targetGroup} />
        <Field label="Composition" value={fd.step4.composition} />
        <Field label="New Technology" value={fd.step4.newTechnology} />
        <Field label="Chemical Name" value={fd.step4.chemicalName} />
        <Field label="Purity" value={fd.step4.purity} />
        <Field label="ADI" value={fd.step4.adi} />
        <Field label="Proposed Level" value={fd.step4.proposedLevel} />
        <Field label="Color Index" value={fd.step4.colorIndex} />
        <Field label="Enzyme Activity" value={fd.step4.enzymeActivity} />
      </TwoCol>

      <SectionHead title="Step 5 — Payment" />
      <TwoCol>
        <Field label="Payment Method" value={fd.step5.paymentMethod} />
        <Field label="Payment Reference" value={fd.step5.paymentReference} />
      </TwoCol>
    </div>
  );
}

// ── Tab: Documents ────────────────────────────────────────────────────────────
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i;
function isStored(v: string) {
  return UUID_RE.test(v);
}
function cleanName(v: string) {
  return v.replace(UUID_RE, "");
}

function TabDocuments({
  fd,
  applicationType,
}: {
  fd: AppFormData;
  applicationType: string;
}) {
  if (applicationType === "AyurvedaAahara") {
    const aa = fd as unknown as Record<string, string>;
    const files = AA_DOC_FIELDS.filter((d) => {
      const val = aa[d.key];
      return val && typeof val === "string" && val.trim() !== "";
    });
    if (files.length === 0) {
      return (
        <div
          style={{
            padding: "48px 0",
            textAlign: "center",
            color: COLORS.textMuted,
            fontSize: 13,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
          No documents uploaded yet.
        </div>
      );
    }
    return (
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
      >
        <thead>
          <tr>
            {["#", "Document", "File Name", "Action"].map((h) => (
              <th key={h} style={S.th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {files.map((d, i) => {
            const val = aa[d.key];
            const stored = isStored(val);
            return (
              <tr
                key={i}
                style={{ background: i % 2 === 0 ? "#fff" : COLORS.bg }}
              >
                <td style={S.td}>{i + 1}</td>
                <td style={S.td}>
                  <span style={{ fontWeight: 600 }}>{d.label}</span>
                </td>
                <td style={S.td}>
                  <span style={{ color: COLORS.primary }}>
                    📎 {stored ? cleanName(val) : val}
                  </span>
                </td>
                <td style={S.td}>
                  {stored ? (
                    <a
                      href={`${API_BASE}/uploads/${val}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: COLORS.primary,
                        color: "#fff",
                        border: "none",
                        borderRadius: 5,
                        fontSize: 10,
                        padding: "4px 10px",
                        cursor: "pointer",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      ⬇ Download
                    </a>
                  ) : (
                    <span
                      style={{
                        fontSize: 10,
                        color: COLORS.textMuted,
                        fontStyle: "italic",
                      }}
                    >
                      Re-upload to enable download
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  if (applicationType === "CA") {
    const ca = fd as unknown as Record<string, string>;
    const files = CA_DOC_FIELDS.filter((d) => {
      const val = ca[d.key];
      return val && typeof val === "string" && val.trim() !== "";
    });
    if (files.length === 0) {
      return (
        <div
          style={{
            padding: "48px 0",
            textAlign: "center",
            color: COLORS.textMuted,
            fontSize: 13,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
          No documents uploaded yet.
        </div>
      );
    }
    return (
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
      >
        <thead>
          <tr>
            {["#", "Document", "File Name", "Action"].map((h) => (
              <th key={h} style={S.th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {files.map((d, i) => {
            const val = ca[d.key];
            const stored = isStored(val);
            return (
              <tr
                key={i}
                style={{ background: i % 2 === 0 ? "#fff" : COLORS.bg }}
              >
                <td style={S.td}>{i + 1}</td>
                <td style={S.td}>
                  <span style={{ fontWeight: 600 }}>{d.label}</span>
                </td>
                <td style={S.td}>
                  <span style={{ color: COLORS.primary }}>
                    📎 {stored ? cleanName(val) : val}
                  </span>
                </td>
                <td style={S.td}>
                  {stored ? (
                    <a
                      href={`${API_BASE}/uploads/${val}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: COLORS.primary,
                        color: "#fff",
                        border: "none",
                        borderRadius: 5,
                        fontSize: 10,
                        padding: "4px 10px",
                        cursor: "pointer",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      ⬇ Download
                    </a>
                  ) : (
                    <span
                      style={{
                        fontSize: 10,
                        color: COLORS.textMuted,
                        fontStyle: "italic",
                      }}
                    >
                      Re-upload to enable download
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  if (applicationType === "RPET") {
    const rpet = fd as unknown as Record<string, string>;
    const files = RPET_DOC_FIELDS.filter((d) => {
      const val = rpet[d.key];
      return val && typeof val === "string" && val.trim() !== "";
    });
    if (files.length === 0) {
      return (
        <div
          style={{
            padding: "48px 0",
            textAlign: "center",
            color: COLORS.textMuted,
            fontSize: 13,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
          No documents uploaded yet.
        </div>
      );
    }
    return (
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
      >
        <thead>
          <tr>
            {["#", "Document", "File Name", "Action"].map((h) => (
              <th key={h} style={S.th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {files.map((d, i) => {
            const val = rpet[d.key];
            const stored = isStored(val);
            return (
              <tr
                key={i}
                style={{ background: i % 2 === 0 ? "#fff" : COLORS.bg }}
              >
                <td style={S.td}>{i + 1}</td>
                <td style={S.td}>
                  <span style={{ fontWeight: 600 }}>{d.label}</span>
                </td>
                <td style={S.td}>
                  <span style={{ color: COLORS.primary }}>
                    📎 {stored ? cleanName(val) : val}
                  </span>
                </td>
                <td style={S.td}>
                  {stored ? (
                    <a
                      href={`${API_BASE}/uploads/${val}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: COLORS.primary,
                        color: "#fff",
                        border: "none",
                        borderRadius: 5,
                        fontSize: 10,
                        padding: "4px 10px",
                        cursor: "pointer",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      ⬇ Download
                    </a>
                  ) : (
                    <span
                      style={{
                        fontSize: 10,
                        color: COLORS.textMuted,
                        fontStyle: "italic",
                      }}
                    >
                      Re-upload to enable download
                    </span>
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
    const val =
      d.step === "step3"
        ? (fd.step3 as unknown as Record<string, unknown>)[d.key as string]
        : (fd.step4 as unknown as Record<string, unknown>)[d.key as string];
    return val && typeof val === "string" && val.trim() !== "";
  });

  if (files.length === 0) {
    return (
      <div
        style={{
          padding: "48px 0",
          textAlign: "center",
          color: COLORS.textMuted,
          fontSize: 13,
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
        No documents uploaded yet.
      </div>
    );
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead>
        <tr>
          {["#", "Document", "File Name", "Action"].map((h) => (
            <th key={h} style={S.th}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {files.map((d, i) => {
          const val = (
            d.step === "step3"
              ? (fd.step3 as unknown as Record<string, unknown>)[
                  d.key as string
                ]
              : (fd.step4 as unknown as Record<string, unknown>)[
                  d.key as string
                ]
          ) as string;
          const stored = isStored(val);
          return (
            <tr
              key={i}
              style={{ background: i % 2 === 0 ? "#fff" : COLORS.bg }}
            >
              <td style={S.td}>{i + 1}</td>
              <td style={S.td}>
                <span style={{ fontWeight: 600 }}>{d.label}</span>
              </td>
              <td style={S.td}>
                <span style={{ color: COLORS.primary }}>
                  📎 {stored ? cleanName(val) : val}
                </span>
              </td>
              <td style={S.td}>
                {stored ? (
                  <a
                    href={`${API_BASE}/uploads/${val}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: COLORS.primary,
                      color: "#fff",
                      border: "none",
                      borderRadius: 5,
                      fontSize: 10,
                      padding: "4px 10px",
                      cursor: "pointer",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    ⬇ Download
                  </a>
                ) : (
                  <span
                    style={{
                      fontSize: 10,
                      color: COLORS.textMuted,
                      fontStyle: "italic",
                    }}
                  >
                    Re-upload to enable download
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseResponse(text: string): {
  body: string;
  attachmentFile: string | null;
  attachmentName: string | null;
} {
  const m = text.match(/\n\n📎 Attachment: (.+?) \[(.+?)\]$/);
  if (!m || m.index === undefined)
    return { body: text, attachmentFile: null, attachmentName: null };
  return {
    body: text.slice(0, m.index),
    attachmentFile: m[2],
    attachmentName: m[1],
  };
}

// ── Tab: Queries ──────────────────────────────────────────────────────────────
function TabQueries({
  app,
  extensions,
  onResponded,
}: {
  app: Application;
  extensions: ExtensionItem[];
  onResponded: () => void;
}) {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null); // queryId being responded to
  const [responseText, setResponseText] = useState("");
  const [responseFile, setResponseFile] = useState<string | null>(null); // storedName after upload
  const [responseFileName, setResponseFileName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQueries(app.id)
      .then((qs) => {
        // Only show queries that have been forwarded to the applicant:
        // 1. TO queries forwarded by Nodal (nodalForwardedAt is set)
        // 2. Direct Nodal queries (originStage is null — sent straight to applicant)
        setQueries(
          qs.filter(
            (q) =>
              q.nodalForwardedAt !== null ||
              q.originStage !== "WithTechnicalOfficer",
          ),
        );
      })
      .catch(() => toast.error("Could not load queries"))
      .finally(() => setLoading(false));
  }, [app.id]);

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const storedName = await uploadFile(file, app.id, "queryResponse");
      setResponseFile(storedName);
      setResponseFileName(file.name);
      toast.success("File uploaded");
    } catch {
      toast.error("File upload failed");
    } finally {
      setUploading(false);
    }
  }

  function clearResponding() {
    setResponding(null);
    setResponseText("");
    setResponseFile(null);
    setResponseFileName("");
  }

  async function handleRespond(queryId: string) {
    if (!responseText.trim()) {
      toast.error("Please enter a response");
      return;
    }
    setSubmitting(true);
    try {
      const fullText = responseFile
        ? `${responseText.trim()}\n\n📎 Attachment: ${responseFileName} [${responseFile}]`
        : responseText.trim();
      const updated = await respondToQuery(app.id, queryId, fullText);
      setQueries((prev) => prev.map((q) => (q.id === queryId ? updated : q)));
      clearResponding();
      toast.success("Response submitted — application returned to review.");
      onResponded();
    } catch {
      toast.error("Could not submit response");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading)
    return (
      <div
        style={{
          padding: "40px 0",
          textAlign: "center",
          color: COLORS.textMuted,
          fontSize: 13,
        }}
      >
        Loading queries…
      </div>
    );

  if (queries.length === 0) {
    return (
      <div
        style={{
          padding: "48px 0",
          textAlign: "center",
          color: COLORS.textMuted,
          fontSize: 13,
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>No Queries</div>
        <div style={{ fontSize: 11 }}>
          Any queries raised by the reviewing officer will appear here.
        </div>
      </div>
    );
  }

  return (
    <div>
      {app.stage === "QuerySent" && (
        <div
          style={{
            background: COLORS.warningLight,
            border: "1px solid rgba(246,173,85,0.5)",
            borderLeft: `4px solid ${COLORS.accent}`,
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 16,
            fontSize: 12,
          }}
        >
          <strong>⚠ Action Required:</strong> The officer has raised{" "}
          {queries.filter((q) => !q.response).length} unanswered query/queries.
          Please respond to continue the review process.
        </div>
      )}
      {queries.map((q, i) => (
        <div
          key={q.id}
          style={{
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10,
            padding: 16,
            marginBottom: 14,
            background: q.response ? "#F9FFF9" : "#FFFBF0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  background: COLORS.primary,
                  color: "#fff",
                  borderRadius: "50%",
                  width: 22,
                  height: 22,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: COLORS.textMuted,
                }}
              >
                From:{" "}
                <strong style={{ color: COLORS.text }}>
                  {q.askedBy.username}
                </strong>
                {q.askedBy.officeLocation && ` · ${q.askedBy.officeLocation}`}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, color: COLORS.textMuted }}>
                {fmtDate(q.createdAt)}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 10,
                  background: q.response ? "#D1FAE5" : "#FEF3C7",
                  color: q.response ? "#065F46" : "#92400E",
                }}
              >
                {q.response ? "Answered" : "Pending Response"}
              </span>
            </div>
          </div>

          {/* Query text */}
          <div
            style={{
              background: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 12,
              color: COLORS.text,
              marginBottom: 12,
              lineHeight: 1.6,
            }}
          >
            {q.text}
          </div>

          {/* Response */}
          {q.response ? (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: COLORS.primary,
                  marginBottom: 4,
                }}
              >
                Your Response · {fmtDate(q.respondedAt)}
              </div>
              <div
                style={{
                  background: "#F0FDF4",
                  border: `1px solid #BBF7D0`,
                  borderRadius: 6,
                  padding: "10px 12px",
                  fontSize: 12,
                  color: COLORS.text,
                  lineHeight: 1.6,
                }}
              >
                {(() => {
                  const { body, attachmentFile, attachmentName } =
                    parseResponse(q.response!);
                  return (
                    <>
                      <span style={{ whiteSpace: "pre-wrap" }}>{body}</span>
                      {attachmentFile && (
                        <div style={{ marginTop: 8 }}>
                          <a
                            href={`${API_BASE}/uploads/${attachmentFile}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              background: COLORS.primaryLight,
                              color: COLORS.primary,
                              padding: "5px 10px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              textDecoration: "none",
                            }}
                          >
                            📎 {attachmentName}
                          </a>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div>
              {/* Deadline banner for open queries */}
              {(() => {
                const baseDate = new Date(q.nodalForwardedAt ?? q.createdAt);
                const approvedExt = extensions.find(
                  (e) => e.queryId === q.id && e.status === "Approved",
                );
                const extDays = approvedExt ? approvedExt.extensionDays : 0;
                const deadline = addDays(baseDate, 30 + extDays);
                const now = new Date();
                const daysLeft = Math.ceil(
                  (deadline.getTime() - now.getTime()) / 86400000,
                );
                const isOverdue = daysLeft < 0;
                return (
                  <div
                    style={{
                      marginBottom: 10,
                      padding: "8px 12px",
                      borderRadius: 7,
                      background: isOverdue ? "#FEF2F2" : "#FFFBF0",
                      border: `1px solid ${isOverdue ? "#FECACA" : "rgba(246,173,85,0.5)"}`,
                      fontSize: 11,
                      color: isOverdue ? "#991B1B" : "#7C2D12",
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>
                      ⏰ Response Deadline:{" "}
                    </span>
                    <span style={{ fontWeight: 700 }}>
                      {deadline.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span
                      style={{
                        marginLeft: 6,
                        color: isOverdue ? "#DC2626" : "#92400E",
                      }}
                    >
                      {isOverdue
                        ? `(${Math.abs(daysLeft)} day(s) overdue)`
                        : `(${daysLeft} day(s) remaining)`}
                    </span>
                    {approvedExt && (
                      <span
                        style={{
                          marginLeft: 8,
                          background: "#D1FAE5",
                          color: "#065F46",
                          padding: "1px 7px",
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: 10,
                        }}
                      >
                        ✓ +{extDays}d extension approved
                      </span>
                    )}
                  </div>
                );
              })()}
              {responding === q.id ? (
                <div>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Enter your response to this query…"
                    style={{
                      width: "100%",
                      border: `1.5px solid ${COLORS.primary}`,
                      borderRadius: 6,
                      padding: "10px 12px",
                      fontSize: 12,
                      resize: "vertical",
                      minHeight: 100,
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "'Noto Sans','Segoe UI',sans-serif",
                    }}
                  />
                  {/* File attachment */}
                  <div style={{ marginTop: 10 }}>
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: COLORS.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: 0.4,
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Attach Supporting Document (optional)
                    </label>
                    {responseFile ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          background: "#F0FDF4",
                          border: "1px solid #BBF7D0",
                          borderRadius: 6,
                          padding: "7px 12px",
                        }}
                      >
                        <span style={{ fontSize: 13 }}>📎</span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#065F46",
                            flex: 1,
                          }}
                        >
                          {responseFileName}
                        </span>
                        <button
                          onClick={() => {
                            setResponseFile(null);
                            setResponseFileName("");
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: COLORS.danger,
                            fontSize: 14,
                            cursor: "pointer",
                            fontWeight: 700,
                            padding: "0 4px",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: COLORS.bg,
                          border: `1px dashed ${COLORS.border}`,
                          borderRadius: 6,
                          padding: "7px 14px",
                          fontSize: 12,
                          cursor: uploading ? "not-allowed" : "pointer",
                          color: COLORS.primary,
                          fontWeight: 600,
                        }}
                      >
                        {uploading ? "⏳ Uploading…" : "📎 Attach File"}
                        <input
                          type="file"
                          style={{ display: "none" }}
                          disabled={uploading}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUpload(f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      onClick={() => handleRespond(q.id)}
                      disabled={submitting || uploading}
                      style={{
                        background: COLORS.primary,
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "8px 18px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor:
                          submitting || uploading ? "not-allowed" : "pointer",
                        opacity: submitting || uploading ? 0.7 : 1,
                      }}
                    >
                      {submitting ? "Submitting…" : "Submit Response"}
                    </button>
                    <button
                      onClick={clearResponding}
                      style={{
                        background: "transparent",
                        color: COLORS.textMuted,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 6,
                        padding: "8px 14px",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setResponding(q.id)}
                  style={{
                    background: COLORS.accent,
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 18px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
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
// Business milestone definitions — the applicant sees workflow progress, not internal roles.
// The same backend role (e.g. Technical Officer) can map to different milestones depending
// on where in the workflow the application currently is.
interface Milestone {
  id: string;
  label: string;
  sublabel?: string;
}

const CORE_MILESTONES: Milestone[] = [
  { id: "draft", label: "Draft" },
  { id: "submitted", label: "Submitted" },
  { id: "nodalReview", label: "Nodal Officer Review" },
  { id: "toReview", label: "Technical Officer Review" },
  { id: "ecReview", label: "Expert Committee Review" },
  {
    id: "form2Prep",
    label: "Form 2 Preparation",
    sublabel: "Technical Officer",
  },
  { id: "decisionPrep", label: "Prepare Decision", sublabel: "Nodal Officer" },
];

const APPEAL_MILESTONES: Milestone[] = [
  { id: "appealSubmitted", label: "Appeal Submitted" },
  { id: "ceoReview", label: "CEO Review" },
  { id: "chairReview", label: "Chairperson Review" },
];

// ecAssessment being set means EC has completed its review — used to distinguish
// "first TO visit (initial review)" from "second TO visit (Form 2 prep)".
function getCurrentMilestoneId(app: Application): string {
  const hasEcDone = app.ecAssessment !== null;
  switch (app.stage) {
    case "Draft":
      return "draft";
    case "Submitted":
      return "submitted";
    case "WithNodalOfficerA":
      return hasEcDone ? "decisionPrep" : "nodalReview";
    case "QuerySent":
    case "WithTechnicalOfficer":
      return hasEcDone ? "form2Prep" : "toReview";
    case "WithExpertCommittee":
      return "ecReview";
    case "DecisionPending":
      return "decisionPrep";
    case "Approved":
    case "Closed":
      return "approved";
    case "Rejected":
      return "rejected";
    case "AppealPending":
      return "appealSubmitted";
    case "WithCEO":
      return "ceoReview";
    case "WithChairperson":
      return "chairReview";
    default:
      return "nodalReview";
  }
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}

function TabTimeline({
  app,
  queries,
  extensions,
}: {
  app: Application;
  queries: Query[];
  extensions: ExtensionItem[];
}) {
  const currentMilestoneId = getCurrentMilestoneId(app);

  // Build the milestone list dynamically:
  // - Always show core milestones up to and including the outcome
  // - Append appeal milestones only when the app is on that path
  const onAppealPath = ["AppealPending", "WithCEO", "WithChairperson"].includes(
    app.stage,
  );
  const isRejected = app.stage === "Rejected";
  const isApproved = ["Approved", "Closed"].includes(app.stage);

  const outcomeMilestone: Milestone = {
    id: isApproved ? "approved" : isRejected ? "rejected" : "outcome",
    label: isApproved ? "Approved" : isRejected ? "Rejected" : "Final Outcome",
  };

  const milestones: Milestone[] = [
    ...CORE_MILESTONES,
    outcomeMilestone,
    ...(onAppealPath ? APPEAL_MILESTONES : []),
  ];

  const currentIdx = milestones.findIndex((m) => m.id === currentMilestoneId);

  // Compute response deadline when app is in QuerySent stage
  let deadlineInfo: {
    deadline: Date;
    extDays: number;
    extGranted: boolean;
  } | null = null;
  if (app.stage === "QuerySent") {
    const openQuery = queries
      .filter((q) => !q.response)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];
    if (openQuery) {
      const baseDate = new Date(
        openQuery.nodalForwardedAt ?? openQuery.createdAt,
      );
      const approvedExt = extensions.find(
        (e) => e.queryId === openQuery.id && e.status === "Approved",
      );
      const extDays = approvedExt ? approvedExt.extensionDays : 0;
      deadlineInfo = {
        deadline: addDays(baseDate, 30 + extDays),
        extDays,
        extGranted: !!approvedExt,
      };
    }
  }

  return (
    <div style={{ padding: "4px 0" }}>
      {milestones.map((m, i) => {
        const done = i < currentIdx || isApproved;
        const active = m.id === currentMilestoneId;
        const future = i > currentIdx && !done;
        const isOutcome =
          m.id === "approved" || m.id === "rejected" || m.id === "outcome";
        const dotColor =
          done || active
            ? isRejected && isOutcome
              ? COLORS.danger
              : COLORS.primary
            : COLORS.border;
        const lineColor = done ? COLORS.primary : COLORS.border;

        let dateStr = "";
        if (m.id === "draft") dateStr = fmtDate(app.createdAt);
        if (m.id === "submitted") dateStr = fmtDate(app.submittedAt);
        if (active && !dateStr) dateStr = "Current stage";

        return (
          <div
            key={m.id}
            style={{ display: "flex", alignItems: "flex-start", gap: 16 }}
          >
            {/* Dot + line */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 24,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  marginTop: 2,
                  background: active
                    ? isRejected && isOutcome
                      ? COLORS.danger
                      : COLORS.primary
                    : done
                      ? COLORS.primaryLight
                      : "#E5E7EB",
                  border: `2px solid ${dotColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  color:
                    done || active
                      ? isRejected && isOutcome
                        ? "#fff"
                        : COLORS.primary
                      : COLORS.textMuted,
                  fontWeight: 700,
                }}
              >
                {done && !active
                  ? "✓"
                  : active && isRejected && isOutcome
                    ? "✕"
                    : ""}
              </div>
              {i < milestones.length - 1 && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 28,
                    background: lineColor,
                    marginTop: 2,
                    marginBottom: 2,
                  }}
                />
              )}
            </div>
            {/* Label */}
            <div style={{ paddingBottom: 20, opacity: future ? 0.4 : 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active
                    ? isRejected && isOutcome
                      ? COLORS.danger
                      : COLORS.primary
                    : COLORS.text,
                }}
              >
                {m.label}
                {active && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 10,
                      background: COLORS.primaryLight,
                      color: COLORS.primary,
                      padding: "2px 7px",
                      borderRadius: 10,
                      fontWeight: 700,
                    }}
                  >
                    CURRENT
                  </span>
                )}
              </div>
              {m.sublabel && (
                <div
                  style={{
                    fontSize: 10,
                    color: COLORS.textMuted,
                    marginTop: 1,
                  }}
                >
                  {m.sublabel}
                </div>
              )}
              {dateStr && (
                <div
                  style={{
                    fontSize: 11,
                    color: COLORS.textMuted,
                    marginTop: 2,
                  }}
                >
                  {dateStr}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {isRejected && (
        <div
          style={{
            marginTop: 8,
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 8,
            padding: "12px 16px",
            fontSize: 12,
            color: "#991B1B",
            fontWeight: 600,
          }}
        >
          ✕ Application Rejected
        </div>
      )}
      {app.stage === "QuerySent" && (
        <div
          style={{
            marginTop: 8,
            background: COLORS.warningLight,
            border: "1px solid rgba(246,173,85,0.5)",
            borderRadius: 8,
            padding: "12px 16px",
            fontSize: 12,
            color: "#7C2D12",
          }}
        >
          <div style={{ fontWeight: 700 }}>
            ⚠ Query Sent — Response Required
          </div>
          {deadlineInfo && (
            <div
              style={{
                marginTop: 8,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ fontSize: 11 }}>
                <span style={{ fontWeight: 600 }}>Response Deadline: </span>
                <span style={{ fontWeight: 700, color: "#9A3412" }}>
                  {deadlineInfo.deadline.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span style={{ color: "#92400E" }}>
                  {" "}
                  (30 days
                  {deadlineInfo.extGranted
                    ? ` + ${deadlineInfo.extDays} day extension`
                    : ""}
                  )
                </span>
              </div>
              {deadlineInfo.extGranted && (
                <div
                  style={{
                    fontSize: 11,
                    background: "#D1FAE5",
                    border: "1px solid #6EE7B7",
                    borderRadius: 5,
                    padding: "4px 8px",
                    color: "#065F46",
                    fontWeight: 600,
                    display: "inline-block",
                    width: "fit-content",
                  }}
                >
                  ✓ Extension of {deadlineInfo.extDays} day(s) approved
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ApplicationView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [timelineQueries, setTimelineQueries] = useState<Query[]>([]);
  const [timelineExtensions, setTimelineExtensions] = useState<ExtensionItem[]>(
    [],
  );
  const printRef = useRef<HTMLDivElement>(null);

  function printDetails() {
    const el = printRef.current;
    if (!el) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document
      .write(`<!DOCTYPE html><html><head><title>Application Details — ${app?.referenceNumber ?? ""}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
  th { background: #f0f0f0; font-weight: 700; }
  @media print { body { padding: 0; } }
</style></head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }
  const [activeTab, setActiveTab] = useState(() => {
    const t = parseInt(params.get("tab") ?? "0", 10);
    return isNaN(t) ? 0 : t;
  });

  const [mailSending, setMailSending] = useState(false);
  const [pmsFile, setPmsFile] = useState<File | null>(null);
  const [pmsUploading, setPmsUploading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchApplication(id)
      .then(setApp)
      .catch(() => toast.error("Could not load application"))
      .finally(() => setLoading(false));
    // Load queries + extensions for timeline deadline display
    fetchQueries(id)
      .then((qs) =>
        setTimelineQueries(
          qs.filter(
            (q) =>
              q.nodalForwardedAt !== null ||
              q.originStage !== "WithTechnicalOfficer",
          ),
        ),
      )
      .catch(() => {});
    fetchExtensions()
      .then((all) =>
        setTimelineExtensions(all.filter((e) => e.applicationId === id)),
      )
      .catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          padding: "60px 0",
          textAlign: "center",
          color: COLORS.textMuted,
          fontSize: 13,
        }}
      >
        Loading application…
      </div>
    );
  }

  if (!app) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
        <div style={{ fontSize: 14, color: COLORS.textMuted }}>
          Application not found.
        </div>
        <button
          onClick={() => navigate("/app/applications")}
          style={{
            marginTop: 16,
            background: COLORS.primary,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 20px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          ← Back to Applications
        </button>
      </div>
    );
  }

  const fd = app.formData as AppFormData | null;

  return (
    <div ref={printRef}>
      {/* ── Page header ───────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => navigate("/app/applications")}
          style={{
            background: "none",
            border: "none",
            color: COLORS.primary,
            fontSize: 12,
            cursor: "pointer",
            padding: 0,
            marginBottom: 10,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          ← Back to Application Details
        </button>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={S.pageDesc}>
              {TYPE_LABELS[app.applicationType] ?? app.applicationType} ·{" "}
              {app.companyName}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {app.stage === "Draft" && (
              <button
                onClick={() => {
                  let path: string;
                  if (app.applicationType === "NSF")
                    path = `/app/apply/nsf-form?id=${app.id}`;
                  else if (app.applicationType === "CA")
                    path = `/app/apply/ca-form?id=${app.id}`;
                  else if (
                    app.applicationType === "AyurvedaAahara" ||
                    app.applicationType === "AA"
                  )
                    path = `/app/apply/aa-form?id=${app.id}`;
                  else if (app.applicationType === "RPET")
                    path = `/app/apply/rpet-form?id=${app.id}`;
                  else
                    path = `/app/apply/form?id=${app.id}&type=${app.applicationType}`;
                  navigate(path);
                }}
                style={{
                  background: COLORS.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 18px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ✏ Edit Draft
              </button>
            )}
            {app.stage === "QuerySent" && (
              <button
                onClick={() => setActiveTab(2)}
                style={{
                  background: COLORS.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 18px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ⚠ Respond to Query
              </button>
            )}
            <button
              onClick={printDetails}
              style={{
                background: "transparent",
                color: COLORS.primary,
                border: `1.5px solid ${COLORS.primary}`,
                borderRadius: 8,
                padding: "9px 18px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🖨 Print
            </button>
          </div>
        </div>
      </div>

      {/* ── Info chips row ────────────────────────────────────────── */}
      <div
        style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}
      >
        <InfoChip label="Reference No." value={app.referenceNumber} highlight />
        <InfoChip
          label="Application Type"
          value={TYPE_LABELS[app.applicationType] ?? app.applicationType}
        />
        <InfoChip
          label="Current Stage"
          value={STAGE_LABELS[app.stage] ?? app.stage}
        />
        <InfoChip label="Created" value={fmtDate(app.createdAt)} />
        <InfoChip label="Submitted" value={fmtDate(app.submittedAt)} />
        <InfoChip label="Last Updated" value={fmtDate(app.updatedAt)} />
      </div>

      {/* ── Tab content ───────────────────────────────────────────── */}
      <div
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "16px 20px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === 0 &&
          (fd ? (
            <FormDataTable formData={fd} />
          ) : (
            <div
              style={{
                padding: "40px 0",
                textAlign: "center",
                color: COLORS.textMuted,
                fontSize: 13,
              }}
            >
              No form data saved yet.
            </div>
          ))}
        {activeTab === 1 &&
          (fd ? (
            <TabDocuments fd={fd} applicationType={app.applicationType} />
          ) : (
            <TabDocuments
              fd={{
                step1: {
                  applicationFor: "",
                  specifyFood: "",
                  ingredients: [],
                  additives: [],
                },
                step2: {} as never,
                step3: {} as never,
                step4: {} as never,
                step5: {} as never,
              }}
              applicationType={app.applicationType}
            />
          ))}
        {activeTab === 2 && (
          <TabQueries
            app={app}
            extensions={timelineExtensions}
            onResponded={() => fetchApplication(app.id).then(setApp)}
          />
        )}
        {activeTab === 3 && (
          <div style={{ padding: "16px 0" }}>
            {app.stage === "Approved" || app.stage === "Rejected" ? (
              (() => {
                const td = app.toDecision as Record<string, unknown> | null;
                const f2 = td?.form2Data as Record<string, unknown> | undefined;
                const decision = td?.decision as string | undefined;
                const isApproved =
                  decision === "Approved" || app.stage === "Approved";

                const issuedOn = td?.recordedAt
                  ? new Date(td.recordedAt as string).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
                  : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const afd2 = app!.formData as any;
                const form2Html = buildForm2Html({
                  applicationType: app!.applicationType,
                  appNo:           String(f2?.applicationNo ?? app!.referenceNumber),
                  approvalNumber:  app!.approvalNumber,
                  dateOfApplication: String(f2?.dateOfApplication ?? issuedOn),
                  mfgName:         String(f2?.orgName ?? afd2?.fboName ?? app!.companyName ?? '—'),
                  applicantName:   String(f2?.applicantName ?? afd2?.authorisedPerson ?? '—'),
                  address:         String(f2?.address ?? afd2?.fboAddress ?? app!.address ?? '—'),
                  authorizedPerson: String(f2?.authorizedPerson ?? afd2?.authorisedPerson ?? '—'),
                  productName:     String(f2?.productName ?? app!.productName ?? '—'),
                  foodCategory:    String(f2?.productCategory ?? app!.foodCategory ?? '—'),
                  materialType:    String(f2?.materialType ?? ''),
                  techDetails:     String(f2?.techDetails ?? ''),
                  licenseNo:       String((f2?.licenseNo && f2.licenseNo !== '—') ? f2.licenseNo : (afd2?.licenseNo ?? '—')),
                  contactDetails:  String((f2?.contactDetails && f2.contactDetails !== '—') ? f2.contactDetails : ([afd2?.authorisedContact, afd2?.authorisedEmail].filter(Boolean).join(' | ') || '—')),
                  composition:     String((f2?.composition && f2.composition !== '—') ? f2.composition : (afd2?.ingredients ?? '—')),
                  decision:        isApproved ? 'Approved' : 'Rejected',
                  conditions:      String(td?.conditions ?? ''),
                  reasons:         String(td?.reasons ?? ''),
                  issuedOn,
                });

                function printForm2() {
                  const win = window.open("", "_blank", "width=900,height=700");
                  if (!win) return;
                  win.document.write(form2Html);
                  win.document.close();
                  win.focus();
                  win.print();
                  win.close();
                }

                return (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: isApproved ? COLORS.success : COLORS.danger,
                        }}
                      >
                        {isApproved
                          ? "✅ Application Approved"
                          : "✕ Application Rejected"}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={printForm2}
                          style={{
                            background: COLORS.primary,
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            padding: "8px 16px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          🖨 {app!.applicationType === 'Vegan' ? 'Download / Print Form B' : 'Download / Print Form II'}
                        </button>
                        {isApproved && (
                          <button
                            disabled={mailSending}
                            onClick={async () => {
                              if (!app) return;
                              setMailSending(true);
                              try {
                                const { sentTo } = await sendCertificateEmail(
                                  app.id,
                                );
                                toast.success(`Certificate sent to ${sentTo}`);
                              } catch {
                                toast.error("Failed to send email");
                              } finally {
                                setMailSending(false);
                              }
                            }}
                            style={{
                              background: "#059669",
                              color: "#fff",
                              border: "none",
                              borderRadius: 6,
                              padding: "8px 16px",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: mailSending ? "not-allowed" : "pointer",
                              opacity: mailSending ? 0.7 : 1,
                            }}
                          >
                            {mailSending
                              ? "Sending…"
                              : "📧 Send Certificate to Email"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Form II card — reads exclusively from f2 (toDecision.form2Data saved by TO) */}
                    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: 'hidden' }}>
                      {/* Header */}
                      <div style={{ background: '#1A3C34', padding: '16px 24px', textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Food Safety and Standards Authority of India</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Libre Baskerville',Georgia,serif", marginBottom: 2 }}>
                          {app!.applicationType === 'Vegan' ? 'FORM B' : 'FORM - II'}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>
                          {app!.applicationType === 'RPET' ? 'Authorization/Rejection of FCM-rPET'
                            : app!.applicationType === 'Vegan' ? 'Annexure-C — Approval/Rejection for endorsement of vegan logo'
                            : '(Approval/Rejection)'}
                        </div>
                      </div>
                      <div style={{ padding: '20px 24px' }}>
                        {/* Fields grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px 20px', marginBottom: 20 }}>
                          {((): [string, string][] => {
                            const appType = app!.applicationType;
                            if (appType === 'RPET') return [
                              ['Application No.', String(f2?.applicationNo ?? app!.referenceNumber)],
                              ['Date of Application', String(f2?.dateOfApplication ?? '—')],
                              ['Name of Manufacturer', String(f2?.manufacturerName ?? f2?.orgName ?? '—')],
                              ['Name of Applicant', String(f2?.applicantName ?? '—')],
                              ['Registered Address', String(f2?.address ?? '—')],
                              ['Authorized Person', String(f2?.authorizedPerson ?? '—')],
                              ['Type of Material Being Recycled', String(f2?.materialType ?? '—')],
                              ['Approval/NOC/Details of Technology', String(f2?.techDetails ?? '—')],
                              ['Status of Application', `${isApproved ? 'Approved' : 'Rejected'}${app!.approvalNumber ? ` | Ref. No.: ${app!.approvalNumber}` : ''}`],
                              ['Reasons for Rejection, if any', isApproved ? '—' : (String(td?.reasons ?? '—'))],
                            ];
                            if (appType === 'Vegan') {
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              const vfd = app!.formData as any;
                              return [
                                ['Application No.', String(f2?.applicationNo ?? app!.referenceNumber)],
                                ...(app!.approvalNumber ? [[isApproved ? 'Approval No.' : 'Rejection No.', app!.approvalNumber] as [string,string]] : []),
                                ['Date of Application', String(f2?.dateOfApplication ?? '—')],
                                ['Name of FBO', String(f2?.orgName ?? app!.companyName ?? '—')],
                                ['FBO Address', String(f2?.address ?? app!.address ?? '—')],
                                ['License No.', String(vfd?.licenseNo ?? '—')],
                                ['Authorized Person', String(f2?.authorizedPerson ?? vfd?.authorisedPerson ?? '—')],
                                ['Contact Details', [vfd?.authorisedContact, vfd?.authorisedEmail].filter(Boolean).join(' | ') || '—'],
                                ['Name of Product', String(f2?.productName ?? app!.productName ?? '—')],
                                ['Food Category (FSSR)', String(f2?.productCategory ?? app!.foodCategory ?? '—')],
                                ['Composition', String((f2?.composition && f2.composition !== '—') ? f2.composition : (vfd?.ingredients ?? '—'))],
                              ];
                            }
                            return [
                              ['Application No.', String(f2?.applicationNo ?? app!.referenceNumber)],
                              ...(app!.approvalNumber ? [[isApproved ? 'Approval No.' : 'Rejection No.', app!.approvalNumber] as [string,string]] : []),
                              ['Date of Application', String(f2?.dateOfApplication ?? '—')],
                              ['Organisation', String(f2?.orgName ?? '—')],
                              ['Applicant Name', String(f2?.applicantName ?? '—')],
                              ['Address', String(f2?.address ?? '—')],
                              ['Authorised Person', String(f2?.authorizedPerson ?? '—')],
                              ...(f2?.productName ? [['Product Name', String(f2.productName)] as [string,string]] : []),
                              ...(f2?.productCategory ? [['Product Category', String(f2.productCategory)] as [string,string]] : []),
                              ...(f2?.claimStatement ? [['Claim Statement', String(f2.claimStatement)] as [string,string]] : []),
                              ...(f2?.composition ? [['Composition', String(f2.composition)] as [string,string]] : []),
                            ];
                          })().map(([label, val]) => (
                            <div key={label} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 12px' }}>
                              <div style={{ fontSize: 9, color: COLORS.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>{label}</div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{val || '—'}</div>
                            </div>
                          ))}
                        </div>
                        {/* Decision badge */}
                        {app!.applicationType === 'Vegan' ? (
                          <div style={{ marginBottom: 16, fontSize: 13, fontWeight: 700, color: isApproved ? '#166534' : '#991B1B', background: isApproved ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${isApproved ? '#BBF7D0' : '#FECACA'}`, borderRadius: 8, padding: '10px 14px' }}>
                            {isApproved ? '☑ Product approved for displaying vegan logo' : '☑ Product not approved for displaying vegan logo'}
                          </div>
                        ) : (
                          <div style={{ background: isApproved ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${isApproved ? '#BBF7D0' : '#FECACA'}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 14, fontWeight: 800, color: isApproved ? '#166534' : '#991B1B' }}>
                            {isApproved ? '✓ APPROVED' : '✗ REJECTED'}
                          </div>
                        )}
                        {app!.applicationType === 'RPET' ? (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>Conditions for authorization*:</div>
                            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: COLORS.text, lineHeight: 1.7 }} type="i">
                              <li>The Food Authority reserves the right to inspect the records, premises and/or manufacturing &amp; other related facilities of the applicant or manufacturing facility of exporting country prior/post authorization.</li>
                              <li>The recycled PET intended to be used as food contact material shall comply to all the criteria specified by FSSAI &amp; rules and regulations made under the Food Safety and Standards Act, 2006 &amp; as amended from time to time.</li>
                              <li>The applicant shall maintain all documents/records/details/certificates/audit &amp; test reports as specified in the 'Guidelines for acceptance of recycled Polyethylene terephthalate (PET) as Food Contact Material (FCM-rPET)'.</li>
                              {isApproved && td?.conditions && <li>{td.conditions as string}</li>}
                            </ol>
                            <div style={{ fontSize: 12, color: COLORS.text, marginTop: 10 }}>This issues with the approval of the Competent Authority.</div>
                            <div style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'right', marginTop: 8, fontStyle: 'italic' }}>Authorized Signatory</div>
                            <div style={{ fontSize: 12, color: COLORS.text, marginTop: 12 }}>To,</div>
                            <div style={{ fontSize: 12, color: COLORS.text }}>M/s {String(f2?.orgName ?? f2?.mfgName ?? app!.companyName)}, {String(f2?.address ?? app!.address ?? '')}</div>
                            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 8, fontStyle: 'italic' }}>Note: * Conditions for authorization may change based on the application.</div>
                          </div>
                        ) : (
                          <>
                            {!!td?.conditions && (
                              <div style={{ marginBottom: 14 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>Conditions for Approval</div>
                                <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.6, background: COLORS.bg, padding: '10px 12px', borderRadius: 6, whiteSpace: 'pre-wrap' }}>
                                  {td.conditions as string}
                                </div>
                              </div>
                            )}
                            {!!td?.reasons && (
                              <div style={{ marginBottom: 14 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>Reasons for Rejection</div>
                                <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.6, background: COLORS.bg, padding: '10px 12px', borderRadius: 6, whiteSpace: 'pre-wrap' }}>
                                  {td.reasons as string}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        <div style={{ fontSize: 10, color: COLORS.textMuted, textAlign: 'right', marginTop: 16 }}>
                          Issued on: {td?.recordedAt ? new Date(td.recordedAt as string).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                        </div>
                      </div>
                    </div>

                    {isApproved && (td as Record<string, any>)?.withPms && (
                      <div
                        style={{
                          marginTop: 20,
                          border: `1px solid #FCD34D`,
                          borderRadius: 10,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            background: "#FFFBEB",
                            borderBottom: "1px solid #FCD34D",
                            padding: "12px 20px",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <span style={{ fontSize: 18 }}>🔬</span>
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#92400E",
                              }}
                            >
                              Post Market Surveillance (PMS) Report
                            </div>
                            <div style={{ fontSize: 11, color: "#B45309" }}>
                              Your approval includes a PMS condition. Submit
                              monitoring data or report below.
                            </div>
                          </div>
                        </div>
                        <div style={{ padding: "16px 20px" }}>
                          <div style={{ marginBottom: 12 }}>
                            <label
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: COLORS.textMuted,
                                textTransform: "uppercase",
                                letterSpacing: 0.4,
                                display: "block",
                                marginBottom: 6,
                              }}
                            >
                              Upload PMS Report
                            </label>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                              onChange={(e) =>
                                setPmsFile(e.target.files?.[0] ?? null)
                              }
                              style={{ fontSize: 12, color: COLORS.text }}
                            />
                          </div>
                          {pmsFile && (
                            <button
                              disabled={pmsUploading}
                              onClick={async () => {
                                if (!app || !pmsFile) return;
                                setPmsUploading(true);
                                try {
                                  const storedName = await uploadFile(
                                    pmsFile,
                                    app.id,
                                    "pmsReport",
                                  );
                                  await submitPmsReport(
                                    app.id,
                                    storedName,
                                    pmsFile.name,
                                  );
                                  toast.success(
                                    "PMS report submitted successfully",
                                  );
                                  setPmsFile(null);
                                } catch {
                                  toast.error("Failed to submit PMS report");
                                } finally {
                                  setPmsUploading(false);
                                }
                              }}
                              style={{
                                background: "#D97706",
                                color: "#fff",
                                border: "none",
                                borderRadius: 6,
                                padding: "8px 18px",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: pmsUploading
                                  ? "not-allowed"
                                  : "pointer",
                                opacity: pmsUploading ? 0.7 : 1,
                              }}
                            >
                              {pmsUploading
                                ? "Uploading…"
                                : "⬆ Submit PMS Report"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : app.stage === "Rejected" ? (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  padding: "16px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: COLORS.danger,
                    marginBottom: 6,
                  }}
                >
                  ✕ Application Rejected
                </div>
                <div style={{ fontSize: 12, color: COLORS.text }}>
                  This application was rejected. Please refer to the queries
                  section for details and use the Appeal option if applicable.
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: "48px 0",
                  textAlign: "center",
                  color: COLORS.textMuted,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  No formal decision yet
                </div>
                <div style={{ fontSize: 12 }}>
                  Application is currently with:{" "}
                  <strong>{STAGE_LABELS[app.stage] ?? app.stage}</strong>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 4 && (
          <TabTimeline
            app={app}
            queries={timelineQueries}
            extensions={timelineExtensions}
          />
        )}
      </div>
    </div>
  );
}

import type React from "react";
