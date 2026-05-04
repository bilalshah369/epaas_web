// Extracted 1:1 from App.jsx mock LoginPage (L7242).
// Props-based navigation replaced with React Router + Zustand.
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { useAuthStore } from '@/store/authStore';
import { COLORS } from '@/utils/colors';
import { ROLE_DEFAULT_ROUTES } from '@/types/auth.types';

type LoginType = 'applicant' | 'authority';

const APPLICANT_FEATURES = [
  { icon: '🧪', text: 'New Standard Foods (NSF)' },
  { icon: '✅', text: 'Claim Approvals (CA)' },
  { icon: '🌿', text: 'Ayurveda Aahara (AA)' },
  { icon: '♻️', text: 'rPET Packaging Approval' },
  { icon: '📄', text: 'Any Other Category' },
];

const AUTHORITY_FEATURES = [
  { icon: '🏛️', text: 'Nodal Officer A / Point B' },
  { icon: '🔬', text: 'Technical Officer' },
  { icon: '👥', text: 'Expert Committee Member' },
  { icon: '👔', text: 'CEO / Chairperson' },
  { icon: '⚙️', text: 'System Administrator' },
];

const STATS = [
  { num: '8,500+', label: 'Applications' },
  { num: '98%',    label: 'On-time Rate' },
  { num: '30 Days',label: 'Min. Processing' },
];

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  fontSize: 13,
  borderRadius: 8,
  border: `1.5px solid ${COLORS.border}`,
  background: COLORS.bg,
  outline: 'none',
  fontFamily: "'Noto Sans', 'Segoe UI', sans-serif",
  transition: 'border-color 0.15s',
};

