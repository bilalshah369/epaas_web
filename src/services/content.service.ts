import { api } from './api';

export interface Circular {
  id: string;
  date: string;
  refNumber: string;
  title: string;
  tag: string;
  published: boolean;
  sortOrder: number;
}

export interface Notification {
  id: string;
  date: string;
  title: string;
  type: string;
  body?: string | null;
  published: boolean;
  sortOrder: number;
}

export async function fetchAdminCirculars(): Promise<Circular[]> {
  const { data } = await api.get<{ circulars: Circular[] }>('/admin/circulars');
  return data.circulars;
}

export async function createCircular(d: Omit<Circular, 'id'>): Promise<Circular> {
  const { data } = await api.post<{ circular: Circular }>('/admin/circulars', d);
  return data.circular;
}

export async function updateCircular(id: string, d: Partial<Omit<Circular, 'id'>>): Promise<Circular> {
  const { data } = await api.patch<{ circular: Circular }>(`/admin/circulars/${id}`, d);
  return data.circular;
}

export async function deleteCircular(id: string): Promise<void> {
  await api.delete(`/admin/circulars/${id}`);
}

export async function fetchAdminNotifications(): Promise<Notification[]> {
  const { data } = await api.get<{ notifications: Notification[] }>('/admin/notifications');
  return data.notifications;
}

export async function createNotification(d: Omit<Notification, 'id'>): Promise<Notification> {
  const { data } = await api.post<{ notification: Notification }>('/admin/notifications', d);
  return data.notification;
}

export async function updateNotification(id: string, d: Partial<Omit<Notification, 'id'>>): Promise<Notification> {
  const { data } = await api.patch<{ notification: Notification }>(`/admin/notifications/${id}`, d);
  return data.notification;
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/admin/notifications/${id}`);
}
