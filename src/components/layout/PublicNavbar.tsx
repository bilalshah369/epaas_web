// Shared top navbar used by LoginPage and SignUpPage.
// Mirrors the two-row header in the mock (utility bar + logo/primary bar).
import { useNavigate } from 'react-router-dom';

const fssaiLogo = 'https://package-tracking-files-prod.s3.eu-north-1.amazonaws.com/app_images/fssai-logo.png';

interface Props {
  rightLabel:   string;   // e.g. "Already registered? Sign in →" or "Authority Login →"
  onRightClick: () => void;
}

export default function PublicNavbar({ rightLabel, onRightClick }: Props) {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', flexShrink: 0 }}>
      {/* ── Logo + primary bar ──────────────────────────────────────────── */}
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
          <img src={fssaiLogo} alt="FSSAI" style={{ height: 104, width: 'auto', objectFit: 'contain', display: 'block' }} />
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
