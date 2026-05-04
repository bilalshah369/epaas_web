import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { COLORS } from '@/utils/colors';
import { ROLE_DEFAULT_ROUTES } from '@/types/auth.types';

export default function UnauthorizedPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  function goBack() {
    if (user) {
      navigate(ROLE_DEFAULT_ROUTES[user.roleCode] ?? '/login', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '40px 48px', textAlign: 'center', maxWidth: 440 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🚫</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginBottom: 8, fontFamily: "'Libre Baskerville', Georgia, serif" }}>
          Access Denied
        </h1>
        <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.7, marginBottom: 24 }}>
          You don't have permission to view this page. Please contact your administrator if you believe this is an error.
        </p>
        <button
          onClick={goBack}
          style={{ padding: '10px 24px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          {user ? 'Go to Dashboard' : 'Back to Login'}
        </button>
      </div>
    </div>
  );
}
