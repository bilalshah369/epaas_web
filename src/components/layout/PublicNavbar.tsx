// Shared top navbar used by LoginPage and SignUpPage.
// Mirrors the two-row header in the mock (utility bar + logo/primary bar).
import { useNavigate } from 'react-router-dom';
import PalettePicker from '@/components/ui/PalettePicker';

const fssaiLogo = 'https://package-tracking-files-prod.s3.eu-north-1.amazonaws.com/app_images/fssai-logo.png';

interface Props {
  rightLabel:   string;   // e.g. "Already registered? Sign in →" or "Authority Login →"
  onRightClick: () => void;
}

export default function PublicNavbar({ rightLabel, onRightClick }: Props) {
  const navigate = useNavigate();

  function adjustFontSize(delta: number) {
    const current = parseFloat(getComputedStyle(document.documentElement).fontSize);
    document.documentElement.style.fontSize = `${Math.min(20, Math.max(12, current + delta))}px`;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', flexShrink: 0 }}>
      {/* ── Row 1: utility bar ─────────────────────────────────────────── */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #e0e0e0',
          padding: '4px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src="https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg"
            alt="India Flag"
            style={{ height: 20, width: 30, objectFit: 'cover', borderRadius: 1 }}
          />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#1A3D2B', letterSpacing: 0.2 }}>
            Ministry of Health &amp; Family Welfare, Government of India
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 10, color: '#666' }}>Font:</span>
          {([['A−', -1], ['A', 0], ['A+', 1]] as [string, number][]).map(([t, d], i) => (
            <button
              key={i}
              onClick={() => d !== 0 && adjustFontSize(d)}
              style={{
                background: '#f4f4f4',
                border: '1px solid #ddd',
                borderRadius: 3,
                cursor: 'pointer',
                fontSize: [10, 12, 14][i],
                fontWeight: 600,
                color: '#1A3D2B',
                width: 22,
                height: 22,
                padding: 0,
                lineHeight: 1,
              }}
            >
              {t}
            </button>
          ))}

          <div style={{ width: 1, height: 16, background: '#ddd', margin: '0 3px' }} />
          <span style={{ fontSize: 10, color: '#888' }}>Last Updated: Apr 2026</span>
          <div style={{ width: 1, height: 16, background: '#ddd', margin: '0 3px' }} />

          <PalettePicker />

          <div style={{ width: 1, height: 16, background: '#ddd', margin: '0 3px' }} />
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#1A3D2B', fontWeight: 500, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 3 }}
          >
            <span>🗺️</span><span>Sitemap</span>
          </button>
        </div>
      </div>

      {/* ── Row 2: logo + primary bar ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div
          onClick={() => navigate('/')}
          style={{
            background: '#fff',
            width: 260,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 10px',
            cursor: 'pointer',
          }}
        >
          <img src={fssaiLogo} alt="FSSAI" style={{ height: 90, width: 'auto', objectFit: 'contain', display: 'block' }} />
        </div>

        <div
          style={{
            background: '#fff',
            padding: '0 16px',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 4,
            borderBottom: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          {[
            { label: 'Home', href: '/' },
            { label: 'About Us', href: '/' },
            { label: 'Application Categories', href: '/' },
            { label: 'User Manual', href: '/' },
            { label: 'FAQs', href: '/' },
          ].map(({ label }) => (
            <span
              key={label}
              onClick={() => navigate('/')}
              style={{ fontSize: 15, color: '#111', cursor: 'pointer', padding: '6px 10px', fontWeight: 400 }}
            >
              {label}
            </span>
          ))}
          <div style={{ width: 1, height: 16, background: 'rgba(0,0,0,0.12)', margin: '0 6px' }} />
          <span
            onClick={onRightClick}
            style={{ fontSize: 12, color: '#111', cursor: 'pointer', fontWeight: 700, border: '1px solid rgba(0,0,0,0.14)', padding: '5px 12px', borderRadius: 5, background: '#f9f9f9' }}
          >
            {rightLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
