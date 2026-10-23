import { MemberProfile } from './types';

export interface RegistrationPayload {
  phone: string;
  email: string;
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
  role: 'MEMBER' | 'ADMIN' | 'SECURITY';
  securityProfile?: SecurityProfile | null;
  phone?: string;
  email?: string | null;
}

export interface RegistrationOptions {
  branches: string[];
  sections: string[];
}

export interface SecurityProfile {
  name: string;
  email: string;
  role: 'SECURITY';
  branch: string | null;
}

export interface SecurityEvent {
  id: string;
  title: string;
  category: string;
  location: string;
  startsAt: string;
  branch: string | null;
}

export interface SecurityCheckIn {
  attendanceId: string;
  memberName: string;
  membershipNumber: string;
  eventName: string;
  checkedInAt: string;
}

export interface MemberAttendance {
  attendanceId: string;
  eventName: string;
  branch: string;
  location: string;
  method: 'self_qr' | 'usher_scan';
  checkedInAt: string;
}

export const EVENT_QR_PREFIX = 'IPHC-EVENT:';

export interface AdminUser {
  id: string;
  phone: string;
  email: string | null;
  role: 'MEMBER' | 'ADMIN' | 'SECURITY';
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

export const getRegistrationOptions = () => request<RegistrationOptions>('/api/auth/options');

export const getSecurityEvents = () => request<SecurityEvent[]>('/api/security/events');

export const recordSecurityCheckIn = (eventId: string, membershipNumber: string) =>
  request<SecurityCheckIn>('/api/security/attendance', {
    method: 'POST',
    body: JSON.stringify({ eventId, membershipNumber }),
  });

export const getMemberAttendance = () => request<MemberAttendance[]>('/api/attendance/me');

export const recordMemberCheckIn = (eventId: string) =>
  request<MemberAttendance>('/api/attendance/self', {
    method: 'POST',
    body: JSON.stringify({ eventId }),
  });

export const login = (email: string, password: string) =>
  request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const register = (payload: RegistrationPayload) =>
  request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });

export const logout = () => request<void>('/api/auth/logout', { method: 'POST' });

export const requestPasswordReset = (email: string) =>
  request<{ ok: boolean }>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });

export const resetPasswordWithToken = (accessToken: string, password: string) =>
  request<{ ok: boolean }>('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ accessToken, password }) });

export const getAdminUsers = () => request<AdminUser[]>('/api/admin/users');

export const createAdminUser = (payload: RegistrationPayload) =>
  request<AdminUser>('/api/admin/users', { method: 'POST', body: JSON.stringify(payload) });