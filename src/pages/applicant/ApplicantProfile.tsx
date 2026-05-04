// Mirrors ApplicantProfile from mock (App.jsx L24433).
// Wired to useAuthStore for user info and fetchMyApplications for stats.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type React from 'react';
import { COLORS } from '@/utils/colors';
import { useAuthStore } from '@/store/authStore';
import { fetchMyApplications, type Application } from '@/services/application.service';

function btn(variant: 'solid' | 'outline' = 'solid', extra?: React.CSSProperties): React.CSSProperties {
  return {
    padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    border: variant === 'outline' ? `1.5px solid ${COLORS.primary}` : 'none',
    background: variant === 'outline' ? 'transparent' : COLORS.primary,
    color: variant === 'outline' ? COLORS.primary : '#fff',
    ...extra,
  };
}

function Field({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div style={{ gridColumn: span ? 'span 2' : undefined }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: '9px 12px' }}>
        {value || '—'}
      </div>
    </div>
  );
}

const TABS = [
  { key: 'business', label: 'Business Details' },
  { key: 'contact',  label: 'Contact & Login' },
  { key: 'licence',  label: 'FSSAI Licence' },
  { key: 'docs',     label: 'KYC Documents' },
];

const KYC_DOCS = [
  { name: 'Certificate of Incorporation',  status: 'Verified',      date: 'Uploaded 12 Jan 2024', icon: '📄' },
  { name: 'PAN Card (Entity)',             status: 'Verified',      date: 'Uploaded 12 Jan 2024', icon: '🪪' },
  { name: 'GSTIN Certificate',            status: 'Verified',      date: 'Uploaded 15 Jan 2024', icon: '📋' },
  { name: 'FSSAI Licence Copy',           status: 'Verified',      date: 'Uploaded 15 Jan 2024', icon: '🏛️' },
  { name: 'Authorised Signatory Letter',  status: 'Pending Review', date: 'Uploaded 02 Apr 2026', icon: '✍️' },
];

export default function ApplicantProfile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('business');
  const [apps, setApps] = useState<Application[]>([]);

  useEffect(() => {
    fetchMyApplications().then(setApps).catch(() => {});
  }, []);

  // Business info from the most recent non-draft application's formData
  const submittedApp = apps.find((a) => a.formData?.step2 && a.stage !== 'Draft');
  const step2 = submittedApp?.formData?.step2;

  const businessName  = step2?.orgName ?? user?.username ?? '—';
  const licenseNumber = user?.licenseNumber ?? step2?.licenseNumber ?? '—';
  const initials      = businessName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'AP';

  const totalApps    = apps.length;
  const approvedApps = apps.filter((a) => a.stage === 'Approved').length;
  const actionReq    = apps.filter((a) => ['QuerySent'].includes(a.stage)).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${COLORS.border}` }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>APPLICANT PORTAL</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Libre Baskerville', Georgia, serif", color: COLORS.text, margin: 0 }}>
            My Profile
          </h2>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 3 }}>Manage your business information and account settings</div>
        </div>
        <button style={btn('outline')} onClick={() => navigate('/app/dashboard')}>← Back to Dashboard</button>
      </div>

      {/* Profile banner */}
      <div style={{ background: `linear-gradient(130deg, ${COLORS.primary} 0%, #0e2419 100%)`, borderRadius: 12, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: "'Libre Baskerville', Georgia, serif" }}>{businessName}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>
            Applicant &nbsp;·&nbsp; FSSAI Licence: <strong style={{ color: '#fff' }}>{licenseNumber}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Total Apps',  value: totalApps,    color: '#fff' },
            { label: 'Approved',    value: approvedApps, color: COLORS.accent },
            { label: 'Action Req.', value: actionReq,    color: '#F87171' },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 18px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${COLORS.border}`, marginBottom: 20 }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ background: 'none', border: 'none', borderBottom: activeTab === t.key ? `2px solid ${COLORS.primary}` : '2px solid transparent', marginBottom: -2, padding: '10px 20px', fontSize: 13, fontWeight: activeTab === t.key ? 700 : 500, color: activeTab === t.key ? COLORS.primary : COLORS.textMuted, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>

        {activeTab === 'business' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Business / Entity Name" value={step2?.orgName ?? businessName} span />
            <Field label="Type of Entity"         value={step2?.natureOfBusiness ?? '—'} />
            <Field label="PAN Number"             value="—" />
            <Field label="GSTIN"                  value={step2 ? '—' : '—'} />
            <Field label="Industry Sector"        value="Food Manufacturing" />
            <Field label="Year of Incorporation"  value="—" />
            <Field label="Registered Address"     value={step2?.orgAddress ?? '—'} span />
          </div>
        )}

        {activeTab === 'contact' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Primary Contact Person" value={step2?.applicantName ?? '—'} />
            <Field label="Designation"            value={step2?.authorisedPerson ?? '—'} />
            <Field label="Mobile Number"          value={step2?.mobileNo ?? '—'} />
            <Field label="Alternate Mobile"       value="—" />
            <Field label="Email Address"          value={step2?.email ?? user?.email ?? '—'} />
            <Field label="Official Website"       value="—" />
            <div style={{ gridColumn: 'span 2', borderTop: `1px solid ${COLORS.border}`, paddingTop: 16, marginTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 14 }}>Login Credentials</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Login Email / Username" value={user?.email ?? '—'} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Password</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: COLORS.text, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: '9px 12px' }}>
                      ••••••••••
                    </div>
                    <button style={btn('outline', { fontSize: 11, padding: '9px 14px' })}>Change</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'licence' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="FSSAI Licence Number"      value={licenseNumber} />
            <Field label="Licence Type"              value="Central Licence" />
            <Field label="Issued Date"               value="—" />
            <Field label="Valid Until"               value="—" />
            <Field label="Licensing Authority"       value="FSSAI Central, New Delhi" />
            <Field label="Licence Status"            value="Active ✓" />
            <Field label="Licensed Premises Address" value={step2?.mfgAddress ?? '—'} span />
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ background: COLORS.successLight, border: '1px solid #A5D6A7', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.success }}>Licence is valid and in good standing</div>
                  <div style={{ fontSize: 11, color: COLORS.success, marginTop: 2 }}>Renewal can be initiated 6 months before expiry</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div>
            {KYC_DOCS.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: COLORS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {d.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{d.date}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: d.status === 'Verified' ? COLORS.successLight : COLORS.warningLight, color: d.status === 'Verified' ? COLORS.success : COLORS.warning }}>
                  {d.status}
                </span>
                <button style={btn('outline', { fontSize: 11, padding: '5px 12px' })}>View</button>
              </div>
            ))}
            <button style={btn('solid', { marginTop: 16, fontSize: 12 })}>+ Upload New Document</button>
          </div>
        )}

      </div>
    </div>
  );
}
