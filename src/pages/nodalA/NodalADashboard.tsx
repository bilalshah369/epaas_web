// Mirrors NodalDashboard from mock (App.jsx L12763).
// Wired to real API: fetchNodalAAll() for all non-draft apps.
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS, S } from "@/utils/colors";
import { resolveFoodCategory } from "@/utils/docResolver";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  fetchNodalAAll, fetchNodalAPmsApplications, fetchWithdrawalRequests, approveWithdrawalRequest,
  rejectWithdrawalRequest, withdrawByAuthority,
  type WithdrawalRequestRecord,
} from "@/services/officer.service";
import { API_BASE } from "@/services/api";
import type { Application } from "@/services/application.service";
import toast from "react-hot-toast";

// ── Stage helpers ──────────────────────────────────────────────────────────────

const STAGE_PENDING_WITH: Record<string, string> = {
  Submitted: "Nodal Officer",
  WithNodalOfficerA: "Nodal Officer",
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
  Withdrawn: "—",
  WithdrawnByAuthority: "—",
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
  if (["Withdrawn", "WithdrawnByAuthority"].includes(stage)) return "withdrawn";
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
    label: "Food Category",
    type: "select",
    options: [
      "All",
      "Bakery & Confectionery",
      "Beverages",
      "Cereal & Cereal Products",
      "Dairy Products",
      "Fats & Oils",
      "Fruits & Vegetables",
      "Meat & Poultry",
      "Nutritional Supplements",
      "Spices & Condiments",
      "Any Other",
    ],
  },
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
      "Recommended by TO",
      "Recommended by EC",
      "Extension of Additional Time",
      "Request for Appeal",
      "Request for Review",
      "Withdraw by Applicant",
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

// ── PDF print helper ───────────────────────────────────────────────────────────

