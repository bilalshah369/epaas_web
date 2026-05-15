import AppShell, { MenuItem } from '@/components/layout/AppShell';

const MENU: MenuItem[] = [
  { icon: '🏠', label: 'Dashboard',                 path: '/technical/dashboard' },
  {
    icon: '⚙️', label: 'Processing of Applications', path: '/technical/processing',
    children: [
      { icon: '🔍', label: 'Document Scrutinization',         path: '/technical/scrutiny'    },
      { icon: '✅', label: 'Granted Approval',                path: '/technical/approved'    },
      { icon: '✏️', label: 'App for Editing / Clarification',  path: '/technical/editing'     },
      { icon: '🚫', label: 'Withdrawal of Approval',          path: '/technical/withdrawal'  },
      { icon: '📤', label: 'Forwarded to EC',                path: '/technical/forwarded-ec' },
    ],
  },
  {
    icon: '📋', label: 'Application Based Reports',  path: '/technical/reports/apps',
    children: [
      { icon: '✅', label: 'Approved Applications',   path: '/technical/reports/approved'   },
      { icon: '❌', label: 'Rejected Applications',   path: '/technical/reports/rejected'   },
      { icon: '🔄', label: 'Withdrawn by Applicant',  path: '/technical/reports/withdrawn'  },
      { icon: '⚖️', label: 'Application for Appeal',  path: '/technical/reports/appeal'     },
      { icon: '🔍', label: 'Application for Review',  path: '/technical/reports/review'     },
    ],
  },
  { icon: '📊', label: 'Reports',           path: '/technical/reports/summary'  },
  { icon: '⚖️', label: 'Appeal and Review', path: '/technical/appeal-review'    },
  { icon: '⏱️', label: 'Extension of Time', path: '/technical/extension'        },
  { icon: '🔍', label: 'Search Console',    path: '/technical/search'           },
];

export default function TechnicalLayout() {
  return <AppShell menu={MENU} />;
}
