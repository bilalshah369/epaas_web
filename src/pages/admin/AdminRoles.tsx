import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { COLORS, S } from '@/utils/colors';
import { fetchAdminRoles, createRole, type RoleOption } from '@/services/admin.service';


const iStyle: React.CSSProperties = { padding: '8px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, width: '100%', boxSizing: 'border-box', background: COLORS.bg };
const lStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.4, display: 'block', marginBottom: 5 };

export default function AdminRoles() {
  const [roles,    setRoles]    = useState<RoleOption[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  const [roleCode,    setRoleCode]    = useState('');
  const [roleName,    setRoleName]    = useState('');
  const [description, setDescription] = useState('');
  const [formError,   setFormError]   = useState('');

  useEffect(() => {
    fetchAdminRoles()
      .then(setRoles)
      .catch(() => toast.error('Failed to load roles'))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    setFormError('');
    if (!roleCode.trim()) { setFormError('Role Code is required'); return; }
    if (!roleName.trim()) { setFormError('Role Name is required'); return; }
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(roleCode.trim())) {
      setFormError('Role Code must be alphanumeric, starting with a letter (e.g. NodalOfficerA)');
      return;
    }
    setSaving(true);
    try {
      const created = await createRole({ roleCode: roleCode.trim(), roleName: roleName.trim(), description: description.trim() || undefined });
      setRoles((prev) => [...prev, created]);
      setRoleCode(''); setRoleName(''); setDescription('');
      toast.success(`Role "${created.roleName}" created`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to create role');
    } finally { setSaving(false); }
  }

  return (
    <div>
      <div style={{ marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={S.pageDesc}>Define new system roles and review existing ones. Roles control which module each officer can access.</div>
      </div>

      {/* Create new role form */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>Create New Role</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lStyle}>Role Code <span style={{ color: COLORS.danger }}>*</span></label>
            <input value={roleCode} onChange={(e) => setRoleCode(e.target.value)} placeholder="e.g. TechnicalOfficer" style={iStyle} />
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>Alphanumeric, no spaces. Used in API guards.</div>
          </div>
          <div>
            <label style={lStyle}>Role Name <span style={{ color: COLORS.danger }}>*</span></label>
            <input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g. Technical Officer" style={iStyle} />
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>Human-readable display name.</div>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={lStyle}>Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this role's responsibilities…" style={iStyle} />
        </div>
        {formError && (
          <div style={{ background: COLORS.dangerLight, border: `1px solid ${COLORS.danger}33`, borderRadius: 6, padding: '8px 12px', fontSize: 12, color: COLORS.danger, marginBottom: 14 }}>
            {formError}
          </div>
        )}
        <button onClick={handleCreate} disabled={saving}
          style={{ padding: '8px 24px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Creating…' : '+ Create Role'}
        </button>
      </div>

      {/* Existing roles table */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '9px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Existing Roles ({roles.length})
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['Sr.', 'Role Code', 'Role Name', 'Description', 'Officers Assigned'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', padding: '40px 0', color: COLORS.textMuted }}>Loading…</td></tr>}
              {!loading && roles.length === 0 && (
                <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', padding: '48px 0', color: COLORS.textMuted }}>No roles found.</td></tr>
              )}
              {roles.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                  <td style={S.td}>{i + 1}</td>
                  <td style={S.td}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: COLORS.primaryLight, color: COLORS.primary }}>
                      {r.roleCode}
                    </span>
                  </td>
                  <td style={{ ...S.td, fontWeight: 600, color: COLORS.text }}>{r.roleName}</td>
                  <td style={{ ...S.td, color: COLORS.textMuted, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.description || '—'}
                  </td>
                  <td style={S.td}>—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 14, background: COLORS.infoLight, border: `1px solid ${COLORS.info}33`, borderRadius: 8, padding: '10px 14px', fontSize: 11, color: COLORS.info, lineHeight: 1.6 }}>
        <strong>ℹ Note:</strong> After creating a new role, assign it to an officer via Officer Management. For the new role to have protected API access, the backend role guard also needs to be configured.
      </div>
    </div>
  );
}
