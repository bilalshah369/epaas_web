// Mirrors S.badge() from mock + StatusBadge component (App.jsx L1744, L2524).
const BADGE_MAP: Record<string, { bg: string; color: string; label: string }> = {
  Draft:                  { bg: '#78909C', color: '#fff', label: 'Draft' },
  Submitted:              { bg: '#1565C0', color: '#fff', label: 'Submitted' },
  WithNodalOfficerA:      { bg: '#0D7377', color: '#fff', label: 'Under Scrutiny' },
  WithTechnicalOfficer:   { bg: '#0D7377', color: '#fff', label: 'Under Scrutiny' },
  QuerySent:              { bg: '#F57C00', color: '#fff', label: 'Query Raised' },
  WithExpertCommittee:    { bg: '#1565C0', color: '#fff', label: 'With EC' },
  WithNodalPointB:        { bg: '#0D7377', color: '#fff', label: 'With Nodal B' },
  DecisionPending:        { bg: '#9E9E9E', color: '#fff', label: 'Decision Pending' },
  WithCEO:                { bg: '#6A1B9A', color: '#fff', label: 'With CEO' },
  WithChairperson:        { bg: '#4A148C', color: '#fff', label: 'With Chairperson' },
  Approved:               { bg: '#2E7D32', color: '#fff', label: 'Approved' },
  Rejected:               { bg: '#E53935', color: '#fff', label: 'Rejected' },
  Closed:                 { bg: '#2E7D32', color: '#fff', label: 'Closed' },
  // Legacy short-form keys (used by mock directly)
  scrutiny:               { bg: '#0D7377', color: '#fff', label: 'Under Scrutiny' },
  ec:                     { bg: '#1565C0', color: '#fff', label: 'With EC' },
  query:                  { bg: '#F57C00', color: '#fff', label: 'Query Raised' },
  approved:               { bg: '#2E7D32', color: '#fff', label: 'Approved' },
  rejected:               { bg: '#E53935', color: '#fff', label: 'Rejected' },
  pending:                { bg: '#9E9E9E', color: '#fff', label: 'Pending' },
  draft:                  { bg: '#78909C', color: '#fff', label: 'Draft' },
};

interface Props {
  status: string;
  label?: string;
}

export default function StatusBadge({ status, label }: Props) {
  const entry = BADGE_MAP[status] ?? { bg: '#ccc', color: '#333', label: status };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        borderRadius: 12,
        fontSize: 10,
        fontWeight: 700,
        background: entry.bg,
        color: entry.color,
        whiteSpace: 'nowrap',
      }}
    >
      {label ?? entry.label}
    </span>
  );
}
