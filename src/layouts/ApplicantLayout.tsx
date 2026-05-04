import AppShell, { MenuItem } from '@/components/layout/AppShell';

const MENU: MenuItem[] = [
  { icon: '🏠', label: 'Dashboard',                  path: '/app/dashboard' },
  { icon: '📋', label: 'Application Details',         path: '/app/applications' },
  { icon: '🧾', label: 'Tax Invoice / Payments',      path: '/app/tax-invoice' },
  {
    icon: '⚖️',
    label: 'Requests',
    path: '/app/requests',
    children: [
      { icon: '•', label: 'Appeal against Rejection',           path: '/app/requests/appeal' },
      { icon: '•', label: 'Review against Appellate Order',     path: '/app/requests/review' },
      { icon: '•', label: 'Extension of Time',                  path: '/app/requests/extension' },
    ],
  },
];

export default function ApplicantLayout() {
  return <AppShell menu={MENU} />;
}
