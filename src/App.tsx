import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

// Public pages
import LandingPage           from '@/pages/landing/LandingPage';
import LoginPage             from '@/pages/auth/LoginPage';
import SignUpPage            from '@/pages/auth/SignUpPage';

// Auth guards
import ProtectedRoute        from '@/router/ProtectedRoute';
import RoleRoute             from '@/router/RoleRoute';

// ── Applicant module ──────────────────────────────────────────────────────────
import ApplicantLayout            from '@/layouts/ApplicantLayout';
import ApplicantDashboard         from '@/pages/applicant/ApplicantDashboard';
import ApplicationDetails         from '@/pages/applicant/ApplicationDetails';
import ApplicationTypeSelector    from '@/pages/applicant/ApplicationTypeSelector';
import ApplicationForm            from '@/pages/applicant/ApplicationForm';
import ApplicationView            from '@/pages/applicant/ApplicationView';
import TaxInvoice                 from '@/pages/applicant/TaxInvoice';
import ApplicantProfile           from '@/pages/applicant/ApplicantProfile';

// ── Technical Officer module ──────────────────────────────────────────────────
import TechnicalLayout            from '@/layouts/TechnicalLayout';
import TechDashboard              from '@/pages/technical/TechDashboard';
import TechAssessment             from '@/pages/technical/TechAssessment';
import TechDocScrutiny            from '@/pages/technical/TechDocScrutiny';
import TechGrantedApproval        from '@/pages/technical/TechGrantedApproval';
import TechAppForEditing          from '@/pages/technical/TechAppForEditing';
import TechWithdrawal             from '@/pages/technical/TechWithdrawal';
import TechApplicationReports     from '@/pages/technical/TechApplicationReports';
import TechReports                from '@/pages/technical/TechReports';
import TechAppealReview           from '@/pages/technical/TechAppealReview';
import TechExtensionOfTime        from '@/pages/technical/TechExtensionOfTime';
import TechSearchConsole          from '@/pages/technical/TechSearchConsole';

import ApplicantRequests           from '@/pages/applicant/ApplicantRequests';

// ── Nodal Officer A module ────────────────────────────────────────────────────
import NodalALayout               from '@/layouts/NodalALayout';
import NodalADashboard            from '@/pages/nodalA/NodalADashboard';
import ApplicationScrutiny        from '@/pages/nodalA/ApplicationScrutiny';
import DocumentScrutiny           from '@/pages/nodalA/DocumentScrutiny';
import GrantedApproval            from '@/pages/nodalA/GrantedApproval';
import AppForEditing              from '@/pages/nodalA/AppForEditing';
import WithdrawalOfApproval       from '@/pages/nodalA/WithdrawalOfApproval';
import ApplicationReports         from '@/pages/nodalA/ApplicationReports';
import NodalReports               from '@/pages/nodalA/NodalReports';
import AppealReview               from '@/pages/nodalA/AppealReview';
import ExtensionOfTime            from '@/pages/nodalA/ExtensionOfTime';
import SearchConsole              from '@/pages/nodalA/SearchConsole';

// Placeholder for unbuilt screens (replaced in later steps)
import DashboardPlaceholder  from '@/pages/shared/DashboardPlaceholder';
import UnauthorizedPage      from '@/pages/shared/UnauthorizedPage';

