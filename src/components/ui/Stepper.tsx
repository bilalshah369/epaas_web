// Mirrors Stepper component from mock (App.jsx L2805).
import { COLORS } from '@/utils/colors';

interface Props {
  steps:   string[];
  current: number; // 0-based
}

export default function Stepper({ steps, current }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20 }}>
      {steps.map((s, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {/* Circle */}
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, flexShrink: 0,
              background: (done || active) ? COLORS.primary : '#E5E7EB',
              color:      (done || active) ? '#fff' : COLORS.textMuted,
            }}>
              {done ? '✓' : i + 1}
            </div>
            {/* Label */}
            <span style={{
              fontSize: 12, fontWeight: active ? 600 : 400,
              color:    active ? COLORS.primary : COLORS.textMuted,
              marginLeft: 6, whiteSpace: 'nowrap',
            }}>
              {s}
            </span>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 8px',
                background: done ? COLORS.primary : COLORS.border,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
