import { useState, useEffect } from 'react';
import type React from 'react';
import toast from 'react-hot-toast';
import { COLORS, S } from '@/utils/colors';
import {
  fetchAdminOfficers, fetchAdminRoles, fetchOfficerCreationRoles, updateOfficerRole, toggleOfficerStatus,
  createOfficer, updateOfficerProfile, deleteOfficer,
  type Officer, type RoleOption,
} from '@/services/admin.service';

const ALL_CATEGORIES = [
  { value: 'NSF',           label: 'NSF' },
  { value: 'ClaimApproval', label: 'Claim Approval' },
  { value: 'AyurvedaAahara',label: 'Ayurveda Aahara' },
  { value: 'RPET',          label: 'R-PET' },
  { value: 'AnyOther',      label: 'Any Other' },
];

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function CategoryBadges({ cats }: { cats: string[] }) {
  if (!cats || cats.length === 0) return <span style={{ color: COLORS.textMuted, fontSize: 11 }}>—</span>;
  const labels: Record<string, string> = {
    NSF: 'NSF', ClaimApproval: 'CA', AyurvedaAahara: 'AA', RPET: 'R-PET', AnyOther: 'AO',
  };
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {cats.map(c => (
        <span key={c} style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 8, background: COLORS.primaryLight, color: COLORS.primary }}>
          {labels[c] ?? c}
        </span>
      ))}
    </div>
  );
}

