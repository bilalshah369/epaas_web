// App Shell — utility bar + sidebar + topbar + page content.
// Mirrors the EPAASApp shell layout (mock App.jsx L28044).
import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { COLORS } from '@/utils/colors';
import PalettePicker from '@/components/ui/PalettePicker';

export interface MenuItem {
  icon:     string;
  label:    string;
  path:     string;
  children?: Array<{ icon: string; label: string; path: string }>;
}

interface Props {
  menu: MenuItem[];
}

function adjustFontSize(delta: number) {
  const cur = parseFloat(getComputedStyle(document.documentElement).fontSize);
  document.documentElement.style.fontSize = `${Math.min(20, Math.max(12, cur + delta))}px`;
}

export default function AppShell({ menu }: Props) {
  const { user, logout } = useAuthStore();
  const navigate         = useNavigate();
  const location         = useLocation();
  const navRef           = useRef<HTMLDivElement>(null);
  const [expanded,      setExpanded]      = useState<Record<string, boolean>>({});
  const [userMenuOpen,  setUserMenuOpen]  = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [helpOpen,      setHelpOpen]      = useState(false);
  const [readIds,       setReadIds]       = useState<Set<number>>(new Set());
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef    = useRef<HTMLDivElement>(null);
  const helpRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current  && !notifRef.current.contains(e.target as Node))  setNotifOpen(false);
      if (helpRef.current   && !helpRef.current.contains(e.target as Node))   setHelpOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allItems = menu.flatMap((m) => m.children ? [m, ...m.children] : [m]);
  const activeLabel = allItems.find((m) => location.pathname.startsWith(m.path))?.label ?? 'Dashboard';

  function handleLogout() {
    logout();
    toast.success('Logged out successfully');
    navigate('/', { replace: true });
  }

  function toggleMenu(path: string) {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  }

  const initials = (user?.username ?? 'U')
    .split(/[\s.]+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "'Noto Sans','Segoe UI',sans-serif", background: COLORS.bg, overflow: 'hidden' }}>

      {/* ── Utility bar ──────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '4px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <img src="https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg" alt="India Flag" style={{ height: 14, width: 22, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: '#444' }}>Ministry of Health &amp; Family Welfare, Government of India</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 10, color: '#666' }}>Font:</span>
          {([['A−', -1], ['A', 0], ['A+', 1]] as [string, number][]).map(([t, d], i) => (
            <button key={i} onClick={() => d !== 0 && adjustFontSize(d)}
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

      {/* ── App shell ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <div style={{ width: 270, background: COLORS.sidebar, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'hidden' }}>

          {/* Logo — same height as topbar (56px) */}
          <div
            onClick={() => navigate('/')}
            style={{ height: 56, borderBottom: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, gap: 0, flexDirection: 'column' }}
          >
            <span style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: 3, lineHeight: 1, fontFamily: 'Georgia, serif' }}>E-PAAS</span>
            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.7, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.4, marginTop: 3 }}>
              Electronic Product &amp; Claim<br />Approval Application System
            </span>
          </div>

          {/* Role badge */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{user?.username}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{user?.roleName}</div>
            </div>
          </div>

          {/* Nav */}
          <div ref={navRef} style={{ flex: 1, overflowY: 'auto', position: 'relative' }} className="sidebar-scroll">
            <div style={{ padding: '8px 0' }}>
              {menu.map((item) => {
                const hasChildren = Boolean(item.children?.length);
                const childActive = hasChildren && item.children!.some((c) => location.pathname.startsWith(c.path));
                const isActive    = location.pathname.startsWith(item.path) && !hasChildren;
                const isExpanded  = expanded[item.path] ?? childActive;

                return (
                  <div key={item.path}>
                    <div
                      onClick={() => hasChildren ? toggleMenu(item.path) : navigate(item.path)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: (isActive || childActive) ? 600 : 400, color: (isActive || childActive) ? '#FFFFFF' : 'rgba(255,255,255,0.68)', background: (isActive || childActive) ? 'rgba(255,255,255,0.14)' : 'transparent', borderLeft: (isActive || childActive) ? '3px solid #FFFFFF' : '3px solid transparent', transition: 'all 0.15s' }}
                    >
                      <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{item.icon}</span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {hasChildren && <span style={{ fontSize: 10, opacity: 0.6 }}>{isExpanded ? '▾' : '▸'}</span>}
                    </div>
                    {hasChildren && isExpanded && item.children!.map((child) => {
                      const childIsActive = location.pathname.startsWith(child.path);
                      return (
                        <div
                          key={child.path}
                          onClick={() => navigate(child.path)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px 8px 30px', cursor: 'pointer', fontSize: 12, fontWeight: childIsActive ? 600 : 400, color: childIsActive ? '#FFFFFF' : 'rgba(255,255,255,0.68)', background: childIsActive ? 'rgba(255,255,255,0.14)' : 'transparent', borderLeft: childIsActive ? '3px solid #FFFFFF' : '3px solid transparent', transition: 'all 0.15s' }}
                        >
                          <span style={{ fontSize: 12, width: 18, textAlign: 'center' }}>{child.icon}</span>
                          <span>{child.label}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scroll hint */}
          <div style={{ textAlign: 'center', padding: '4px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => navRef.current?.scrollBy({ top: 80, behavior: 'smooth' })}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 12, padding: '3px 16px', width: '90%' }}
            >
              ▾
            </button>
          </div>

          {/* Logout */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <button
              onClick={handleLogout}
              style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '8px 0', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', cursor: 'pointer', letterSpacing: 0.3 }}
            >
              ← Logout
            </button>
          </div>
        </div>

        {/* ── Main content area ─────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Topbar */}
          <div style={{ background: COLORS.white, borderBottom: `2px solid var(--color-primary-22)`, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexShrink: 0 }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 180 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 }}>
                {user?.roleName ?? 'E-PAAS'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, lineHeight: 1.2 }}>
                {activeLabel}
              </div>
            </div>

            <div style={{ width: 1, height: 30, background: COLORS.border, flexShrink: 0 }} />

            {/* Right cluster */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
              {/* Help */}
              <div ref={helpRef} style={{ position: 'relative' }}>
                <div
                  onClick={() => { setHelpOpen((v) => !v); setNotifOpen(false); setUserMenuOpen(false); }}
                  title="Help & Documentation"
                  style={{ width: 34, height: 34, borderRadius: 8, border: `1.5px solid ${helpOpen ? COLORS.primary : COLORS.border}`, background: helpOpen ? COLORS.primaryLight : COLORS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15, color: helpOpen ? COLORS.primary : COLORS.textMuted, fontWeight: 700, transition: 'all 0.15s' }}
                >
                  ?
                </div>
                {helpOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', width: 280, zIndex: 1000, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>Help &amp; Support</div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>E-PAAS User Documentation</div>
                    </div>
                    {[
                      { icon: '📖', label: 'User Manual',            sub: 'Step-by-step application guide' },
                      { icon: '🎥', label: 'Video Tutorials',        sub: 'Watch how-to videos' },
                      { icon: '❓', label: 'FAQs',                    sub: 'Frequently asked questions' },
                      { icon: '📞', label: 'Contact Support',        sub: 'helpdesk@fssai.gov.in' },
                      { icon: '🐛', label: 'Report an Issue',        sub: 'Report bugs or problems' },
                    ].map((item) => (
                      <div key={item.label}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 16px', cursor: 'pointer', borderBottom: `1px solid ${COLORS.border}` }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.bg)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontSize: 16, marginTop: 1 }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{item.label}</div>
                          <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 1 }}>{item.sub}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: COLORS.textMuted }}>E-PAAS v1.0 · FSSAI 2026</span>
                      <span style={{ fontSize: 10, color: COLORS.primary, fontWeight: 600, cursor: 'pointer' }}>Keyboard shortcuts →</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications */}
              {(() => {
                const NOTIFS = [
                  { id: 1, icon: '📋', title: 'Application Forwarded',   body: 'Your application has been forwarded to Technical Officer.',  time: '2h ago',  type: 'info'    },
                  { id: 2, icon: '⚠️', title: 'Query Received',          body: 'Nodal Officer has raised a query on EPAAS-2026-00001.',       time: '5h ago',  type: 'warning' },
                  { id: 3, icon: '✅', title: 'Application Approved',    body: 'Your application EPAAS-2026-00002 has been approved.',        time: '1d ago',  type: 'success' },
                  { id: 4, icon: '📅', title: 'Extension Granted',       body: 'Your request for extension of time has been approved.',       time: '2d ago',  type: 'info'    },
                ];
                const unread = NOTIFS.filter((n) => !readIds.has(n.id)).length;
                const typeColor: Record<string, string> = { info: COLORS.info, warning: COLORS.warning, success: COLORS.success };
                return (
                  <div ref={notifRef} style={{ position: 'relative' }}>
                    <div
                      onClick={() => { setNotifOpen((v) => !v); setHelpOpen(false); setUserMenuOpen(false); }}
                      title="Notifications"
                      style={{ width: 34, height: 34, borderRadius: 8, border: `1.5px solid ${notifOpen ? COLORS.primary : COLORS.border}`, background: notifOpen ? COLORS.primaryLight : COLORS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={notifOpen ? COLORS.primary : COLORS.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                      {unread > 0 && (
                        <span style={{ position: 'absolute', top: -4, right: -4, background: COLORS.danger, color: '#fff', borderRadius: '50%', fontSize: 9, fontWeight: 700, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>{unread}</span>
                      )}
                    </div>
                    {notifOpen && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', width: 320, zIndex: 1000, overflow: 'hidden' }}>
                        <div style={{ padding: '12px 16px', background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>Notifications</div>
                            {unread > 0 && <div style={{ fontSize: 10, color: COLORS.primary, marginTop: 1 }}>{unread} unread</div>}
                          </div>
                          {unread > 0 && (
                            <button onClick={() => setReadIds(new Set(NOTIFS.map((n) => n.id)))}
                              style={{ background: 'none', border: 'none', fontSize: 11, color: COLORS.primary, cursor: 'pointer', fontWeight: 600 }}>
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                          {NOTIFS.map((n) => {
                            const isUnread = !readIds.has(n.id);
                            return (
                              <div key={n.id}
                                onClick={() => setReadIds((prev) => new Set([...prev, n.id]))}
                                style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, cursor: 'pointer', background: isUnread ? `${typeColor[n.type]}0d` : 'transparent', transition: 'background 0.12s' }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.bg)}
                                onMouseLeave={(e) => (e.currentTarget.style.background = isUnread ? `${typeColor[n.type]}0d` : 'transparent')}
                              >
                                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{n.icon}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                    <span style={{ fontSize: 12, fontWeight: isUnread ? 700 : 500, color: COLORS.text }}>{n.title}</span>
                                    <span style={{ fontSize: 9, color: COLORS.textMuted, flexShrink: 0 }}>{n.time}</span>
                                  </div>
                                  <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.4 }}>{n.body}</div>
                                </div>
                                {isUnread && <div style={{ width: 7, height: 7, borderRadius: '50%', background: typeColor[n.type], flexShrink: 0, marginTop: 5 }} />}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ padding: '10px 16px', textAlign: 'center', borderTop: `1px solid ${COLORS.border}` }}>
                          <span style={{ fontSize: 11, color: COLORS.primary, fontWeight: 600, cursor: 'pointer' }}>View all notifications →</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{ width: 1, height: 28, background: COLORS.border }} />

              {/* User chip + dropdown */}
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <div
                  onClick={() => setUserMenuOpen((v) => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 6px 8px', border: `1.5px solid ${userMenuOpen ? COLORS.primary : COLORS.border}`, borderRadius: 10, cursor: 'pointer', background: userMenuOpen ? COLORS.primaryLight : COLORS.bg, transition: 'all 0.15s' }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${COLORS.primary}, var(--color-primary-dark, #0F2318))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: COLORS.text, whiteSpace: 'nowrap' }}>{user?.username}</div>
                    <div style={{ fontSize: 9, color: COLORS.textMuted, whiteSpace: 'nowrap' }}>{user?.licenseNumber ?? user?.email}</div>
                  </div>
                  <svg style={{ marginLeft: 4, transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 220, zIndex: 1000, overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{ padding: '14px 16px', background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{user?.username}</div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{user?.email}</div>
                      <div style={{ marginTop: 6, display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: COLORS.primaryLight, color: COLORS.primary }}>{user?.roleName}</div>
                    </div>

                    {/* Menu items */}
                    {[
                      { icon: '👤', label: 'My Profile',       action: () => { navigate('/app/profile'); setUserMenuOpen(false); } },
                      { icon: '📋', label: 'My Applications',  action: () => { navigate('/app/dashboard'); setUserMenuOpen(false); } },
                      { icon: '🔒', label: 'Change Password',  action: () => { setUserMenuOpen(false); } },
                    ].map((item) => (
                      <div key={item.label} onClick={item.action}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', fontSize: 13, color: COLORS.text, transition: 'background 0.12s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.bg)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                    ))}

                    <div style={{ height: 1, background: COLORS.border, margin: '4px 0' }} />

                    {/* Logout */}
                    <div onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', fontSize: 13, color: COLORS.danger }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>🚪</span>
                      <span style={{ fontWeight: 600 }}>Logout</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Page content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 40px' }}>
            <Outlet />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#1a1a1a', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '8px 24px', display: 'flex', flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: '#fff' }}>
          © 2026 Food Safety and Standards Authority of India · Ministry of Health &amp; Family Welfare, Government of India
        </div>
        <div style={{ display: 'flex', gap: 14, marginLeft: 'auto' }}>
          {['Privacy Policy', 'Terms of Use', 'Accessibility', 'Sitemap'].map((label) => (
            <span key={label} style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
