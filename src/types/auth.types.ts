export interface AuthUser {
  id:             string;
  username:       string;
  email:          string;
  roleCode:       string;
  roleName:       string;
  licenseNumber?: string;
  officeLocation?: string;
  isActive:       boolean;
}

export interface AuthResponse {
  user:  AuthUser;
  token: string;
}

export interface LoginApplicantRequest {
  identifier: string; // license number or email
  password:   string;
}

export interface LoginAuthorityRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  name:             string;
  mobile:           string;
  email:            string;
  orgName:          string;
  natureOfBusiness: string;
  password:         string;
}

// Role codes — mirrors server constants
export const ROLE_CODES = {
  APPLICANT:         'Applicant',
  NODAL_OFFICER_A:   'NodalOfficerA',
  TECHNICAL_OFFICER: 'TechnicalOfficer',
  EXPERT_COMMITTEE:  'ExpertCommittee',
  NODAL_POINT_B:     'NodalPointB',
  CEO:               'CEO',
  CHAIRPERSON:       'Chairperson',
  ADMIN:             'Admin',
} as const;

// Default route after login, keyed by roleCode
export const ROLE_DEFAULT_ROUTES: Record<string, string> = {
  Applicant:        '/app/dashboard',
  NodalOfficerA:    '/nodal/dashboard',
  TechnicalOfficer: '/technical/dashboard',
  ExpertCommittee:  '/ec/dashboard',
  NodalPointB:      '/nodalb/dashboard',
  CEO:              '/ceo/dashboard',
  Chairperson:      '/chairperson/dashboard',
  Admin:            '/admin/dashboard',
};
