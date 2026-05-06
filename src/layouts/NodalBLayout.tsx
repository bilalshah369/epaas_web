import AppShell, { MenuItem } from '@/components/layout/AppShell';

const MENU: MenuItem[] = [
  { icon: '🏠', label: 'Dashboard',          path: '/nodalb/dashboard'     },
  { icon: '📋', label: 'Application Queue',  path: '/nodalb/queue'         },
  { icon: '🔍', label: 'Search Console',     path: '/nodalb/search'        },
  { icon: '🔔', label: 'Notifications',      path: '/nodalb/notifications' },
];

export default function NodalBLayout() {
  return <AppShell menu={MENU} />;
}
