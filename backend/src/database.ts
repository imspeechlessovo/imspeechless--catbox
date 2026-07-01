import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.resolve(__dirname, '..', 'data.json');

interface Data {
  questions: QuestionRow[];
  visitorSessions: VisitorSessionRow[];
  messages: MessageRow[];
  authorMessages: AuthorMessageRow[];
  authors: AuthorRow[];
  cards: CardRow[];
  likes: LikeRow[];
  downloads: DownloadRow[];
  stats: StatsRow[];
  replies: ReplyRow[];
  messageLikes: MessageLikeRow[];
  _idCounter: number;
}

export interface QuestionRow {
  id: number; title: string; answer_hash: string; enabled: number;
  sort_order: number; created_at: string; updated_at: string;
}
export interface VisitorSessionRow {
  id: string; token_hash: string; ip_hash: string; user_agent: string | null;
  passed: number; expires_at: string; created_at: string;
}
export interface MessageRow {
  id: number; nickname: string; content: string; visible: number; pinned: number;
  ip_hash: string; user_agent: string | null; created_at: string; updated_at: string;
  likeCount?: number; replyCount?: number;
}
export interface AuthorMessageRow {
  id: number; title: string; content: string; pinned: number; visible: number;
  created_at: string; updated_at: string;
  replyCount?: number; likeCount?: number;
}
export interface AuthorRow {
  id: number; username: string; password_hash: string; display_name: string;
  created_at: string; updated_at: string;
}
export interface CardRow {
  id: number; name: string; intro: string; tags: string;
  image_path: string; thumb_path: string; password_hash: string;
  total_likes: number; total_downloads: number; created_at: string; updated_at: string;
}
export interface LikeRow {
  id: number; card_id: number; ip_hash: string; created_at: string;
}
export interface DownloadRow {
  id: number; card_id: number; ip_hash: string; created_at: string;
}
export interface StatsRow {
  id: number; week: number; dateRange: string;
  views: number; messages: number;
  likes: number; chatUsers: number;
  content: string; topWork: string;
  created_at: string; updated_at: string;
}
export interface ReplyRow {
  id: number; message_id: number; nickname: string; content: string;
  ip_hash: string; user_agent: string | null; created_at: string;
}
export interface MessageLikeRow {
  id: number; message_id: number; ip_hash: string; created_at: string;
}

export interface ReplyRow {
  id: number; message_id: number; nickname: string; content: string;
  ip_hash: string; user_agent: string | null; created_at: string;
}
export interface MessageLikeRow {
  id: number; message_id: number; ip_hash: string; created_at: string;
}


export interface StatsRow {
  id: number; week: number; dateRange: string;
  views: number; messages: number;
  likes: number; chatUsers: number;
  content: string; topWork: string;
  created_at: string; updated_at: string;
}


function emptyData(): Data {
  return {
    questions: [], visitorSessions: [], messages: [], authorMessages: [],
    authors: [], cards: [], likes: [], downloads: [], stats: [], replies: [], messageLikes: [], replies: [], messageLikes: [], stats: [],
    _idCounter: 1,
  };
}

let data: Data;

export function initDb(): void {
  if (fs.existsSync(DB_PATH)) {
    data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } else {
    data = emptyData();
  }
}

export function saveDb(): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function nextId(): number { return data._idCounter++; }

export function queryAll<T>(table: keyof Data, where?: (row: T) => boolean, orderBy?: (a: T, b: T) => number): T[] {
  const rows = (data[table] as unknown as T[]).slice();
  let filtered = where ? rows.filter(where) : rows;
  if (orderBy) filtered.sort(orderBy);
  return filtered;
}

export function queryOne<T>(table: keyof Data, where: (row: T) => boolean): T | null {
  return queryAll<T>(table, where)[0] || null;
}

export function insertNum<T extends { id: number }>(table: keyof Data, row: Omit<T, 'id'>): T {
  const full = { id: nextId(), ...row } as T;
  (data[table] as unknown as T[]).push(full);
  saveDb();
  return full;
}

export function insertStr<T extends { id: string }>(table: keyof Data, row: T): T {
  (data[table] as unknown as T[]).push(row);
  saveDb();
  return row;
}

export function updateRow<T extends { id: number | string }>(table: keyof Data, id: T['id'], updates: Partial<T>): T | null {
  const rows = data[table] as unknown as T[];
  const idx = rows.findIndex(r => r.id === id);
  if (idx === -1) return null;
  Object.assign(rows[idx], updates);
  saveDb();
  return rows[idx];
}

export function deleteRow(table: keyof Data, id: number | string): boolean {
  const rows = data[table] as unknown as { id: number | string }[];
  const idx = rows.findIndex(r => r.id === id);
  if (idx === -1) return false;
  rows.splice(idx, 1);
  saveDb();
  return true;
}

export function clearTable(table: keyof Data): void {
  (data[table] as unknown[]).length = 0;
  saveDb();
}