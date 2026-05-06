import AppShell, { MenuItem } from '@/components/layout/AppShell';

const MENU: MenuItem[] = [
  { icon: '🏠', label: 'Dashboard',          path: '/ceo/dashboard'    },
  { icon: '⚖️', label: 'Appeal Queue',       path: '/ceo/appeals'      },
  { icon: '📊', label: 'Reports',            path: '/ceo/reports'      },
  { icon: '🔍', label: 'Search Console',     path: '/ceo/search'       },
  { icon: '⏱️', label: 'Extension of Time', path: '/ceo/extension'    },
  { icon: '🔔', label: 'Notifications',      path: '/ceo/notifications'},
];

export default function CEOLayout() {
  return <AppShell menu={MENU} />;
}
