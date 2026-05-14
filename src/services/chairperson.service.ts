import { api } from './api';
import type { Application } from './application.service';

export interface Review {
  id: string;
  applicationId: string;
  application: Application;
  appealId: string;
  appeal: { id: string; grounds: string; status: string };
  applicantId: string;
  grounds: string;
  status: string;
  filedAt: string;
  decisionAt: string | null;
  decisionRemarks: string | null;
}

export async function fetchChairpersonPending(): Promise<Application[]> {
  const { data } = await api.get<{ applications: Application[] }>('/chairperson/applications');
  return data.applications;
}

export async function fetchChairpersonAll(): Promise<Application[]> {
  const { data } = await api.get<{ applications: Application[] }>('/chairperson/all');
  return data.applications;
}

export async function fetchChairpersonReviews(): Promise<Review[]> {
  const { data } = await api.get<{ reviews: Review[] }>('/chairperson/reviews');
  return data.reviews;
}

export async function fetchChairpersonExtensions(): Promise<any[]> {
  const { data } = await api.get<{ requests: any[] }>('/chairperson/extension-requests');
  return data.requests;
}

export async function chairpersonDisposeReview(id: string, decisionRemarks: string): Promise<any> {
  const { data } = await api.post(`/chairperson/reviews/${id}/dispose`, { decisionRemarks });
  return data;
}
