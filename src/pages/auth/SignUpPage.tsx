// Extracted 1:1 from App.jsx mock SignUpPage (L6275).
// 3-step form: Personal Info → Organisation Details → Review & Submit.
// Password field added to Step 2 (required for real auth, same visual style).
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { useAuthStore } from '@/store/authStore';
import { COLORS } from '@/utils/colors';
import { ROLE_DEFAULT_ROUTES } from '@/types/auth.types';

const STEP_LABELS = ['Personal Info', 'Organisation Details', 'Review & Submit'];

const STEPS_INFO = [
  { n: '01', title: 'Personal Information',    desc: 'Your name & mobile number' },
  { n: '02', title: 'Organisation Details',    desc: 'Email, organisation name & nature of business' },
  { n: '03', title: 'Review & Submit',         desc: 'Confirm details and register' },
];

const BOTTOM_STATS = [
  { num: '2 Mins',   label: 'Registration Time' },
  { num: 'Free',     label: 'No Registration Fee' },
  { num: 'Instant',  label: 'Account Access' },
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

interface FormData {
  name:             string;
  mobile:           string;
  email:            string;
  orgName:          string;
  natureOfBusiness: string;
  password:         string;
  confirmPassword:  string;
}

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({ name: '', mobile: '', email: '', orgName: '', natureOfBusiness: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit() {
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    try {
      await register({
        name:             form.name,
        mobile:           form.mobile,
        email:            form.email,
        orgName:          form.orgName,
        natureOfBusiness: form.natureOfBusiness,
        password:         form.password,
      });
      const user = useAuthStore.getState().user!;
      toast.success('Registration successful! Welcome to E-PAAS.');
      navigate(ROLE_DEFAULT_ROUTES[user.roleCode] ?? '/app/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Registration failed';
      setError(msg);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: COLORS.bg }}>
      <PublicNavbar
        rightLabel="Already registered? Sign in →"
        onRightClick={() => navigate('/login')}
      />

      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
        {/* ── Left info panel ───────────────────────────────────────── */}
        <div style={{ flex: 1, background: `linear-gradient(150deg, ${COLORS.primary} 0%, #102918 55%, #0a1e10 100%)`, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 56px', position: 'relative', overflow: 'hidden' }}>
          {[{ top: -80, right: -80, size: 300, opacity: 0.05 }, { top: -40, right: -40, size: 180, opacity: 0.07 }, { bottom: -100, left: -60, size: 360, opacity: 0.04 }].map((r, i) => (
            <div key={i} style={{ position: 'absolute', ...('top' in r ? { top: r.top } : { bottom: (r as {bottom:number}).bottom }), ...('right' in r ? { right: (r as {right:number}).right } : { left: (r as {left:number}).left }), width: r.size, height: r.size, borderRadius: '50%', border: `1px solid rgba(255,255,255,${r.opacity})` }} />
          ))}
          <div style={{ position: 'absolute', bottom: 40, right: 0, width: 200, height: 200, borderRadius: '50% 0 0 50%', background: 'var(--color-accent-14)' }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 380 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '5px 12px', marginBottom: 28 }}>
              <span style={{ fontSize: 14 }}>🇮🇳</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 600, letterSpacing: 0.5 }}>GOVERNMENT OF INDIA · OFFICIAL PORTAL</span>
            </div>

            <h1 style={{ fontSize: 30, fontWeight: 700, color: '#fff', fontFamily: "'Libre Baskerville', Georgia, serif", lineHeight: 1.25, marginBottom: 14 }}>
              New Applicant Registration
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 32 }}>
              Register as a Non-FBO applicant on FSSAI E-PAAS to submit and track approval applications for New Standard Foods, Claim Approvals, Ayurveda Aahara, rPET packaging, and more.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 36 }}>
              {STEPS_INFO.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: i < 2 ? 20 : 0, position: 'relative' }}>
                  {i < 2 && <div style={{ position: 'absolute', left: 15, top: 32, width: 2, height: 20, background: 'rgba(255,255,255,0.12)' }} />}
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: step > i + 1 ? COLORS.accent : step === i + 1 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)', border: `1px solid ${step > i + 1 ? COLORS.accent : 'rgba(255,255,255,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: step > i + 1 ? '#fff' : 'rgba(255,255,255,0.7)', flexShrink: 0 }}>
                    {step > i + 1 ? '✓' : s.n}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: step === i + 1 ? '#fff' : 'rgba(255,255,255,0.65)' }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}>
              {BOTTOM_STATS.map((s, i) => (
                <div key={i} style={{ flex: 1, paddingRight: 20, borderRight: i < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none', paddingLeft: i > 0 ? 20 : 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.accent, fontFamily: "'Libre Baskerville', Georgia, serif" }}>{s.num}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right form panel ──────────────────────────────────────── */}
        <div style={{ width: 500, background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 48px', borderLeft: `1px solid ${COLORS.border}`, overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Applicant Registration · FSSAI E-PAAS</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville', Georgia, serif", marginBottom: 6, lineHeight: 1.2 }}>Create Your Account</h2>
            <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.6 }}>
              {step === 1 ? 'Provide your personal details to get started.' : step === 2 ? 'Enter your email address and organisation information.' : 'Review your information and complete registration.'}
            </p>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
            {[1, 2, 3].map((n) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 3 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: step > n ? COLORS.success : step === n ? COLORS.primary : COLORS.border, color: step >= n ? '#fff' : COLORS.textMuted, flexShrink: 0 }}>
                    {step > n ? '✓' : n}
                  </div>
                  <span style={{ fontSize: 11, color: step === n ? COLORS.primary : step > n ? COLORS.success : COLORS.textMuted, fontWeight: step === n ? 600 : 400, whiteSpace: 'nowrap' }}>
                    {STEP_LABELS[n - 1]}
                  </span>
                </div>
                {n < 3 && <div style={{ flex: 1, height: 2, background: step > n ? COLORS.success : COLORS.border, margin: '0 8px' }} />}
              </div>
            ))}
          </div>

          {/* ── Step 1: Personal Info ── */}
          {step === 1 && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.text, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Applicant Name</label>
                <input value={form.name} onChange={set('name')} placeholder="Enter your full name" style={fieldStyle} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.text, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Mobile Number</label>
                <input value={form.mobile} onChange={set('mobile')} placeholder="+91 XXXXX XXXXX" style={fieldStyle} />
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>An OTP will be sent to this number for verification</div>
              </div>
              <button onClick={() => setStep(2)} style={{ width: '100%', padding: 13, background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.3 }}>
                Continue →
              </button>
            </>
          )}

          {/* ── Step 2: Organisation Details + Password ── */}
          {step === 2 && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.text, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Email ID</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" style={fieldStyle} />
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>A verification link will be sent to this email</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.text, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Name of Organisation</label>
                <input value={form.orgName} onChange={set('orgName')} placeholder="Enter your organisation name" style={fieldStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.text, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Nature of Business</label>
                <select value={form.natureOfBusiness} onChange={set('natureOfBusiness')} style={{ ...fieldStyle, appearance: 'auto', cursor: 'pointer' }}>
                  <option value="">Select nature of business</option>
                  <option>Manufacturer</option>
                  <option>Importer</option>
                  <option>Exporter</option>
                  <option>Trader / Distributor</option>
                  <option>Retailer</option>
                  <option>Research Institution</option>
                  <option>Other</option>
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.text, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Password</label>
                <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" style={fieldStyle} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.text, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Confirm Password</label>
                <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter password" style={fieldStyle} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: 13, background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setStep(3)} style={{ flex: 2, padding: 13, background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.3 }}>Continue →</button>
              </div>
            </>
          )}

          {/* ── Step 3: Review & Submit ── */}
          {step === 3 && (
            <>
              <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '16px 18px', marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Registration Summary</div>
                {([['Applicant Name', form.name], ['Mobile Number', form.mobile], ['Email ID', form.email], ['Name of Organisation', form.orgName], ['Nature of Business', form.natureOfBusiness]] as [string, string][]).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${COLORS.border}`, fontSize: 12 }}>
                    <span style={{ color: COLORS.textMuted, fontWeight: 500 }}>{k}</span>
                    <span style={{ color: COLORS.text, fontWeight: 600 }}>{v || '—'}</span>
                  </div>
                ))}
              </div>

              {error && (
                <div style={{ background: '#FDECEA', border: '1px solid #F5C6C6', borderLeft: '3px solid #C0392B', borderRadius: 6, padding: '10px 12px', fontSize: 12, color: '#C0392B', marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <div style={{ background: COLORS.primaryLight, border: '1px solid var(--color-primary-22)', borderLeft: `3px solid ${COLORS.primary}`, borderRadius: 6, padding: '10px 12px', fontSize: 11, color: COLORS.primary, marginBottom: 20 }}>
                🔒 By registering, you agree to the FSSAI E-PAAS Terms of Service and Privacy Policy. Your data is protected as per IT Act 2000.
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: 13, background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  style={{ flex: 2, padding: 13, background: COLORS.success, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', letterSpacing: 0.3, opacity: isLoading ? 0.7 : 1 }}
                >
                  {isLoading ? 'Registering…' : '✓ Complete Registration'}
                </button>
              </div>
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: COLORS.textMuted }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: COLORS.primary, fontWeight: 700, textDecoration: 'none' }}>Sign in here →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
