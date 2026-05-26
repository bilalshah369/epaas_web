import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { COLORS } from '@/utils/colors';
import {
  fetchAdminCirculars, createCircular, updateCircular, deleteCircular,
  fetchAdminNotifications, createNotification, updateNotification, deleteNotification,
  type Circular, type Notification,
} from '@/services/content.service';

const CIRCULAR_TAGS = ['NSF', 'CA', 'AA', 'rPET', 'General'];
const NOTIF_TYPES   = ['Alert', 'Meeting', 'Approval', 'Compliance', 'Support', 'Update'];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: 12, border: `1.5px solid ${COLORS.border}`,
  borderRadius: 6, outline: 'none', fontFamily: "'Noto Sans','Segoe UI',sans-serif", boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700, color: COLORS.textMuted,
  textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
};

// ── Circular modal ─────────────────────────────────────────────────────────────
function CircularModal({ item, onClose, onSaved }: { item: Circular | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = Boolean(item?.id);
  const isCopy = Boolean(item && !item.id);
  const [form, setForm] = useState({
    date: item?.date ?? '',
    refNumber: item?.refNumber ?? '',
    title: item?.title ?? '',
    tag: item?.tag ?? 'General',
    published: item?.published ?? true,
    sortOrder: item?.sortOrder ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.type === 'number' ? Number(e.target.value) : e.target.value }));

  async function handleSave() {
    if (!form.date || !form.refNumber || !form.title) { toast.error('Date, Ref No and Title are required'); return; }
    setSaving(true);
    try {
      if (isEdit) await updateCircular(item!.id, form);
      else        await createCircular(form);
      toast.success(isEdit ? 'Circular updated' : 'Circular created');
      onSaved();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  }

  const modalTitle = isEdit ? 'Edit Circular' : isCopy ? 'Copy Circular' : 'New Circular';

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500 }} />
      <div style={{ position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 520, maxHeight: '80vh', background: '#fff', borderRadius: 12, zIndex: 501, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
        <div style={{ background: COLORS.primary, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{modalTitle}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Date <span style={{ color: COLORS.danger }}>*</span></label>
              <input value={form.date} onChange={set('date')} placeholder="e.g. 10 Apr 2026" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Reference No. <span style={{ color: COLORS.danger }}>*</span></label>
              <input value={form.refNumber} onChange={set('refNumber')} placeholder="FSSAI/EPAAS/2026/CIR-XX" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Title <span style={{ color: COLORS.danger }}>*</span></label>
            <input value={form.title} onChange={set('title')} placeholder="Circular title…" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Tag</label>
              <select value={form.tag} onChange={set('tag')} style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 6, padding: '8px 34px 8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'Noto Sans', 'Segoe UI', sans-serif", backgroundColor: '#f7f8fc', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23555' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat' as const, backgroundPosition: 'right 10px center', backgroundSize: '12px', color: 'var(--color-text)', cursor: 'pointer', appearance: 'none' as const, transition: 'border-color 0.15s, box-shadow 0.15s' }}>
                {CIRCULAR_TAGS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={set('sortOrder')} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.published} onChange={set('published')} style={{ width: 14, height: 14 }} />
                Published
              </label>
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 6, padding: '7px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </>
  );
}

// ── Notification modal ─────────────────────────────────────────────────────────
function NotificationModal({ item, onClose, onSaved }: { item: Notification | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = Boolean(item?.id);
  const isCopy = Boolean(item && !item.id);
  const [form, setForm] = useState({
    date: item?.date ?? '',
    title: item?.title ?? '',
    type: item?.type ?? 'Update',
    body: item?.body ?? '',
    published: item?.published ?? true,
    sortOrder: item?.sortOrder ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.type === 'number' ? Number(e.target.value) : e.target.value }));

  async function handleSave() {
    if (!form.date || !form.title) { toast.error('Date and Title are required'); return; }
    setSaving(true);
    try {
      if (isEdit) await updateNotification(item!.id, { ...form, body: form.body || null });
      else        await createNotification({ ...form, body: form.body || null });
      toast.success(isEdit ? 'Notification updated' : 'Notification created');
      onSaved();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  }

  const modalTitle = isEdit ? 'Edit Notification' : isCopy ? 'Copy Notification' : 'New Notification';

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500 }} />
      <div style={{ position: 'fixed', top: '8%', left: '50%', transform: 'translateX(-50%)', width: 520, maxHeight: '82vh', background: '#fff', borderRadius: 12, zIndex: 501, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
        <div style={{ background: COLORS.primary, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{modalTitle}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Date <span style={{ color: COLORS.danger }}>*</span></label>
              <input value={form.date} onChange={set('date')} placeholder="e.g. 12 Apr 2026" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select value={form.type} onChange={set('type')} style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 6, padding: '8px 34px 8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'Noto Sans', 'Segoe UI', sans-serif", backgroundColor: '#f7f8fc', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23555' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat' as const, backgroundPosition: 'right 10px center', backgroundSize: '12px', color: 'var(--color-text)', cursor: 'pointer', appearance: 'none' as const, transition: 'border-color 0.15s, box-shadow 0.15s' }}>
                {NOTIF_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Title <span style={{ color: COLORS.danger }}>*</span></label>
            <input value={form.title} onChange={set('title')} placeholder="Notification title…" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Body <span style={{ fontSize: 9, color: COLORS.textMuted }}>(for Alert type — shown as the highlighted box)</span></label>
            <textarea value={form.body ?? ''} onChange={set('body')} placeholder="Alert body text…" rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <label style={labelStyle}>Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={set('sortOrder')} style={inputStyle} />
            </div>
            <div style={{ paddingBottom: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.published} onChange={set('published')} style={{ width: 14, height: 14 }} />
                Published
              </label>
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderRadius: 6, padding: '7px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminContent() {
  const [tab, setTab]                   = useState<'circulars' | 'notifications'>('circulars');
  const [circulars, setCirculars]       = useState<Circular[]>([]);
  const [notifs, setNotifs]             = useState<Notification[]>([]);
  const [loading, setLoading]           = useState(true);
  const [circModal, setCircModal]       = useState<{ open: boolean; item: Circular | null }>({ open: false, item: null });
  const [notifModal, setNotifModal]     = useState<{ open: boolean; item: Notification | null }>({ open: false, item: null });

  async function load() {
    setLoading(true);
    try {
      const [c, n] = await Promise.all([fetchAdminCirculars(), fetchAdminNotifications()]);
      setCirculars(c);
      setNotifs(n);
    } catch { toast.error('Failed to load content'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleDeleteCircular(id: string) {
    if (!window.confirm('Delete this circular?')) return;
    try { await deleteCircular(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  }

  async function handleDeleteNotif(id: string) {
    if (!window.confirm('Delete this notification?')) return;
    try { await deleteNotification(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  }

  const th: React.CSSProperties = { textAlign: 'left', padding: '9px 12px', background: COLORS.bg, borderBottom: `2px solid ${COLORS.border}`, fontSize: 11, fontWeight: 700, color: COLORS.textMuted, whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '9px 12px', borderBottom: `1px solid ${COLORS.border}`, fontSize: 12, verticalAlign: 'top' };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, fontFamily: "'Libre Baskerville',Georgia,serif", marginBottom: 4 }}>
          Content Manager
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>
          Manage circulars and public notifications displayed on the landing page.
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${COLORS.border}`, marginBottom: 20 }}>
        {(['circulars', 'notifications'] as const).map((t) => (
          <div key={t} onClick={() => setTab(t)}
            style={{ padding: '9px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderBottom: tab === t ? `2px solid ${COLORS.primary}` : '2px solid transparent', marginBottom: -2, color: tab === t ? COLORS.primary : COLORS.textMuted, textTransform: 'capitalize', transition: 'all 0.15s' }}>
            {t === 'circulars' ? '📋 Latest Circulars' : '🔔 Public Notifications'}
          </div>
        ))}
      </div>

      {/* ── Circulars tab ── */}
      {tab === 'circulars' && (
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>
              Circulars <span style={{ fontSize: 11, fontWeight: 400, color: COLORS.textMuted, marginLeft: 6 }}>{circulars.length} total</span>
            </div>
            <button onClick={() => setCircModal({ open: true, item: null })}
              style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              + Add Circular
            </button>
          </div>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>Loading…</div>
          ) : circulars.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>No circulars yet. Click "Add Circular" to create one.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Date</th>
                    <th style={th}>Ref No.</th>
                    <th style={th}>Title</th>
                    <th style={th}>Tag</th>
                    <th style={th}>Order</th>
                    <th style={th}>Status</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {circulars.map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                      <td style={td}>{c.date}</td>
                      <td style={{ ...td, fontSize: 11, color: COLORS.textMuted }}>{c.refNumber}</td>
                      <td style={{ ...td, maxWidth: 320 }}>{c.title}</td>
                      <td style={td}>
                        <span style={{ fontSize: 10, background: COLORS.primaryLight, color: COLORS.primary, padding: '2px 7px', borderRadius: 3, fontWeight: 700 }}>{c.tag}</span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>{c.sortOrder}</td>
                      <td style={td}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: c.published ? COLORS.successLight : COLORS.bg, color: c.published ? COLORS.success : COLORS.textMuted }}>
                          {c.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        <button onClick={() => setCircModal({ open: true, item: c })}
                          style={{ background: 'transparent', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer', marginRight: 5 }}>
                          Edit
                        </button>
                        <button onClick={() => setCircModal({ open: true, item: { ...c, id: '' } })}
                          style={{ background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer', marginRight: 5 }}>
                          Copy
                        </button>
                        <button onClick={() => handleDeleteCircular(c.id)}
                          style={{ background: 'transparent', color: COLORS.danger, border: `1px solid ${COLORS.danger}`, borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Notifications tab ── */}
      {tab === 'notifications' && (
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>
              Notifications <span style={{ fontSize: 11, fontWeight: 400, color: COLORS.textMuted, marginLeft: 6 }}>{notifs.length} total</span>
            </div>
            <button onClick={() => setNotifModal({ open: true, item: null })}
              style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              + Add Notification
            </button>
          </div>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>Loading…</div>
          ) : notifs.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>No notifications yet. Click "Add Notification" to create one.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Date</th>
                    <th style={th}>Type</th>
                    <th style={th}>Title</th>
                    <th style={th}>Body</th>
                    <th style={th}>Order</th>
                    <th style={th}>Status</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notifs.map((n, i) => (
                    <tr key={n.id} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                      <td style={td}>{n.date}</td>
                      <td style={td}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: n.type === 'Alert' ? '#FEF3C7' : COLORS.primaryLight, color: n.type === 'Alert' ? '#92400E' : COLORS.primary }}>
                          {n.type}
                        </span>
                      </td>
                      <td style={{ ...td, maxWidth: 260 }}>{n.title}</td>
                      <td style={{ ...td, maxWidth: 200, fontSize: 11, color: COLORS.textMuted }}>
                        {n.body ? n.body.slice(0, 60) + (n.body.length > 60 ? '…' : '') : '—'}
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>{n.sortOrder}</td>
                      <td style={td}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: n.published ? COLORS.successLight : COLORS.bg, color: n.published ? COLORS.success : COLORS.textMuted }}>
                          {n.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        <button onClick={() => setNotifModal({ open: true, item: n })}
                          style={{ background: 'transparent', color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer', marginRight: 5 }}>
                          Edit
                        </button>
                        <button onClick={() => setNotifModal({ open: true, item: { ...n, id: '' } })}
                          style={{ background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer', marginRight: 5 }}>
                          Copy
                        </button>
                        <button onClick={() => handleDeleteNotif(n.id)}
                          style={{ background: 'transparent', color: COLORS.danger, border: `1px solid ${COLORS.danger}`, borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {circModal.open  && <CircularModal     item={circModal.item}  onClose={() => setCircModal({ open: false, item: null })}  onSaved={() => { setCircModal({ open: false, item: null });  load(); }} />}
      {notifModal.open && <NotificationModal item={notifModal.item} onClose={() => setNotifModal({ open: false, item: null })} onSaved={() => { setNotifModal({ open: false, item: null }); load(); }} />}
    </div>
  );
}
