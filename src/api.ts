import { MemberProfile } from './types';

export interface RegistrationPayload {
  phone: string;
  email?: string;
  password: string;
  title: string;
  fullName: string;
  branch: string;
  section: string;
  age?: number;
  biography?: string;
  qualifications?: string;
  photoUrl?: string;
  physicalAddress?: string;
  postalAddress?: string;
  marriageStatus?: string;
  nextOfKin?: { fullName: string; relation: string; phone: string };
  familyMembers: Array<{ fullName: string; relation: string }>;
}

export interface AuthResponse {
  member: MemberProfile | null;
  role: 'MEMBER' | 'ADMIN';
  phone?: string;
  email?: string | null;
}

export interface AdminUser {
  id: string;
  phone: string;
  email: string | null;
  role: 'MEMBER' | 'ADMIN';
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  member: MemberProfile | null;
}

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${response.status}).`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
};

export const getCurrentUser = () => request<AuthResponse>('/api/auth/me');

export const login = (phone: string, password: string) =>
  request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) });

export const register = (payload: RegistrationPayload) =>
  request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });

export const logout = () => request<void>('/api/auth/logout', { method: 'POST' });

export const getAdminUsers = () => request<AdminUser[]>('/api/admin/users');

export const createAdminUser = (payload: RegistrationPayload) =>
  request<AdminUser>('/api/admin/users', { method: 'POST', body: JSON.stringify(payload) });