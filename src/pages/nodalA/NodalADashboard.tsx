// Mirrors NodalDashboard from mock (App.jsx L12763).
// Wired to real API: fetchNodalAAll() for all non-draft apps.
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS, S } from "@/utils/colors";
import StatusBadge from "@/components/ui/StatusBadge";
import { fetchNodalAAll } from "@/services/officer.service";
import type { Application } from "@/services/application.service";

// ── Stage helpers ──────────────────────────────────────────────────────────────

const STAGE_PENDING_WITH: Record<string, string> = {
  Submitted: "Nodal Officer A",
  WithNodalOfficerA: "Nodal Officer A",
  QuerySent: "Applicant",
  WithTechnicalOfficer: "Technical Officer",
  WithExpertCommittee: "Expert Committee",
  DecisionPending: "Expert Committee",
  WithNodalPointB: "Nodal Point B",
  WithCEO: "CEO (Appellate)",
  WithChairperson: "Chairperson",
  Approved: "—",
  Closed: "—",
  Rejected: "—",
};

const TYPE_LABELS: Record<string, string> = {
  NSF: "NSF",
  ClaimApproval: "Claim Approval",
  AyurvedaAahara: "Ayurveda Aahara",
  RPET: "rPET",
  AnyOther: "Any Other",
};

function stageToStatus(stage: string): string {
  if (["Approved", "Closed"].includes(stage)) return "approved";
  if (stage === "Rejected") return "rejected";
  if (stage === "QuerySent") return "query";
  if (["WithNodalOfficerA", "Submitted"].includes(stage)) return "scrutiny";
  return "pending";
}

function daysLeft(submittedAt: string | null, windowDays = 30): number {
  if (!submittedAt) return 0;
  const elapsed = Math.floor(
    (Date.now() - new Date(submittedAt).getTime()) / 86_400_000,
  );
  return Math.max(0, windowDays - elapsed);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ScreenHeading({ role, title }: { role: string; title: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
        paddingBottom: 10,
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <div>
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
          {role}
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
          {title}
        </h2>
      </div>
    </div>
  );
}

function OfficerBins({
  activeBin,
  onSelect,
  pendingCount,
  notifCount,
}: {
  activeBin: string;
  onSelect: (k: string) => void;
  pendingCount: number;
  notifCount: number;
}) {
  const bins = [
    {
      key: "dashboard",
      icon: "🏛️",
      label: "Click to View Dashboard",
      count: null,
      color: COLORS.primary,
    },
    {
      key: "pending",
      icon: "⚡",
      label: "Click to View Pending Actions",
      count: pendingCount,
      color: "#B45309",
    },
    {
      key: "notifications",
      icon: "🔔",
      label: "Click to View Notifications",
      count: notifCount,
      color: COLORS.info,
    },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: 14,
        marginBottom: 20,
      }}
    >
      {bins.map((b) => {
        const active = activeBin === b.key;
        return (
          <div
            key={b.key}
            onClick={() => onSelect(b.key)}
            style={{
              background: active ? b.color : COLORS.white,
              border: `1.5px solid ${active ? b.color : COLORS.border}`,
              borderRadius: 8,
              padding: "14px 16px",
              cursor: "pointer",
              textAlign: "center",
              boxShadow: active
                ? `0 3px 12px ${b.color}38`
                : "0 1px 3px rgba(0,0,0,0.06)",
              transition: "all 0.18s",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                margin: "0 auto 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                background: active ? "rgba(255,255,255,0.18)" : b.color + "14",
                border: `1px solid ${active ? "rgba(255,255,255,0.18)" : b.color + "28"}`,
              }}
            >
              {b.icon}
            </div>
            {b.count !== null && b.count !== undefined && (
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  lineHeight: 1,
                  marginBottom: 6,
                  color: active ? "#fff" : b.color,
                  fontFamily: "'Libre Baskerville',Georgia,serif",
                }}
              >
                {b.count}
              </div>
            )}
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: active ? "rgba(255,255,255,0.92)" : COLORS.text,
                lineHeight: 1.3,
              }}
            >
              {b.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface FilterField {
  label: string;
  type?: string;
  options?: string[];
  placeholder?: string;
}
function OfficerFilterBar({ fields }: { fields: FilterField[] }) {
  return (
    <div
      style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: "12px 16px",
        marginBottom: 14,
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        alignItems: "flex-end",
      }}
    >
      {fields.map((f) => (
        <div
          key={f.label}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            minWidth: 140,
            flex: "1 1 140px",
          }}
        >
          <label
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: COLORS.textMuted,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            {f.label}
          </label>
          {f.type === "select" ? (
            <select
              style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                padding: "5px 8px",
                fontSize: 11,
                background: "#fff",
                cursor: "pointer",
              }}
            >
              {(f.options ?? []).map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ) : f.type === "date" ? (
            <input
              type="date"
              style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                padding: "5px 8px",
                fontSize: 11,
              }}
            />
          ) : (
            <input
              placeholder={f.placeholder ?? ""}
              style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                padding: "5px 8px",
                fontSize: 11,
              }}
            />
          )}
        </div>
      ))}
      <button
        style={{
          background: COLORS.primary,
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "7px 18px",
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
          alignSelf: "flex-end",
        }}
      >
        Search
      </button>
      <button
        style={{
          background: "none",
          color: COLORS.primary,
          border: `1px solid ${COLORS.primary}`,
          borderRadius: 6,
          padding: "6px 14px",
          fontSize: 11,
          cursor: "pointer",
          alignSelf: "flex-end",
        }}
      >
        Reset
      </button>
    </div>
  );
}

