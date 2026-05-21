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
import NSFApplicationForm              from '@/pages/applicant/NSFApplicationForm';
import CAApplicationForm               from '@/pages/applicant/CAApplicationForm';
import AyurvedaAaharaApplicationForm   from '@/pages/applicant/AyurvedaAaharaApplicationForm';
import RPETApplicationForm             from '@/pages/applicant/RPETApplicationForm';
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
import TechForwardedToEC          from '@/pages/technical/TechForwardedToEC';

import ApplicantRequests           from '@/pages/applicant/ApplicantRequests';
import ApplicantExtensionRequest   from '@/pages/applicant/ApplicantExtensionRequest';

// ── Nodal Point B module ──────────────────────────────────────────────────────
import NodalBLayout              from '@/layouts/NodalBLayout';
import NodalBDashboard           from '@/pages/nodal-b/NodalBDashboard';
import NodalBApplicationReview   from '@/pages/nodal-b/NodalBApplicationReview';
import NodalBSearchConsole       from '@/pages/nodal-b/NodalBSearchConsole';

// ── CEO module ────────────────────────────────────────────────────────────────
import CEOLayout                 from '@/layouts/CEOLayout';
import CEODashboard              from '@/pages/ceo/CEODashboard';
import CEOApplicationReview      from '@/pages/ceo/CEOApplicationReview';
import CEOReports                from '@/pages/ceo/CEOReports';
import CEOSearchConsole          from '@/pages/ceo/CEOSearchConsole';
import CEOExtensionOfTime        from '@/pages/ceo/CEOExtensionOfTime';

// ── Chairperson module ────────────────────────────────────────────────────────
import ChairpersonLayout              from '@/layouts/ChairpersonLayout';
import ChairpersonDashboard           from '@/pages/chairperson/ChairpersonDashboard';
import ChairpersonApplicationReview   from '@/pages/chairperson/ChairpersonApplicationReview';
import ChairpersonReports             from '@/pages/chairperson/ChairpersonReports';
import ChairpersonSearchConsole       from '@/pages/chairperson/ChairpersonSearchConsole';
import ChairpersonExtensionOfTime     from '@/pages/chairperson/ChairpersonExtensionOfTime';

// ── Admin module ─────────────────────────────────────────────────────────────
import AdminLayout          from '@/layouts/AdminLayout';
import AdminDashboard       from '@/pages/admin/AdminDashboard';
import AdminAppMonitor      from '@/pages/admin/AdminAppMonitor';
import AdminOfficers        from '@/pages/admin/AdminOfficers';
import AdminRoles           from '@/pages/admin/AdminRoles';
import AdminReports         from '@/pages/admin/AdminReports';
import AdminAuditTrail      from '@/pages/admin/AdminAuditTrail';
import AdminSearchConsole   from '@/pages/admin/AdminSearchConsole';

// ── Expert Committee module ───────────────────────────────────────────────────
import ECLayout           from '@/layouts/ECLayout';
import ECDashboard        from '@/pages/ec/ECDashboard';
import ECCaseDockets      from '@/pages/ec/ECCaseDockets';
import ECDocketReview     from '@/pages/ec/ECDocketReview';
import ECAgenda           from '@/pages/ec/ECAgenda';
import ECReports          from '@/pages/ec/ECReports';
import ECAppealReview     from '@/pages/ec/ECAppealReview';
import ECExtensionOfTime  from '@/pages/ec/ECExtensionOfTime';
import ECSearchConsole    from '@/pages/ec/ECSearchConsole';

