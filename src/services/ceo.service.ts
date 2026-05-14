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

export async function fetchCEOPending(): Promise<Application[]> {
  const { data } = await api.get<{ applications: Application[] }>('/ceo/applications');
  return data.applications;
}

export async function fetchCEOAll(): Promise<Application[]> {
  const { data } = await api.get<{ applications: Application[] }>('/ceo/all');
  return data.applications;
}

export async function fetchCEOAppeals(): Promise<Appeal[]> {
  const { data } = await api.get<{ appeals: Appeal[] }>('/ceo/appeals');
  return data.appeals;
}

export async function fetchCEOExtensions(): Promise<any[]> {
  const { data } = await api.get<{ requests: any[] }>('/ceo/extension-requests');
  return data.requests;
}

export async function ceoApproveAppeal(id: string, decisionRemarks: string): Promise<any> {
  const { data } = await api.post(`/ceo/appeals/${id}/approve`, { decisionRemarks });
  return data;
}

export async function ceoRejectAppeal(id: string, decisionRemarks: string): Promise<any> {
  const { data } = await api.post(`/ceo/appeals/${id}/reject`, { decisionRemarks });
  return data;
}
