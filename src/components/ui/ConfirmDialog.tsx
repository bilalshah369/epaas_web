import { COLORS } from '@/utils/colors';

interface Props {
  message:      string;
  onConfirm:    () => void;
  onCancel:     () => void;
  confirmLabel?: string;
  /** 'primary' | 'danger' | 'warning' — maps to COLORS key */
  variant?:     'primary' | 'danger' | 'warning';
}

export default function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = 'Yes, Proceed', variant = 'primary' }: Props) {
  const confirmBg = variant === 'danger' ? COLORS.danger : variant === 'warning' ? COLORS.warning : COLORS.primary;
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.52)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onCancel}
    >
      <div
        style={{ background: '#fff', borderRadius: 10, padding: '28px 28px 22px', maxWidth: 420, width: '100%', boxShadow: '0 12px 48px rgba(0,0,0,0.22)', textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 28, marginBottom: 10, lineHeight: 1 }}>⚠️</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", marginBottom: 10 }}>
          Confirm Action
        </div>
        <div style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.65, marginBottom: 22 }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={onConfirm}
            style={{ padding: '8px 24px', background: confirmBg, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            style={{ padding: '8px 20px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
