import { api } from './api';

export interface ExtensionItem {
  id:              string;
  applicationId:   string;
  queryId:         string | null;
  reason:          string;
  extensionDays:   number;
  contactEmail:    string;
  justification:      string;
  supportingDocument: string | null;
  status:             'Pending' | 'Approved' | 'Rejected';
  authorityRemarks:   string | null;
  createdAt:       string;
  application: {
    referenceNumber: string;
    applicationType: string;
    foodCategory:    string;
    productName:     string | null;
  };
}

export async function fetchExtensions(): Promise<ExtensionItem[]> {
  const { data } = await api.get<{ items: ExtensionItem[] }>('/extensions');
  return data.items;
}

export async function createExtension(payload: {
  applicationId:      string;
  reason:             string;
  extensionDays:      number;
  contactEmail:       string;
  justification:      string;
  queryId?:           string;
  supportingDocument?: string;
}): Promise<ExtensionItem> {
  const { data } = await api.post<{ extension: ExtensionItem }>('/extensions', payload);
  return data.extension;
}

export async function updateExtension(id: string, payload: {
  reason:        string;
  extensionDays: number;
  contactEmail:  string;
  justification: string;
}): Promise<ExtensionItem> {
  const { data } = await api.put<{ extension: ExtensionItem }>(`/extensions/${id}`, payload);
  return data.extension;
}
