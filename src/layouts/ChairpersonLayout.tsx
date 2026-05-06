import AppShell, { MenuItem } from '@/components/layout/AppShell';

const MENU: MenuItem[] = [
  { icon: '🏠', label: 'Dashboard',          path: '/chairperson/dashboard'    },
  { icon: '📋', label: 'Review Queue',       path: '/chairperson/reviews'      },
  { icon: '📊', label: 'Reports',            path: '/chairperson/reports'      },
  { icon: '🔍', label: 'Search Console',     path: '/chairperson/search'       },
  { icon: '⏱️', label: 'Extension of Time', path: '/chairperson/extension'    },
  { icon: '🔔', label: 'Notifications',      path: '/chairperson/notifications'},
];

export default function ChairpersonLayout() {
  return <AppShell menu={MENU} />;
}
