import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { COLORS, S } from '@/utils/colors';
import {
  fetchAdminOfficers, fetchAdminRoles, updateOfficerRole, toggleOfficerStatus,
  createOfficer,
  type Officer, type RoleOption,
} from '@/services/admin.service';

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminOfficers() {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [roles,    setRoles]    = useState<RoleOption[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState<string | null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});

  // Add officer modal state
  const [showAdd,     setShowAdd]     = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail,    setNewEmail]    = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newRoleCode, setNewRoleCode] = useState('');
  const [adding,      setAdding]      = useState(false);

  useEffect(() => {
    Promise.all([fetchAdminOfficers(), fetchAdminRoles()])
      .then(([o, r]) => {
        setOfficers(o);
        setRoles(r);
        if (r.length > 0) setNewRoleCode(r[0].roleCode);
      })
      .catch(() => toast.error('Failed to load officers'))
      .finally(() => setLoading(false));
  }, []);

  async function handleRoleChange(officer: Officer) {
    const newRole = pendingRoles[officer.id];
    if (!newRole || newRole === officer.role.roleCode) { toast('No change in role'); return; }
    setSaving(officer.id);
    try {
      const updated = await updateOfficerRole(officer.id, newRole);
      setOfficers((prev) => prev.map((o) => o.id === officer.id ? { ...o, role: updated.role } : o));
      setPendingRoles((prev) => { const n = { ...prev }; delete n[officer.id]; return n; });
      toast.success(`Role updated to ${updated.role.roleName}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Role update failed');
    } finally { setSaving(null); }
  }

  async function handleToggleStatus(officer: Officer) {
    setSaving(officer.id);
    try {
      const updated = await toggleOfficerStatus(officer.id);
      setOfficers((prev) => prev.map((o) => o.id === officer.id ? { ...o, isActive: updated.isActive } : o));
      toast.success(updated.isActive ? 'Account activated' : 'Account deactivated');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Status toggle failed');
    } finally { setSaving(null); }
  }

  async function handleAddOfficer() {
    if (!newUsername.trim() || !newEmail.trim() || !newPassword.trim() || !newRoleCode) {
      toast.error('Please fill all required fields'); return;
    }
    setAdding(true);
    try {
      const created = await createOfficer({
        username: newUsername.trim(), email: newEmail.trim(),
        password: newPassword, officeLocation: newLocation.trim() || undefined, roleCode: newRoleCode,
      });
      setOfficers((prev) => [...prev, created]);
      setShowAdd(false);
      setNewUsername(''); setNewEmail(''); setNewPassword(''); setNewLocation('');
      if (roles.length > 0) setNewRoleCode(roles[0].roleCode);
      toast.success(`Officer "${created.username}" created successfully`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to create officer');
    } finally { setAdding(false); }
  }

  const activeCount   = officers.filter((o) => o.isActive).length;
  const inactiveCount = officers.filter((o) => !o.isActive).length;

  const mInput: React.CSSProperties = { padding: '8px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, width: '100%', boxSizing: 'border-box' };
  const mLabel: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 5 };

  return (
    <div>
      {/* Add Officer Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.48)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setShowAdd(false)}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 28, maxWidth: 500, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>SYSTEM ADMIN</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif" }}>Add New Officer</div>
              </div>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: COLORS.textMuted }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
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
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" style={mInput} />
              </div>
              <div>
                <label style={mLabel}>Office Location</label>
                <input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="e.g. New Delhi" style={mInput} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={mLabel}>Role <span style={{ color: COLORS.danger }}>*</span></label>
              <select value={newRoleCode} onChange={(e) => setNewRoleCode(e.target.value)} style={{ ...mInput, cursor: 'pointer' }}>
                {roles.map((r) => <option key={r.roleCode} value={r.roleCode}>{r.roleName}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
              <button onClick={handleAddOfficer} disabled={adding}
                style={{ padding: '8px 24px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.7 : 1 }}>
                {adding ? 'Creating…' : 'Create Officer'}
              </button>
              <button onClick={() => setShowAdd(false)}
                style={{ padding: '8px 16px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div style={{ marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={S.roleLabel}>SYSTEM ADMIN</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={S.pageTitle}>Officer Management</div>
            <div style={S.pageDesc}>Manage officer accounts, roles, and system access.</div>
          </div>
          <button onClick={() => setShowAdd(true)}
            style={{ padding: '8px 18px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            + Add Officer
          </button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Officers', value: officers.length, color: COLORS.primary },
          { label: 'Active',         value: activeCount,     color: COLORS.success },
          { label: 'Inactive',       value: inactiveCount,   color: COLORS.danger  },
        ].map((s) => (
          <div key={s.label} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${s.color}`, borderRadius: 8, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: "'Libre Baskerville',Georgia,serif" }}>{loading ? '—' : s.value}</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '9px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Officer Accounts ({officers.length})
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['Sr.', 'Name / Username', 'Email', 'Current Role', 'Joined', 'Status', 'Change Role', 'Actions'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: '40px 0', color: COLORS.textMuted }}>Loading…</td></tr>}
              {!loading && officers.length === 0 && (
                <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: '48px 0', color: COLORS.textMuted }}>No officers found. Add officers via database seeding.</td></tr>
              )}
              {officers.map((o, i) => {
                const pendingRole = pendingRoles[o.id] ?? o.role.roleCode;
                const changed     = pendingRole !== o.role.roleCode;
                const isSaving    = saving === o.id;
                return (
                  <tr key={o.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg, opacity: o.isActive ? 1 : 0.6 }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: COLORS.text }}>{o.username}</td>
                    <td style={{ ...S.td, color: COLORS.textMuted }}>{o.email}</td>
                    <td style={S.td}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: COLORS.primaryLight, color: COLORS.primary }}>
                        {o.role.roleName}
                      </span>
                    </td>
                    <td style={S.td}>{fmtDate(o.createdAt)}</td>
                    <td style={S.td}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: o.isActive ? COLORS.successLight : COLORS.dangerLight, color: o.isActive ? COLORS.success : COLORS.danger }}>
                        {o.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <select
                          value={pendingRole}
                          onChange={(e) => setPendingRoles((prev) => ({ ...prev, [o.id]: e.target.value }))}
                          disabled={isSaving}
                          style={{ padding: '4px 8px', border: `1px solid ${changed ? COLORS.warning : COLORS.border}`, borderRadius: 5, fontSize: 11, background: changed ? COLORS.warningLight : COLORS.bg, cursor: 'pointer', minWidth: 160 }}>
                          {roles.map((r) => <option key={r.roleCode} value={r.roleCode}>{r.roleName}</option>)}
                        </select>
                        {changed && (
                          <button onClick={() => handleRoleChange(o)} disabled={isSaving}
                            style={{ background: COLORS.warning, color: '#fff', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                            {isSaving ? '…' : 'Save'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={S.td}>
                      <button onClick={() => handleToggleStatus(o)} disabled={isSaving}
                        style={{ background: 'transparent', color: o.isActive ? COLORS.danger : COLORS.success, border: `1px solid ${o.isActive ? COLORS.danger : COLORS.success}`, borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                        {isSaving ? '…' : o.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 14, background: COLORS.infoLight, border: `1px solid ${COLORS.info}33`, borderRadius: 8, padding: '10px 14px', fontSize: 11, color: COLORS.info, lineHeight: 1.6 }}>
        <strong>ℹ Note:</strong> Role changes take effect immediately. Deactivated accounts cannot log in. New officer accounts are created by the system administrator directly in the database.
      </div>
    </div>
  );
}
