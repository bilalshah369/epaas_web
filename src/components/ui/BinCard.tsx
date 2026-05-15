// Mirrors BinCard component from mock (App.jsx L8112).
interface Props {
  icon:    string;
  label:   string;
  count:   number;
  color:   string;
  active:  boolean;
  onClick: () => void;
}

export default function BinCard({ icon, label, count, color, active, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      style={{
        background:    active ? color : '#fff',
        borderTop:     `3px solid ${color}`,
        borderRight:   `1.5px solid ${active ? color : 'var(--color-border)'}`,
        borderBottom:  `1.5px solid ${active ? color : 'var(--color-border)'}`,
        borderLeft:    `1.5px solid ${active ? color : 'var(--color-border)'}`,
        borderRadius:  12,
        padding:       '16px 10px 14px',
        cursor:        'pointer',
        transition:    'all 0.18s',
        textAlign:     'center',
        boxShadow:     active ? `0 4px 16px ${color}44` : `0 2px 6px ${color}18`,
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           8,
      }}
    >
      <div
        style={{
          width:           44,
          height:          44,
          borderRadius:    10,
          background:      active ? 'rgba(255,255,255,0.22)' : `${color}28`,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          fontSize:        22,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize:    28,
          fontWeight:  700,
          color:       active ? '#fff' : color,
          lineHeight:  1,
          fontFamily:  "'Libre Baskerville', Georgia, serif",
        }}
      >
        {count}
      </div>
      <div
        style={{
          fontSize:   10,
          fontWeight: 600,
          color:      active ? 'rgba(255,255,255,0.95)' : 'var(--color-text)',
          lineHeight: 1.4,
          textAlign:  'center',
        }}
      >
        {label}
      </div>
    </div>
  );
}
