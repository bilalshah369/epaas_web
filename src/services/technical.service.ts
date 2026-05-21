import { api } from './api';
import type { Application } from './application.service';
import type { AppealReviewRecord, ExtensionRecord } from './officer.service';

export async function fetchTechnicalPending(): Promise<Application[]> {
  const { data } = await api.get<{ applications: Application[] }>('/technical/applications');
  return data.applications;
}

export async function fetchTechnicalAll(): Promise<Application[]> {
  const { data } = await api.get<{ applications: Application[] }>('/technical/all');
  return data.applications;
}

export async function fetchTechnicalAppealReview(): Promise<AppealReviewRecord[]> {
  const { data } = await api.get<{ records: AppealReviewRecord[] }>('/technical/appeal-review');
  return data.records;
}

export async function fetchTechnicalExtensionRequests(): Promise<ExtensionRecord[]> {
  const { data } = await api.get<{ requests: ExtensionRecord[] }>('/technical/extension-requests');
  return data.requests;
}

export async function fetchTechnicalAppealsReport(): Promise<Application[]> {
  const { data } = await api.get<{ applications: Application[] }>('/technical/reports/appeals');
  return data.applications;
}

export async function fetchTechnicalReviewsReport(): Promise<Application[]> {
  const { data } = await api.get<{ applications: Application[] }>('/technical/reports/reviews');
  return data.applications;
}

export async function technicalForwardToEC(appId: string, ecId: string): Promise<Application> {
  const { data } = await api.post<{ application: Application }>(`/technical/applications/${appId}/forward-ec`, { ecId });
  return data.application;
}

export async function technicalRequestClarification(appId: string, text: string): Promise<void> {
  await api.post(`/technical/applications/${appId}/request-clarification`, { text });
}

export async function technicalRecordDecision(
  appId: string,
  decision: string,
  conditions: string,
  reasons: string,
  form2Data: Record<string, unknown>,
  withPms?: boolean,
): Promise<Application> {
  const { data } = await api.post<{ application: Application }>(`/technical/applications/${appId}/record-decision`, { decision, conditions, reasons, form2Data, withPms: withPms ?? false });
  return data.application;
}

export async function technicalReject(appId: string, reason: string): Promise<Application> {
  const { data } = await api.post<{ application: Application }>(`/technical/applications/${appId}/reject`, { reason });
  return data.application;
}

// Send query to applicant: reuses the shared query endpoint
export async function technicalSendQuery(appId: string, text: string): Promise<void> {
  await api.post(`/applications/${appId}/queries`, { text });
}
