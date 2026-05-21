import { api } from './api';
import type { Application } from './application.service';

export interface Officer {
  id: string;
  username: string;
  email: string;
  officeLocation: string | null;
  assignedCategories: string[];
  isActive: boolean;
  createdAt: string;
  role: { roleCode: string; roleName: string };
}

export interface RoleOption {
  id: string;
  roleCode: string;
  roleName: string;
  description?: string;
}

export interface TimelineEvent {
  dt: string;
  stage: string;
  actor: string;
  role: string;
  notes: string;
}

export interface AuditTrailResponse {
  application: Application;
  timeline: TimelineEvent[];
}

export async function fetchAdminAll(): Promise<Application[]> {
  const { data } = await api.get<{ applications: Application[] }>('/admin/all');
  return data.applications;
}

export async function fetchAdminOfficers(): Promise<Officer[]> {
  const { data } = await api.get<{ officers: Officer[] }>('/admin/officers');
  return data.officers;
}

export async function fetchAdminRoles(): Promise<RoleOption[]> {
  const { data } = await api.get<{ roles: RoleOption[] }>('/admin/roles');
  return data.roles;
}

export async function fetchOfficerCreationRoles(): Promise<RoleOption[]> {
  const { data } = await api.get<{ roles: RoleOption[] }>('/admin/officer-creation-roles');
  return data.roles;
}

export async function updateOfficerRole(officerId: string, roleCode: string): Promise<Officer> {
  const { data } = await api.patch<{ user: Officer }>(`/admin/officers/${officerId}/role`, { roleCode });
  return data.user;
}

export async function toggleOfficerStatus(officerId: string): Promise<Officer> {
  const { data } = await api.patch<{ user: Officer }>(`/admin/officers/${officerId}/status`);
  return data.user;
}

export async function fetchAuditTrail(applicationId: string): Promise<AuditTrailResponse> {
  const { data } = await api.get<AuditTrailResponse>(`/admin/applications/${applicationId}/audit`);
  return data;
}

export interface CreateOfficerData {
  username: string;
  email: string;
  password: string;
  officeLocation?: string;
  roleCode: string;
  assignedCategories: string[];
}

export async function createOfficer(data: CreateOfficerData): Promise<Officer> {
  const { data: res } = await api.post<{ user: Officer }>('/admin/officers', data);
  return res.user;
}

export interface UpdateOfficerProfileData {
  username?: string;
  email?: string;
  password?: string;
  officeLocation?: string;
  assignedCategories?: string[];
}

export async function updateOfficerProfile(officerId: string, data: UpdateOfficerProfileData): Promise<Officer> {
  const { data: res } = await api.patch<{ user: Officer }>(`/admin/officers/${officerId}/profile`, data);
  return res.user;
}

export async function deleteOfficer(officerId: string): Promise<void> {
  await api.delete(`/admin/officers/${officerId}`);
}

export interface CreateRoleData {
  roleCode: string;
  roleName: string;
  description?: string;
}

export async function createRole(data: CreateRoleData): Promise<RoleOption> {
  const { data: res } = await api.post<{ role: RoleOption }>('/admin/roles', data);
  return res.role;
}

export async function fetchAdminExtensions(): Promise<any[]> {
  const { data } = await api.get<{ requests: any[] }>('/admin/extensions');
  return data.requests;
}

export async function fetchAdminAppeals(): Promise<any[]> {
  const { data } = await api.get<{ appeals: any[] }>('/admin/appeals');
  return data.appeals;
}
