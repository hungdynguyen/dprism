import type {
  CaseContext,
  CaseDraft,
  CaseMethod,
  ChatMessage,
  Expert,
  ExpertInput,
  PlanDocument,
  PlanTemplate,
  Run,
  SharedCase,
  Skill,
  User,
} from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL || '';
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set('Content-Type', 'application/json');
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });
  if (response.status === 401) {
    window.location.assign('/auth/login');
    throw new ApiError(401, 'Phiên đăng nhập đã hết hạn.');
  }
  if (!response.ok)
    throw new ApiError(response.status, await response.text().catch(() => response.statusText));
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export const getMe = (signal?: AbortSignal) => request<User>('/api/users/me', { signal });
export const getSampleCase = () =>
  request<{ context: CaseContext; document: PlanDocument }>('/api/examples/autosupport');
export const getExperts = (signal?: AbortSignal) => request<Expert[]>('/api/experts', { signal });
export const getExpert = (id: string, signal?: AbortSignal) =>
  request<Expert>(`/api/experts/${encodeURIComponent(id)}`, { signal });
export const createExpert = (data: ExpertInput) =>
  request<Expert>('/api/experts', { method: 'POST', body: JSON.stringify(data) });
export const updateExpert = ({ id, data }: { id: string; data: ExpertInput }) =>
  request<Expert>(`/api/experts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
export const getSkills = (signal?: AbortSignal) => request<Skill[]>('/api/skills', { signal });
export const getTemplates = (signal?: AbortSignal) =>
  request<PlanTemplate[]>('/api/templates', { signal });
export const createTemplate = (data: Omit<PlanTemplate, 'id' | 'version'>) =>
  request<PlanTemplate>('/api/templates', { method: 'POST', body: JSON.stringify(data) });
export const getCases = (signal?: AbortSignal) => request<CaseDraft[]>('/api/cases', { signal });
export const getCase = (id: string, signal?: AbortSignal) =>
  request<CaseDraft>(`/api/cases/${encodeURIComponent(id)}`, { signal });
export const createCase = (data: {
  title: string;
  referenceCaseIds?: string[];
  method?: CaseMethod;
}) => request<CaseDraft>('/api/cases', { method: 'POST', body: JSON.stringify(data) });
export const updateCase = (data: CaseDraft) =>
  request<CaseDraft>(`/api/cases/${encodeURIComponent(data.id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
export const proposePlan = (id: string) =>
  request<CaseDraft>(`/api/cases/${encodeURIComponent(id)}/proposal`, { method: 'POST' });
export const startRun = (id: string) =>
  request<Run>(`/api/cases/${encodeURIComponent(id)}/runs`, { method: 'POST' });
export const getRun = (id: string, signal?: AbortSignal) =>
  request<Run>(`/api/runs/${encodeURIComponent(id)}`, { signal });
export const shareRun = ({ id, shared }: { id: string; shared: boolean }) =>
  request<Run>(`/api/runs/${encodeURIComponent(id)}/sharing`, {
    method: 'PUT',
    body: JSON.stringify({ shared }),
  });
export const getSharedCases = (signal?: AbortSignal) =>
  request<SharedCase[]>('/api/shared-cases', { signal });
export const getSharedCase = (id: string, signal?: AbortSignal) =>
  request<SharedCase>(`/api/shared-cases/${encodeURIComponent(id)}`, { signal });
export const uploadDocument = (file: File) => {
  const body = new FormData();
  body.append('file', file);
  return request<PlanDocument>('/api/documents', { method: 'POST', body });
};
export const replyToExpert = (data: {
  expertId: string;
  caseId: string | null;
  messages: ChatMessage[];
  signal?: AbortSignal;
}) =>
  request<ChatMessage>(`/api/experts/${encodeURIComponent(data.expertId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ caseId: data.caseId, messages: data.messages }),
    signal: data.signal,
  });