// ── Nodal Officer A module ────────────────────────────────────────────────────
import NodalALayout               from '@/layouts/NodalALayout';
import NodalADashboard            from '@/pages/nodalA/NodalADashboard';
import ApplicationScrutiny        from '@/pages/nodalA/ApplicationScrutiny';
import NodalApplicationView       from '@/pages/nodalA/NodalApplicationView';
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
            <Route path="/app/apply/nsf-form"   element={<NSFApplicationForm />}             />
            <Route path="/app/apply/ca-form"    element={<CAApplicationForm />}              />
            <Route path="/app/apply/aa-form"    element={<AyurvedaAaharaApplicationForm />}  />
            <Route path="/app/apply/rpet-form"  element={<RPETApplicationForm />}            />
            <Route path="/app/applications/:id" element={<ApplicationView />}     />
            <Route path="/app/tax-invoice"      element={<TaxInvoice />}          />
            <Route path="/app/profile"          element={<ApplicantProfile />}    />
            <Route path="/app/requests/appeal"    element={<ApplicantRequests />}   />
            <Route path="/app/requests/review"    element={<ApplicantRequests />}   />
            <Route path="/app/requests/extension" element={<ApplicantRequests />}   />
            <Route path="/app/extension-request/:appId" element={<ApplicantExtensionRequest />} />
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
            <Route path="/nodal/view/:id"       element={<NodalApplicationView />} />
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
            <Route path="/technical/forwarded-ec"           element={<TechForwardedToEC />}      />
            <Route path="/technical/*"                      element={<DashboardPlaceholder />}   />
          </Route>
        </Route>

        {/* ── Expert Committee ────────────────────────────────────────── */}
        <Route element={<RoleRoute roles={['ExpertCommittee']} />}>
          <Route element={<ECLayout />}>
            <Route path="/ec/dashboard"    element={<ECDashboard />}       />
            <Route path="/ec/dockets"      element={<ECCaseDockets />}     />
            <Route path="/ec/dockets/:id"  element={<ECDocketReview />}    />
            <Route path="/ec/agenda"       element={<ECAgenda />}          />
            <Route path="/ec/reports"      element={<ECReports />}         />
            <Route path="/ec/appeal-review" element={<ECAppealReview />}   />
            <Route path="/ec/extension"    element={<ECExtensionOfTime />} />
            <Route path="/ec/search"       element={<ECSearchConsole />}   />
            <Route path="/ec/*"            element={<DashboardPlaceholder />} />
          </Route>
        </Route>

        {/* ── Nodal Point B ───────────────────────────────────────────── */}
        <Route element={<RoleRoute roles={['NodalPointB']} />}>
          <Route element={<NodalBLayout />}>
            <Route path="/nodalb/dashboard"    element={<NodalBDashboard />}          />
            <Route path="/nodalb/queue"        element={<NodalBDashboard />}          />
            <Route path="/nodalb/queue/:id"    element={<NodalBApplicationReview />}  />
            <Route path="/nodalb/search"       element={<NodalBSearchConsole />}      />
            <Route path="/nodalb/*"            element={<DashboardPlaceholder />}     />
          </Route>
        </Route>

        {/* ── CEO ─────────────────────────────────────────────────────── */}
        <Route element={<RoleRoute roles={['CEO']} />}>
          <Route element={<CEOLayout />}>
            <Route path="/ceo/dashboard"   element={<CEODashboard />}          />
            <Route path="/ceo/appeals"     element={<CEODashboard />}          />
            <Route path="/ceo/appeals/:id" element={<CEOApplicationReview />}  />
            <Route path="/ceo/reports"     element={<CEOReports />}            />
            <Route path="/ceo/search"      element={<CEOSearchConsole />}      />
            <Route path="/ceo/extension"   element={<CEOExtensionOfTime />}    />
            <Route path="/ceo/*"           element={<DashboardPlaceholder />}  />
          </Route>
        </Route>

        {/* ── Chairperson ─────────────────────────────────────────────── */}
        <Route element={<RoleRoute roles={['Chairperson']} />}>
          <Route element={<ChairpersonLayout />}>
            <Route path="/chairperson/dashboard"   element={<ChairpersonDashboard />}          />
            <Route path="/chairperson/reviews"     element={<ChairpersonDashboard />}          />
            <Route path="/chairperson/reviews/:id" element={<ChairpersonApplicationReview />}  />
            <Route path="/chairperson/reports"     element={<ChairpersonReports />}            />
            <Route path="/chairperson/search"      element={<ChairpersonSearchConsole />}      />
            <Route path="/chairperson/extension"   element={<ChairpersonExtensionOfTime />}    />
            <Route path="/chairperson/*"           element={<DashboardPlaceholder />}          />
          </Route>
        </Route>

        {/* ── Admin ───────────────────────────────────────────────────── */}
        <Route element={<RoleRoute roles={['Admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />}      />
            <Route path="/admin/monitor"   element={<AdminAppMonitor />}     />
            <Route path="/admin/officers"  element={<AdminOfficers />}       />
            <Route path="/admin/roles"     element={<AdminRoles />}          />
            <Route path="/admin/reports"   element={<AdminReports />}        />
            <Route path="/admin/audit"     element={<AdminAuditTrail />}     />
            <Route path="/admin/search"    element={<AdminSearchConsole />}  />
            <Route path="/admin/*"         element={<DashboardPlaceholder />} />
          </Route>
        </Route>
      </Route>

      {/* ── Catch-all ───────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
