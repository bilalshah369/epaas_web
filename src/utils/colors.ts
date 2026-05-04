// Mirrors the COLORS object from App.jsx mock.
// Values reference CSS variables set by applyPalette() so they
// automatically reflect whichever theme is active.
export const COLORS = {
  primary:      'var(--color-primary)',
  primaryDark:  'var(--color-primary-dark)',
  primaryLight: 'var(--color-primary-light)',
  accent:       'var(--color-accent)',
  bg:           'var(--color-bg)',
  border:       'var(--color-border)',
  text:         'var(--color-text)',
  textMuted:    'var(--color-text-muted)',
  white:        '#FFFFFF',
  sidebar:      'var(--color-primary)',
  sidebarActive:'#FFFFFF',
  navbarBg:     '#FFFFFF',
  navbarText:   '#000000',
  // Semantic — fixed regardless of palette
  danger:        '#C0392B',
  dangerLight:   '#FDECEA',
  success:       '#1A6B3C',
  successLight:  '#E5F4EC',
  warning:       '#C67C12',
  warningLight:  '#FEF3DC',
  info:          '#1A5276',
  infoLight:     '#E8F0F7',
} as const;

// Inline style shorthand (mirrors S object in mock — add as needed per screen)
export const S = {
  input: {
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: "'Noto Sans', 'Segoe UI', sans-serif",
  } as React.CSSProperties,

  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-text)',
    marginBottom: 4,
  } as React.CSSProperties,

  select: {
    appearance: 'auto',
    cursor: 'pointer',
  } as React.CSSProperties,

  // Page-header pattern shared across all role dashboards (mock S.roleLabel/pageTitle/pageDesc)
  roleLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--color-primary)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  } as React.CSSProperties,

  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--color-text)',
    margin: '2px 0 4px',
    fontFamily: "'Libre Baskerville', Georgia, serif",
  } as React.CSSProperties,

  pageDesc: {
    fontSize: 12,
    color: 'var(--color-text-muted)',
  } as React.CSSProperties,

  // Shared table cell styles
  th: {
    textAlign: 'left',
    padding: '9px 10px',
    background: 'var(--color-bg)',
    borderBottom: '2px solid var(--color-border)',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,

  td: {
    padding: '9px 10px',
    borderBottom: '1px solid var(--color-border)',
    fontSize: 12,
  } as React.CSSProperties,
} as const;

// Required so TypeScript accepts React.CSSProperties above
import type React from 'react';