function printTablePDF(title: string, headers: string[], rows: string[][]) {
  const win = window.open('', '_blank', 'width=900,height=650');
  if (!win) return;
  const thStyle = 'background:#1B4332;color:#fff;padding:8px 10px;font-size:11px;font-weight:700;text-align:left;white-space:nowrap;border:1px solid #ddd;';
  const tdStyle = 'padding:7px 10px;font-size:11px;border:1px solid #ddd;';
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>body{font-family:"Segoe UI",sans-serif;margin:24px;}h2{font-size:16px;margin-bottom:4px;color:#1B4332;}
    p{font-size:11px;color:#666;margin-bottom:16px;}table{border-collapse:collapse;width:100%;}
    tr:nth-child(even){background:#f6faf8;}@media print{@page{size:landscape;}}</style></head>
    <body><h2>FSSAI E-PAAS — ${title}</h2>
    <p>Generated on ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</p>
    <table><thead><tr>${headers.map((h) => `<th style="${thStyle}">${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td style="${tdStyle}">${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function NodalADashboard() {
  const navigate = useNavigate();
  const [activeBin, setActiveBin] = useState("dashboard");
  const [pendingSection, setPendingSection] = useState("docscrutiny");
  const [apps, setApps] = useState<Application[]>([]);
  const [pmsApps, setPmsApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardSection, setDashboardSection] = useState<string | null>(null);
  const [dashSubTab, setDashSubTab] = useState<"category" | "yearwise">("category");
  const [statusSheet, setStatusSheet] = useState<1 | 2>(1);
  const [appealType, setAppealType] = useState("Appeal");

  // Report search
  const [reportSearch, setReportSearch] = useState('');

  // Withdrawal state
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequestRecord[]>([]);
  const [withdrawalLoading,  setWithdrawalLoading]  = useState(false);
  const [withdrawByAuthApp,  setWithdrawByAuthApp]  = useState<Application | null>(null);
  const [withdrawByAuthJust, setWithdrawByAuthJust] = useState('');
  const [withdrawByAuthSub,  setWithdrawByAuthSub]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [all, pms] = await Promise.all([fetchNodalAAll(), fetchNodalAPmsApplications()]);
      setApps(all);
      setPmsApps(pms);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWithdrawals = useCallback(async () => {
    setWithdrawalLoading(true);
    try { setWithdrawalRequests(await fetchWithdrawalRequests()); }
    finally { setWithdrawalLoading(false); }
  }, []);

  useEffect(() => { load(); loadWithdrawals(); }, [load, loadWithdrawals]);
  useEffect(() => { setReportSearch(''); }, [dashboardSection]);

  // ── Derived stats ────────────────────────────────────────────────────────────

  const approvedApps = apps.filter((a) =>
    ["Approved", "Closed"].includes(a.stage),
  );
  const rejectedApps = apps.filter((a) => a.stage === "Rejected");
  const closedApps = apps.filter((a) => ["Withdrawn", "WithdrawnByAuthority", "Closed"].includes(a.stage));
  const pendingApps = apps.filter(
    (a) => !["Approved", "Closed", "Rejected", "Withdrawn", "WithdrawnByAuthority"].includes(a.stage),
  );
  const scrutinyQueue = apps.filter((a) =>
    ["WithNodalOfficerA", "Submitted"].includes(a.stage),
  );
  const editQueue = apps.filter((a) => a.stage === "QuerySent");
  const appealReviewApps = apps.filter((a) => ["WithCEO", "WithChairperson"].includes(a.stage));
  const unread = NOTIFICATIONS.filter((n) => !n.read).length;

  const pendingWithdrawals = withdrawalRequests.filter((w) => w.status === 'Pending');

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
    { key: "withdrawal", label: "Withdrawal of Approval", count: pendingWithdrawals.length },
    { key: "appeal", label: "Application for Appeal/Review", count: appealReviewApps.length },
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
      count: pmsApps.length,
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
      count: appealReviewApps.length,
      color: "#2C5282",
    },
  ];

  // ── Dashboard ────────────────────────────────────────────────────────────────

  const renderDashboard = () => {
    // ── Shared report table columns ─────────────────────────────────────────
    const REPORT_COLS = [
      "Sr. No.", "Application No.", "Name & Address of Applicant", "Name of Product",
      "Date of Receipt", "Date of Receipt of Appeal", "Date of Appellate Order",
      "Date of Receipt of Review", "Date of Review Order", "EC Number", "EC Status",
      "Date of Issue of Form 2", "Final Status",
    ];

    const YEAR_WISE_FILTERS: FilterField[] = [
      { label: "Category", type: "select", options: ["All/Both", "NSF", "Claim Approval", "Ayurveda Aahara", "rPET", "Any Other"] },
      { label: "Select Quarter/Month", type: "select", options: ["Select Quarter/Month", "Q1 (Apr–Jun)", "Q2 (Jul–Sep)", "Q3 (Oct–Dec)", "Q4 (Jan–Mar)", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] },
      { label: "Select Year", type: "select", options: ["2026", "2025", "2024", "2023", "2022"] },
      { label: "Date (From)", type: "date" },
      { label: "Date (To)", type: "date" },
      { label: "Type of Application", type: "select", options: ["All", "New", "Appeal", "Review"] },
    ];

    // helpers — called as functions, not components, so hooks rules don't apply
    const ecBadge = (stage: string) => {
      const ok = ["Approved", "Closed"].includes(stage);
      const no = stage === "Rejected";
      const pend = ["WithExpertCommittee", "DecisionPending"].includes(stage);
      const bg = ok ? COLORS.successLight : no ? COLORS.dangerLight : pend ? COLORS.infoLight : COLORS.bg;
      const fg = ok ? COLORS.success : no ? COLORS.danger : pend ? COLORS.info : COLORS.textMuted;
      return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: bg, color: fg }}>{ok ? "Approved" : no ? "Rejected" : pend ? "Pending" : "—"}</span>;
    };

    const finalBadge = (stage: string) => {
      const ok = ["Approved", "Closed"].includes(stage);
      const no = stage === "Rejected";
      const bg = ok ? COLORS.successLight : no ? COLORS.dangerLight : COLORS.warningLight;
      const fg = ok ? COLORS.success : no ? COLORS.danger : COLORS.warning;
      return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: bg, color: fg }}>{ok ? "approved" : no ? "rejected" : stage.toLowerCase()}</span>;
    };

    const reportTable = (rows: Application[], searchLabel = 'Search…') => {
      const filtered = reportSearch.trim()
        ? rows.filter((a) => a.referenceNumber.toLowerCase().includes(reportSearch.trim().toLowerCase()))
        : rows;
      return (
      <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>SEARCH RESULTS</span>
          <input
            placeholder={searchLabel}
            value={reportSearch}
            onChange={(e) => setReportSearch(e.target.value)}
            style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, width: 240, outline: "none" }}
          />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr>{REPORT_COLS.map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={REPORT_COLS.length} style={{ ...S.td, textAlign: "center", color: COLORS.textMuted, padding: 24 }}>No records found.</td></tr>
              ) : filtered.map((a, i) => (
                <tr key={a.id} style={{ background: i % 2 === 0 ? "#fff" : COLORS.bg }}>
                  <td style={S.td}>{i + 1}</td>
                  <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                  <td style={S.td}><div style={{ fontWeight: 600 }}>{a.companyName}</div><div style={{ fontSize: 11, color: COLORS.textMuted }}>{a.address ?? "—"}</div></td>
                  <td style={S.td}>{a.productName ?? "—"}</td>
                  <td style={S.td}>{fmtDate(a.submittedAt)}</td>
                  <td style={S.td}>—</td>
                  <td style={S.td}>—</td>
                  <td style={S.td}>—</td>
                  <td style={S.td}>—</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{a.approvalNumber ?? "—"}</td>
                  <td style={S.td}>{ecBadge(a.stage)}</td>
                  <td style={S.td}>—</td>
                  <td style={S.td}>{finalBadge(a.stage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      );
    };

    const subPageLayout = (title: string, rows: Application[], statCards: Array<{ label: string; value: number }>, searchLabel?: string) => (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={() => setDashboardSection(null)} style={{ background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", color: COLORS.text }}>← Back</button>
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif" }}>{title}</div>
        </div>
        <div style={{ display: "flex", gap: 0, marginBottom: 14 }}>
          {(["category", "yearwise"] as const).map((tab) => (
            <button key={tab} onClick={() => setDashSubTab(tab)}
              style={{ padding: "7px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${COLORS.border}`, background: dashSubTab === tab ? COLORS.primary : "#fff", color: dashSubTab === tab ? "#fff" : COLORS.text, borderRadius: tab === "category" ? "6px 0 0 6px" : "0 6px 6px 0", marginRight: tab === "category" ? -1 : 0 }}>
              {tab === "category" ? "Category-wise Summary" : "Year-wise / Specific Period"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          {statCards.map((sc) => (
            <div key={sc.label} style={{ flex: 1, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "12px 16px", background: "#fff" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.primary, fontFamily: "'Libre Baskerville',Georgia,serif" }}>{sc.value}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{sc.label}</div>
            </div>
          ))}
        </div>
        {dashSubTab === "yearwise" && (
          <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>CLICK TO VIEW YEAR WISE WITH SPECIFIC PERIOD</div>
            <OfficerFilterBar fields={YEAR_WISE_FILTERS} />
          </div>
        )}
        {reportTable(rows, searchLabel)}
      </div>
    );

    // ── Sub-page routing ────────────────────────────────────────────────────
    if (dashboardSection === "approved")
      return subPageLayout("Applications Approved", approvedApps, [
        { label: "Total Applications Received", value: apps.length },
        { label: "Total Approved", value: approvedApps.length },
        { label: "Total Withdrawn/Closed", value: closedApps.length },
      ]);

    if (dashboardSection === "rejected")
      return subPageLayout("Application Rejected", rejectedApps, [
        { label: "Total Applications Received", value: apps.length },
        { label: "Total Rejected", value: rejectedApps.length },
      ]);

    if (dashboardSection === "withdrawn")
      return subPageLayout("Application Withdrawn / Closed", closedApps, [
        { label: "Total Applications Received", value: apps.length },
        { label: "Total Approved", value: approvedApps.length },
        { label: "Total Withdrawn/Closed", value: closedApps.length },
      ]);

    if (dashboardSection === "pms")
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button onClick={() => setDashboardSection(null)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer', color: COLORS.text }}>← Back</button>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif" }}>Applications Approved with PMS</div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {[{ label: 'Total PMS Reports Received', value: pmsApps.length }, { label: 'Total Approved', value: approvedApps.length }].map((sc) => (
              <div key={sc.label} style={{ flex: 1, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 16px', background: '#fff' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.primary, fontFamily: "'Libre Baskerville',Georgia,serif" }}>{sc.value}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{sc.label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['S.No.', 'App. Ref. No.', 'Company', 'Product', 'Category', 'Approval No.', 'PMS Report'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: 32, color: COLORS.textMuted }}>Loading…</td></tr>}
                {!loading && pmsApps.length === 0 && <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: 32, color: COLORS.textMuted }}>No PMS reports submitted yet.</td></tr>}
                {pmsApps.map((a, i) => {
                  const pmsDoc = a.documents?.find((d) => d.fieldName === 'pmsReport');
                  return (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                      <td style={S.td}>{i + 1}</td>
                      <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                      <td style={S.td}>{a.companyName}</td>
                      <td style={S.td}>{a.productName ?? '—'}</td>
                      <td style={S.td}>{a.applicationType}</td>
                      <td style={S.td}>{a.approvalNumber ?? '—'}</td>
                      <td style={S.td}>
                        {pmsDoc ? (
                          <a href={`${API_BASE}/uploads/${pmsDoc.storedName}`} target="_blank" rel="noreferrer"
                            style={{ color: COLORS.primary, fontWeight: 600, textDecoration: 'none', fontSize: 12 }}>
                            📎 {pmsDoc.originalName}
                          </a>
                        ) : <span style={{ color: COLORS.textMuted }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );

    if (dashboardSection === "status") return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={() => setDashboardSection(null)} style={{ background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", color: COLORS.text }}>← Back</button>
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif" }}>Application Status</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase" }}>View</label>
            <select style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "5px 8px", fontSize: 11, background: "#fff" }}>
              <option>Year-wise</option><option>Category-wise</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase" }}>Type</label>
            <select style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "5px 8px", fontSize: 11, background: "#fff" }}>
              <option>New</option><option>Appeal</option><option>Review</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 0, marginBottom: 14 }}>
          {([1, 2] as const).map((s) => (
            <button key={s} onClick={() => setStatusSheet(s)}
              style={{ padding: "7px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${COLORS.border}`, background: statusSheet === s ? COLORS.primary : "#fff", color: statusSheet === s ? "#fff" : COLORS.text, borderRadius: s === 1 ? "6px 0 0 6px" : "0 6px 6px 0", marginRight: s === 1 ? -1 : 0 }}>
              Sheet {s}
            </button>
          ))}
        </div>
        {statusSheet === 1 && (
          <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}`, fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>SHEET 1 — APPLICANT PENDING STATUS</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr>{["Summary", "TO", "Nodal", "EC", "Applicant"].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {[
                  { label: "Applicant Pending ≤ 45 Days",   min: 0,  max: 45       },
                  { label: "Applicant Pending 46–75 Days",  min: 46, max: 75       },
                  { label: "Applicant Pending > 75 Days",   min: 76, max: Infinity },
                ].map((row, i) => {
                  const f = pendingApps.filter((a) => { const d = (Date.now() - new Date(a.submittedAt ?? 0).getTime()) / 86400000; return d >= row.min && d <= row.max; });
                  return (
                    <tr key={row.label} style={{ background: i % 2 === 0 ? "#fff" : COLORS.bg }}>
                      <td style={S.td}>{row.label}</td>
                      <td style={{ ...S.td, textAlign: "center" }}>{f.filter((a) => a.stage === "WithTechnicalOfficer").length}</td>
                      <td style={{ ...S.td, textAlign: "center" }}>{f.filter((a) => ["WithNodalOfficerA", "Submitted"].includes(a.stage)).length}</td>
                      <td style={{ ...S.td, textAlign: "center" }}>{f.filter((a) => ["WithExpertCommittee", "DecisionPending"].includes(a.stage)).length}</td>
                      <td style={{ ...S.td, textAlign: "center" }}>{f.filter((a) => a.stage === "QuerySent").length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {statusSheet === 2 && (
          <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}`, fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>SHEET 2 — DETAILED APPLICATION STATUS</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>{["Sr. No.", "Total Pending Applications", "Applications Pending with TO", "Applications Pending with Nodal Officer", "Applications Pending with EC", "Applications Ready to go to EC", "Applicant Pending ≤ 30 Days", "Applicant Pending 31–45 Days", "Applicant Pending > 45 Days", "Long Outstanding Cases (> 75 Days)"].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={S.td}>1</td>
                    <td style={S.td}>{pendingApps.length}</td>
                    <td style={S.td}>{pendingApps.filter((a) => a.stage === "WithTechnicalOfficer").length}</td>
                    <td style={S.td}>{pendingApps.filter((a) => ["WithNodalOfficerA", "Submitted"].includes(a.stage)).length}</td>
                    <td style={S.td}>{pendingApps.filter((a) => ["WithExpertCommittee", "DecisionPending"].includes(a.stage)).length}</td>
                    <td style={S.td}>{pendingApps.filter((a) => a.stage === "WithNodalPointB").length}</td>
                    <td style={S.td}>{pendingApps.filter((a) => { const d = (Date.now() - new Date(a.submittedAt ?? 0).getTime()) / 86400000; return d <= 30; }).length}</td>
                    <td style={S.td}>{pendingApps.filter((a) => { const d = (Date.now() - new Date(a.submittedAt ?? 0).getTime()) / 86400000; return d > 30 && d <= 45; }).length}</td>
                    <td style={S.td}>{pendingApps.filter((a) => { const d = (Date.now() - new Date(a.submittedAt ?? 0).getTime()) / 86400000; return d > 45; }).length}</td>
                    <td style={S.td}>{pendingApps.filter((a) => { const d = (Date.now() - new Date(a.submittedAt ?? 0).getTime()) / 86400000; return d > 75; }).length}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );

    if (dashboardSection === "appealreview") {
      const appealRows = apps.filter((a) => a.workflowType === 'Appeal');
      const reviewRows = apps.filter((a) => a.workflowType === 'Review');
      const activeRows = appealType === 'Appeal' ? appealRows : reviewRows;
      const activeApproved = activeRows.filter((a) => ['Approved', 'Closed'].includes(a.stage)).length;
      const activeRejected = activeRows.filter((a) => a.stage === 'Rejected').length;
      const activePending  = activeRows.filter((a) => !['Approved', 'Closed', 'Rejected', 'Withdrawn', 'WithdrawnByAuthority'].includes(a.stage)).length;
      return (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <button onClick={() => setDashboardSection(null)} style={{ background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", color: COLORS.text }}>← Back</button>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif" }}>Application for Appeal / Review</div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {(["Appeal", "Review"] as const).map((t) => (
              <button key={t} onClick={() => setAppealType(t)}
                style={{ padding: "7px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${COLORS.border}`, background: appealType === t ? COLORS.primary : "#fff", color: appealType === t ? "#fff" : COLORS.text, borderRadius: 6 }}>
                {t} <span style={{ fontSize: 11, marginLeft: 4, opacity: 0.8 }}>({(t === 'Appeal' ? appealRows : reviewRows).length})</span>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            {[
              { label: `Total ${appealType}s`, value: activeRows.length },
              { label: 'Approved', value: activeApproved },
              { label: 'Rejected', value: activeRejected },
              { label: 'Pending', value: activePending },
            ].map((sc) => (
              <div key={sc.label} style={{ flex: 1, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "12px 16px", background: "#fff" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.primary, fontFamily: "'Libre Baskerville',Georgia,serif" }}>{sc.value}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{sc.label}</div>
              </div>
            ))}
          </div>
          {reportTable(activeRows)}
        </div>
      );
    }

    // ── Main dashboard ──────────────────────────────────────────────────────
    return (
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
            onClick={() => setDashboardSection(c.key)}
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
              onClick={() => printTablePDF(
                "Recent Applications",
                ["Ref. No.", "Company", "Product", "Type", "Food Category", "Received", "Pending With", "Status"],
                apps.map((a) => [a.referenceNumber, a.companyName, a.productName ?? "—", a.applicationType, resolveFoodCategory(a), a.submittedAt ? new Date(a.submittedAt).toLocaleDateString("en-IN") : "—", STAGE_PENDING_WITH[a.stage] ?? a.stage, a.stage])
              )}
              style={{ background: "#DC2626", color: "#fff", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
            >
              ⬇ Download PDF
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
                        {resolveFoodCategory(a)}
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
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => navigate(`/nodal/view/${a.id}`)}
                            style={{ background: 'transparent', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => navigate(`/nodal/scrutiny/${a.id}`)}
                            style={{ background: COLORS.primary, color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Proceed
                          </button>
                        </div>
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
  };

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
                onClick={() => printTablePDF(
                  "Document Scrutinization Queue",
                  ["Ref. No.", "Type", "Food Category", "Company", "Product", "Pending With", "Received On", "Days Remaining"],
                  scrutinyQueue.map((a) => [a.referenceNumber, a.applicationType, resolveFoodCategory(a), a.companyName, a.productName ?? "—", STAGE_PENDING_WITH[a.stage] ?? a.stage, a.submittedAt ? new Date(a.submittedAt).toLocaleDateString("en-IN") : "—", String(Math.max(0, 30 - Math.floor((Date.now() - new Date(a.submittedAt ?? 0).getTime()) / 86400000)))])
                )}
                style={{ background: "#DC2626", color: "#fff", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
              >
                ⬇ Download PDF
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
                          {resolveFoodCategory(a)}
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
                              label="View"
                              variant="outline"
                              onClick={() => navigate(`/nodal/view/${a.id}`)}
                            />
                            <Btn
                              label="Proceed"
                              onClick={() => navigate(`/nodal/scrutiny/${a.id}`)}
                            />
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
                        {resolveFoodCategory(a)}
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
          {/* Authority-initiated withdrawal: approved + already-withdrawn apps */}
          {(() => {
            const withdrawalApps = apps.filter((a) => ["Approved", "Closed", "Withdrawn", "WithdrawnByAuthority"].includes(a.stage));
            const statusLabel = (stage: string) => {
              if (stage === "Withdrawn") return { bg: "#E0E7FF", color: "#3730A3", text: "Withdrawn" };
              if (stage === "WithdrawnByAuthority") return { bg: "#F3F4F6", color: "#374151", text: "Withdrawn by Authority" };
              return { bg: COLORS.successLight, color: COLORS.success, text: "Approved" };
            };
            return (
              <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>Withdrawal of Approval (Authority Action)</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 12 }}>Nodal Officer can directly withdraw an approved application. Already-withdrawn applications are view-only.</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>{["Sr. No.", "Ref. No.", "Company", "Product", "Status", "Action"].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {withdrawalApps.length === 0 ? (
                        <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: COLORS.textMuted, padding: 20 }}>No approved or withdrawn applications.</td></tr>
                      ) : withdrawalApps.map((a, i) => {
                        const sl = statusLabel(a.stage);
                        const isWithdrawn = ["Withdrawn", "WithdrawnByAuthority"].includes(a.stage);
                        return (
                          <tr key={a.id} style={{ background: i % 2 === 0 ? "#fff" : COLORS.bg }}>
                            <td style={S.td}>{i + 1}</td>
                            <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{a.referenceNumber}</td>
                            <td style={S.td}>{a.companyName}</td>
                            <td style={S.td}>{a.productName ?? "—"}</td>
                            <td style={S.td}><span style={{ fontSize: 10, fontWeight: 700, background: sl.bg, color: sl.color, padding: "2px 8px", borderRadius: 4 }}>{sl.text}</span></td>
                            <td style={S.td}>
                              {isWithdrawn ? (
                                <Btn label="View" variant="outline" onClick={() => navigate(`/nodal/scrutiny/${a.id}`)} />
                              ) : (
                                <button onClick={() => { setWithdrawByAuthApp(a); setWithdrawByAuthJust(''); }}
                                  style={{ background: COLORS.danger, color: "#fff", border: "none", borderRadius: 5, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                                  Withdraw
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Applicant-requested withdrawals */}
          <OfficerFilterBar fields={WITHDRAWAL_FILTERS} />
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "9px 14px", background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}`, fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              APPLICANT WITHDRAWAL REQUESTS
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>{["Sr. No.", "Ref. No.", "Company", "Product", "Justification", "Request Date", "Status", "Action"].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {withdrawalLoading ? (
                  <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: COLORS.textMuted, padding: 24 }}>Loading…</td></tr>
                ) : withdrawalRequests.length === 0 ? (
                  <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: COLORS.textMuted, padding: 24 }}>No withdrawal requests.</td></tr>
                ) : withdrawalRequests.map((w, i) => (
                  <tr key={w.id} style={{ background: i % 2 === 0 ? "#fff" : COLORS.bg }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, color: COLORS.primary, fontWeight: 600 }}>{w.application.referenceNumber}</td>
                    <td style={S.td}>{w.application.companyName}</td>
                    <td style={S.td}>{w.application.productName ?? "—"}</td>
                    <td style={{ ...S.td, maxWidth: 200 }}><span style={{ fontSize: 11, color: COLORS.text }}>{w.justification}</span></td>
                    <td style={S.td}>{new Date(w.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td style={S.td}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: w.status === "Pending" ? COLORS.warningLight : w.status === "Approved" ? COLORS.successLight : COLORS.dangerLight, color: w.status === "Pending" ? COLORS.warning : w.status === "Approved" ? COLORS.success : COLORS.danger }}>
                        {w.status}
                      </span>
                    </td>
                    <td style={S.td}>
                      {w.status === "Pending" && (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={async () => { try { await approveWithdrawalRequest(w.id); toast.success("Withdrawal approved"); loadWithdrawals(); load(); } catch { toast.error("Failed"); } }}
                            style={{ background: COLORS.success, color: "#fff", border: "none", borderRadius: 5, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                            Approve
                          </button>
                          <button onClick={async () => { try { await rejectWithdrawalRequest(w.id); toast.success("Withdrawal rejected"); loadWithdrawals(); } catch { toast.error("Failed"); } }}
                            style={{ background: COLORS.danger, color: "#fff", border: "none", borderRadius: 5, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                            Reject
                          </button>
                        </div>
                      )}
                      {w.status !== "Pending" && <span style={{ fontSize: 11, color: COLORS.textMuted }}>—</span>}
                    </td>
                  </tr>
                ))}
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
      {/* ── Withdraw by Authority Modal ─────────────────────────────────── */}
      {withdrawByAuthApp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, width: 500, boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}>
            <div style={{ background: COLORS.danger, borderRadius: "12px 12px 0 0", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Withdraw Application (Authority)</div>
              <div onClick={() => setWithdrawByAuthApp(null)} style={{ cursor: "pointer", color: "rgba(255,255,255,0.7)", fontSize: 20 }}>✕</div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>Application</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary }}>{withdrawByAuthApp.referenceNumber}</div>
                <div style={{ fontSize: 11, color: COLORS.text, marginTop: 2 }}>{withdrawByAuthApp.companyName}</div>
              </div>
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, padding: "10px 14px", fontSize: 11, color: "#991B1B", marginBottom: 14, lineHeight: 1.6 }}>
                This action will immediately withdraw the approved application and notify the applicant. This cannot be undone.
              </div>
              <label style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>
                Justification <span style={{ color: COLORS.danger }}>*</span>
              </label>
              <textarea
                value={withdrawByAuthJust}
                onChange={(e) => setWithdrawByAuthJust(e.target.value)}
                placeholder="Provide official reason for withdrawal..."
                style={{ width: "100%", resize: "vertical", fontFamily: "'Noto Sans','Segoe UI',sans-serif", fontSize: 12, padding: "8px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 6, outline: "none", minHeight: 80, marginBottom: 16 }}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setWithdrawByAuthApp(null)} style={{ background: "transparent", color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 5, padding: "8px 18px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button disabled={withdrawByAuthSub || !withdrawByAuthJust.trim()} onClick={async () => {
                  if (!withdrawByAuthJust.trim()) return;
                  setWithdrawByAuthSub(true);
                  try {
                    await withdrawByAuthority(withdrawByAuthApp.id, withdrawByAuthJust);
                    toast.success("Application withdrawn by authority");
                    setWithdrawByAuthApp(null);
                    setWithdrawByAuthJust('');
                    load();
                  } catch { toast.error("Failed to withdraw application"); }
                  finally { setWithdrawByAuthSub(false); }
                }} style={{ background: COLORS.danger, color: "#fff", border: "none", borderRadius: 5, padding: "8px 18px", fontSize: 11, fontWeight: 600, cursor: "pointer", opacity: withdrawByAuthJust.trim() ? 1 : 0.5 }}>
                  {withdrawByAuthSub ? "Processing…" : "Confirm Withdrawal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
