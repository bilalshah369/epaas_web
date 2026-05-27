import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { COLORS, S } from '@/utils/colors';
import { resolveFoodCategory } from '@/utils/docResolver';
import { fetchECPending, ecForwardToTechnicalOfficer, ecReject } from '@/services/ec.service';
import { api } from '@/services/api';
import type { Application } from '@/services/application.service';

const MEETING = {
  id:      'EC-2026-07.15',
  date:    '15 Jul 2026',
  venue:   'FSSAI Conference Room B, New Delhi',
  members: 'Dr. R. Sharma (Chair), Dr. A. Gupta, Dr. P. Mehta, Prof. S. Nair, Dr. T. Rao',
  quorum:  '4 members present',
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ECAgenda() {
  const navigate   = useNavigate();
  const fileRef    = useRef<HTMLInputElement>(null);

  const [apps,         setApps]         = useState<Application[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [agendaAction, setAgendaAction] = useState<'start' | 'reject' | 'notes'>('start');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  useEffect(() => {
    fetchECPending().then((data) => { setApps(data); if (data.length) setSelectedId(data[0].id); }).finally(() => setLoading(false));
  }, []);

  const selectedApp = apps.find((a) => a.id === selectedId) ?? null;

  async function handleSubmitDecision() {
    if (!selectedId) { toast.error('Select an application from the agenda first'); return; }
    if (agendaAction === 'notes') {
      if (!meetingNotes.trim()) { toast.error('Please enter meeting notes before submitting'); return; }
      toast.success('Meeting notes recorded successfully.');
      return;
    }
    if (agendaAction === 'reject' && !meetingNotes.trim()) {
      toast.error('Please enter grounds for rejection in the Meeting Notes field');
      return;
    }
    setSubmitting(true);
    try {
      if (agendaAction === 'start') {
        await ecForwardToTechnicalOfficer(selectedId);
        toast.success(`${selectedApp?.referenceNumber} — EC recommended approval. Forwarded to Technical Officer.`);
      } else {
        await ecReject(selectedId, meetingNotes || 'EC decision: Rejected in committee meeting');
        toast.success(`${selectedApp?.referenceNumber} — Rejected by Expert Committee.`);
      }
      const updated = await fetchECPending();
      setApps(updated);
      setSelectedId(updated.length ? updated[0].id : null);
      setMeetingNotes('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Action failed');
    } finally { setSubmitting(false); }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB'); return; }
    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!allowed.includes(file.type)) { toast.error('Only PDF, PNG, JPG files are allowed'); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<{ storedName: string }>('/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadedFile(file.name);
      toast.success(`EC minutes uploaded: ${file.name}`);
      return data.storedName;
    } catch {
      toast.error('Upload failed — please try again');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={S.pageDesc}>View scheduled EC meeting details, manage agenda items, and record session outcomes.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left — Meeting Details + Agenda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Meeting details */}
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${COLORS.border}` }}>Meeting Details</div>
            {([
              ['Meeting ID',      MEETING.id],
              ['Date',            MEETING.date],
              ['Venue',           MEETING.venue],
              ['Members Present', MEETING.members],
              ['Quorum',          MEETING.quorum],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 12 }}>
                <span style={{ color: COLORS.textMuted, width: 130, flexShrink: 0, fontWeight: 500 }}>{k}</span>
                <span style={{ fontWeight: 600, color: COLORS.text, flex: 1 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Application Agenda — click to select */}
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Application Agenda ({apps.length})</div>
              <span style={{ fontSize: 10, color: COLORS.textMuted }}>Click to select for decision</span>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', color: COLORS.textMuted, padding: '20px 0', fontSize: 12 }}>Loading…</div>
            ) : apps.length === 0 ? (
              <div style={{ textAlign: 'center', color: COLORS.textMuted, padding: '20px 0', fontSize: 12 }}>No applications pending EC review.</div>
            ) : apps.map((a, i) => {
              const selected = a.id === selectedId;
              return (
                <div key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  style={{ border: `2px solid ${selected ? COLORS.primary : COLORS.border}`, borderRadius: 6, padding: 10, marginBottom: 8, cursor: 'pointer', background: selected ? COLORS.primaryLight : COLORS.white, transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: selected ? COLORS.primary : COLORS.text }}>{i + 1}. {a.referenceNumber}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, background: COLORS.primaryLight, color: COLORS.primary, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{a.applicationType}</span>
                      {selected && <span style={{ fontSize: 10, background: COLORS.primary, color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>SELECTED</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{a.companyName} — {a.productName ?? resolveFoodCategory(a)}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Submitted: {fmtDate(a.submittedAt)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — Agenda Actions + Minutes Upload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Selected app banner */}
          {selectedApp && (
            <div style={{ background: COLORS.primaryLight, border: `1px solid ${COLORS.primary}33`, borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>Decision will apply to</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{selectedApp.referenceNumber}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>{selectedApp.companyName} — {selectedApp.applicationType}</div>
            </div>
          )}

          {/* Agenda Actions */}
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Agenda Actions</div>
            {([
              { key: 'start',  label: 'Recommend Approval — forward to Nodal Point B' },
              { key: 'reject', label: 'Recommend Rejection — close with EC grounds'    },
              { key: 'notes',  label: 'Add Notes — record observations only'           },
            ] as { key: 'start' | 'reject' | 'notes'; label: string }[]).map((opt) => (
              <div key={opt.key} onClick={() => setAgendaAction(opt.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 8, border: `1.5px solid ${agendaAction === opt.key ? COLORS.primary : COLORS.border}`, borderRadius: 6, cursor: 'pointer', background: agendaAction === opt.key ? COLORS.primaryLight : COLORS.white, transition: 'all 0.15s' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${agendaAction === opt.key ? COLORS.primary : COLORS.border}`, background: agendaAction === opt.key ? COLORS.primary : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {agendaAction === opt.key && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <span style={{ fontSize: 12, color: agendaAction === opt.key ? COLORS.primary : COLORS.text, fontWeight: agendaAction === opt.key ? 600 : 400 }}>{opt.label}</span>
              </div>
            ))}

            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 6 }}>
                {agendaAction === 'reject' ? 'Grounds for Rejection *' : 'Meeting Notes'}
              </label>
              <textarea rows={4} value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder={agendaAction === 'reject' ? 'State grounds for EC rejection…' : 'Enter meeting notes, observations…'}
                style={{ width: '100%', border: `1px solid ${agendaAction === 'reject' && !meetingNotes.trim() ? COLORS.danger : COLORS.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 12, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <button
              style={{ marginTop: 12, width: '100%', background: agendaAction === 'reject' ? COLORS.danger : COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: submitting || !selectedId ? 'not-allowed' : 'pointer', opacity: submitting || !selectedId ? 0.6 : 1 }}
              disabled={submitting || !selectedId}
              onClick={handleSubmitDecision}>
              {submitting ? 'Submitting…'
                : agendaAction === 'start'  ? '✅ Submit — Recommend Approval'
                : agendaAction === 'reject' ? '✗ Submit — Recommend Rejection'
                : '📝 Save Meeting Notes'}
            </button>

            {!selectedId && (
              <div style={{ marginTop: 8, fontSize: 11, color: COLORS.warning, textAlign: 'center' }}>Select an application from the agenda list to enable this button</div>
            )}
          </div>

          {/* Minutes Upload */}
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Upload EC Minutes</div>
            <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={handleFileChange} />
            <div
              style={{ border: `2px dashed ${uploadedFile ? COLORS.success : COLORS.border}`, borderRadius: 8, padding: '24px 20px', textAlign: 'center', background: uploadedFile ? COLORS.successLight : COLORS.bg, marginBottom: 12, transition: 'all 0.2s' }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && fileRef.current) { const dt = new DataTransfer(); dt.items.add(f); fileRef.current.files = dt.files; fileRef.current.dispatchEvent(new Event('change', { bubbles: true })); } }}>
              {uploadedFile ? (
                <>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                  <div style={{ fontWeight: 600, fontSize: 12, color: COLORS.success, marginBottom: 4 }}>{uploadedFile}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 12 }}>Uploaded successfully</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>⬆️</div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Upload EC decision or minutes</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 14 }}>PDF, PNG, JPG — up to 10 MB. Drag &amp; drop or click.</div>
                </>
              )}
              <button
                style={{ background: uploadedFile ? COLORS.success : COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 20px', fontSize: 12, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}
                disabled={uploading}
                onClick={() => fileRef.current?.click()}>
                {uploading ? 'Uploading…' : uploadedFile ? 'Replace File' : 'Choose File'}
              </button>
            </div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.6 }}>
              Uploaded minutes are stored on the server and accessible to Nodal Officers.
            </div>
          </div>

          {/* Quick links */}
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Quick Actions</div>
            {[
              { label: 'View Case Dockets',    path: '/ec/dockets' },
              { label: 'Go to Search Console', path: '/ec/search'  },
              { label: 'View Reports',         path: '/ec/reports' },
            ].map((link) => (
              <div key={link.path} onClick={() => navigate(link.path)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}`, cursor: 'pointer' }}>
                <span style={{ fontSize: 12, color: COLORS.primary, fontWeight: 500 }}>{link.label}</span>
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>→</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
