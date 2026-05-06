import { api } from './api';
import type { Application } from './application.service';

export interface Appeal {
  id: string;
  applicationId: string;
  application: Application;
  applicantId: string;
  grounds: string;
  status: string;
  filedAt: string;
  decisionAt: string | null;
  decisionRemarks: string | null;
}

export async function fetchNodalBPending(): Promise<Application[]> {
  const { data } = await api.get<{ applications: Application[] }>('/nodal-b/applications');
  return data.applications;
}

export async function fetchNodalBAll(): Promise<Application[]> {
  const { data } = await api.get<{ applications: Application[] }>('/nodal-b/all');
  return data.applications;
}

export async function fetchNodalBAppeals(): Promise<Appeal[]> {
  const { data } = await api.get<{ appeals: Appeal[] }>('/nodal-b/appeals');
  return data.appeals;
}

export async function fetchNodalBExtensions(): Promise<any[]> {
  const { data } = await api.get<{ requests: any[] }>('/nodal-b/extension-requests');
  return data.requests;
}

export async function nodalBForwardCEO(id: string): Promise<Application> {
  const { data } = await api.post<{ application: Application }>(`/nodal-b/applications/${id}/forward-ceo`);
  return data.application;
}

export async function nodalBReject(id: string, reason: string): Promise<Application> {
  const { data } = await api.post<{ application: Application }>(`/nodal-b/applications/${id}/reject`, { reason });
  return data.application;
}