function Btn({
  label,
  variant = "primary",
  onClick,
}: {
  label: string;
  variant?: "primary" | "outline";
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: variant === "primary" ? COLORS.primary : "transparent",
        color: variant === "primary" ? "#fff" : COLORS.primary,
        border: `1px solid ${COLORS.primary}`,
        borderRadius: 6,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ── Filter definitions ──────────────────────────────────────────────────────────

const DOC_SCRUTINY_FILTERS: FilterField[] = [
  { label: "Application Ref. No.", placeholder: "EPAAS-…" },
  { label: "Company / Org Name", placeholder: "Search…" },
  {
    label: "State",
    type: "select",
    options: ["All", "Gujarat", "Maharashtra", "Delhi", "Karnataka"],
  },
  { label: "From Date", type: "date" },
  { label: "To Date", type: "date" },
  {
    label: "Kind of Business",
    type: "select",
    options: ["All", "Manufacturer", "Relabeller", "Importer"],
  },
  {
    label: "Application Type",
    type: "select",
    options: ["All", "New", "Appeal", "Review"],
  },
  {
    label: "Application Filter",
    type: "select",
    options: [
      "All",
      "Edited by Applicant",
      "Recommended by IO",
      "Recommended by EC",
      "Extension of Additional Time",
    ],
  },
];
const FBO_EDIT_FILTERS: FilterField[] = [
  { label: "Application Ref. No.", placeholder: "EPAAS-…" },
  { label: "Company / Org", placeholder: "Search…" },
  {
    label: "State",
    type: "select",
    options: ["All", "Gujarat", "Maharashtra", "Delhi"],
  },
  { label: "From Date", type: "date" },
  { label: "To Date", type: "date" },
];
const WITHDRAWAL_FILTERS: FilterField[] = [
  { label: "Approval No.", placeholder: "APPR-…" },
  { label: "Company / Org Name", placeholder: "Search…" },
  { label: "From Date", type: "date" },
  { label: "To Date", type: "date" },
  { label: "Reason", type: "select", options: ["All", "PMS", "Any Other"] },
];
const APPEAL_FILTERS: FilterField[] = [
  { label: "Application No.", placeholder: "EPAAS-…" },
  { label: "Company / Org Name", placeholder: "Search…" },
  { label: "Rejection / Appellate Order Date", type: "date" },
  { label: "From Date", type: "date" },
  { label: "To Date", type: "date" },
];

const NOTIFICATIONS = [
  {
    id: 1,
    title: "New application submitted — EPAAS-2025-009",
    desc: "Nestlé India Ltd. has submitted a new NSF application. Awaiting scrutiny.",
    time: "2h ago",
    read: false,
  },
  {
    id: 2,
    title: "Query response received — EPAAS-2025-004",
    desc: "Hindustan Unilever has responded to your query on the rPET application.",
    time: "5h ago",
    read: false,
  },
  {
    id: 3,
    title: "Application forwarded to Technical Officer",
    desc: "EPAAS-2025-006 forwarded successfully by you on 05 Feb 2025.",
    time: "1d ago",
    read: true,
  },
  {
    id: 4,
    title: "Reminder: EPAAS-2025-005 — 3 days remaining",
    desc: "Sun Pharma NSF application is nearing its deadline. Action required.",
    time: "1d ago",
    read: false,
  },
  {
    id: 5,
    title: "EC Meeting #14 scheduled for 22 Apr 2026",
    desc: "Expert Committee meeting has been scheduled. Prepare shortlisted applications.",
    time: "2d ago",
    read: true,
  },
];

// ── App type badge ──────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const label = TYPE_LABELS[type] ?? type;
  const isNSF = type === "NSF";
  return (
    <span
      style={{
        background: isNSF ? COLORS.primaryLight : COLORS.infoLight,
        color: isNSF ? COLORS.primary : COLORS.info,
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 4,
      }}
    >
      {label}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function NodalADashboard() {
  const navigate = useNavigate();
  const [activeBin, setActiveBin] = useState("dashboard");
  const [pendingSection, setPendingSection] = useState("docscrutiny");
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setApps(await fetchNodalAAll());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Derived stats ────────────────────────────────────────────────────────────

  const approvedApps = apps.filter((a) =>
    ["Approved", "Closed"].includes(a.stage),
  );
  const rejectedApps = apps.filter((a) => a.stage === "Rejected");
  const closedApps = apps.filter((a) => a.stage === "Closed");
  const pendingApps = apps.filter(
    (a) => !["Approved", "Closed", "Rejected"].includes(a.stage),
  );
  const scrutinyQueue = apps.filter((a) =>
    ["WithNodalOfficerA", "Submitted"].includes(a.stage),
  );
  const editQueue = apps.filter((a) => a.stage === "QuerySent");
  const unread = NOTIFICATIONS.filter((n) => !n.read).length;

  const pendingSections = [
    {
      key: "docscrutiny",
      label: "Document Scrutinization",
      count: scrutinyQueue.length,
    },
    {
      key: "fboedit",
      label: "Application with Editing",
      count: editQueue.length,
    },
    { key: "withdrawal", label: "Withdrawal of Approval", count: 0 },
    { key: "appeal", label: "Application for Appeal/Review", count: 0 },
  ];

  const dashCards = [
    {
      key: "approved",
      icon: "✅",
      label: "Applications Approved",
      count: approvedApps.length,
      color: COLORS.success,
    },
    {
      key: "rejected",
      icon: "❌",
      label: "Application Rejected",
      count: rejectedApps.length,
      color: COLORS.danger,
    },
    {
      key: "pms",
      icon: "📋",
      label: "Application Approved with PMS",
      count: 0,
      color: COLORS.info,
    },
    {
      key: "withdrawn",
      icon: "🔄",
      label: "Application Withdrawn / Closed",
      count: closedApps.length,
      color: COLORS.warning,
    },
    {
      key: "status",
      icon: "📊",
      label: "Application Status",
      count: null,
      color: COLORS.primary,
    },
    {
      key: "appealreview",
      icon: "⚖️",
      label: "Application for Appeal / Review",
      count: 0,
      color: "#2C5282",
    },
  ];

  // ── Dashboard ────────────────────────────────────────────────────────────────

  const renderDashboard = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* 2×3 stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 10,
        }}
      >
        {dashCards.map((c) => (
          <div
            key={c.key}
            onClick={() => setActiveBin("pending")}
            style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              borderTop: `3px solid ${c.color}`,
              borderRadius: 8,
              padding: "12px 16px",
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              transition: "box-shadow 0.15s",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: COLORS.textMuted,
                  lineHeight: 1.35,
                  maxWidth: "75%",
                }}
              >
                {c.label}
              </span>
              <span style={{ fontSize: 15, opacity: 0.55, flexShrink: 0 }}>
                {c.icon}
              </span>
            </div>
            {c.count !== null ? (
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: c.color,
                  fontFamily: "'Libre Baskerville',Georgia,serif",
                  lineHeight: 1,
                }}
              >
                {c.count}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: c.color, fontWeight: 600 }}>
                View details →
              </div>
            )}
            <div
              style={{
                fontSize: 10,
                color: COLORS.textMuted,
                marginTop: 5,
                fontWeight: 500,
              }}
            >
              Click to view details
            </div>
          </div>
        ))}
      </div>

      {/* Recent Applications table */}
      <div
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "9px 14px",
            borderBottom: `1px solid ${COLORS.border}`,
            background: COLORS.bg,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: COLORS.primary,
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            Recent Applications
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              style={{
                background: "none",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                padding: "4px 12px",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              ⬇ Export CSV
            </button>
            <button
              onClick={() => setActiveBin("pending")}
              style={{
                fontSize: 11,
                color: COLORS.primary,
                fontWeight: 600,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              View pending →
            </button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                color: COLORS.textMuted,
              }}
            >
              Loading applications…
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
                  {[
                    "App. No.",
                    "Company",
                    "Product",
                    "App. Type",
                    "Food Category",
                    "State",
                    "Received",
                    "Pending With",
                    "Days Left",
                    "Status",
                    "Action",
                  ].map((h) => (
                    <th key={h} style={S.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apps.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      style={{
                        ...S.td,
                        textAlign: "center",
                        color: COLORS.textMuted,
                        padding: 24,
                      }}
                    >
                      No applications found.
                    </td>
                  </tr>
                )}
                {apps.map((a, i) => {
                  const dl = daysLeft(a.submittedAt);
                  return (
                    <tr
                      key={a.id}
                      style={{ background: i % 2 === 0 ? "#fff" : COLORS.bg }}
                    >
                      <td
                        style={{
                          ...S.td,
                          color: COLORS.primary,
                          fontWeight: 600,
                        }}
                      >
                        {a.referenceNumber}
                      </td>
                      <td style={S.td}>{a.companyName}</td>
                      <td style={S.td}>{a.productName ?? "—"}</td>
                      <td style={S.td}>
                        <TypeBadge type={a.applicationType} />
                      </td>
                      <td style={{ ...S.td, fontSize: 11 }}>
                        {a.foodCategory || "—"}
                      </td>
                      <td style={S.td}>—</td>
                      <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                      <td
                        style={{
                          ...S.td,
                          fontSize: 11,
                          color: COLORS.primary,
                          fontWeight: 600,
                        }}
                      >
                        {STAGE_PENDING_WITH[a.stage] ?? a.stage}
                      </td>
                      <td
                        style={{
                          ...S.td,
                          color: dl <= 5 ? COLORS.danger : COLORS.text,
                          fontWeight: dl <= 5 ? 700 : 400,
                        }}
                      >
                        {dl}
                      </td>
                      <td style={S.td}>
                        <StatusBadge status={stageToStatus(a.stage)} />
                      </td>
                      <td style={S.td}>
                        <button
                          onClick={() => navigate(`/nodal/scrutiny/${a.id}`)}
                          style={{
                            background: COLORS.primary,
                            color: "#fff",
                            padding: "4px 10px",
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: "pointer",
                            border: "none",
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Application Summary */}
      <div
        style={{
          background: "#fff",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          padding: 20,
        }}
      >
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: COLORS.text,
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: `2px solid ${COLORS.border}`,
              }}
            >
              APPLICATION SUMMARY
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Total applications received", value: apps.length },
                { label: "Applications Approved", value: approvedApps.length },
                { label: "Applications Rejected", value: rejectedApps.length },
                {
                  label: "Applications Pending / Under Review",
                  value: pendingApps.length,
                },
                {
                  label: "Applications Withdrawn / Closed",
                  value: closedApps.length,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: COLORS.bg,
                    borderRadius: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: COLORS.text,
                      fontWeight: 500,
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: COLORS.primary,
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              background: COLORS.primaryLight,
              border: `1px solid ${COLORS.primary}22`,
              borderRadius: 8,
              padding: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 200,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              <div
                style={{ fontSize: 13, color: COLORS.primary, fontWeight: 600 }}
              >
                Category-wise Breakdown
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: COLORS.textMuted,
                  marginTop: 8,
                  lineHeight: 1.6,
                }}
              >
                Select specific categories to view detailed statistics and
                filters
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Pending Actions ──────────────────────────────────────────────────────────

  const renderPendingActions = () => (
    <>
      {/* Section tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: `1px solid ${COLORS.border}`,
          marginBottom: 14,
        }}
      >
        {pendingSections.map((s) => (
          <div
            key={s.key}
            onClick={() => setPendingSection(s.key)}
            style={{
              padding: "6px 14px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              color:
                pendingSection === s.key ? COLORS.primary : COLORS.textMuted,
              borderBottom:
                pendingSection === s.key
                  ? `2px solid ${COLORS.primary}`
                  : "2px solid transparent",
              marginBottom: -1,
              display: "flex",
              gap: 5,
              alignItems: "center",
            }}
          >
            {s.label}
            {s.count > 0 && (
              <span
                style={{
                  background:
                    pendingSection === s.key ? COLORS.primary : COLORS.border,
                  color: pendingSection === s.key ? "#fff" : COLORS.text,
                  borderRadius: 8,
                  fontSize: 10,
                  padding: "0 5px",
                  fontWeight: 700,
                }}
              >
                {s.count}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Document Scrutinization */}
      {pendingSection === "docscrutiny" && (
        <>
          <OfficerFilterBar fields={DOC_SCRUTINY_FILTERS} />
          <div
            style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "8px 14px",
                borderBottom: `1px solid ${COLORS.border}`,
                background: COLORS.bg,
              }}
            >
              <button
                style={{
                  background: "none",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 6,
                  padding: "4px 12px",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                ⬇ Export CSV
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Sr. No.",
                      "App. Ref. No. / UID",
                      "App. Type",
                      "Food Category",
                      "Company / Org.",
                      "Product Applied For",
                      "Pending With",
                      "Received On",
                      "Edited",
                      "Days Remaining",
                      "Action",
                    ].map((h) => (
                      <th key={h} style={S.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={11}
                        style={{
                          ...S.td,
                          textAlign: "center",
                          color: COLORS.textMuted,
                          padding: 24,
                        }}
                      >
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!loading && scrutinyQueue.length === 0 && (
                    <tr>
                      <td
                        colSpan={11}
                        style={{
                          ...S.td,
                          textAlign: "center",
                          color: COLORS.textMuted,
                          padding: 24,
                        }}
                      >
                        No applications pending scrutiny.
                      </td>
                    </tr>
                  )}
                  {scrutinyQueue.map((a, i) => {
                    const dl = daysLeft(a.submittedAt);
                    return (
                      <tr
                        key={a.id}
                        style={{ background: i % 2 === 0 ? "#fff" : COLORS.bg }}
                      >
                        <td style={S.td}>{i + 1}</td>
                        <td
                          style={{
                            ...S.td,
                            color: COLORS.primary,
                            fontWeight: 600,
                          }}
                        >
                          {a.referenceNumber}
                        </td>
                        <td style={S.td}>
                          <TypeBadge type={a.applicationType} />
                        </td>
                        <td style={{ ...S.td, fontSize: 11 }}>
                          {a.foodCategory || "—"}
                        </td>
                        <td style={S.td}>{a.companyName}</td>
                        <td style={S.td}>{a.productName ?? "—"}</td>
                        <td
                          style={{
                            ...S.td,
                            fontSize: 11,
                            color: COLORS.primary,
                            fontWeight: 600,
                          }}
                        >
                          {STAGE_PENDING_WITH[a.stage] ?? a.stage}
                        </td>
                        <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                        <td style={S.td}>No</td>
                        <td
                          style={{
                            ...S.td,
                            color: dl <= 5 ? COLORS.danger : COLORS.text,
                            fontWeight: dl <= 5 ? 700 : 400,
                          }}
                        >
                          {dl}
                        </td>
                        <td style={S.td}>
                          <div
                            style={{
                              display: "flex",
                              gap: 4,
                              flexWrap: "wrap",
                            }}
                          >
                            <Btn
                              label="Proceed"
                              onClick={() =>
                                navigate(`/nodal/scrutiny/${a.id}`)
                              }
                            />
                            <Btn label="Assign I/O" variant="outline" />
                            <Btn label="Forward" variant="outline" />
                            <Btn label="View Purpose" variant="outline" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Application with Editing */}
      {pendingSection === "fboedit" && (
        <>
          <OfficerFilterBar fields={FBO_EDIT_FILTERS} />
          <div
            style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Sr. No.",
                      "App. Ref. No.",
                      "App. Type",
                      "Food Category",
                      "Company / Org.",
                      "Product",
                      "Forwarded On",
                      "Action",
                    ].map((h) => (
                      <th key={h} style={S.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          ...S.td,
                          textAlign: "center",
                          color: COLORS.textMuted,
                          padding: 24,
                        }}
                      >
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!loading && editQueue.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          ...S.td,
                          textAlign: "center",
                          color: COLORS.textMuted,
                          padding: 24,
                        }}
                      >
                        No applications with editing.
                      </td>
                    </tr>
                  )}
                  {editQueue.map((a, i) => (
                    <tr
                      key={a.id}
                      style={{ background: i % 2 === 0 ? "#fff" : COLORS.bg }}
                    >
                      <td style={S.td}>{i + 1}</td>
                      <td
                        style={{
                          ...S.td,
                          color: COLORS.primary,
                          fontWeight: 600,
                        }}
                      >
                        {a.referenceNumber}
                      </td>
                      <td style={S.td}>
                        <TypeBadge type={a.applicationType} />
                      </td>
                      <td style={{ ...S.td, fontSize: 11 }}>
                        {a.foodCategory || "—"}
                      </td>
                      <td style={S.td}>{a.companyName}</td>
                      <td style={S.td}>{a.productName ?? "—"}</td>
                      <td style={S.td}>{fmtDate(a.updatedAt)}</td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <Btn
                            label="View Remarks"
                            onClick={() => navigate(`/nodal/scrutiny/${a.id}`)}
                          />
                          <Btn label="Changes Recommended" variant="outline" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Withdrawal of Approval */}
      {pendingSection === "withdrawal" && (
        <>
          <OfficerFilterBar fields={WITHDRAWAL_FILTERS} />
          <div
            style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr>
                  {[
                    "Sr. No.",
                    "Approval No.",
                    "Company / Org.",
                    "Issue Date",
                    "Request Date",
                    "Status",
                    "Action",
                  ].map((h) => (
                    <th key={h} style={S.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      ...S.td,
                      textAlign: "center",
                      color: COLORS.textMuted,
                      padding: 24,
                    }}
                  >
                    No withdrawal requests pending.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Appeal / Review */}
      {pendingSection === "appeal" && (
        <>
          <OfficerFilterBar fields={APPEAL_FILTERS} />
          <div
            style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Sr. No.",
                      "Application No.",
                      "Company / Org.",
                      "Food Category",
                      "Product Name",
                      "Request Date",
                      "Days Remaining",
                      "Action",
                    ].map((h) => (
                      <th key={h} style={S.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        ...S.td,
                        textAlign: "center",
                        color: COLORS.textMuted,
                        padding: 24,
                      }}
                    >
                      No appeal / review applications pending.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );

  // ── Notifications ────────────────────────────────────────────────────────────

  const renderNotifications = () => (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "9px 14px",
          borderBottom: `1px solid ${COLORS.border}`,
          background: COLORS.bg,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: COLORS.primary,
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          Notifications
        </span>
      </div>
      <div style={{ padding: "0 16px" }}>
        {NOTIFICATIONS.map((n) => (
          <div
            key={n.id}
            style={{
              display: "flex",
              gap: 12,
              padding: "12px 0",
              borderBottom: `1px solid ${COLORS.border}`,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: n.read ? COLORS.border : COLORS.primary,
                marginTop: 5,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: n.read ? 400 : 700,
                  color: COLORS.text,
                  marginBottom: 2,
                }}
              >
                {n.title}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: COLORS.textMuted,
                  lineHeight: 1.5,
                }}
              >
                {n.desc}
              </div>
            </div>
            <div
              style={{ fontSize: 10, color: COLORS.textMuted, flexShrink: 0 }}
            >
              {n.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <ScreenHeading role="Nodal Officer (A)" title="Dashboard" />
      <OfficerBins
        activeBin={activeBin}
        onSelect={setActiveBin}
        pendingCount={scrutinyQueue.length + editQueue.length}
        notifCount={unread}
      />
      {activeBin === "dashboard" && renderDashboard()}
      {activeBin === "pending" && renderPendingActions()}
      {activeBin === "notifications" && renderNotifications()}
    </div>
  );
}
