// Full landing page — mirrors DOCS/App.jsx LandingPage function.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PalettePicker from '@/components/ui/PalettePicker';
import { COLORS } from '@/utils/colors';
import { useAuthStore } from '@/store/authStore';
import { ROLE_DEFAULT_ROUTES } from '@/types/auth.types';

const fssaiLogo = 'https://package-tracking-files-prod.s3.eu-north-1.amazonaws.com/app_images/fssai-logo.png';

const NAV_LINKS = [
  { label: 'Home',                    id: 'lp-top'               },
  { label: 'About Us',               id: 'lp-why-epaas'         },
  { label: 'Application Categories', id: 'lp-application-types' },
  { label: 'User Manual',            id: 'lp-resources'         },
  { label: 'FAQs',                   id: 'lp-resources'         },
];

const LANDING_APP_TYPES = [
  { key: 'nsf',   code: 'NSF',      label: 'Non-Specified/Novel Food & Food Ingredients (NSF & FI)', desc: 'For approval of food products or ingredients covered under the Food Safety and Standards (Approval for Non-Specific Food and Food Ingredients) Regulation, 2017. Requires full dossier, safety and efficacy data and Expert Committee evaluation.',                                                                                                                                                                                  color: '#1565C0', lightColor: '#E3F2FD' },
  { key: 'ca',    code: 'CA',        label: 'Claim Approval (CA)',                                    desc: 'For approval of claims under the Food Safety and Standards (Advertising and Claims) Regulation, 2018. Requires scientific substantiation and evidence mapping.',                                                                                                                                                                                                                                                                  color: '#2E7D32', lightColor: '#E8F5E9' },
  { key: 'aa',    code: 'AA',        label: 'Ayurveda Aahara (AA)',                                   desc: 'For approval of Ayurveda Aahara as per the Food Safety and Standards (Ayurveda Aahara) Regulations, 2022.',                                                                                                                                                                                                                                                                                                                  color: '#6A1E55', lightColor: '#F3E5F5' },
  { key: 'other', code: 'Any Other', label: 'Any Other',                                              desc: 'For approval of FSMP, notification of esters/derivatives/salts of vitamins, salts/chelates of minerals, and esters/derivatives/isomers/salts of amino acids and approval of any other food, product, process, or system for which prior approval is required by the Food Authority under the provisions of the FSS Act, 2006, and regulations made thereunder, or as notified from time to time.',                         color: '#546E7A', lightColor: '#ECEFF1' },
  { key: 'rpet',  code: 'rPET',      label: 'Recycled PET Packaging (rPET)',                          desc: 'For authorization of recycle plastic manufacturers as per the Food Safety and Standards (Packaging) Regulation, 2018',                                                                                                                                                                                                                                                                                                          color: '#E65100', lightColor: '#FFF3E0' },
];

const PAGE_CONTENT: Record<string, { title: string; lastUpdated: string; sections: { heading: string; body: string }[] }> = {
  privacy: {
    title: 'Privacy Policy', lastUpdated: 'April 2026',
    sections: [
      { heading: '1. Information We Collect',    body: 'FSSAI E-PAAS collects personal information including your name, mobile number, email address, organisation details, and nature of business when you register on the portal. We also collect application data, uploaded documents, and usage logs for audit and compliance purposes.' },
      { heading: '2. How We Use Your Information', body: 'Your information is used solely for processing food product approval applications, communicating application status, verifying identity, generating reports, and complying with regulatory obligations under the Food Safety and Standards Act, 2006.' },
      { heading: '3. Data Security',            body: 'All data transmitted through FSSAI E-PAAS is encrypted using TLS 1.2 or higher. Sessions are monitored and access is role-based. The portal complies with the IT Act 2000 and the Information Technology (Reasonable Security Practices) Rules, 2011.' },
      { heading: '4. Data Retention',           body: 'Application records and associated documents are retained for a minimum of 7 years as required by FSSAI regulations. User account data is retained for the duration of the account and for 3 years after deactivation.' },
      { heading: '5. Third-Party Disclosure',   body: 'FSSAI does not sell, trade, or otherwise transfer your personally identifiable information to third parties. Information may be shared with other government authorities as required by law or for regulatory compliance.' },
      { heading: '6. Cookies',                  body: 'E-PAAS uses session cookies strictly necessary for authentication and portal functionality. No third-party tracking cookies are used. Disabling cookies may affect portal functionality.' },
      { heading: '7. Your Rights',              body: 'You have the right to access, correct, or request deletion of your personal data. To exercise these rights, contact the FSSAI helpdesk at helpdesk@fssai.gov.in or call 1800-112-100.' },
      { heading: '8. Contact',                  body: 'For privacy-related queries, write to: Data Protection Officer, FSSAI, FDA Bhawan, Kotla Road, New Delhi – 110002.' },
    ],
  },
  terms: {
    title: 'Terms of Use', lastUpdated: 'April 2026',
    sections: [
      { heading: '1. Acceptance of Terms',    body: 'By accessing or using the FSSAI E-PAAS portal, you agree to be bound by these Terms of Use, the Privacy Policy, and all applicable laws and regulations. If you do not agree, please discontinue use of this portal immediately.' },
      { heading: '2. Authorised Use',         body: 'E-PAAS is intended exclusively for submitting, tracking, and managing food product approval applications as per FSSAI regulations. Unauthorised access, misuse, or any attempt to disrupt portal services is prohibited and punishable under the IT Act 2000.' },
      { heading: '3. User Responsibilities', body: 'Users are responsible for maintaining the confidentiality of their login credentials. All actions performed using your credentials are your responsibility. You must provide accurate and truthful information in all applications and declarations.' },
      { heading: '4. Intellectual Property', body: 'All content, design, and software of E-PAAS are the property of FSSAI and the Government of India. No content may be reproduced, distributed, or used commercially without explicit written permission from FSSAI.' },
      { heading: '5. Disclaimer of Warranties', body: "E-PAAS is provided on an 'as is' basis. FSSAI makes no warranties, express or implied, regarding the accuracy, reliability, or availability of the portal. FSSAI shall not be liable for any losses arising from portal downtime or data errors." },
      { heading: '6. Application Accuracy',   body: 'Applicants are solely responsible for the accuracy and completeness of submitted applications. FSSAI reserves the right to reject or revoke approvals if fraudulent or incorrect information is found at any stage.' },
      { heading: '7. Governing Law',          body: 'These Terms are governed by the laws of India. Any disputes arising from the use of E-PAAS shall be subject to the exclusive jurisdiction of courts in New Delhi.' },
      { heading: '8. Amendments',             body: 'FSSAI reserves the right to amend these Terms at any time. Continued use of the portal after amendments constitutes acceptance of the revised Terms.' },
    ],
  },
  accessibility: {
    title: 'Accessibility Statement', lastUpdated: 'April 2026',
    sections: [
      { heading: 'Our Commitment',          body: 'FSSAI is committed to ensuring that E-PAAS is accessible to all users, including persons with disabilities, in accordance with the Guidelines for Indian Government Websites (GIGW) and the Rights of Persons with Disabilities Act, 2016.' },
      { heading: 'Conformance Status',      body: 'E-PAAS aims to conform to Level AA of the Web Content Accessibility Guidelines (WCAG) 2.1. We are continuously working to improve the accessibility of this portal.' },
      { heading: 'Accessibility Features',  body: 'The portal includes font size adjustment controls (A− / A / A+), sufficient colour contrast ratios throughout the interface, keyboard navigability for all interactive elements, ARIA labels on form inputs and buttons, and descriptive alt text for all images.' },
      { heading: 'Keyboard Navigation',     body: 'All features of E-PAAS can be accessed using a keyboard. Use the Tab key to navigate between elements, Enter or Space to activate buttons and links, and Escape to close dialogs and modals.' },
      { heading: 'Screen Reader Support',   body: 'E-PAAS has been tested with NVDA and JAWS screen readers. Semantic HTML, landmark regions, and live regions are used to improve the screen reader experience.' },
      { heading: 'Known Limitations',       body: 'Some complex data tables and PDF documents attached to applications may not be fully accessible. We are working to address these limitations. Accessible alternatives are available on request.' },
      { heading: 'Feedback & Assistance',   body: 'If you encounter accessibility barriers while using E-PAAS, please contact us at accessibility@fssai.gov.in or call our toll-free helpline at 1800-112-100 (Mon–Fri 09:00–18:00 IST). We aim to respond within 2 working days.' },
      { heading: 'Third-Party Content',     body: 'Some content linked from E-PAAS may be hosted on third-party platforms not under FSSAI control. We cannot guarantee the accessibility of such external content.' },
    ],
  },
};