export default function AdminOfficers() {
  const [officers, setOfficers]   = useState<Officer[]>([]);
  const [allRoles, setAllRoles]   = useState<RoleOption[]>([]);
  const [addRoles, setAddRoles]   = useState<RoleOption[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [saving,   setSaving]     = useState<string | null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});

  // Add officer modal state
  const [showAdd,        setShowAdd]        = useState(false);
  const [newUsername,    setNewUsername]    = useState('');
  const [newEmail,       setNewEmail]       = useState('');
  const [newPassword,    setNewPassword]    = useState('');
  const [newLocation,    setNewLocation]    = useState('');
  const [newRoleCode,    setNewRoleCode]    = useState('');
  const [newCategories,  setNewCategories]  = useState<string[]>([]);
  const [adding,         setAdding]         = useState(false);

  // Edit officer modal state
  const [editTarget,     setEditTarget]     = useState<Officer | null>(null);
  const [editUsername,   setEditUsername]   = useState('');
  const [editEmail,      setEditEmail]      = useState('');
  const [editPassword,   setEditPassword]   = useState('');
  const [editLocation,   setEditLocation]   = useState('');
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [editSaving,     setEditSaving]     = useState(false);

  // Delete confirmation state
  const [deleteTarget,   setDeleteTarget]   = useState<Officer | null>(null);
  const [deleting,       setDeleting]       = useState(false);

  useEffect(() => {
    Promise.all([fetchAdminOfficers(), fetchAdminRoles(), fetchOfficerCreationRoles()])
      .then(([o, allR, addR]) => {
        setOfficers(o);
        setAllRoles(allR);
        setAddRoles(addR);
        if (addR.length > 0) setNewRoleCode(addR[0].roleCode);
      })
      .catch(() => toast.error('Failed to load officers'))
      .finally(() => setLoading(false));
  }, []);

  function toggleCategory(cat: string) {
    setNewCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }

  function openEdit(o: Officer) {
    setEditTarget(o);
    setEditUsername(o.username);
    setEditEmail(o.email);
    setEditPassword('');
    setEditLocation(o.officeLocation ?? '');
    setEditCategories(o.assignedCategories ?? []);
  }

  async function handleEditSave() {
    if (!editTarget) return;
    if (!editUsername.trim() || !editEmail.trim()) { toast.error('Username and email are required'); return; }
    if (editCategories.length === 0) { toast.error('Select at least one category'); return; }
    setEditSaving(true);
    try {
      const updated = await updateOfficerProfile(editTarget.id, {
        username:           editUsername.trim(),
        email:              editEmail.trim(),
        officeLocation:     editLocation.trim() || undefined,
        assignedCategories: editCategories,
        ...(editPassword ? { password: editPassword } : {}),
      });
      setOfficers(prev => prev.map(o => o.id === editTarget.id ? { ...o, ...updated } : o));
      setEditTarget(null);
      toast.success('Officer updated successfully');
    } catch (err: unknown) {
      const d = (err as any)?.response?.data;
      toast.error(d?.message ?? d?.error ?? 'Failed to update officer');
    } finally { setEditSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteOfficer(deleteTarget.id);
      setOfficers(prev => prev.filter(o => o.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success(`Officer "${deleteTarget.username}" deleted`);
    } catch (err: unknown) {
      const d = (err as any)?.response?.data;
      toast.error(d?.message ?? d?.error ?? 'Failed to delete officer');
    } finally { setDeleting(false); }
  }

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
      const d = (err as any)?.response?.data;
      toast.error(d?.message ?? d?.error ?? 'Role update failed');
    } finally { setSaving(null); }
  }

  async function handleToggleStatus(officer: Officer) {
    setSaving(officer.id);
    try {
      const updated = await toggleOfficerStatus(officer.id);
      setOfficers((prev) => prev.map((o) => o.id === officer.id ? { ...o, isActive: updated.isActive } : o));
      toast.success(updated.isActive ? 'Account activated' : 'Account deactivated');
    } catch (err: unknown) {
      const d = (err as any)?.response?.data;
      toast.error(d?.message ?? d?.error ?? 'Status toggle failed');
    } finally { setSaving(null); }
  }

  async function handleAddOfficer() {
    if (!newUsername.trim() || !newEmail.trim() || !newPassword.trim() || !newRoleCode) {
      toast.error('Please fill all required fields'); return;
    }
    if (newCategories.length === 0) {
      toast.error('Select at least one application category'); return;
    }
    setAdding(true);
    try {
      const created = await createOfficer({
        username: newUsername.trim(), email: newEmail.trim(),
        password: newPassword, officeLocation: newLocation.trim() || undefined,
        roleCode: newRoleCode, assignedCategories: newCategories,
      });
      setOfficers((prev) => [...prev, created]);
      setShowAdd(false);
      setNewUsername(''); setNewEmail(''); setNewPassword(''); setNewLocation('');
      setNewCategories([]);
      if (addRoles.length > 0) setNewRoleCode(addRoles[0].roleCode);
      toast.success(`Officer "${created.username}" created successfully`);
    } catch (err: unknown) {
      const d = (err as any)?.response?.data;
      toast.error(d?.message ?? d?.error ?? 'Failed to create officer');
    } finally { setAdding(false); }
  }

  const activeCount   = officers.filter((o) => o.isActive).length;
  const inactiveCount = officers.filter((o) => !o.isActive).length;

  const mInput: React.CSSProperties = { padding: '8px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, width: '100%', boxSizing: 'border-box' };
  const mLabel: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 5 };

  // shared form panel style
  const panelCard: React.CSSProperties = {
    background: COLORS.white, border: `1px solid ${COLORS.border}`,
    borderRadius: 10, padding: 24, position: 'sticky', top: 16,
  };

  function cancelAdd() {
    setShowAdd(false);
    setNewUsername(''); setNewEmail(''); setNewPassword(''); setNewLocation('');
    setNewCategories([]);
    if (addRoles.length > 0) setNewRoleCode(addRoles[0].roleCode);
  }

  return (
    <div>
      {/* Edit Officer Modal */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.48)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setEditTarget(null)}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 28, maxWidth: 520, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>SYSTEM ADMIN</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif" }}>Edit Officer</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{editTarget.username} · {editTarget.role.roleName}</div>
              </div>
              <button onClick={() => setEditTarget(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: COLORS.textMuted }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={mLabel}>Username <span style={{ color: COLORS.danger }}>*</span></label>
                <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="e.g. john_doe" style={mInput} />
              </div>
              <div>
                <label style={mLabel}>Email <span style={{ color: COLORS.danger }}>*</span></label>
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="officer@gov.in" style={mInput} />
              </div>
              <div>
                <label style={mLabel}>New Password <span style={{ color: COLORS.textMuted, fontWeight: 400, textTransform: 'none' }}>(leave blank to keep)</span></label>
                <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Enter new password" style={mInput} />
              </div>
              <div>
                <label style={mLabel}>Office Location</label>
                <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="e.g. New Delhi" style={mInput} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={mLabel}>Application Categories <span style={{ color: COLORS.danger }}>*</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 6, background: COLORS.bg }}>
                {ALL_CATEGORIES.map(cat => (
                  <label key={cat.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: editCategories.includes(cat.value) ? COLORS.primary : COLORS.text, background: editCategories.includes(cat.value) ? COLORS.primaryLight : 'transparent', padding: '4px 10px', borderRadius: 6, border: `1px solid ${editCategories.includes(cat.value) ? COLORS.primary : COLORS.border}`, userSelect: 'none' }}>
                    <input type="checkbox" checked={editCategories.includes(cat.value)}
                      onChange={() => setEditCategories(prev => prev.includes(cat.value) ? prev.filter(c => c !== cat.value) : [...prev, cat.value])}
                      style={{ accentColor: COLORS.primary, marginTop: 1 }} />
                    {cat.label}
                  </label>
                ))}
              </div>
              {editCategories.length === 0 && <div style={{ fontSize: 11, color: COLORS.danger, marginTop: 4 }}>Select at least one category</div>}
            </div>
            <div style={{ display: 'flex', gap: 10, borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
              <button onClick={handleEditSave} disabled={editSaving}
                style={{ padding: '8px 24px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: editSaving ? 'not-allowed' : 'pointer', opacity: editSaving ? 0.7 : 1 }}>
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => setEditTarget(null)}
                style={{ padding: '8px 16px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.48)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", marginBottom: 10 }}>Delete Officer Account</div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 20, lineHeight: 1.6 }}>
              Are you sure you want to permanently delete <strong style={{ color: COLORS.text }}>{deleteTarget.username}</strong>?
              This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: '8px 20px', background: COLORS.danger, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
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
          {!showAdd && (
            <button onClick={() => setShowAdd(true)}
              style={{ padding: '8px 18px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              + Add Officer
            </button>
          )}
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

      {/* Split layout: table left, add-officer panel right */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

        {/* Officers table */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '9px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Officer Accounts ({officers.length})
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>{['Sr.', 'Username', 'Email', 'Current Role', 'Categories', 'Joined', 'Status', 'Change Role', 'Actions'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', padding: '40px 0', color: COLORS.textMuted }}>Loading…</td></tr>}
                  {!loading && officers.length === 0 && (
                    <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', padding: '48px 0', color: COLORS.textMuted }}>No officers found. Add officers via the button above.</td></tr>
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
                        <td style={S.td}><CategoryBadges cats={o.assignedCategories ?? []} /></td>
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
                              style={{ padding: '4px 8px', border: `1px solid ${changed ? COLORS.warning : COLORS.border}`, borderRadius: 5, fontSize: 11, background: changed ? COLORS.warningLight : COLORS.bg, cursor: 'pointer', minWidth: 140 }}>
                              {addRoles.map((r) => <option key={r.roleCode} value={r.roleCode}>{r.roleName}</option>)}
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
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            <button onClick={() => handleToggleStatus(o)} disabled={isSaving}
                              style={{ background: 'transparent', color: o.isActive ? COLORS.danger : COLORS.success, border: `1px solid ${o.isActive ? COLORS.danger : COLORS.success}`, borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                              {isSaving ? '…' : o.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button onClick={() => openEdit(o)} disabled={isSaving}
                              style={{ background: 'transparent', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                              Edit
                            </button>
                            <button onClick={() => setDeleteTarget(o)} disabled={isSaving}
                              style={{ background: 'transparent', color: COLORS.danger, border: `1.5px solid ${COLORS.danger}`, borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop: 14, background: COLORS.infoLight, border: `1px solid ${COLORS.info}33`, borderRadius: 8, padding: '10px 14px', fontSize: 11, color: COLORS.info, lineHeight: 1.6 }}>
            <strong>ℹ Note:</strong> Only Nodal Officer, Technical Officer, and Expert Committee roles can be created here. Category assignment determines which application types are routed to each officer.
          </div>
        </div>

        {/* Add Officer panel */}
        {showAdd && (
          <div style={{ width: 360, flexShrink: 0 }}>
            <div style={panelCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 }}>SYSTEM ADMIN</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif" }}>Add New Officer</div>
                </div>
                <button onClick={cancelAdd} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: COLORS.textMuted, lineHeight: 1, padding: 0 }}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                <div>
                  <label style={mLabel}>Role <span style={{ color: COLORS.danger }}>*</span></label>
                  <select value={newRoleCode} onChange={(e) => setNewRoleCode(e.target.value)} style={{ ...mInput, cursor: 'pointer' }}>
                    {addRoles.map((r) => <option key={r.roleCode} value={r.roleCode}>{r.roleName}</option>)}
                  </select>
                </div>
                <div>
                  <label style={mLabel}>Application Categories <span style={{ color: COLORS.danger }}>*</span></label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 6, background: COLORS.bg }}>
                    {ALL_CATEGORIES.map(cat => (
                      <label key={cat.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: newCategories.includes(cat.value) ? COLORS.primary : COLORS.text, background: newCategories.includes(cat.value) ? COLORS.primaryLight : 'transparent', padding: '5px 10px', borderRadius: 6, border: `1px solid ${newCategories.includes(cat.value) ? COLORS.primary : COLORS.border}`, userSelect: 'none' }}>
                        <input type="checkbox" checked={newCategories.includes(cat.value)} onChange={() => toggleCategory(cat.value)} style={{ accentColor: COLORS.primary }} />
                        {cat.label}
                      </label>
                    ))}
                  </div>
                  {newCategories.length === 0 && <div style={{ fontSize: 11, color: COLORS.danger, marginTop: 4 }}>Select at least one category</div>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
                <button onClick={handleAddOfficer} disabled={adding}
                  style={{ flex: 1, padding: '9px 0', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.7 : 1 }}>
                  {adding ? 'Creating…' : 'Create Officer'}
                </button>
                <button onClick={cancelAdd}
                  style={{ padding: '9px 14px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