export default function LoginPage() {
  const [type, setType]         = useState<LoginType>('applicant');
  const [identifier, setId]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');

  const { loginApplicant, loginAuthority, isLoading } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const isAuthority = type === 'authority';
  const features    = isAuthority ? AUTHORITY_FEATURES : APPLICANT_FEATURES;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (isAuthority) {
        await loginAuthority({ username: identifier, password });
      } else {
        await loginApplicant({ identifier, password });
      }
      const user = useAuthStore.getState().user!;
      toast.success(`Welcome back, ${user.username}!`);
      navigate(from ?? ROLE_DEFAULT_ROUTES[user.roleCode] ?? '/', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Login failed';
      setError(msg);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: COLORS.bg }}>
      <PublicNavbar
        rightLabel={isAuthority ? '← Applicant Login' : 'Authority Login →'}
        onRightClick={() => { setType(isAuthority ? 'applicant' : 'authority'); setError(''); setId(''); setPassword(''); }}
      />

      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
        {/* ── Left panel ─────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            background: `linear-gradient(150deg, ${COLORS.primary} 0%, #102918 55%, #0a1e10 100%)`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '48px 56px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative rings */}
          {[{ top: -80, right: -80, size: 300, opacity: 0.05 }, { top: -40, right: -40, size: 180, opacity: 0.07 }, { bottom: -100, left: -60, size: 360, opacity: 0.04 }].map((r, i) => (
            <div key={i} style={{ position: 'absolute', ...('top' in r ? { top: r.top } : { bottom: r.bottom }), ...('right' in r ? { right: r.right } : { left: r.left }), width: r.size, height: r.size, borderRadius: '50%', border: `1px solid rgba(255,255,255,${r.opacity})` }} />
          ))}
          <div style={{ position: 'absolute', bottom: 40, right: 0, width: 200, height: 200, borderRadius: '50% 0 0 50%', background: 'var(--color-accent-14)' }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 380 }}>
            {/* Govt badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '5px 12px', marginBottom: 28 }}>
              <span style={{ fontSize: 14 }}>🇮🇳</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 600, letterSpacing: 0.5 }}>GOVERNMENT OF INDIA · OFFICIAL PORTAL</span>
            </div>

            <h1 style={{ fontSize: 30, fontWeight: 700, color: '#fff', fontFamily: "'Libre Baskerville', Georgia, serif", lineHeight: 1.25, marginBottom: 14, whiteSpace: 'pre-line' }}>
              {isAuthority ? 'FSSAI Officer\nPortal' : 'Electronic Product &\nApproval System'}
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 32 }}>
              {isAuthority
                ? 'Secure access for FSSAI Officers. Process applications, raise queries, and dispatch approvals through one unified dashboard.'
                : "India's official digital portal for food product approvals. Submit, track, and manage NSF, CA, AA, rPET applications paperlessly."}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
              {features.map((f) => (
                <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                    {f.icon}
                  </div>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{f.text}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}>
              {STATS.map((s, i) => (
                <div key={i} style={{ flex: 1, paddingRight: 20, borderRight: i < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none', paddingLeft: i > 0 ? 20 : 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.accent, fontFamily: "'Libre Baskerville', Georgia, serif" }}>{s.num}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right form panel ───────────────────────────────────────── */}
        <div style={{ width: 480, background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '52px 48px', borderLeft: `1px solid ${COLORS.border}`, overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
              {isAuthority ? 'Authority Access' : 'Applicant Access'} · FSSAI E-PAAS
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville', Georgia, serif", marginBottom: 8, lineHeight: 1.2 }}>
              {isAuthority ? 'Authority Login' : 'Applicant Login'}
            </h2>
            <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.6 }}>
              {isAuthority
                ? 'Enter your official FSSAI credentials to access the officer dashboard.'
                : 'Enter your credentials to manage your food product approvals.'}
            </p>
          </div>

          {/* Toggle pill */}
          <div style={{ display: 'flex', background: COLORS.bg, borderRadius: 8, padding: 4, marginBottom: 24, border: `1px solid ${COLORS.border}` }}>
            {(['Applicant', 'Authority Officer'] as const).map((t, i) => {
              const isActive = (i === 0) !== isAuthority;
              return (
                <div
                  key={t}
                  onClick={() => { setType(i === 0 ? 'applicant' : 'authority'); setError(''); }}
                  style={{ flex: 1, textAlign: 'center', padding: '7px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: isActive ? '#fff' : 'transparent', color: isActive ? COLORS.primary : COLORS.textMuted, boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}
                >
                  {t}
                </div>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.text, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>
                {isAuthority ? 'Username' : 'License Number / Email'}
              </label>
              <input
                value={identifier}
                onChange={(e) => setId(e.target.value)}
                placeholder={isAuthority ? 'Enter your username' : 'FBO-XX-XXXX-XXXXX or email'}
                style={fieldStyle}
                required
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, letterSpacing: 0.5, textTransform: 'uppercase' }}>Password</label>
                <span style={{ fontSize: 11, color: COLORS.primary, cursor: 'pointer', fontWeight: 700 }}>Forgot Password?</span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  style={{ ...fieldStyle, paddingRight: 40 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}
                >
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: '#FDECEA', border: '1px solid #F5C6C6', borderLeft: '3px solid #C0392B', borderRadius: 6, padding: '10px 12px', fontSize: 12, color: '#C0392B', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{ width: '100%', padding: 13, background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', letterSpacing: 0.3, marginBottom: 14, opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? 'Logging in…' : 'Login to E-PAAS →'}
            </button>
          </form>

          {/* Security notice */}
          <div style={{ background: COLORS.primaryLight, border: '1px solid var(--color-primary-22)', borderLeft: `3px solid ${COLORS.primary}`, borderRadius: 6, padding: '10px 12px', fontSize: 11, color: COLORS.primary, display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 20 }}>
            <span style={{ flexShrink: 0 }}>🔒</span>
            <span>{isAuthority ? 'Unauthorized access is prohibited under IT Act 2000. All actions are logged and auditable.' : 'Secure Government Portal — All sessions are encrypted, monitored and compliant with Govt. of India standards.'}</span>
          </div>

          {/* Sign up link (applicant only) */}
          {!isAuthority && (
            <div style={{ textAlign: 'center', paddingTop: 16, borderTop: `1px solid ${COLORS.border}`, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: COLORS.textMuted }}>New to E-PAAS? </span>
              <Link to="/signup" style={{ fontSize: 12, color: COLORS.primary, fontWeight: 700, textDecoration: 'none' }}>
                Create an account →
              </Link>
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <span
              onClick={() => { setType(isAuthority ? 'applicant' : 'authority'); setError(''); }}
              style={{ fontSize: 11, color: COLORS.textMuted, cursor: 'pointer' }}
            >
              {isAuthority ? '← Applicant Login' : 'Authority Officer? Login here →'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