function adjustFontSize(delta: number) {
  const cur = parseFloat(getComputedStyle(document.documentElement).fontSize);
  document.documentElement.style.fontSize = `${Math.min(20, Math.max(12, cur + delta))}px`;
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function PageModal({ modalKey, onClose }: { modalKey: string; onClose: () => void }) {
  const pg = PAGE_CONTENT[modalKey];
  if (!pg) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 400 }} />
      <div style={{ position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: 660, maxHeight: '78vh', background: '#fff', borderRadius: 12, zIndex: 401, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
        <div style={{ background: COLORS.primary, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{pg.title}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Last Updated: {pg.lastUpdated}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 22, cursor: 'pointer', lineHeight: 1, marginTop: -2 }}>×</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '20px 24px' }}>
          {pg.sections.map((s, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary, marginBottom: 6 }}>{s.heading}</div>
              <div style={{ fontSize: 12, color: '#333', lineHeight: 1.7 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const drwFieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 13,
  borderRadius: 7,
  border: `1.5px solid ${COLORS.border}`,
  background: COLORS.bg,
  outline: 'none',
  fontFamily: "'Noto Sans', 'Segoe UI', sans-serif",
  boxSizing: 'border-box',
};

type TrackResult = {
  referenceNumber: string;
  applicationType: string;
  stage: string;
  stageLabel: string;
  companyName: string;
  productName: string | null;
  submittedAt: string | null;
  lastUpdatedAt: string;
  journey: { submitted: boolean; scrutiny: boolean; ecReview: boolean; decided: boolean };
};

const STAGE_STATUS_COLOR: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  Approved:  { bg: '#E5F4EC', border: '#A5D6A7', text: '#1A6B3C', icon: '✅' },
  Rejected:  { bg: '#FDECEA', border: '#F5C6C6', text: '#C0392B', icon: '❌' },
  Withdrawn: { bg: '#FEF3DC', border: '#F9DCA0', text: '#C67C12', icon: '⚠️' },
  Closed:    { bg: '#F4F4F4', border: '#E0E0E0', text: '#666',    icon: '🔒' },
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [modal, setModal] = useState<string | null>(null);
  const [trackerInput, setTrackerInput]   = useState('');
  const [trackResult, setTrackResult]     = useState<TrackResult | null>(null);
  const [trackLoading, setTrackLoading]   = useState(false);
  const [trackError, setTrackError]       = useState<string | null>(null);
  const [portalStats, setPortalStats]     = useState({ approvals: 0, inProgress: 0, withEC: 0, onTimePct: 0 });
  const [circulars, setCirculars]         = useState<Array<{ id: string; date: string; refNumber: string; title: string; tag: string }>>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; date: string; title: string; type: string; body?: string | null }>>([]);

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL ?? '/api';
    fetch(`${base}/public/stats`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setPortalStats(d))
      .catch(() => {});
    fetch(`${base}/public/circulars`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d?.circulars && setCirculars(d.circulars))
      .catch(() => {});
    fetch(`${base}/public/notifications`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d?.notifications && setNotifications(d.notifications))
      .catch(() => {});
  }, []);

  // Login drawer state
  const [drawer, setDrawer]       = useState<{ type: 'applicant' | 'authority' | 'signup' } | null>(null);
  const [drwId, setDrwId]         = useState('');
  const [drwPw, setDrwPw]         = useState('');
  const [drwShowPw, setDrwShowPw] = useState(false);
  const [drwError, setDrwError]   = useState('');
  // Signup drawer state
  const [sgStep, setSgStep] = useState(1);
  const [sgForm, setSgForm] = useState({ name: '', mobile: '', email: '', orgName: '', natureOfBusiness: '', password: '', confirmPassword: '' });
  const [sgError, setSgError] = useState('');
  const { loginApplicant, loginAuthority, isLoading, register } = useAuthStore();

  const [vw, setVw] = useState(() => window.innerWidth);
  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    const onScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll);
    return () => { window.removeEventListener('resize', onResize); window.removeEventListener('scroll', onScroll); };
  }, []);

  async function doTrack() {
    const ref = trackerInput.trim();
    if (!ref) return;
    setTrackLoading(true);
    setTrackError(null);
    setTrackResult(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/public/track?ref=${encodeURIComponent(ref)}`);
      if (res.status === 404) { setTrackError('Application not found. Please check the reference number.'); return; }
      if (!res.ok) { setTrackError('Lookup failed. Please try again.'); return; }
      const data = await res.json();
      setTrackResult(data);
    } catch {
      setTrackError('Unable to connect. Please try again later.');
    } finally {
      setTrackLoading(false);
    }
  }

  function resetTracker() {
    setTrackResult(null);
    setTrackError(null);
  }

  function openDrawer(type: 'applicant' | 'authority') {
    setDrawer({ type });
    setDrwId(''); setDrwPw(''); setDrwShowPw(false); setDrwError('');
  }

  function closeDrawer() {
    setDrawer(null);
    setDrwError('');
  }

  function openSignup() {
    setSgStep(1);
    setSgForm({ name: '', mobile: '', email: '', orgName: '', natureOfBusiness: '', password: '', confirmPassword: '' });
    setSgError('');
    setDrawer({ type: 'signup' });
  }

  async function handleSignup() {
    if (sgForm.password !== sgForm.confirmPassword) { setSgError('Passwords do not match'); return; }
    setSgError('');
    try {
      await register({ name: sgForm.name, mobile: sgForm.mobile, email: sgForm.email, orgName: sgForm.orgName, natureOfBusiness: sgForm.natureOfBusiness, password: sgForm.password });
      const user = useAuthStore.getState().user!;
      toast.success('Registration successful! Welcome to E-PAAS.');
      navigate(ROLE_DEFAULT_ROUTES[user.roleCode] ?? '/app/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Registration failed';
      setSgError(msg);
    }
  }

  const setSg = (k: keyof typeof sgForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setSgForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleDrawerLogin(e: React.FormEvent) {
    e.preventDefault();
    setDrwError('');
    try {
      if (drawer!.type === 'authority') {
        await loginAuthority({ username: drwId, password: drwPw });
      } else {
        await loginApplicant({ identifier: drwId, password: drwPw });
      }
      const user = useAuthStore.getState().user!;
      toast.success(`Welcome back, ${user.username}!`);
      navigate(ROLE_DEFAULT_ROUTES[user.roleCode] ?? '/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Login failed';
      setDrwError(msg);
    }
  }

  return (
    <div id="lp-top" style={{ minHeight: '100vh', fontFamily: "'Noto Sans','Segoe UI',sans-serif", background: '#fff', overflowX: 'hidden' }}>

      {/* ── Sticky header wrapper ───────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', position: 'sticky', top: 0, zIndex: 100 }}>

        {/* Utility bar — hidden, uncomment to restore
        <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '4px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg" alt="India Flag" style={{ height: 20, width: 30, objectFit: 'cover', borderRadius: 1 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#1A3D2B', letterSpacing: 0.2 }}>Ministry of Health &amp; Family Welfare, Government of India</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <button onClick={() => scrollTo('lp-helpdesk')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#1A3D2B', fontWeight: 600, padding: '2px 6px' }}>Helpdesk</button>
            <div style={{ width: 1, height: 16, background: '#ddd', margin: '0 3px' }} />
            <span style={{ fontSize: 10, color: '#666' }}>Font:</span>
            {(['A−', 'A', 'A+'] as const).map((t, i) => (
              <button key={t} onClick={() => i !== 1 && adjustFontSize(i === 0 ? -1 : 1)}
                style={{ background: '#f4f4f4', border: '1px solid #ddd', borderRadius: 3, cursor: 'pointer', fontSize: [10, 12, 14][i], fontWeight: 600, color: '#1A3D2B', width: 22, height: 22, padding: 0, lineHeight: 1 }}>
                {t}
              </button>
            ))}
            <div style={{ width: 1, height: 16, background: '#ddd', margin: '0 3px' }} />
            <span style={{ fontSize: 10, color: '#888' }}>Last Updated: Apr 2026</span>
            <div style={{ width: 1, height: 16, background: '#ddd', margin: '0 3px' }} />
            <PalettePicker />
            <div style={{ width: 1, height: 16, background: '#ddd', margin: '0 3px' }} />
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#1A3D2B', fontWeight: 500, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 3 }}>
              <span>🗺️</span><span>Sitemap</span>
            </button>
          </div>
        </div>
        */}

        {/* Logo + nav bar */}
        <div style={{ display: 'flex', alignItems: 'stretch', background: '#fff' }}>
          <div onClick={() => scrollTo('lp-top')} style={{ background: '#fff', width: vw >= 768 ? 260 : 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px', cursor: 'pointer' }}>
            <img src={fssaiLogo} alt="FSSAI" style={{ height: vw >= 768 ? 92 : 56, width: 'auto', objectFit: 'contain' }} />
          </div>
          <div style={{ background: '#fff', padding: vw >= 768 ? '0 16px' : '0 8px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <div style={{ display: vw >= 768 ? 'flex' : 'none', alignItems: 'center', gap: 4 }}>
              {NAV_LINKS.map(({ label, id }) => (
                <span key={label} onClick={() => scrollTo(id)}
                  style={{ fontSize: 15, color: '#111', cursor: 'pointer', padding: '6px 10px' }}>
                  {label}
                </span>
              ))}
              <div style={{ width: 1, height: 16, background: 'rgba(0,0,0,0.12)', margin: '0 6px' }} />
            </div>
            <button onClick={() => openDrawer('applicant')}
              style={{ background: '#fff', color: '#111', border: '1px solid rgba(0,0,0,0.14)', borderRadius: 5, padding: vw >= 540 ? '6px 14px' : '5px 8px', fontSize: vw >= 540 ? 15 : 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {vw >= 540 ? 'Applicant Login' : 'Applicant'}
            </button>
            <button onClick={() => openDrawer('authority')}
              style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 5, padding: vw >= 540 ? '6px 14px' : '5px 8px', fontSize: vw >= 540 ? 15 : 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {vw >= 540 ? 'Authority Login' : 'Authority'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Hero section ────────────────────────────────────────────────── */}
      <div style={{ padding: vw >= 960 ? '56px 48px 64px' : vw >= 540 ? '40px 24px 48px' : '28px 16px 36px', background: `linear-gradient(135deg, ${COLORS.primary} 0%, #0f2d1a 55%, #0a1e10 100%)`, position: 'relative', overflow: 'hidden' }}>
        {/* Decorative rings */}
        <div style={{ position: 'absolute', top: -120, right: 380, width: 420, height: 420, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, right: 320, width: 280, height: 280, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -60, width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        {/* Diagonal stripe */}
        <div style={{ position: 'absolute', top: 0, right: 370, bottom: 0, width: 1, background: 'rgba(255,255,255,0.06)', transform: 'skewX(-8deg)', pointerEvents: 'none' }} />

        <div style={{ display: 'grid', gridTemplateColumns: vw >= 900 ? '1fr 340px' : '1fr', gap: vw >= 900 ? 48 : 24, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          {/* Left: text */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.accent }} />
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.90)', fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 20, letterSpacing: 0.4 }}>
                Electronic Product &amp; Claim Approval Application System
              </div>
            </div>
            <h1 style={{ fontSize: vw >= 960 ? 44 : vw >= 540 ? 34 : 26, fontWeight: 800, color: COLORS.accent, lineHeight: 1.2, margin: '0 0 20px', fontFamily: "'Libre Baskerville',Georgia,serif", letterSpacing: -0.5 }}>
              Food Product Approval & <br /> Application Management System
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
              <div style={{ width: 3, height: 18, background: COLORS.accent, borderRadius: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.70)', margin: 0, fontWeight: 500, letterSpacing: 0.2 }}>
                Submit. Track. Comply—All in One Place.
              </p>
            </div>
          </div>

          {/* Right: Tracker card */}
          <div style={{ background: '#fff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.35)', minWidth: 300 }}>
            {/* Card header */}
            <div style={{ background: COLORS.primary, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>FSSAI E-PAAS · Application Tracker</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                  {trackResult ? trackResult.referenceNumber : 'Track your application status'}
                </div>
              </div>
            </div>

            {trackResult ? (() => {
              const { journey, stage } = trackResult;
              const statusColors = STAGE_STATUS_COLOR[stage] ?? { bg: COLORS.successLight, border: '#A5D6A7', text: COLORS.success, icon: '🔄' };
              const steps = [
                { label: 'Submitted', done: journey.submitted },
                { label: 'Scrutiny',  done: journey.scrutiny  },
                { label: 'EC Review', done: journey.ecReview  },
                { label: 'Decided',   done: journey.decided   },
              ];
              return (
                <>
                  {/* Status badge */}
                  <div style={{ padding: '10px 18px', background: statusColors.bg, borderBottom: `1px solid ${statusColors.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{statusColors.icon}</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: statusColors.text }}>{trackResult.stageLabel}</div>
                      <div style={{ fontSize: 10, color: COLORS.textMuted }}>
                        {trackResult.productName ? `${trackResult.productName} · ` : ''}
                        {trackResult.companyName}
                        {trackResult.submittedAt ? ` · Submitted ${fmtDate(trackResult.submittedAt)}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Application Journey timeline */}
                  <div style={{ padding: '12px 18px', borderBottom: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Application Journey</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                      {steps.map((s, i, arr) => (
                        <div key={s.label} style={{ display: 'flex', alignItems: 'center', flex: i < arr.length - 1 ? 1 : 'none' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: s.done ? COLORS.success : COLORS.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                              {s.done ? '✓' : i + 1}
                            </div>
                            <div style={{ fontSize: 9, color: s.done ? COLORS.success : COLORS.textMuted, fontWeight: s.done ? 600 : 400, whiteSpace: 'nowrap' }}>
                              {s.label}
                            </div>
                          </div>
                          {i < arr.length - 1 && (
                            <div style={{ flex: 1, height: 2, background: s.done ? COLORS.success : COLORS.border, margin: '0 4px', marginBottom: 14 }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Portal stats */}
                  <div style={{ padding: '12px 18px', borderBottom: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Portal Statistics (2026)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                      {[
                        { n: portalStats.approvals.toLocaleString('en-IN'), l: 'Approvals' },
                        { n: portalStats.inProgress.toLocaleString('en-IN'), l: 'In Progress' },
                        { n: portalStats.withEC.toLocaleString('en-IN'), l: 'With EC' },
                        { n: `${portalStats.onTimePct}%`, l: 'On-Time' },
                      ].map(({ n, l }) => (
                        <div key={l} style={{ textAlign: 'center', background: COLORS.bg, borderRadius: 6, padding: '6px 4px' }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.primary }}>{n}</div>
                          <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 2 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Search again */}
                  <div style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        value={trackerInput}
                        onChange={(e) => setTrackerInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && doTrack()}
                        placeholder="Enter Ref No. / Approval No."
                        style={{ flex: 1, border: `1.5px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 11, outline: 'none' }}
                      />
                      <button onClick={resetTracker} style={{ background: COLORS.textMuted, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Reset</button>
                    </div>
                  </div>
                </>
              );
            })() : (
              /* Initial / error state */
              <div style={{ padding: '20px 18px' }}>
                <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.7, marginBottom: 16 }}>
                  Enter your application reference number or approval number to instantly check your E-PAAS application status.
                </div>
                {/* Portal stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 18 }}>
                  {[
                    { n: portalStats.approvals.toLocaleString('en-IN'), l: 'Approvals' },
                    { n: portalStats.inProgress.toLocaleString('en-IN'), l: 'In Progress' },
                    { n: portalStats.withEC.toLocaleString('en-IN'), l: 'With EC' },
                    { n: `${portalStats.onTimePct}%`, l: 'On-Time' },
                  ].map(({ n, l }) => (
                    <div key={l} style={{ textAlign: 'center', background: COLORS.bg, borderRadius: 6, padding: '6px 4px' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.primary }}>{n}</div>
                      <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 2 }}>{l}</div>
                    </div>
                  ))}
                </div>
                {trackError && (
                  <div style={{ background: COLORS.dangerLight, border: `1px solid #F5C6C6`, borderLeft: `3px solid ${COLORS.danger}`, borderRadius: 6, padding: '8px 10px', fontSize: 11, color: COLORS.danger, marginBottom: 12 }}>
                    {trackError}
                  </div>
                )}
                <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Track Your Application</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={trackerInput}
                    onChange={(e) => setTrackerInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && doTrack()}
                    placeholder="Enter Ref No. / Approval No."
                    style={{ flex: 1, border: `1.5px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 11, outline: 'none' }}
                  />
                  <button
                    onClick={doTrack}
                    disabled={trackLoading || !trackerInput.trim()}
                    style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: trackLoading ? 'wait' : 'pointer', opacity: trackLoading ? 0.7 : 1 }}>
                    {trackLoading ? '…' : 'Track'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Application Categories ──────────────────────────────────────── */}
      <style>{`
        .lp-cat-section { padding: 72px 0; }
        .lp-cat-inner   { max-width: 1200px; margin: 0 auto; padding: 0 48px; }
        .lp-cat-grid    { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .lp-cat-card    { background: #fff; border-radius: 16px; overflow: hidden;
                          box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
                          display: flex; flex-direction: column; cursor: pointer;
                          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        @media (max-width: 1100px) {
          .lp-cat-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 900px) {
          .lp-cat-inner { padding: 0 24px; }
          .lp-cat-grid  { grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .lp-cat-section { padding: 48px 0; }
        }
        @media (max-width: 540px) {
          .lp-cat-inner { padding: 0 16px; }
          .lp-cat-grid  { grid-template-columns: 1fr; gap: 12px; }
          .lp-cat-section { padding: 32px 0; }
        }
      `}</style>

      <div id="lp-application-types" className="lp-cat-section" style={{ background: COLORS.bg, borderTop: `1px solid ${COLORS.border}` }}>
        <div className="lp-cat-inner">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-block', background: COLORS.primaryLight, color: COLORS.primary, fontSize: 16, fontWeight: 700, padding: '4px 12px', borderRadius: 4, marginBottom: 10, letterSpacing: 0.5 }}>
              AVAILABLE CATEGORIES
            </div>
            <p style={{ fontSize: 14, color: COLORS.textMuted, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              Select one of the available categories below to proceed with the relevant approval workflow.
            </p>
          </div>

          <div className="lp-cat-grid">
            {LANDING_APP_TYPES.map((t) => (
              <div
                key={t.key}
                className="lp-cat-card"
                onClick={() => navigate('/login')}
                style={{ border: `1px solid ${COLORS.border}` }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${t.color}28, 0 2px 8px rgba(0,0,0,0.08)`; e.currentTarget.style.borderColor = t.color + '60'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = COLORS.border; }}
              >
                {/* Coloured header band */}
                <div style={{ background: t.color, padding: '18px 16px 16px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', position: 'relative' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#fff', background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.40)', padding: '3px 10px', borderRadius: 20, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                      {t.code}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '18px 16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", lineHeight: 1.4, marginBottom: 10 }}>
                    {t.label}
                  </div>
                  <p style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.75, flex: 1, margin: 0 }}>
                    {t.desc}
                  </p>
                  {/* CTA */}
                  <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: t.lightColor, borderRadius: 8, border: `1px solid ${t.color}25` }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.color }}>Start Application</span>
                    <span style={{ fontSize: 14, color: t.color, fontWeight: 700 }}>→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <div id="lp-for-applicants" style={{ background: COLORS.bg, padding: vw >= 640 ? '56px 0' : '36px 0', borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: vw >= 640 ? '0 32px' : '0 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-block', background: COLORS.primaryLight, color: COLORS.primary, fontSize: 16, fontWeight: 700, padding: '4px 12px', borderRadius: 4, marginBottom: 10, letterSpacing: 0.5 }}>
              PROCESS FLOW
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", marginBottom: 8 }}>
              How E-PAAS Works
            </h2>
            <p style={{ fontSize: 14, color: COLORS.textMuted, maxWidth: 540, margin: '0 auto' }}>
              A fully digital end-to-end approval workflow
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: vw >= 1024 ? 'repeat(6,1fr)' : vw >= 640 ? 'repeat(3,1fr)' : 'repeat(2,1fr)', gap: vw >= 640 ? 12 : 10, position: 'relative' }}>
            {/* Connecting line */}
            <div style={{ display: vw >= 1024 ? 'block' : 'none', position: 'absolute', top: 44, left: '8.33%', right: '8.33%', height: 2, background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.accent})`, zIndex: 0 }} />
            {[
              { n: '01', icon: '🔐', title: 'Login & Register',       desc: 'Create your E-PAAS account',                                                        accent: COLORS.primary },
              { n: '02', icon: '📋', title: 'Select Application Type', desc: 'Choose the appropriate approval category for your product.',                         accent: COLORS.primary },
              { n: '03', icon: '📁', title: 'Upload Documents',        desc: 'Submit your product dossier, safety data, and certificates',                        accent: COLORS.primary },
              { n: '04', icon: '💳', title: 'Pay Fee',                 desc: 'Secure Online Payment',                                                             accent: COLORS.primary },
              { n: '05', icon: '🔍', title: 'Scrutiny & Review',       desc: 'Get your application evaluated & reviewed',                                         accent: COLORS.primary },
              { n: '06', icon: '✅', title: 'Receive Decission',        desc: 'Download your approval certificate from the portal.',                               accent: COLORS.accent  },
            ].map((s, i) => (
              <div
                key={i}
                style={{ textAlign: 'center', padding: '16px 10px 18px', position: 'relative', zIndex: 1, borderRadius: 12, background: 'transparent', transition: 'background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease', cursor: 'default' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; const c = e.currentTarget.querySelector<HTMLElement>('.step-circle'); if (c) { c.style.transform = 'scale(1.12)'; c.style.boxShadow = `0 6px 18px ${s.accent}55`; } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; const c = e.currentTarget.querySelector<HTMLElement>('.step-circle'); if (c) { c.style.transform = 'scale(1)'; c.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)'; } }}
              >
                <div className="step-circle" style={{ width: 56, height: 56, borderRadius: '50%', background: s.accent, border: `3px solid ${COLORS.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 5, textTransform: 'uppercase' }}>Step {s.n}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 8, lineHeight: 1.35 }}>{s.title}</div>
                <p style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Circulars & Notifications ───────────────────────────────────── */}
      <div style={{ background: COLORS.white, padding: vw >= 640 ? '56px 0' : '36px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: vw >= 768 ? '0 32px' : '0 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: vw >= 768 ? '1fr 1fr' : '1fr', gap: vw >= 768 ? 40 : 24 }}>

            {/* Latest Circulars */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 4 }}>OFFICIAL ORDERS</div>
                  <h3 style={{ fontSize: 19, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", margin: 0 }}>Latest Circulars</h3>
                </div>
                <span style={{ fontSize: 11, color: COLORS.primary, cursor: 'pointer', fontWeight: 600 }}>View All →</span>
              </div>
              {circulars.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 12 }}>No circulars available.</div>
              ) : circulars.map((c, i) => (
                <div key={c.id ?? i} style={{ padding: '12px 0', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
                  <div style={{ minWidth: 46, background: COLORS.primaryLight, borderRadius: 6, padding: '5px 6px', textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.primary, lineHeight: 1 }}>{c.date.split(' ')[0]}</div>
                    <div style={{ fontSize: 9, color: COLORS.primary, lineHeight: 1.3 }}>{c.date.split(' ').slice(1).join(' ')}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 9, color: COLORS.textMuted, letterSpacing: 0.3 }}>{c.refNumber}</span>
                      <span style={{ fontSize: 9, background: COLORS.primaryLight, color: COLORS.primary, padding: '1px 6px', borderRadius: 3, fontWeight: 700 }}>{c.tag}</span>
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.45, fontWeight: 500 }}>{c.title}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Public Notifications */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#B45309', letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 4 }}>PORTAL UPDATES</div>
                  <h3 style={{ fontSize: 19, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", margin: 0 }}>Public Notifications</h3>
                </div>
                <span style={{ fontSize: 11, color: COLORS.primary, cursor: 'pointer', fontWeight: 600 }}>View All →</span>
              </div>
              {notifications.filter(n => n.type === 'Alert').slice(0, 1).map((n) => (
                <div key={n.id} style={{ background: '#FFF8E7', border: '1px solid #E9C46A', borderLeft: `4px solid ${COLORS.accent}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', marginBottom: 3 }}>⚠ {n.title}</div>
                  {n.body && <div style={{ fontSize: 11, color: '#78350F', lineHeight: 1.55 }}>{n.body}</div>}
                </div>
              ))}
              {notifications.filter(n => n.type !== 'Alert').length === 0 && notifications.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 12 }}>No notifications available.</div>
              ) : notifications.filter(n => n.type !== 'Alert').map((n, i) => (
                <div key={n.id ?? i} style={{ padding: '12px 0', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.accent, marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, lineHeight: 1.45, marginBottom: 3 }}>{n.title}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: COLORS.textMuted }}>{n.date}</span>
                      <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, fontWeight: 600, border: `1px solid ${COLORS.border}`, color: n.type === 'Approval' ? COLORS.success : COLORS.textMuted, background: n.type === 'Approval' ? COLORS.successLight : COLORS.bg }}>
                        {n.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Key Features (Why E-PAAS) ───────────────────────────────────── */}
      <div id="lp-why-epaas" style={{ background: COLORS.primary, padding: vw >= 640 ? '56px 0' : '36px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: vw >= 640 ? '0 32px' : '0 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: 700, padding: '4px 12px', borderRadius: 4, marginBottom: 10, letterSpacing: 0.5 }}>
              WHY E-PAAS
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Libre Baskerville',Georgia,serif", marginBottom: 8, margin: 0 }}>
              A Modern, Transparent Approval System
            </h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
            {[
              { icon: '📄', title: 'Fully Paperless',         desc: 'All submissions, scrutiny, and approvals handled digitally — no physical files required.'              },
              { icon: '📡', title: 'Real-time Tracking',      desc: 'View live application status at every stage of the multi-level review workflow.'                      },
              { icon: '🔍', title: 'Transparent Process',     desc: 'Complete audit trail across all review stages for full visibility and accountability.'                 },
              { icon: '💬', title: 'Query Management',        desc: 'Officers raise clarification queries directly to applicants through the portal.'                       },
              { icon: '🔐', title: 'Secure & Compliant',      desc: 'Government-grade security, role-based access control, and digital signature support.'                 },
            ].map((f) => (
              <div key={f.title} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '20px 16px', flex: vw >= 900 ? '0 0 calc(25% - 12px)' : vw >= 540 ? '0 0 calc(50% - 8px)' : '0 0 100%' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 12 }}>
                  {f.icon}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{f.title}</div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.58)', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Links & Resources ─────────────────────────────────────── */}
      <div id="lp-resources" style={{ background: COLORS.bg, padding: vw >= 640 ? '48px 0' : '32px 0', borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: vw >= 768 ? '0 32px' : '0 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", margin: 0 }}>
              Quick Links &amp; Resources
            </h2>
            <p style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 6 }}>
              All the documents and guides you need to prepare and submit a successful application.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: vw >= 768 ? 'repeat(4,1fr)' : 'repeat(2,1fr)', gap: 12 }}>
            {[
              { icon: '📘', title: 'Applicant User Manual',   sub: 'PDF · v2.3 · Apr 2026'      },
              { icon: '📋', title: 'Application Categories',  sub: 'NSF / CA / AA / rPET'        },
              { icon: '❓', title: 'FAQs',                   sub: '40 Q&As covered'             },
              { icon: '📞', title: 'Contact Helpdesk',        sub: 'Mon–Fri 09:00–18:00 IST'    },
            ].map((q) => (
              <div key={q.title} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '18px 14px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>{q.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, lineHeight: 1.4, marginBottom: 4 }}>{q.title}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>{q.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div id="lp-helpdesk" style={{ background: '#000', borderTop: `3px solid ${COLORS.accent}`, padding: vw >= 640 ? '48px 0 0' : '32px 0 0' }}>
        <div style={{ padding: vw >= 900 ? '0 48px' : vw >= 540 ? '0 24px' : '0 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: vw >= 900 ? '2fr 1fr 1fr 1fr' : vw >= 540 ? '1fr 1fr' : '1fr', gap: vw >= 900 ? 32 : 20, marginBottom: 40 }}>

            {/* Col 1: FSSAI info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <img
  src={fssaiLogo}
  alt="FSSAI"
  style={{
    height: 64,
    width: 'auto',
    objectFit: 'contain',
    filter: 'brightness(0) invert(1)'
  }}
/>
                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.15)' }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>FSSAI E-PAAS</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>ELECTRONIC PRODUCT APPROVAL SYSTEM</div>
                </div>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.85, marginBottom: 16 }}>
                The Food Safety and Standards Authority of India (FSSAI) is an autonomous body under the Ministry of Health &amp; Family Welfare, Government of India. E-PAAS is the official digital platform for prior product approval applications.
              </p>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 2.1 }}>
                <div>📍 FDA Bhawan, Kotla Road, New Delhi — 110002</div>
                <div>📞 +91-11-23236975 &nbsp;|&nbsp; ✉ fssai.helpdesk@fssai.gov.in</div>
                <div>🌐 www.fssai.gov.in</div>
              </div>
            </div>

            {/* Col 2: Important Links */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Important Links</div>
              {[
                { label: 'Food Safety And Standards Authority Of India', href: 'https://www.fssai.gov.in/' },
                { label: 'Food Safety Compliance System',                href: 'https://foscos.fssai.gov.in/' },
                { label: 'Food Import Clearance System',                 href: 'https://fics.fssai.gov.in/' },
              ].map(({ label, href }) => (
                <div key={label} onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
                  style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: COLORS.accent, fontSize: 10 }}>›</span> {label}
                </div>
              ))}
            </div>

            {/* Col 3: Additional Information */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Additional Information</div>
              {[
                { label: 'User Manual',        href: null },
                { label: 'Application Forms',  href: null },
                { label: 'Fee Schedule',       href: null },
                { label: 'FAQs',               href: null },
                { label: 'Grievance Portal',   href: 'https://foscos.fssai.gov.in/consumergrievance/' },
              ].map(({ label, href }) => (
                href
                  ? <a key={label} href={href} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                      <span style={{ color: COLORS.accent, fontSize: 10 }}>›</span> {label}
                    </a>
                  : <div key={label} style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: COLORS.accent, fontSize: 10 }}>›</span> {label}
                    </div>
              ))}
            </div>

            {/* Col 4: Connect With Us */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Connect With Us</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                {['𝕏', 'f', '▶', 'in'].map((s) => (
                  <div key={s} style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                    {s}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.9 }}>
                <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Helpdesk Hours</div>
                <div>Mon–Fri: 09:00–18:00 IST</div>
                <div>Sat: 09:00–13:00 IST</div>
                <div style={{ marginTop: 10, color: COLORS.accent, fontWeight: 700, fontSize: 13 }}>1800-112-100</div>
                <div style={{ fontSize: 10 }}>Toll-free helpline</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: vw >= 540 ? '14px 32px' : '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: vw >= 540 ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,1)' }}>
              © 2026 Food Safety and Standards Authority of India · Ministry of Health &amp; Family Welfare, Government of India
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              {[
                { label: 'Privacy Policy',  key: 'privacy'       },
                { label: 'Terms of Use',    key: 'terms'         },
                { label: 'Accessibility',   key: 'accessibility' },
                { label: 'Sitemap',         key: null            },
              ].map(({ label, key }) => (
                <span key={label} onClick={() => key && setModal(key)}
                  style={{ fontSize: 10, color: 'rgba(255,255,255,1)', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,1)')}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Login Drawer ────────────────────────────────────────────────── */}
      {drawer && (
        <>
          {/* Overlay */}
          <div
            onClick={closeDrawer}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 300 }}
          />
          {/* Drawer panel */}
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: vw < 480 ? '100%' : 400, background: '#fff', zIndex: 301, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.25)', overflowY: 'auto' }}>
            {/* Drawer header */}
            <div style={{ background: COLORS.primary, padding: vw < 480 ? '16px 16px 14px' : '20px 24px 18px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                    {drawer.type === 'signup' ? 'New Registration' : drawer.type === 'authority' ? 'Authority Access' : 'Applicant Access'} · FSSAI E-PAAS
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: "'Libre Baskerville',Georgia,serif" }}>
                    {drawer.type === 'signup' ? 'Create Your Account' : drawer.type === 'authority' ? 'Authority Login' : 'Applicant Login'}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
                    {drawer.type === 'signup'
                      ? 'Register as a Non-FBO applicant on FSSAI E-PAAS.'
                      : drawer.type === 'authority'
                      ? 'Enter your official FSSAI credentials.'
                      : 'Enter your credentials to manage your applications.'}
                  </div>
                </div>
                <button
                  onClick={closeDrawer}
                  style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: '50%', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }}>
                  ×
                </button>
              </div>
            </div>

            {/* Form body */}
            <div style={{ padding: vw < 480 ? '20px 16px 16px' : '24px 24px 20px', flex: 1 }}>

              {/* ── Signup form ── */}
              {drawer.type === 'signup' && (
                <>
                  {/* Step indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22 }}>
                    {[1, 2, 3].map((n) => (
                      <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 3 ? 1 : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: sgStep > n ? COLORS.success : sgStep === n ? COLORS.primary : COLORS.border, color: sgStep >= n ? '#fff' : COLORS.textMuted, flexShrink: 0 }}>
                            {sgStep > n ? '✓' : n}
                          </div>
                          <span style={{ fontSize: 10, color: sgStep === n ? COLORS.primary : sgStep > n ? COLORS.success : COLORS.textMuted, fontWeight: sgStep === n ? 600 : 400, whiteSpace: 'nowrap' }}>
                            {['Personal Info', 'Org Details', 'Review'][n - 1]}
                          </span>
                        </div>
                        {n < 3 && <div style={{ flex: 1, height: 2, background: sgStep > n ? COLORS.success : COLORS.border, margin: '0 6px' }} />}
                      </div>
                    ))}
                  </div>

                  {/* Step 1 */}
                  {sgStep === 1 && (
                    <>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.text, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>Applicant Name</label>
                        <input value={sgForm.name} onChange={setSg('name')} placeholder="Enter your full name" style={drwFieldStyle} autoFocus />
                      </div>
                      <div style={{ marginBottom: 22 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.text, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>Mobile Number</label>
                        <input value={sgForm.mobile} onChange={setSg('mobile')} placeholder="+91 XXXXX XXXXX" style={drwFieldStyle} />
                        <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>An OTP will be sent to this number for verification</div>
                      </div>
                      <button onClick={() => setSgStep(2)} style={{ width: '100%', padding: 12, background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.3, marginBottom: 14 }}>
                        Continue →
                      </button>
                    </>
                  )}

                  {/* Step 2 */}
                  {sgStep === 2 && (
                    <>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.text, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>Email ID</label>
                        <input type="email" value={sgForm.email} onChange={setSg('email')} placeholder="your@email.com" style={drwFieldStyle} autoFocus />
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.text, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>Name of Organisation</label>
                        <input value={sgForm.orgName} onChange={setSg('orgName')} placeholder="Enter your organisation name" style={drwFieldStyle} />
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.text, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>Nature of Business</label>
                        <select value={sgForm.natureOfBusiness} onChange={setSg('natureOfBusiness')} style={{ ...drwFieldStyle, appearance: 'auto', cursor: 'pointer' }}>
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
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.text, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>Password</label>
                        <input type="password" value={sgForm.password} onChange={setSg('password')} placeholder="Min. 8 characters" style={drwFieldStyle} />
                      </div>
                      <div style={{ marginBottom: 18 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.text, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>Confirm Password</label>
                        <input type="password" value={sgForm.confirmPassword} onChange={setSg('confirmPassword')} placeholder="Re-enter password" style={drwFieldStyle} />
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                        <button onClick={() => setSgStep(1)} style={{ flex: 1, padding: 11, background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
                        <button onClick={() => setSgStep(3)} style={{ flex: 2, padding: 11, background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.3 }}>Continue →</button>
                      </div>
                    </>
                  )}

                  {/* Step 3 */}
                  {sgStep === 3 && (
                    <>
                      <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Registration Summary</div>
                        {([['Applicant Name', sgForm.name], ['Mobile Number', sgForm.mobile], ['Email ID', sgForm.email], ['Organisation', sgForm.orgName], ['Nature of Business', sgForm.natureOfBusiness]] as [string, string][]).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${COLORS.border}`, fontSize: 11 }}>
                            <span style={{ color: COLORS.textMuted, fontWeight: 500 }}>{k}</span>
                            <span style={{ color: COLORS.text, fontWeight: 600 }}>{v || '—'}</span>
                          </div>
                        ))}
                      </div>
                      {sgError && (
                        <div style={{ background: '#FDECEA', border: '1px solid #F5C6C6', borderLeft: '3px solid #C0392B', borderRadius: 6, padding: '9px 12px', fontSize: 12, color: '#C0392B', marginBottom: 12 }}>
                          {sgError}
                        </div>
                      )}
                      <div style={{ background: COLORS.primaryLight, border: '1px solid rgba(26,61,43,0.15)', borderLeft: `3px solid ${COLORS.primary}`, borderRadius: 6, padding: '8px 12px', fontSize: 10, color: COLORS.primary, marginBottom: 14 }}>
                        🔒 By registering, you agree to the FSSAI E-PAAS Terms of Service and Privacy Policy.
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                        <button onClick={() => setSgStep(2)} style={{ flex: 1, padding: 11, background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
                        <button onClick={handleSignup} disabled={isLoading} style={{ flex: 2, padding: 11, background: COLORS.success, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', letterSpacing: 0.3, opacity: isLoading ? 0.7 : 1 }}>
                          {isLoading ? 'Registering…' : '✓ Complete Registration'}
                        </button>
                      </div>
                    </>
                  )}

                  <div style={{ textAlign: 'center', paddingTop: 14, borderTop: `1px solid ${COLORS.border}` }}>
                    <span style={{ fontSize: 12, color: COLORS.textMuted }}>Already have an account? </span>
                    <span onClick={() => openDrawer('applicant')} style={{ fontSize: 12, color: COLORS.primary, fontWeight: 700, cursor: 'pointer' }}>Sign in here →</span>
                  </div>
                </>
              )}

              {/* ── Login form ── */}
              {drawer.type !== 'signup' && (
                <>
                  {/* Type switcher */}
                  <div style={{ display: 'flex', background: COLORS.bg, borderRadius: 8, padding: 3, marginBottom: 22, border: `1px solid ${COLORS.border}` }}>
                    {(['Applicant', 'Authority Officer'] as const).map((label, i) => {
                      const isActive = i === 0 ? drawer.type === 'applicant' : drawer.type === 'authority';
                      return (
                        <div
                          key={label}
                          onClick={() => { setDrawer({ type: i === 0 ? 'applicant' : 'authority' }); setDrwError(''); }}
                          style={{ flex: 1, textAlign: 'center', padding: '7px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: isActive ? '#fff' : 'transparent', color: isActive ? COLORS.primary : COLORS.textMuted, boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}
                        >
                          {label}
                        </div>
                      );
                    })}
                  </div>

                  {/* Login form */}
                  <form onSubmit={handleDrawerLogin}>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.text, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>
                        {drawer.type === 'authority' ? 'Username' : 'License Number / Email'}
                      </label>
                      <input
                        value={drwId}
                        onChange={(e) => setDrwId(e.target.value)}
                        placeholder={drawer.type === 'authority' ? 'Enter your username' : 'Enter license number / email'}
                        style={drwFieldStyle}
                        required
                        autoFocus
                      />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, letterSpacing: 0.5, textTransform: 'uppercase' }}>Password</label>
                        <span style={{ fontSize: 11, color: COLORS.primary, cursor: 'pointer', fontWeight: 700 }}>Forgot Password?</span>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={drwShowPw ? 'text' : 'password'}
                          value={drwPw}
                          onChange={(e) => setDrwPw(e.target.value)}
                          placeholder="••••••••••"
                          style={{ ...drwFieldStyle, paddingRight: 40 }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setDrwShowPw((v) => !v)}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                          {drwShowPw ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    {drwError && (
                      <div style={{ background: '#FDECEA', border: '1px solid #F5C6C6', borderLeft: '3px solid #C0392B', borderRadius: 6, padding: '9px 12px', fontSize: 12, color: '#C0392B', marginBottom: 14 }}>
                        {drwError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      style={{ width: '100%', padding: 12, background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', letterSpacing: 0.3, marginBottom: 14, opacity: isLoading ? 0.7 : 1 }}>
                      {isLoading ? 'Logging in…' : 'Login to E-PAAS →'}
                    </button>
                  </form>

                  {/* Security notice */}
                  <div style={{ background: COLORS.primaryLight, border: '1px solid rgba(26,61,43,0.15)', borderLeft: `3px solid ${COLORS.primary}`, borderRadius: 6, padding: '9px 12px', fontSize: 11, color: COLORS.primary, display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 16 }}>
                    <span style={{ flexShrink: 0 }}>🔒</span>
                    <span>
                      {drawer.type === 'authority'
                        ? 'Unauthorized access is prohibited under IT Act 2000. All actions are logged and auditable.'
                        : 'Secure Government Portal — All sessions are encrypted, monitored and compliant with Govt. of India standards.'}
                    </span>
                  </div>

                  {/* Sign up link (applicant only) */}
                  {drawer.type === 'applicant' && (
                    <div style={{ textAlign: 'center', paddingTop: 14, borderTop: `1px solid ${COLORS.border}` }}>
                      <span style={{ fontSize: 12, color: COLORS.textMuted }}>New to E-PAAS? </span>
                      <span
                        onClick={openSignup}
                        style={{ fontSize: 12, color: COLORS.primary, fontWeight: 700, cursor: 'pointer' }}>
                        Create an account →
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Back to Top ─────────────────────────────────────────────────── */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Back to top"
          style={{ position: 'fixed', bottom: 28, right: 24, zIndex: 200, width: 44, height: 44, borderRadius: '50%', background: COLORS.primary, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 4px 16px rgba(0,0,0,0.25)', transition: 'background 0.2s ease, transform 0.2s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.accent; e.currentTarget.style.transform = 'translateY(-3px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.primary; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          ↑
        </button>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {modal && <PageModal modalKey={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
