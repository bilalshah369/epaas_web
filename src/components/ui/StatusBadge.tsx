// Mirrors S.badge() from mock + StatusBadge component (App.jsx L1744, L2524).
const BADGE_MAP: Record<string, { bg: string; color: string; label: string }> = {
  Draft:                  { bg: '#78909C', color: '#fff', label: 'Draft' },
  Submitted:              { bg: '#1565C0', color: '#fff', label: 'Submitted' },
  WithNodalOfficerA:      { bg: '#0D7377', color: '#fff', label: 'Document Scrutiny' },
  WithTechnicalOfficer:   { bg: '#0D7377', color: '#fff', label: 'Document Scrutiny' },
  QuerySent:              { bg: '#F57C00', color: '#fff', label: 'Query / Clarification' },
  WithExpertCommittee:    { bg: '#1565C0', color: '#fff', label: 'Expert Committee' },
  WithNodalPointB:        { bg: '#1565C0', color: '#fff', label: 'Expert Committee' },
  DecisionPending:        { bg: '#1565C0', color: '#fff', label: 'Expert Committee' },
  WithCEO:                { bg: '#6A1B9A', color: '#fff', label: 'CEO Appeal' },
  WithChairperson:        { bg: '#4A148C', color: '#fff', label: 'Chairperson Review' },
  Approved:               { bg: '#2E7D32', color: '#fff', label: 'Approval' },
  Rejected:               { bg: '#E53935', color: '#fff', label: 'Rejected' },
  Closed:                 { bg: '#2E7D32', color: '#fff', label: 'Approval' },
  Withdrawn:              { bg: '#78909C', color: '#fff', label: 'Withdrawn' },
  WithdrawnByAuthority:   { bg: '#546E7A', color: '#fff', label: 'Withdrawn by Authority' },
  // Legacy short-form keys (used by mock directly)
  scrutiny:               { bg: '#0D7377', color: '#fff', label: 'Document Scrutiny' },
  ec:                     { bg: '#1565C0', color: '#fff', label: 'Expert Committee' },
  query:                  { bg: '#F57C00', color: '#fff', label: 'Query / Clarification' },
  approved:               { bg: '#2E7D32', color: '#fff', label: 'Approval' },
  rejected:               { bg: '#E53935', color: '#fff', label: 'Rejected' },
  pending:                { bg: '#9E9E9E', color: '#fff', label: 'Pending' },
  draft:                  { bg: '#78909C', color: '#fff', label: 'Draft' },
  withdrawn:              { bg: '#78909C', color: '#fff', label: 'Withdrawn' },
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
