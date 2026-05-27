import { useState, useEffect } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { validateEmail } from '@/utils/validators';
import toast from 'react-hot-toast';
import { COLORS, S } from '@/utils/colors';
import { fetchOfficerCreationRoles, createOfficer, type RoleOption } from '@/services/admin.service';

const ALL_CATEGORIES = [
  { value: 'NSF',            label: 'NSF' },
  { value: 'ClaimApproval',  label: 'Claim Approval' },
  { value: 'AyurvedaAahara', label: 'Ayurveda Aahara' },
  { value: 'RPET',           label: 'R-PET' },
  { value: 'Vegan',          label: 'Vegan' },
  { value: 'AnyOther',       label: 'Any Other' },
];

export default function AdminAddOfficer() {
  const navigate = useNavigate();

  const [addRoles,      setAddRoles]      = useState<RoleOption[]>([]);
  const [newUsername,   setNewUsername]   = useState('');
  const [newEmail,      setNewEmail]      = useState('');
  const [newPassword,   setNewPassword]   = useState('');
  const [newLocation,   setNewLocation]   = useState('');
  const [newRoleCode,   setNewRoleCode]   = useState('');
  const [newCategories, setNewCategories] = useState<string[]>([]);
  const [adding,        setAdding]        = useState(false);

  useEffect(() => {
    fetchOfficerCreationRoles()
      .then((roles) => {
        setAddRoles(roles);
        if (roles.length > 0) setNewRoleCode(roles[0].roleCode);
      })
      .catch(() => toast.error('Failed to load roles'));
  }, []);

  function toggleCategory(cat: string) {
    setNewCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleAddOfficer() {
    if (!newUsername.trim() || !newPassword.trim() || !newRoleCode) {
      toast.error('Please fill all required fields'); return;
    }
    const emailErr = validateEmail(newEmail);
    if (emailErr) { toast.error(emailErr); return; }
    if (newCategories.length === 0) {
      toast.error('Select at least one application category'); return;
    }
    setAdding(true);
    try {
      const created = await createOfficer({
        username:           newUsername.trim(),
        email:              newEmail.trim(),
        password:           newPassword,
        officeLocation:     newLocation.trim() || undefined,
        roleCode:           newRoleCode,
        assignedCategories: newCategories,
      });
      toast.success(`Officer "${created.username}" created successfully`);
      navigate('/admin/officers');
    } catch (err: unknown) {
      const d = (err as any)?.response?.data;
      toast.error(d?.message ?? d?.error ?? 'Failed to create officer');
    } finally { setAdding(false); }
  }

  const mInput: React.CSSProperties = {
    padding: '8px 10px', border: `1px solid ${COLORS.border}`,
    borderRadius: 6, fontSize: 13, width: '100%', boxSizing: 'border-box',
  };
  const mLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 5,
  };

  return (
    <div>
      <div style={{ marginBottom: 20, paddingBottom: 10, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={S.roleLabel}>SYSTEM ADMIN</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={S.pageTitle}>Add New Officer</div>
            <div style={S.pageDesc}>Create a new officer account and assign role and categories.</div>
          </div>
          <button
            onClick={() => navigate('/admin/officers')}
            style={{ background: 'transparent', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 6, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            ← Back to Officer Management
          </button>
        </div>
      </div>

      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={mLabel}>Username <span style={{ color: COLORS.danger }}>*</span></label>
              <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="e.g. john_doe" style={mInput} />
            </div>
            <div>
              <label style={mLabel}>Email <span style={{ color: COLORS.danger }}>*</span></label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="officer@gov.in" style={mInput} />
            </div>
            <div>
              <label style={mLabel}>Password <span style={{ color: COLORS.danger }}>*</span></label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter password" style={mInput} />
            </div>
            <div>
              <label style={mLabel}>Office Location</label>
              <input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="e.g. New Delhi" style={mInput} />
            </div>
          </div>

          <div>
            <label style={mLabel}>Role <span style={{ color: COLORS.danger }}>*</span></label>
            <select value={newRoleCode} onChange={(e) => setNewRoleCode(e.target.value)} style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 6, padding: '8px 34px 8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'Noto Sans', 'Segoe UI', sans-serif", backgroundColor: '#f7f8fc', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23555' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat' as const, backgroundPosition: 'right 10px center', backgroundSize: '12px', color: 'var(--color-text)', cursor: 'pointer', appearance: 'none' as const, transition: 'border-color 0.15s, box-shadow 0.15s' }}>
              {addRoles.map((r) => <option key={r.roleCode} value={r.roleCode}>{r.roleName}</option>)}
            </select>
          </div>

          <div>
            <label style={mLabel}>Application Categories <span style={{ color: COLORS.danger }}>*</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 6, background: COLORS.bg }}>
              {ALL_CATEGORIES.map((cat) => (
                <label key={cat.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: newCategories.includes(cat.value) ? COLORS.primary : COLORS.text, background: newCategories.includes(cat.value) ? COLORS.primaryLight : 'transparent', padding: '5px 12px', borderRadius: 6, border: `1px solid ${newCategories.includes(cat.value) ? COLORS.primary : COLORS.border}`, userSelect: 'none' }}>
                  <input type="checkbox" checked={newCategories.includes(cat.value)} onChange={() => toggleCategory(cat.value)} style={{ accentColor: COLORS.primary }} />
                  {cat.label}
                </label>
              ))}
            </div>
            {newCategories.length === 0 && (
              <div style={{ fontSize: 11, color: COLORS.danger, marginTop: 4 }}>Select at least one category</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
          <button onClick={handleAddOfficer} disabled={adding}
            style={{ padding: '9px 28px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.7 : 1 }}>
            {adding ? 'Creating…' : 'Create Officer'}
          </button>
          <button onClick={() => navigate('/admin/officers')} disabled={adding}
            style={{ padding: '9px 16px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>

      <div style={{ marginTop: 14, background: COLORS.infoLight, border: `1px solid ${COLORS.info}33`, borderRadius: 8, padding: '10px 14px', fontSize: 11, color: COLORS.info, lineHeight: 1.6 }}>
        <strong>ℹ Note:</strong> Only Nodal Officer, Technical Officer, and Expert Committee roles can be created here. Category assignment determines which application types are routed to each officer.
      </div>
    </div>
  );
}
