/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // CSS variables set by the palette system (see src/utils/palette.ts).
      // This lets you write: className="bg-primary text-white"
      colors: {
        primary:       'var(--color-primary)',
        'primary-dark':'var(--color-primary-dark)',
        'primary-light':'var(--color-primary-light)',
        accent:        'var(--color-accent)',
        'app-bg':      'var(--color-bg)',
        'app-border':  'var(--color-border)',
        'app-text':    'var(--color-text)',
        muted:         'var(--color-text-muted)',
        // Semantic — fixed regardless of palette (TDD design tokens)
        danger:        '#C0392B',
        'danger-light':'#FDECEA',
        success:       '#1A6B3C',
        'success-light':'#E5F4EC',
        warning:       '#C67C12',
        'warning-light':'#FEF3DC',
        info:          '#1A5276',
        'info-light':  '#E8F0F7',
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto',
          'Oxygen', 'Ubuntu', 'Cantarell', '"Helvetica Neue"', 'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
