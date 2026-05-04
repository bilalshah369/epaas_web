import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { COLORS } from '@/utils/colors';

export default function DashboardPlaceholder() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '40px 48px', textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🏗️</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginBottom: 8, fontFamily: "'Libre Baskerville', Georgia, serif" }}>
          Dashboard Coming Soon
        </h1>
        <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.7, marginBottom: 24 }}>
          You're logged in as <strong style={{ color: COLORS.primary }}>{user?.username}</strong>
          {' '}({user?.roleName}). This dashboard will be built in Step 3.
        </p>
        <div style={{ background: COLORS.primaryLight, border: `1px solid var(--color-primary-22)`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: COLORS.primary, marginBottom: 24, textAlign: 'left' }}>
          Role: <strong>{user?.roleCode}</strong><br />
          Email: <strong>{user?.email}</strong>
        </div>
        <button
          onClick={handleLogout}
          style={{ padding: '10px 24px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
