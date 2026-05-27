import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { COLORS, S } from '@/utils/colors';
import StatusBadge from '@/components/ui/StatusBadge';
import { fetchAdminAll, fetchAuditTrail, type TimelineEvent } from '@/services/admin.service';
import type { Application } from '@/services/application.service';

const ROLE_COLORS: Record<string, string> = {
  Applicant:        '#6366F1',
  System:           COLORS.textMuted,
  NodalOfficerA:    COLORS.primary,
  TechnicalOfficer: COLORS.info,
  ExpertCommittee:  '#B45309',
  'Nodal Point B':  '#6D28D9',
  CEO:              COLORS.danger,
  Chairperson:      '#1E40AF',
};

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    '  ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function daysSince(iso: string | null | undefined) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

const ROLE_FILTER_OPTIONS = ['All Roles', 'Applicant', 'NodalOfficerA', 'TechnicalOfficer', 'ExpertCommittee', 'CEO', 'Chairperson', 'System'];

export default function AdminAuditTrail() {
  const [searchParams] = useSearchParams();

  const [refInput,    setRefInput]    = useState('');
  const [apps,        setApps]        = useState<Application[]>([]);
  const [suggestions, setSuggestions] = useState<Application[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [timeline,    setTimeline]    = useState<TimelineEvent[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [appsLoaded,  setAppsLoaded]  = useState(false);

  // Filter state
  const [fRole,    setFRole]    = useState('All Roles');
  const [fFrom,    setFFrom]    = useState('');
  const [fTo,      setFTo]      = useState('');
  const [filtered, setFiltered] = useState<TimelineEvent[]>([]);
  const [filterOn, setFilterOn] = useState(false);

  // Load all apps on mount for reference number autocomplete
  useEffect(() => {
    fetchAdminAll()
      .then((data) => { setApps(data); setAppsLoaded(true); })
      .catch(() => {});
  }, []);

  // If navigated from monitor with ?appId=, auto-load
  useEffect(() => {
    const appId = searchParams.get('appId');
    if (appId && appsLoaded) {
      const app = apps.find((a) => a.id === appId);
      if (app) {
        setSelectedApp(app);
        setRefInput(app.referenceNumber);
        loadTrail(appId);
      }
    }
  }, [searchParams, appsLoaded, apps]);

  const loadTrail = useCallback(async (appId: string) => {
    setLoading(true);
    setTimeline([]); setFiltered([]); setFilterOn(false);
    try {
      const result = await fetchAuditTrail(appId);
      setSelectedApp(result.application);
      setTimeline(result.timeline);
      setFiltered(result.timeline);
    } catch {
      toast.error('Could not load audit trail');
    } finally { setLoading(false); }
  }, []);

  function handleRefChange(val: string) {
    setRefInput(val);
    if (val.trim().length < 2) { setSuggestions([]); setShowSuggest(false); return; }
    const s = apps.filter((a) => a.referenceNumber.toLowerCase().includes(val.toLowerCase())).slice(0, 8);
    setSuggestions(s); setShowSuggest(true);
  }

  function selectApp(app: Application) {
    setRefInput(app.referenceNumber); setSuggestions([]); setShowSuggest(false);
    setSelectedApp(app); loadTrail(app.id);
  }

  function applyTimelineFilter() {
    let r = [...timeline];
    if (fRole !== 'All Roles') r = r.filter((e) => e.role === fRole);
    if (fFrom)  r = r.filter((e) => new Date(e.dt) >= new Date(fFrom));
    if (fTo)    r = r.filter((e) => new Date(e.dt) <= new Date(fTo + 'T23:59:59'));
    setFiltered(r); setFilterOn(true);
  }
  function resetTimelineFilter() {
    setFRole('All Roles'); setFFrom(''); setFTo('');
    setFiltered(timeline); setFilterOn(false);
  }

  function exportTrailCSV() {
    if (!filtered.length) return;
    const header = ['#', 'Date & Time', 'Stage / Event', 'Actor', 'Role', 'Notes'];
    const lines  = [header.join(','), ...filtered.map((e, i) => [
      i + 1,
      JSON.stringify(fmtDateTime(e.dt)),
      JSON.stringify(e.stage),
      JSON.stringify(e.actor),
      JSON.stringify(e.role),
      JSON.stringify(e.notes),
    ].join(','))];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = `audit_trail_${selectedApp?.referenceNumber ?? 'export'}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={S.pageDesc}>Full lifecycle event log for any application in the system.</div>
      </div>

      {/* Search box */}
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 18, marginBottom: 16, position: 'relative' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Search Application</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, display: 'block', marginBottom: 4 }}>Application Ref No.</label>
            <input
              value={refInput}
              onChange={(e) => handleRefChange(e.target.value)}
              onFocus={() => refInput.length >= 2 && setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 180)}
              placeholder="Start typing EPAAS-… or reference number"
              style={{ padding: '8px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, width: '100%', boxSizing: 'border-box', background: COLORS.bg }}
            />
            {showSuggest && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', zIndex: 100, marginTop: 2 }}>
                {suggestions.map((a) => (
                  <div key={a.id} onMouseDown={() => selectApp(a)}
                    style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 12, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 10, alignItems: 'center' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.bg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ fontWeight: 700, color: COLORS.primary }}>{a.referenceNumber}</span>
                    <span style={{ color: COLORS.textMuted }}>{a.companyName}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: COLORS.textMuted }}>{a.stage}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => { const found = apps.find((a) => a.referenceNumber.toLowerCase() === refInput.trim().toLowerCase()); if (found) selectApp(found); else if (refInput.trim()) toast.error('Application not found'); }}
            disabled={loading}
            style={{ padding: '8px 24px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Loading…' : 'Load Trail'}
          </button>
        </div>
      </div>

      {/* Application info card */}
      {selectedApp && (
        <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 18px', marginBottom: 14, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div><span style={{ fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Ref No.</span><div style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary }}>{selectedApp.referenceNumber}</div></div>
          <div><span style={{ fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Company</span><div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{selectedApp.companyName}</div></div>
          <div><span style={{ fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Product</span><div style={{ fontSize: 12, color: COLORS.text }}>{selectedApp.productName ?? '—'}</div></div>
          <div><span style={{ fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Type</span><div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{selectedApp.applicationType}</div></div>
          <div><span style={{ fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Stage</span><div style={{ marginTop: 3 }}><StatusBadge status={selectedApp.stage} /></div></div>
          <div><span style={{ fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Submitted</span><div style={{ fontSize: 12, color: COLORS.text }}>{fmtDate(selectedApp.submittedAt)}</div></div>
          <div><span style={{ fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Days Elapsed</span><div style={{ fontSize: 12, fontWeight: 700, color: (daysSince(selectedApp.submittedAt) ?? 0) > 45 ? COLORS.danger : COLORS.text }}>{daysSince(selectedApp.submittedAt) ?? '—'} days</div></div>
        </div>
      )}

      {/* Timeline filter bar */}
      {timeline.length > 0 && (
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 12, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Filter by Role</label>
            <select value={fRole} onChange={(e) => setFRole(e.target.value)} style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 6, padding: '8px 34px 8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'Noto Sans', 'Segoe UI', sans-serif", backgroundColor: '#f7f8fc', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23555' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat' as const, backgroundPosition: 'right 10px center', backgroundSize: '12px', color: 'var(--color-text)', cursor: 'pointer', appearance: 'none' as const, transition: 'border-color 0.15s, box-shadow 0.15s' }}>
              {ROLE_FILTER_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>From Date</label>
            <input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, background: COLORS.bg }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>To Date</label>
            <input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, background: COLORS.bg }} />
          </div>
          <button onClick={applyTimelineFilter} style={{ padding: '6px 16px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Apply</button>
          <button onClick={resetTimelineFilter} style={{ padding: '6px 12px', background: 'transparent', color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Reset</button>
          <button onClick={exportTrailCSV} style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer' }}>⬇ Export</button>
        </div>
      )}

      {/* Timeline table */}
      {(loading || timeline.length > 0) && (
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Event Log {filterOn ? `— ${filtered.length} of ${timeline.length}` : `— ${timeline.length}`} events
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['#', 'Date & Time', 'Stage / Event', 'Actor', 'Role', 'Notes / Action Taken'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', padding: '40px 0', color: COLORS.textMuted }}>Loading events…</td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', padding: '40px 0', color: COLORS.textMuted }}>No events match the filter.</td></tr>}
                {filtered.map((e, i) => {
                  const roleColor = ROLE_COLORS[e.role] ?? COLORS.textMuted;
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : COLORS.bg }}>
                      <td style={{ ...S.td, fontWeight: 600, color: COLORS.textMuted, width: 36, textAlign: 'center' }}>{i + 1}</td>
                      <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 11, whiteSpace: 'nowrap', color: COLORS.textMuted }}>{fmtDateTime(e.dt)}</td>
                      <td style={{ ...S.td, fontWeight: 700, color: COLORS.text }}>{e.stage}</td>
                      <td style={{ ...S.td, fontWeight: 600 }}>{e.actor}</td>
                      <td style={S.td}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: roleColor + '18', color: roleColor }}>
                          {e.role}
                        </span>
                      </td>
                      <td style={{ ...S.td, maxWidth: 300, color: COLORS.textMuted, lineHeight: 1.5 }}>{e.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !selectedApp && (
        <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '48px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📜</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>No application selected</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>Enter an application reference number above to load its full event history.</div>
        </div>
      )}
    </div>
  );
}
