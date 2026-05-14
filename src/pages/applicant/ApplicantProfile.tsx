import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type React from 'react';
import toast from 'react-hot-toast';
import { COLORS } from '@/utils/colors';
import { useAuthStore } from '@/store/authStore';
import { fetchMyApplications, type Application } from '@/services/application.service';
import { updateOrgName } from '@/services/auth.service';

function btn(variant: 'solid' | 'outline' = 'solid', extra?: React.CSSProperties): React.CSSProperties {
  return {
    padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    border: variant === 'outline' ? `1.5px solid ${COLORS.primary}` : 'none',
    background: variant === 'outline' ? 'transparent' : COLORS.primary,
    color: variant === 'outline' ? COLORS.primary : '#fff',
    ...extra,
  };
}

function ReadField({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div style={{ gridColumn: span ? 'span 2' : undefined }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.text, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: '9px 12px' }}>
        {value || '—'}
      </div>
    </div>
  );
}

export default function ApplicantProfile() {
  const navigate        = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [apps, setApps] = useState<Application[]>([]);
  const [editing, setEditing]   = useState(false);
  const [orgNameDraft, setOrgNameDraft] = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    fetchMyApplications().then(setApps).catch(() => {});
  }, []);

  const displayName = user?.orgName || user?.name || user?.username || '—';
  const initials    = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || 'AP';

  const totalApps    = apps.length;
  const approvedApps = apps.filter((a) => a.stage === 'Approved').length;
  const actionReq    = apps.filter((a) => a.stage === 'QuerySent').length;

  function startEdit() {
    setOrgNameDraft(user?.orgName || '');
    setEditing(true);
  }

  async function saveOrgName() {
    if (!orgNameDraft.trim()) { toast.error('Business name cannot be empty'); return; }
    setSaving(true);
    try {
      const updated = await updateOrgName(orgNameDraft.trim());
      updateUser({ orgName: updated.orgName });
      toast.success('Business name updated');
      setEditing(false);
    } catch {
      toast.error('Could not update business name');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${COLORS.border}` }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>APPLICANT PORTAL</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Libre Baskerville', Georgia, serif", color: COLORS.text, margin: 0 }}>
            My Profile
          </h2>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 3 }}>Your registered account information</div>
        </div>
        <button style={btn('outline')} onClick={() => navigate('/app/dashboard')}>← Back to Dashboard</button>
      </div>

      {/* Profile banner */}
      <div style={{ background: `linear-gradient(130deg, ${COLORS.primary} 0%, #0e2419 100%)`, borderRadius: 12, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: "'Libre Baskerville', Georgia, serif" }}>{displayName}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>
            Applicant &nbsp;·&nbsp; {user?.licenseNumber ? <>FSSAI Licence: <strong style={{ color: '#fff' }}>{user.licenseNumber}</strong></> : <span>No licence assigned yet</span>}
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

      {/* Business Details card */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville', Georgia, serif" }}>Business Details</div>
          {!editing && (
            <button style={btn('outline', { fontSize: 11, padding: '6px 14px' })} onClick={startEdit}>
              Edit Business Name
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Business / Organisation Name — editable */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              Name of Organisation / Business
            </div>
            {editing ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={orgNameDraft}
                  onChange={(e) => setOrgNameDraft(e.target.value)}
                  style={{ flex: 1, border: `1.5px solid ${COLORS.primary}`, borderRadius: 7, padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: "'Noto Sans','Segoe UI',sans-serif" }}
                  autoFocus
                />
                <button style={btn('solid', { fontSize: 11, padding: '9px 16px', opacity: saving ? 0.7 : 1 })} onClick={saveOrgName} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button style={btn('outline', { fontSize: 11, padding: '9px 14px' })} onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.text, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: '9px 12px' }}>
                {user?.orgName || '—'}
              </div>
            )}
          </div>

          <ReadField label="Applicant Name"      value={user?.name            || '—'} />
          <ReadField label="Nature of Business"  value={user?.natureOfBusiness || '—'} />
          <ReadField label="Mobile Number"       value={user?.mobile          || '—'} />
          <ReadField label="Email ID"            value={user?.email           || '—'} />
        </div>

        <div style={{ marginTop: 20, padding: '12px 14px', background: COLORS.bg, borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 11, color: COLORS.textMuted, lineHeight: 1.6 }}>
          ℹ To update your mobile number, email, or nature of business, please contact the FSSAI E-PAAS helpdesk.
        </div>
      </div>
    </div>
  );
}
