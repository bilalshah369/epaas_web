import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import type React from "react";
import { COLORS, S } from "@/utils/colors";
import {
  fetchApplication,
  fetchQueries,
  type Application,
  type AppFormData,
  type Query,
} from "@/services/application.service";
import {
  getDocRows,
  getComplianceItems,
  getProfileDisplay,
} from "@/utils/docResolver";
import {
  technicalForwardToEC,
  technicalRequestClarification,
  technicalRecordDecision,
} from "@/services/technical.service";
import { API_BASE } from "@/services/api";

const card: React.CSSProperties = {
  background: COLORS.white,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "16px 18px",
  marginBottom: 16,
};
const cardTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: COLORS.textMuted,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  marginBottom: 14,
};
const textarea: React.CSSProperties = {
  width: "100%",
  resize: "vertical" as const,
  fontFamily: "'Noto Sans','Segoe UI',sans-serif",
  fontSize: 12,
  outline: "none",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 6,
  padding: "8px 10px",
  boxSizing: "border-box",
};
const fieldInput: React.CSSProperties = {
  width: "100%",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 12,
  boxSizing: "border-box",
  fontFamily: "'Noto Sans','Segoe UI',sans-serif",
};

function btn(
  variant: "solid" | "outline" | "danger" | "success" = "solid",
  small = false,
): React.CSSProperties {
  const bg =
    variant === "solid"
      ? COLORS.primary
      : variant === "success"
        ? COLORS.success
        : "transparent";
  return {
    padding: small ? "4px 10px" : "7px 14px",
    borderRadius: 5,
    fontSize: small ? 11 : 12,
    fontWeight: 600,
    cursor: "pointer",
    border:
      variant === "solid" || variant === "success"
        ? "none"
        : `1.5px solid ${variant === "danger" ? COLORS.danger : COLORS.primary}`,
    background: bg,
    color:
      variant === "solid" || variant === "success"
        ? "#fff"
        : variant === "danger"
          ? COLORS.danger
          : COLORS.primary,
  };
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysSince(iso: string | null | undefined) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

type Tab =
  | "profile"
  | "documents"
  | "compliance"
  | "query"
  | "clarification"
  | "recommendation"
  | "decision";

const BASE_TABS: Tab[] = [
  "profile",
  "documents",
  "compliance",
  "query",
  "clarification",
  "recommendation",
];
const TAB_LABELS: Record<Tab, string> = {
  profile: "Applicant Profile",
  documents: "Uploaded Documents",
  compliance: "Compliance Checklist",
  query: "Draft Query",
  clarification: "Request Clarification",
  recommendation: "Recommendation",
  decision: "Prepare Decision",
};

export default function TechAssessment() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const [app, setApp] = useState<Application | null>(null);
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);

  const initialTab = (searchParams.get("tab") as Tab | null) ?? "profile";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [recRemarks, setRecRemarks] = useState("");
  const [clarText, setClarText] = useState("");
  const [querySubject, setQuerySubject] = useState("");
  const [queryBody, setQueryBody] = useState("");

  // Form 2 state
  const [f2Decision, setF2Decision] = useState<"Approved" | "Rejected">(
    "Approved",
  );
  const [f2Conditions, setF2Conditions] = useState("");
  const [f2Reasons, setF2Reasons] = useState("");
  const [f2Composition, setF2Composition] = useState(""); // NSF/AA/Other
  const [f2Claim, setF2Claim] = useState(""); // CA
  const [f2ClaimComp, setF2ClaimComp] = useState(""); // CA approved composition
  const [f2Material, setF2Material] = useState(""); // rPET
  const [f2TechDetails, setF2TechDetails] = useState(""); // rPET

  const [saving, setSaving] = useState(false);
  const form2Ref = useRef<HTMLDivElement>(null);

  function printForm2() {
    const el = form2Ref.current;
    if (!el) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document
      .write(`<!DOCTYPE html><html><head><title>Form II — ${app?.referenceNumber ?? ""}</title>
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

  useEffect(() => {
    if (!id) return;
    fetchApplication(id)
      .then((a) => {
        setApp(a);
        // Pre-fill rPET fields from formData if available
        const fd = a?.formData as AppFormData | null | undefined;
        if (a.applicationType === "RPET") {
          setF2Material(
            ((fd as unknown as Record<string, unknown>)
              ?.recyclingTechnologyType as string) ?? "",
          );
        }
      })
      .catch(() => toast.error("Could not load application"))
      .finally(() => setLoading(false));
    fetchQueries(id)
      .then(setQueries)
      .catch(() => {});
  }, [id]);

  const fd = app?.formData as AppFormData | null | undefined;
  const appId = id ?? "";
  const profile = getProfileDisplay(app);
  const docRows = getDocRows(app);
  const compRows = getComplianceItems(app);

  // Show "Prepare Decision" tab only when EC has forwarded this application to TO
  const fromEC = !!(app?.toDecision as Record<string, unknown> | null)?.fromEC;
  const visibleTabs: Tab[] = fromEC ? [...BASE_TABS, "decision"] : BASE_TABS;

  async function handleForwardEC() {
    if (!recRemarks.trim()) {
      toast.error("Please enter remarks before forwarding to EC");
      return;
    }
    setSaving(true);
    try {
      await technicalForwardToEC(appId);
      toast.success("Application forwarded to Expert Committee");
      navigate("/technical/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg ?? "Could not forward to EC");
      setSaving(false);
    }
  }

  async function handleRequestClarification() {
    if (clarText.trim().length < 10) {
      toast.error("Clarification text must be at least 10 characters");
      return;
    }
    setSaving(true);
    try {
      await technicalRequestClarification(appId, clarText);
      toast.success(
        "Clarification requested — application sent to Nodal Officer A",
      );
      navigate("/technical/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg ?? "Could not request clarification");
      setSaving(false);
    }
  }

  async function handleSendQuery() {
    const text =
      `${querySubject ? querySubject + "\n\n" : ""}${queryBody}`.trim();
    if (text.length < 10) {
      toast.error("Query must be at least 10 characters");
      return;
    }
    setSaving(true);
    try {
      await fetch(`${API_BASE}/applications/${appId}/queries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("epaas_token")}`,
        },
        body: JSON.stringify({ text }),
      });
      toast.success("Query sent to Nodal Officer");
      setQuerySubject("");
      setQueryBody("");
      const updated = await fetchQueries(appId);
      setQueries(updated);
    } catch {
      toast.error("Could not send query");
    } finally {
      setSaving(false);
    }
  }

  async function handleRecordDecision() {
    if (!f2Decision) {
      toast.error("Please select Approved or Rejected");
      return;
    }
    if (f2Decision === "Approved" && !f2Conditions.trim()) {
      toast.error("Conditions for approval are required");
      return;
    }
    if (f2Decision === "Rejected" && !f2Reasons.trim()) {
      toast.error("Reasons for rejection are required");
      return;
    }

    const appType = app?.applicationType ?? "";
    const form2Data: Record<string, unknown> = {
      applicationNo: app?.referenceNumber,
      dateOfApplication: fmtDate(app?.submittedAt),
      orgName: app?.companyName,
      applicantName: profile.applicantName,
      address: app?.address || profile.orgName,
      authorizedPerson: profile.applicantName,
      productName: app?.productName,
      productCategory: app?.foodCategory,
    };

    if (appType === "CA") {
      form2Data["claimStatement"] = f2Claim;
      form2Data["approvedComposition"] = f2ClaimComp;
    } else if (appType === "RPET") {
      form2Data["manufacturerName"] = app?.companyName;
      form2Data["materialType"] = f2Material;
      form2Data["techDetails"] = f2TechDetails;
    } else {
      form2Data["composition"] = f2Composition;
    }

    setSaving(true);
    try {
      await technicalRecordDecision(
        appId,
        f2Decision,
        f2Conditions,
        f2Reasons,
        form2Data,
      );
      toast.success(
        "Form 2 decision recorded — application forwarded to Nodal Officer A",
      );
      navigate("/technical/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg ?? "Could not record decision");
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div
        style={{
          padding: "60px 0",
          textAlign: "center",
          color: COLORS.textMuted,
        }}
      >
        Loading application…
      </div>
    );
  if (!app)
    return (
      <div
        style={{
          padding: "60px 0",
          textAlign: "center",
          color: COLORS.textMuted,
        }}
      >
        Application not found.
      </div>
    );

  const days = daysSince(app.submittedAt);
  const appType = app.applicationType ?? "";

  return (
    <div>
      <button
        onClick={() => navigate("/technical/dashboard")}
        style={{
          background: "none",
          border: "none",
          color: COLORS.primary,
          fontSize: 12,
          cursor: "pointer",
          padding: 0,
          marginBottom: 10,
          fontWeight: 600,
        }}
      >
        ← Back to Dashboard
      </button>

      <div
        style={{
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: COLORS.textMuted,
            textTransform: "uppercase",
            letterSpacing: 0.7,
            marginBottom: 2,
          }}
        >
          TECHNICAL OFFICER — ASSESSMENT
        </div>
        <h2
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: COLORS.text,
            fontFamily: "'Libre Baskerville',Georgia,serif",
            margin: 0,
          }}
        >
          {app.referenceNumber}
        </h2>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 3 }}>
          {app.companyName} · {app.applicationType} · Stage:{" "}
          <strong>{app.stage}</strong>
          {fromEC && (
            <span
              style={{
                marginLeft: 8,
                background: "#E8F5E9",
                color: "#2E7D32",
                borderRadius: 4,
                padding: "1px 7px",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              EC REVIEWED
            </span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: `1px solid ${COLORS.border}`,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        {visibleTabs.map((t) => (
          <div
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              padding: "7px 14px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              color: activeTab === t ? COLORS.primary : COLORS.textMuted,
              borderBottom:
                activeTab === t
                  ? `2px solid ${COLORS.primary}`
                  : "2px solid transparent",
              marginBottom: -1,
              position: "relative",
              background:
                t === "decision"
                  ? activeTab === t
                    ? "#E8F5E9"
                    : "#F1F8E9"
                  : "transparent",
            }}
          >
            {TAB_LABELS[t]}
            {t === "query" && queries.length > 0 && (
              <span
                style={{
                  marginLeft: 5,
                  background: COLORS.primary,
                  color: "#fff",
                  borderRadius: 8,
                  fontSize: 9,
                  padding: "1px 5px",
                  fontWeight: 700,
                }}
              >
                {queries.length}
              </span>
            )}
            {t === "decision" && (
              <span
                style={{
                  marginLeft: 5,
                  background: "#2E7D32",
                  color: "#fff",
                  borderRadius: 8,
                  fontSize: 9,
                  padding: "1px 5px",
                  fontWeight: 700,
                }}
              >
                NEW
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── Profile tab ──────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div style={card}>
          <div style={cardTitle}>APPLICANT &amp; APPLICATION DETAILS</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {(
              [
                ["Reference No.", app.referenceNumber],
                ["Application Type", app.applicationType],
                ["Company Name", app.companyName],
                [
                  "Product Name",
                  app.productName ?? (profile.productName || "—"),
                ],
                ["Food Category", app.foodCategory || "—"],
                ["Submitted On", fmtDate(app.submittedAt)],
                ["Days in Review", days !== null ? `${days} days` : "—"],
                ["Applicant Name", profile.applicantName || "—"],
                ["Organisation", profile.orgName || "—"],
                ["FSSAI License No.", profile.licenseNumber || "—"],
                ["Mobile", profile.mobileNo || "—"],
                ["Email", profile.email || "—"],
                ["Nature of Business", profile.natureOfBusiness || "—"],
                ["Product Category", profile.productCategory || "—"],
                ["GST No.", profile.gstNo || "—"],
                ["Payment Ref.", profile.paymentReference || "—"],
                ["Current Stage", app.stage],
              ] as [string, string][]
            ).map(([k, v]) => (
              <div
                key={k}
                style={{
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 6,
                  padding: "7px 12px",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: COLORS.primary,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                    marginBottom: 2,
                  }}
                >
                  {k}
                </div>
                <div
                  style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
          {profile.justification && (
            <div
              style={{
                background: COLORS.bg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                padding: "10px 14px",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: COLORS.primary,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  marginBottom: 4,
                }}
              >
                Justification
              </div>
              <div
                style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.6 }}
              >
                {profile.justification}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Documents tab ────────────────────────────────────────── */}
      {activeTab === "documents" && (
        <div style={card}>
          <div style={cardTitle}>UPLOADED DOCUMENTS</div>
          {!fd || docRows.length === 0 ? (
            <div
              style={{
                color: COLORS.textMuted,
                fontSize: 12,
                fontStyle: "italic",
              }}
            >
              No documents uploaded yet.
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr>
                  {["#", "Document Name", "Action"].map((h) => (
                    <th key={h} style={S.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docRows.map((d, i) => (
                  <tr
                    key={d.label}
                    style={{ background: i % 2 === 0 ? "#fff" : COLORS.bg }}
                  >
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{d.label}</td>
                    <td style={S.td}>
                      <a
                        href={`${API_BASE}/uploads/${d.val}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          ...btn("outline", true),
                          textDecoration: "none",
                          display: "inline-block",
                        }}
                      >
                        📥 View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Compliance tab ───────────────────────────────────────── */}
      {activeTab === "compliance" && (
        <div style={card}>
          <div style={cardTitle}>COMPLIANCE CHECKLIST</div>
          {!fd ? (
            <div
              style={{
                color: COLORS.textMuted,
                fontSize: 12,
                fontStyle: "italic",
              }}
            >
              No form data available to evaluate compliance.
            </div>
          ) : (
            <>
              {(() => {
                const passCount = compRows.filter((c) => c.passed).length;
                return (
                  <div style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: COLORS.textMuted,
                        marginBottom: 6,
                      }}
                    >
                      {passCount}/{compRows.length} items compliant
                    </div>
                    <div
                      style={{
                        height: 6,
                        background: COLORS.border,
                        borderRadius: 3,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 3,
                          background:
                            passCount === compRows.length
                              ? COLORS.success
                              : COLORS.primary,
                          width: `${(passCount / compRows.length) * 100}%`,
                          transition: "width 0.3s",
                        }}
                      />
                    </div>
                  </div>
                );
              })()}
              {compRows.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 0",
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: c.passed
                        ? COLORS.successLight
                        : COLORS.dangerLight,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {c.passed ? "✓" : "✗"}
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      color: c.passed ? COLORS.text : COLORS.danger,
                    }}
                  >
                    {c.label}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Query tab ────────────────────────────────────────────── */}
      {activeTab === "query" && (
        <div>
          {queries.length > 0 && (
            <div style={card}>
              <div style={cardTitle}>
                QUERY &amp; RESPONSE HISTORY ({queries.length})
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {queries.map((q, i) => {
                  const isTechQuery = q.originStage === "WithTechnicalOfficer";
                  return (
                    <div
                      key={q.id}
                      style={{
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          background: COLORS.primaryLight,
                          padding: "10px 14px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: COLORS.primary,
                            }}
                          >
                            Query #{i + 1} — raised by{" "}
                            {q.askedBy?.username ?? "Officer"}
                          </span>
                          <span
                            style={{ fontSize: 10, color: COLORS.textMuted }}
                          >
                            {fmtDate(q.createdAt)}
                          </span>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            color: COLORS.text,
                            lineHeight: 1.6,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {q.text}
                        </p>
                      </div>
                      {isTechQuery && !q.nodalForwardedAt && (
                        <div
                          style={{
                            background: "#FFF7ED",
                            padding: "8px 14px",
                            borderTop: `1px solid ${COLORS.border}`,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              color: "#B45309",
                              fontWeight: 600,
                            }}
                          >
                            ⏳ Pending — Nodal Officer to forward to applicant
                          </span>
                        </div>
                      )}
                      {isTechQuery && q.nodalForwardedAt && !q.response && (
                        <div
                          style={{
                            background: "#FFFBEB",
                            padding: "8px 14px",
                            borderTop: `1px solid ${COLORS.border}`,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              color: "#B45309",
                              fontWeight: 600,
                            }}
                          >
                            ⏳ Forwarded to applicant on{" "}
                            {fmtDate(q.nodalForwardedAt)} — awaiting response…
                          </span>
                        </div>
                      )}
                      {isTechQuery && q.response && q.nodalFwdResponseAt && (
                        <div
                          style={{
                            background: "#F0FDF4",
                            padding: "10px 14px",
                            borderTop: `1px solid ${COLORS.border}`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: 6,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#065F46",
                              }}
                            >
                              ✅ Applicant Response
                            </span>
                            <span
                              style={{ fontSize: 10, color: COLORS.textMuted }}
                            >
                              {fmtDate(q.respondedAt)}
                            </span>
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 12,
                              color: "#065F46",
                              lineHeight: 1.6,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {q.response}
                          </p>
                        </div>
                      )}
                      {!isTechQuery && q.response && (
                        <div
                          style={{
                            background: "#F0FDF4",
                            padding: "10px 14px",
                            borderTop: `1px solid ${COLORS.border}`,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#065F46",
                            }}
                          >
                            ✅ Applicant Response — {fmtDate(q.respondedAt)}
                          </span>
                          <p
                            style={{
                              margin: "4px 0 0",
                              fontSize: 12,
                              color: "#065F46",
                              lineHeight: 1.6,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {q.response}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div style={card}>
            <div style={cardTitle}>DRAFT NEW QUERY TO APPLICANT</div>
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: COLORS.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Query Subject
              </label>
              <input
                value={querySubject}
                onChange={(e) => setQuerySubject(e.target.value)}
                placeholder="e.g. Request for stability data and formulation certificate"
                style={fieldInput}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: COLORS.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Query Body *
                </label>
                <span
                  style={{
                    fontSize: 10,
                    color:
                      queryBody.trim().length < 10
                        ? COLORS.danger
                        : COLORS.textMuted,
                  }}
                >
                  {queryBody.trim().length} / min 10 chars
                </span>
              </div>
              <textarea
                rows={5}
                value={queryBody}
                onChange={(e) => setQueryBody(e.target.value)}
                placeholder="Describe the information required from the applicant…"
                style={{ ...textarea, minHeight: 120 }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={btn()} disabled={saving} onClick={handleSendQuery}>
                {saving ? "Sending…" : "Send Query to Nodal Officer"}
              </button>
              <button
                style={btn("outline")}
                onClick={() => {
                  setQuerySubject("");
                  setQueryBody("");
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Request Clarification tab ────────────────────────────── */}
      {activeTab === "clarification" && (
        <div style={card}>
          <div style={cardTitle}>REQUEST CLARIFICATION FROM APPLICANT</div>
          <div
            style={{
              marginBottom: 6,
              fontSize: 12,
              color: COLORS.textMuted,
              lineHeight: 1.6,
            }}
          >
            Use this to formally request clarification or additional documents
            from the applicant. The application will be routed to Nodal Officer
            A, who will forward it to the applicant.
          </div>
          <div style={{ marginBottom: 14, marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: COLORS.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Clarification Required *
              </label>
              <span
                style={{
                  fontSize: 10,
                  color:
                    clarText.trim().length < 10
                      ? COLORS.danger
                      : COLORS.textMuted,
                }}
              >
                {clarText.trim().length} / min 10 chars
              </span>
            </div>
            <textarea
              rows={6}
              value={clarText}
              onChange={(e) => setClarText(e.target.value)}
              placeholder="Specify exactly what additional information or documents are needed from the applicant…"
              style={{
                ...textarea,
                minHeight: 130,
                borderColor:
                  clarText.length > 0 && clarText.trim().length < 10
                    ? COLORS.danger
                    : COLORS.border,
              }}
            />
          </div>
          <button
            style={btn()}
            disabled={saving}
            onClick={handleRequestClarification}
          >
            {saving
              ? "Processing…"
              : "↩ Request Clarification — Forward to Nodal A"}
          </button>
          <div
            style={{
              marginTop: 14,
              background: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 11,
              color: COLORS.textMuted,
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: COLORS.text }}>Stage transition:</strong>{" "}
            Application moves to <strong>QuerySent</strong> → Nodal Officer A
            forwards to applicant for response.
          </div>
        </div>
      )}

      {/* ── Recommendation tab ───────────────────────────────────── */}
      {activeTab === "recommendation" && (
        <div style={card}>
          <div style={cardTitle}>RECOMMENDATION TO EXPERT COMMITTEE</div>
          <div
            style={{
              marginBottom: 6,
              fontSize: 12,
              color: COLORS.textMuted,
              lineHeight: 1.6,
            }}
          >
            After technical review, forward this application to the Expert
            Committee for evaluation. Provide your assessment remarks below.
          </div>
          <div style={{ marginBottom: 18, marginTop: 14 }}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: COLORS.textMuted,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                display: "block",
                marginBottom: 6,
              }}
            >
              Technical Remarks / Grounds *
            </label>
            <textarea
              rows={6}
              value={recRemarks}
              onChange={(e) => setRecRemarks(e.target.value)}
              placeholder="State your technical findings and grounds for recommending EC review…"
              style={{ ...textarea, minHeight: 130 }}
            />
          </div>
          <button style={btn()} disabled={saving} onClick={handleForwardEC}>
            {saving ? "Processing…" : "✅ Forward to Expert Committee"}
          </button>
          <div
            style={{
              marginTop: 14,
              background: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 11,
              color: COLORS.textMuted,
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: COLORS.text }}>Stage transition:</strong>{" "}
            Application moves from <strong>WithTechnicalOfficer</strong> →{" "}
            <strong>WithExpertCommittee</strong> for full committee review.
          </div>
        </div>
      )}

      {/* ── Prepare Decision tab (only when EC has reviewed) ─────── */}
      {activeTab === "decision" &&
        fromEC &&
        (() => {
          const ecRec =
            (app.toDecision as Record<string, unknown>)?.ecDecision ===
            "RecommendRejection"
              ? "Reject"
              : "Approve";
          const readField = (label: string, value: string) => (
            <div style={{ marginBottom: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: COLORS.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 3,
                }}
              >
                {label}
              </div>
              <div
                style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}
              >
                {value || "—"}
              </div>
            </div>
          );
          const sectionLabel = (text: string, required = false) => (
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: COLORS.text,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                display: "block",
                marginBottom: 8,
              }}
            >
              {text}
              {required && (
                <span style={{ color: COLORS.danger, marginLeft: 3 }}>*</span>
              )}
            </label>
          );
          return (
            <div>
              {/* EC recommendation banner */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: ecRec === "Approve" ? "#F0FDF4" : "#FFF1F2",
                  border: `1px solid ${ecRec === "Approve" ? "#86EFAC" : "#FECDD3"}`,
                  borderRadius: 10,
                  padding: "12px 18px",
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 22 }}>
                  {ecRec === "Approve" ? "✅" : "⚠️"}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: ecRec === "Approve" ? "#166534" : "#9F1239",
                    }}
                  >
                    EC Recommendation:{" "}
                    {ecRec === "Approve"
                      ? "Recommend Approval"
                      : "Recommend Rejection"}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: COLORS.textMuted,
                      marginTop: 2,
                    }}
                  >
                    Complete Form 2 below and submit to forward this decision to
                    Nodal Officer A for dispatch.
                  </div>
                </div>
              </div>

              {/* Document card */}
              <div
                ref={form2Ref}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  overflow: "hidden",
                }}
              >
                {/* Document header */}
                <div
                  style={{
                    background: COLORS.primary,
                    padding: "18px 24px",
                    position: "relative",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 9,
                        color: "rgba(255,255,255,0.7)",
                        letterSpacing: 1.5,
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Food Safety and Standards Authority of India
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "#fff",
                        fontFamily: "'Libre Baskerville',Georgia,serif",
                        marginBottom: 2,
                      }}
                    >
                      FORM - II
                    </div>
                    <div
                      style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}
                    >
                      {appType === "RPET"
                        ? "Authorization/Rejection of FCM-rPET"
                        : "(Approval/Rejection)"}
                    </div>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: 20,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.9)",
                      letterSpacing: 0.5,
                      background: "rgba(255,255,255,0.15)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      borderRadius: 6,
                      padding: "4px 10px",
                    }}
                  >
                    {appType || "NSF"}
                  </div>
                  <button
                    onClick={printForm2}
                    style={{
                      position: "absolute",
                      right: 20,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "rgba(255,255,255,0.15)",
                      border: "1px solid rgba(255,255,255,0.35)",
                      borderRadius: 6,
                      padding: "7px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    🖨 Print
                  </button>
                </div>

                <div style={{ padding: "24px 28px" }}>
                  {/* Pre-filled details grid */}
                  <div
                    style={{
                      background: COLORS.bg,
                      borderRadius: 8,
                      border: `1px solid ${COLORS.border}`,
                      padding: "16px 20px",
                      marginBottom: 24,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: COLORS.primary,
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                        marginBottom: 14,
                      }}
                    >
                      Application Details (Pre-filled)
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "14px 24px",
                      }}
                    >
                      {readField("Application No.", app.referenceNumber)}
                      {readField(
                        "Date of Application",
                        fmtDate(app.submittedAt),
                      )}
                      {readField(
                        appType === "RPET"
                          ? "Name of Manufacturer"
                          : "Name of Organisation",
                        app.companyName,
                      )}
                      {readField(
                        "Name of Applicant",
                        profile.applicantName || "—",
                      )}
                      {readField(
                        "Registered Address",
                        app.address || profile.orgName || "—",
                      )}
                      {readField(
                        "Authorised Person",
                        profile.applicantName || "—",
                      )}
                      {appType !== "RPET" &&
                        readField(
                          "Name of Food Product",
                          app.productName || "—",
                        )}
                      {appType !== "RPET" &&
                        readField("Product Category", app.foodCategory || "—")}
                    </div>
                  </div>

                  {/* Type-specific editable fields */}
                  {appType === "RPET" && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                        marginBottom: 24,
                      }}
                    >
                      <div>
                        {sectionLabel("Type of Material Being Recycled", true)}
                        <input
                          value={f2Material}
                          onChange={(e) => setF2Material(e.target.value)}
                          placeholder="e.g. Food-grade PET resin"
                          style={fieldInput}
                        />
                      </div>
                      <div>
                        {sectionLabel("Approval / NOC / Details of Technology")}
                        <textarea
                          rows={3}
                          value={f2TechDetails}
                          onChange={(e) => setF2TechDetails(e.target.value)}
                          placeholder="Enter approval/NOC and technology description…"
                          style={{ ...textarea, minHeight: 70 }}
                        />
                      </div>
                    </div>
                  )}

                  {appType === "CA" && (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ marginBottom: 16 }}>
                        {sectionLabel("Claim Statement")}
                        <textarea
                          rows={2}
                          value={f2Claim}
                          onChange={(e) => setF2Claim(e.target.value)}
                          placeholder="Enter the claim statement being evaluated…"
                          style={{ ...textarea, minHeight: 60 }}
                        />
                      </div>
                      <div>
                        {sectionLabel(
                          "If Approved — Food Composition / Ingredient for which Claim is Approved",
                        )}
                        <textarea
                          rows={3}
                          value={f2ClaimComp}
                          onChange={(e) => setF2ClaimComp(e.target.value)}
                          placeholder={
                            f2Decision === "Approved"
                              ? "Specify food composition/ingredient…"
                              : "N/A — Application rejected"
                          }
                          style={{ ...textarea, minHeight: 70 }}
                        />
                      </div>
                    </div>
                  )}

                  {(appType === "NSF" ||
                    appType === "AA" ||
                    appType === "AnyOther") && (
                    <div style={{ marginBottom: 24 }}>
                      {sectionLabel(
                        "Composition (Ingredients & Food Additives)",
                      )}
                      <textarea
                        rows={4}
                        value={f2Composition}
                        onChange={(e) => setF2Composition(e.target.value)}
                        placeholder="List ingredients and food additives with INS No. and limits (GMP or mg/Kg)…"
                        style={{ ...textarea, minHeight: 90 }}
                      />
                    </div>
                  )}

                  {/* Decision toggle */}
                  <div style={{ marginBottom: 24 }}>
                    {sectionLabel("Application Status / Decision", true)}
                    <div style={{ display: "flex", gap: 12 }}>
                      {(["Approved", "Rejected"] as const).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setF2Decision(opt)}
                          style={{
                            padding: "10px 28px",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            border: `2px solid ${f2Decision === opt ? (opt === "Approved" ? COLORS.success : COLORS.danger) : COLORS.border}`,
                            background:
                              f2Decision === opt
                                ? opt === "Approved"
                                  ? "#F0FDF4"
                                  : "#FFF1F2"
                                : "#fff",
                            color:
                              f2Decision === opt
                                ? opt === "Approved"
                                  ? "#166534"
                                  : "#9F1239"
                                : COLORS.textMuted,
                            transition: "all 0.15s",
                          }}
                        >
                          {opt === "Approved" ? "✓ Approved" : "✗ Rejected"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Conditions & Reasons */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                      marginBottom: 24,
                    }}
                  >
                    <div>
                      {sectionLabel(
                        `1. Conditions for ${appType === "RPET" ? "Authorization" : "Approval"}`,
                        f2Decision === "Approved",
                      )}
                      <textarea
                        rows={5}
                        value={f2Conditions}
                        onChange={(e) => setF2Conditions(e.target.value)}
                        placeholder={
                          f2Decision === "Approved"
                            ? "State conditions under which approval is granted…"
                            : "N/A — Application rejected"
                        }
                        style={{
                          ...textarea,
                          minHeight: 110,
                          borderColor:
                            f2Decision === "Approved" && !f2Conditions.trim()
                              ? COLORS.danger + "80"
                              : COLORS.border,
                        }}
                      />
                    </div>
                    <div>
                      {sectionLabel(
                        `${appType === "CA" ? "3" : "2"}. Reasons for Rejection, if any`,
                        f2Decision === "Rejected",
                      )}
                      <textarea
                        rows={5}
                        value={f2Reasons}
                        onChange={(e) => setF2Reasons(e.target.value)}
                        placeholder={
                          f2Decision === "Rejected"
                            ? "State reasons for rejection…"
                            : "N/A — Application approved"
                        }
                        style={{
                          ...textarea,
                          minHeight: 110,
                          borderColor:
                            f2Decision === "Rejected" && !f2Reasons.trim()
                              ? COLORS.danger + "80"
                              : COLORS.border,
                        }}
                      />
                    </div>
                  </div>

                  {/* Submit bar */}
                  <div
                    style={{
                      borderTop: `1px solid ${COLORS.border}`,
                      paddingTop: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background:
                            f2Decision === "Approved"
                              ? COLORS.success
                              : COLORS.danger,
                        }}
                      />
                      <span style={{ fontSize: 12, color: COLORS.textMuted }}>
                        Final Decision:{" "}
                        <strong
                          style={{
                            color:
                              f2Decision === "Approved"
                                ? COLORS.success
                                : COLORS.danger,
                            fontSize: 13,
                          }}
                        >
                          {f2Decision}
                        </strong>
                      </span>
                    </div>
                    <button
                      style={{
                        background: COLORS.primary,
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "11px 26px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: saving ? "not-allowed" : "pointer",
                        opacity: saving ? 0.7 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                      disabled={saving}
                      onClick={handleRecordDecision}
                    >
                      <span>📄</span>
                      {saving
                        ? "Processing…"
                        : "Submit Form 2 & Forward to Nodal Officer A →"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Bottom bar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 16,
          paddingTop: 14,
          borderTop: `1px solid ${COLORS.border}`,
          justifyContent: "flex-end",
        }}
      >
        <button
          style={btn("outline")}
          onClick={() => navigate("/technical/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
