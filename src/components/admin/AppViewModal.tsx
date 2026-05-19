import { COLORS } from '@/utils/colors';
import type { Application } from '@/services/application.service';

const TYPE_LABELS: Record<string, string> = {
  NSF: 'NSF', ClaimApproval: 'Claim Approval',
  AyurvedaAahara: 'Ayurveda Aahara', RPET: 'rPET', AnyOther: 'Any Other',
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function daysSince(iso: string | null | undefined) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

interface AppViewModalProps {
  app: Application;
  onClose: () => void;
  onAuditTrail: () => void;
}

export default function AppViewModal({ app, onClose, onAuditTrail }: AppViewModalProps) {
  const days   = daysSince(app.submittedAt);
  const isAppr = ['Approved', 'Closed'].includes(app.stage);
  const isRej  = app.stage === 'Rejected';
  const stageBg = isAppr ? COLORS.successLight : isRej ? COLORS.dangerLight : COLORS.warningLight;
  const stageFg = isAppr ? COLORS.success       : isRej ? COLORS.danger      : COLORS.warning;

  const fields = [
    { label: 'Company / Organisation', value: app.companyName },
    { label: 'Product Name',           value: app.productName ?? '—' },
    { label: 'Application Type',       value: TYPE_LABELS[app.applicationType] ?? app.applicationType },
    { label: 'Food Category',          value: app.foodCategory || '—' },
    { label: 'Date of Submission',     value: fmtDate(app.submittedAt) },
    { label: 'Days Elapsed',           value: days !== null ? `${days} days` : '—' },
    { label: 'Last Updated',           value: fmtDate(app.updatedAt) },
    { label: 'Office Address',         value: app.address || '—' },
  ];

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.48)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 10, padding: 28, maxWidth: 580, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Application Details</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.primary, fontFamily: "'Libre Baskerville',Georgia,serif" }}>{app.referenceNumber}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: COLORS.textMuted, lineHeight: 1, padding: '0 4px' }}>✕</button>
        </div>

        {/* Stage badge */}
        <div style={{ marginBottom: 18 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 10, background: stageBg, color: stageFg }}>{app.stage}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          {fields.map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 500, wordBreak: 'break-word' }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
          <button onClick={onAuditTrail}
            style={{ padding: '8px 20px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            View Audit Trail
          </button>
          <button onClick={onClose}
            style={{ padding: '8px 16px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
