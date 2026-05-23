import AppShell, { MenuItem } from '@/components/layout/AppShell';

const MENU: MenuItem[] = [
  { icon: '🏠', label: 'Dashboard',          path: '/admin/dashboard'    },
  { icon: '📡', label: 'App Monitor',        path: '/admin/monitor'      },
  { icon: '👮', label: 'Officer Management', path: '/admin/officers'     },
  { icon: '🔐', label: 'Role Management',    path: '/admin/roles'        },
  { icon: '📊', label: 'Reports',            path: '/admin/reports'      },
  { icon: '📜', label: 'Audit Trail',        path: '/admin/audit'        },
  { icon: '🔍', label: 'Search Console',     path: '/admin/search'       },
  { icon: '📰', label: 'Content Manager',   path: '/admin/content'      },
];

export default function AdminLayout() {
  return <AppShell menu={MENU} />;
}
