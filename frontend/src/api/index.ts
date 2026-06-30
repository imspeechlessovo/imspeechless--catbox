const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '请求失败');
  }
  return data as T;
}

// Countdown
export function getCountdown() {
  return request<{ releaseTime: string; serverTime: string }>('/countdown');
}

// Questions
export interface QuestionItem {
  id: number;
  title: string;
  sortOrder: number;
}

export function getQuestions() {
  return request<QuestionItem[]>('/questions');
}

// Gate verify
export function verifyAnswers(answers: { questionId: number; answer: string }[]) {
  return request<{ passed: boolean; message?: string }>('/gate/verify', {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

// Auth status
export interface AuthStatus {
  isVisitorPassed: boolean;
  isAuthor: boolean;
  author: { displayName: string } | null;
}

export function getAuthStatus() {
  return request<AuthStatus>('/auth/status');
}

// Messages
export interface MessageItem {
  id: number;
  nickname: string;
  content: string;
  createdAt: string;
  type: 'visitor';
}

export interface AuthorMessageItem {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  type: 'author';
}

export interface MessagesResponse {
  messages: MessageItem[];
  authorMessages: AuthorMessageItem[];
}

export function getMessages() {
  return request<MessagesResponse>('/messages');
}

export function postMessage(nickname: string, content: string) {
  return request<MessageItem>('/messages', {
    method: 'POST',
    body: JSON.stringify({ nickname, content }),
  });
}

// Author login / logout
export function authorLogin(username: string, password: string) {
  return request<{ ok: boolean; author: { displayName: string; username: string } }>('/author/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function authorLogout() {
  return request<{ ok: boolean }>('/author/logout', { method: 'POST' });
}

// Author dashboard - author messages
export interface AuthorMessageFull {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

export function getAuthorMessages() {
  return request<AuthorMessageFull[]>('/author/messages');
}

export function createAuthorMessage(data: { title: string; content: string; pinned?: boolean; visible?: boolean }) {
  return request<AuthorMessageFull>('/author/messages', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateAuthorMessage(id: number, data: Partial<AuthorMessageFull>) {
  return request<AuthorMessageFull>(`/author/messages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteAuthorMessage(id: number) {
  return request<{ ok: boolean }>(`/author/messages/${id}`, { method: 'DELETE' });
}

// Author dashboard - visitor messages
export interface VisitorMessageFull {
  id: number;
  nickname: string;
  content: string;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

export function getVisitorMessages() {
  return request<VisitorMessageFull[]>('/author/visitor-messages');
}

export function updateVisitorMessage(id: number, data: { visible?: boolean }) {
  return request<VisitorMessageFull>(`/author/visitor-messages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteVisitorMessage(id: number) {
  return request<{ ok: boolean }>(`/author/visitor-messages/${id}`, { method: 'DELETE' });
}

// Author dashboard - questions
export interface QuestionFull {
  id: number;
  title: string;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function getAuthorQuestions() {
  return request<QuestionFull[]>('/author/questions');
}

export function createQuestion(data: { title: string; answer: string; sortOrder?: number }) {
  return request<QuestionFull>('/author/questions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateQuestion(id: number, data: Partial<QuestionFull & { answer?: string }>) {
  return request<QuestionFull>(`/author/questions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteQuestion(id: number) {
  return request<{ ok: boolean }>(`/author/questions/${id}`, { method: 'DELETE' });
}

// ===== Cards =====
export interface CardListItem {
  rank: number; id: number; name: string; intro: string; tags: string[];
  thumbPath: string; score: number; totalLikes: number; totalDownloads: number;
}
export interface CardListResponse { items: CardListItem[]; total: number; page: number; limit: number; rank: string }

export function getCards(rank?: string, page?: number, limit?: number) {
  const params = new URLSearchParams();
  if (rank) params.set('rank', rank);
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  return request<CardListResponse>('/cards' + (qs ? '?' + qs : ''));
}

export interface CardDetail {
  id: number; name: string; intro: string; tags: string[];
  imagePath: string; thumbPath: string;
  totalLikes: number; todayLikes: number; weekLikes: number;
  totalDownloads: number; createdAt: string;
}
export function getCard(id: number) {
  return request<CardDetail>('/cards/' + id);
}

export function createCard(formData: FormData) {
  return request<{ id: number; name: string; intro: string; tags: string[]; totalLikes: number; totalDownloads: number; createdAt: string }>('/cards', {
    method: 'POST',
    body: formData,
    headers: {} as Record<string, string>,
  });
}

export function likeCard(id: number) {
  return request<{ ok: boolean; totalLikes: number }>('/cards/' + id + '/like', { method: 'POST' });
}

export function verifyCardPassword(id: number, password: string) {
  return request<{ ok: boolean; token: string }>('/cards/' + id + '/manage', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export function updateCard(id: number, data: Record<string, unknown>, token: string) {
  return request<{ id: number; name: string; intro: string; tags: string[] }>('/cards/' + id, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: { 'X-Manage-Token': token, 'Content-Type': 'application/json' },
  });
}

export function deleteCard(id: number, token: string) {
  return request<{ ok: boolean }>('/cards/' + id, {
    method: 'DELETE',
    headers: { 'X-Manage-Token': token, 'Content-Type': 'application/json' },
  });
}