export default function App() {
  const { restoreSession, isRestoring } = useAuthStore();

  useEffect(() => { restoreSession(); }, [restoreSession]);

  if (isRestoring) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4F8' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#1A3C5E', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: '#64748B' }}>Loading…</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Routes>
      {/* ── Public ──────────────────────────────────────────────────── */}
      <Route path="/"             element={<LandingPage />}     />
      <Route path="/login"        element={<LoginPage />}       />
      <Route path="/signup"       element={<SignUpPage />}      />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* ── Applicant ───────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute roles={['Applicant']} />}>
          <Route element={<ApplicantLayout />}>
            <Route path="/app/dashboard"    element={<ApplicantDashboard />}      />
            <Route path="/app/applications" element={<ApplicationDetails />}      />
            <Route path="/app/apply"        element={<ApplicationTypeSelector />} />
            <Route path="/app/apply/form"       element={<ApplicationForm />}     />
            <Route path="/app/applications/:id" element={<ApplicationView />}     />
            <Route path="/app/tax-invoice"      element={<TaxInvoice />}          />
            <Route path="/app/profile"          element={<ApplicantProfile />}    />
            <Route path="/app/requests/appeal"    element={<ApplicantRequests />}   />
            <Route path="/app/requests/review"    element={<ApplicantRequests />}   />
            <Route path="/app/requests/extension" element={<ApplicantRequests />}   />
            {/* Remaining applicant screens added in later steps */}
            <Route path="/app/*"            element={<DashboardPlaceholder />}    />
          </Route>
        </Route>

        {/* ── Nodal Officer A ─────────────────────────────────────────── */}
        <Route element={<RoleRoute roles={['NodalOfficerA']} />}>
          <Route element={<NodalALayout />}>
            <Route path="/nodal/dashboard"      element={<NodalADashboard />}      />
            <Route path="/nodal/scrutiny"       element={<DocumentScrutiny />}     />
            <Route path="/nodal/scrutiny/:id"   element={<ApplicationScrutiny />}  />
            <Route path="/nodal/approved"       element={<GrantedApproval />}      />
            <Route path="/nodal/editing"        element={<AppForEditing />}        />
            <Route path="/nodal/withdrawal"          element={<WithdrawalOfApproval />}  />
            <Route path="/nodal/reports/approved"    element={<ApplicationReports />}    />
            <Route path="/nodal/reports/rejected"    element={<ApplicationReports />}    />
            <Route path="/nodal/reports/withdrawn"   element={<ApplicationReports />}    />
            <Route path="/nodal/reports/appeal"      element={<ApplicationReports />}    />
            <Route path="/nodal/reports/review"      element={<ApplicationReports />}    />
            <Route path="/nodal/reports/summary"     element={<NodalReports />}          />
            <Route path="/nodal/appeal-review"       element={<AppealReview />}          />
            <Route path="/nodal/extension"           element={<ExtensionOfTime />}       />
            <Route path="/nodal/search"              element={<SearchConsole />}         />
            <Route path="/nodal/*"                   element={<DashboardPlaceholder />}  />
          </Route>
        </Route>

        {/* ── Technical Officer ───────────────────────────────────────── */}
        <Route element={<RoleRoute roles={['TechnicalOfficer']} />}>
          <Route element={<TechnicalLayout />}>
            <Route path="/technical/dashboard"              element={<TechDashboard />}           />
            <Route path="/technical/assessment/:id"         element={<TechAssessment />}          />
            <Route path="/technical/scrutiny"               element={<TechDocScrutiny />}         />
            <Route path="/technical/approved"               element={<TechGrantedApproval />}     />
            <Route path="/technical/editing"                element={<TechAppForEditing />}       />
            <Route path="/technical/withdrawal"             element={<TechWithdrawal />}          />
            <Route path="/technical/reports/approved"       element={<TechApplicationReports />} />
            <Route path="/technical/reports/rejected"       element={<TechApplicationReports />} />
            <Route path="/technical/reports/withdrawn"      element={<TechApplicationReports />} />
            <Route path="/technical/reports/appeal"         element={<TechApplicationReports />} />
            <Route path="/technical/reports/review"         element={<TechApplicationReports />} />
            <Route path="/technical/reports/summary"        element={<TechReports />}            />
            <Route path="/technical/appeal-review"          element={<TechAppealReview />}       />
            <Route path="/technical/extension"              element={<TechExtensionOfTime />}    />
            <Route path="/technical/search"                 element={<TechSearchConsole />}      />
            <Route path="/technical/*"                      element={<DashboardPlaceholder />}   />
          </Route>
        </Route>

        {/* Other roles — placeholder until their step ────────────────── */}
        <Route path="/ec/*"           element={<DashboardPlaceholder />} />
        <Route path="/nodalb/*"       element={<DashboardPlaceholder />} />
        <Route path="/ceo/*"          element={<DashboardPlaceholder />} />
        <Route path="/chairperson/*"  element={<DashboardPlaceholder />} />
        <Route path="/admin/*"        element={<DashboardPlaceholder />} />
      </Route>

      {/* ── Catch-all ───────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
