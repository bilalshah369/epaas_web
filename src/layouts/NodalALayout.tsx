import AppShell, { MenuItem } from '@/components/layout/AppShell';

const MENU: MenuItem[] = [
  { icon: '🏠', label: 'Dashboard',                 path: '/nodal/dashboard' },
  {
    icon: '⚙️', label: 'Processing of Applications', path: '/nodal/processing',
    children: [
      { icon: '🔍', label: 'Document Scrutinization',        path: '/nodal/scrutiny'    },
      { icon: '✅', label: 'Granted Approval',               path: '/nodal/approved'    },
      { icon: '✏️', label: 'App for Editing / Clarification', path: '/nodal/editing'     },
      { icon: '🚫', label: 'Withdrawal of Approval',         path: '/nodal/withdrawal'  },
    ],
  },
  {
    icon: '📋', label: 'Application Based Reports',  path: '/nodal/reports/apps',
    children: [
      { icon: '✅', label: 'Approved Applications',   path: '/nodal/reports/approved'   },
      { icon: '❌', label: 'Rejected Applications',   path: '/nodal/reports/rejected'   },
      { icon: '🔄', label: 'Withdrawn by Applicant',  path: '/nodal/reports/withdrawn'  },
      { icon: '⚖️', label: 'Application for Appeal',  path: '/nodal/reports/appeal'     },
      { icon: '🔍', label: 'Application for Review',  path: '/nodal/reports/review'     },
    ],
  },
  { icon: '📊', label: 'Reports',           path: '/nodal/reports/summary'    },
  { icon: '⚖️', label: 'Appeal and Review', path: '/nodal/appeal-review'      },
  { icon: '⏱️', label: 'Extension of Time', path: '/nodal/extension'          },
  { icon: '🔍', label: 'Search Console',    path: '/nodal/search'             },
];

export default function NodalALayout() {
  return <AppShell menu={MENU} />;
}
