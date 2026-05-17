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
  attachmentUrl?: string | null;
  authorityDocUrl?: string | null;
}

export interface ExtensionRecord {
  id: string;
  applicationId: string;
  application: Application;
  queryId: string | null;
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

export async function nodalAGrantExtension(id: string, remarks?: string): Promise<void> {
  await api.post(`/nodal-a/extension-requests/${id}/grant`, { remarks });
}

export async function nodalARejectExtension(id: string, remarks?: string): Promise<void> {
  await api.post(`/nodal-a/extension-requests/${id}/reject`, { remarks });
}

export async function nodalACreateExtension(payload: {
  applicationId: string; reason: string; extensionDays: number; contactEmail: string; justification: string;
}): Promise<ExtensionRecord> {
  const { data } = await api.post<{ extension: ExtensionRecord }>('/nodal-a/extension-requests', payload);
  return data.extension;
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

export async function nodalASendDecision(appId: string): Promise<Application> {
  const { data } = await api.post<{ application: Application }>(`/nodal-a/applications/${appId}/send-decision`);
  return data.application;
}

export async function nodalADispatchAppealDecision(appealId: string): Promise<Application> {
  const { data } = await api.post<{ application: Application }>(`/nodal-a/appeals/${appealId}/dispatch`);
  return data.application;
}

export async function nodalAForwardReviewToChairperson(reviewId: string): Promise<void> {
  await api.post(`/nodal-a/reviews/${reviewId}/forward-to-chairperson`);
}

export async function nodalADispatchReviewDecision(reviewId: string): Promise<Application> {
  const { data } = await api.post<{ application: Application }>(`/nodal-a/reviews/${reviewId}/dispatch`);
  return data.application;
}

export async function uploadAppealAuthorityDoc(appealId: string, authorityDocUrl: string): Promise<void> {
  await api.patch(`/nodal-a/appeals/${appealId}/upload-authority-doc`, { authorityDocUrl });
}

export async function uploadReviewAuthorityDoc(reviewId: string, authorityDocUrl: string): Promise<void> {
  await api.patch(`/nodal-a/reviews/${reviewId}/upload-authority-doc`, { authorityDocUrl });
}

// ── Withdrawal requests ───────────────────────────────────────────────────────

export interface WithdrawalRequestRecord {
  id:            string;
  applicationId: string;
  application:   Application;
  requestedById: string;
  requestedBy:   { username: string; email: string; name: string | null };
  type:          'ByApplicant' | 'ByAuthority';
  justification: string;
  status:        'Pending' | 'Approved' | 'Rejected' | 'Executed';
  createdAt:     string;
  updatedAt:     string;
}

export async function fetchWithdrawalRequests(): Promise<WithdrawalRequestRecord[]> {
  const { data } = await api.get<{ requests: WithdrawalRequestRecord[] }>('/nodal-a/withdrawal-requests');
  return data.requests;
}

export async function approveWithdrawalRequest(id: string): Promise<void> {
  await api.post(`/nodal-a/withdrawal-requests/${id}/approve`);
}

export async function rejectWithdrawalRequest(id: string): Promise<void> {
  await api.post(`/nodal-a/withdrawal-requests/${id}/reject`);
}

export async function withdrawByAuthority(appId: string, justification: string): Promise<void> {
  await api.post(`/nodal-a/applications/${appId}/withdraw-by-authority`, { justification });
}
