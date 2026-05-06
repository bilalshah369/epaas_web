import AppShell, { MenuItem } from '@/components/layout/AppShell';

const MENU: MenuItem[] = [
  { icon: '🏠', label: 'Dashboard',       path: '/ec/dashboard' },
  { icon: '📁', label: 'Case Dockets',    path: '/ec/dockets'   },
  { icon: '📅', label: 'Meeting Agenda',  path: '/ec/agenda'    },
  { icon: '📊', label: 'Reports',         path: '/ec/reports'   },
  { icon: '⚖️', label: 'Appeal & Review', path: '/ec/appeal-review' },
  { icon: '⏱️', label: 'Extension of Time', path: '/ec/extension' },
  { icon: '🔍', label: 'Search Console',  path: '/ec/search'    },
];

export default function ECLayout() {
  return <AppShell menu={MENU} />;
}
