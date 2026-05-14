import { api } from './api';
import type {
  AuthResponse,
  LoginApplicantRequest,
  LoginAuthorityRequest,
  RegisterRequest,
  AuthUser,
} from '@/types/auth.types';

export async function loginApplicant(data: LoginApplicantRequest): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/login/applicant', data);
  return res.data;
}

export async function loginAuthority(data: LoginAuthorityRequest): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/login/authority', data);
  return res.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/register', data);
  return res.data;
}

export async function getMe(): Promise<AuthUser> {
  const res = await api.get<{ user: AuthUser }>('/auth/me');
  return res.data.user;
}

export async function updateOrgName(orgName: string): Promise<AuthUser> {
  const res = await api.patch<{ user: AuthUser }>('/auth/me', { orgName });
  return res.data.user;
}
