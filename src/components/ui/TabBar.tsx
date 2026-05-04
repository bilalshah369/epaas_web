import { COLORS } from '@/utils/colors';

interface Props {
  tabs:     string[];
  active:   number;
  onChange: (i: number) => void;
}

export default function TabBar({ tabs, active, onChange }: Props) {
  return (
    <div style={{ display: 'flex', borderBottom: `2px solid ${COLORS.border}`, marginBottom: 20 }}>
      {tabs.map((t, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 22px', fontSize: 13,
            fontWeight: active === i ? 700 : 400,
            color:      active === i ? COLORS.primary : COLORS.textMuted,
            borderBottom: active === i ? `2px solid ${COLORS.primary}` : '2px solid transparent',
            marginBottom: -2, transition: 'color 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
