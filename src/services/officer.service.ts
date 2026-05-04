import { api } from './api';
import type { Application } from './application.service';

export interface AppealReviewRecord {
  id: string;
  type: 'Appeal' | 'Review';
  applicationId: string;
  application: Application;
  grounds: string;
  status: string;
  filedAt: string;
}

export interface ExtensionRecord {
  id: string;
  applicationId: string;
  application: Application;
  reason: string;
  extensionDays: number;
  justification: string;
  status: string;
  authorityRemarks: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Nodal Officer A ───────────────────────────────────────────────────────────
// All non-draft applications — used for dashboard overview table + stats
export async function fetchNodalAAll(): Promise<Application[]> {
  const { data } = await api.get<{ applications: Application[] }>('/nodal-a/all');
  return data.applications;
}

// Only WithNodalOfficerA — scrutiny queue
export async function fetchNodalAPending(): Promise<Application[]> {
  const { data } = await api.get<{ applications: Application[] }>('/nodal-a/applications');
  return data.applications;
}

export async function nodalAForward(appId: string): Promise<Application> {
  const { data } = await api.post<{ application: Application }>(`/nodal-a/applications/${appId}/forward`);
  return data.application;
}

// Return with query: reuses the shared query endpoint
export async function nodalAReturnWithQuery(appId: string, text: string): Promise<void> {
  await api.post(`/applications/${appId}/queries`, { text });
}

// Combined appeal + review records for the Appeal and Review screen
export async function fetchNodalAAppealReview(): Promise<AppealReviewRecord[]> {
  const { data } = await api.get<{ records: AppealReviewRecord[] }>('/nodal-a/appeal-review');
  return data.records;
}

// All extension requests
export async function fetchNodalAExtensionRequests(): Promise<ExtensionRecord[]> {
  const { data } = await api.get<{ requests: ExtensionRecord[] }>('/nodal-a/extension-requests');
  return data.requests;
}

// Apps that have had an appeal filed
export async function fetchNodalAAppealsReport(): Promise<Application[]> {
  const { data } = await api.get<{ applications: Application[] }>('/nodal-a/reports/appeals');
  return data.applications;
}

// Apps that have had a review petition filed
export async function fetchNodalAReviewsReport(): Promise<Application[]> {
  const { data } = await api.get<{ applications: Application[] }>('/nodal-a/reports/reviews');
  return data.applications;
}
