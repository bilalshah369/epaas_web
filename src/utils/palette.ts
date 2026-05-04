import { PALETTES, DEFAULT_PALETTE_ID, type Palette } from './paletteList';

export const STORAGE_KEY        = 'epaas_palette_id';
export const STORAGE_CUSTOM_KEY = 'epaas_palette_custom';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function applyPalette(p: Palette) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary',       p.primary);
  root.style.setProperty('--color-primary-dark',  p.dark);
  root.style.setProperty('--color-primary-light', p.light);
  root.style.setProperty('--color-accent',        p.accent);
  root.style.setProperty('--color-bg',            p.bg);
  root.style.setProperty('--color-border',        p.border);
  root.style.setProperty('--color-text',          p.text);
  root.style.setProperty('--color-text-muted',    p.muted);
  // Derived opacity variants used across screens
  root.style.setProperty('--color-primary-22',    hexToRgba(p.primary, 0.22));
  root.style.setProperty('--color-primary-33',    hexToRgba(p.primary, 0.33));
  root.style.setProperty('--color-accent-14',     hexToRgba(p.accent,  0.14));
}

// Called once in main.tsx on app boot
export function initPalette() {
  const savedId = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_PALETTE_ID;

  if (savedId === 'custom') {
    try {
      const custom = JSON.parse(localStorage.getItem(STORAGE_CUSTOM_KEY) ?? '');
      if (custom) { applyPalette({ id: 'custom', ...custom }); return; }
    } catch { /* fall through to default */ }
  }

  const palette = PALETTES.find((p) => p.id === savedId) ?? PALETTES.find((p) => p.id === DEFAULT_PALETTE_ID)!;
  applyPalette(palette);
}

export function savePalette(id: string) {
  localStorage.setItem(STORAGE_KEY, id);
  const p = PALETTES.find((p) => p.id === id);
  if (p) applyPalette(p);
}

export { PALETTES, type Palette };
