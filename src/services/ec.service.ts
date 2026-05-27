import { api } from './api';
import type { Application } from './application.service';
import type { AppealReviewRecord, ExtensionRecord } from './officer.service';

export async function fetchECPending(): Promise<Application[]> {
  const { data } = await api.get<{ applications: Application[] }>('/ec/applications');
  return data.applications;
}

export async function fetchECAll(): Promise<Application[]> {
  const { data } = await api.get<{ applications: Application[] }>('/ec/all');
  return data.applications;
}

export async function fetchECAppealReview(): Promise<AppealReviewRecord[]> {
  const { data } = await api.get<{ records: AppealReviewRecord[] }>('/ec/appeal-review');
  return data.records;
}

export async function fetchECExtensionRequests(): Promise<ExtensionRecord[]> {
  const { data } = await api.get<{ requests: ExtensionRecord[] }>('/ec/extension-requests');
  return data.requests;
}

export async function fetchECAppealsReport(): Promise<Application[]> {
  const { data } = await api.get<{ applications: Application[] }>('/ec/reports/appeals');
  return data.applications;
}

export async function fetchECReviewsReport(): Promise<Application[]> {
  const { data } = await api.get<{ applications: Application[] }>('/ec/reports/reviews');
  return data.applications;
}

export async function ecForwardToTechnicalOfficer(appId: string): Promise<Application> {
  const { data } = await api.post<{ application: Application }>(`/ec/applications/${appId}/forward-technical`);
  return data.application;
}

export async function ecReject(appId: string, reason: string): Promise<Application> {
  const { data } = await api.post<{ application: Application }>(`/ec/applications/${appId}/reject`, { reason });
  return data.application;
}

export async function ecRequestClarification(appId: string, text: string): Promise<void> {
  await api.post(`/ec/applications/${appId}/clarify`, { text });
}

export async function ecGrantExtension(id: string, remarks?: string): Promise<void> {
  await api.post(`/ec/extension-requests/${id}/grant`, { remarks });
}

export async function ecRejectExtension(id: string, remarks?: string): Promise<void> {
  await api.post(`/ec/extension-requests/${id}/reject`, { remarks });
}

export async function ecSaveAssessment(
  appId: string,
  checklist: Record<string, boolean>,
  notes: string,
): Promise<void> {
  await api.patch(`/ec/applications/${appId}/assessment`, { checklist, notes });
}
