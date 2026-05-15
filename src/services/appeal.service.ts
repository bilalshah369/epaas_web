import { api } from './api';

export interface AppealItem {
  id:            string | null;
  applicationId: string;
  ref:           string;
  company:       string;
  product:       string;
  appType:       string;
  foodCategory:  string;
  rejDate:       string;
  daysLeft:      number;
  appealStatus:  'PendingFiling' | 'AppealPending' | 'AppealApproved' | 'AppealRejected';
}

export interface ReviewItem {
  id:            string | null;
  applicationId: string;
  appealId:      string;
  ref:           string;
  company:       string;
  product:       string;
  appType:       string;
  foodCategory:  string;
  appealRejDate: string;
  daysLeft:      number;
  reviewStatus:  'PendingReview' | 'ReviewPending' | 'ReviewDisposed' | 'DeadlinePassed';
}

export async function fetchAppeals(): Promise<AppealItem[]> {
  const { data } = await api.get<{ items: AppealItem[] }>('/appeals');
  return data.items;
}

export async function fileAppeal(applicationId: string, grounds: string, attachmentUrl?: string | null): Promise<void> {
  await api.post('/appeals', { applicationId, grounds, attachmentUrl: attachmentUrl ?? undefined });
}

export async function fetchReviews(): Promise<ReviewItem[]> {
  const { data } = await api.get<{ items: ReviewItem[] }>('/appeals/reviews');
  return data.items;
}

export async function fileReview(appealId: string, grounds: string, attachmentUrl?: string | null): Promise<void> {
  await api.post('/appeals/reviews', { appealId, grounds, attachmentUrl: attachmentUrl ?? undefined });
}
