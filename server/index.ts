import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppRole, AuditAction, MaritalStatus, MemberStatus, PrismaClient } from '@prisma/client';
import { normalizePhone } from './security.js';

const prisma = new PrismaClient();
const app = express();
const PORT = Number(process.env.API_PORT ?? 3001);
const SUPABASE_URL = (process.env.SUPABASE_URL ?? 'https://zhtrpgvnbrflheismytd.supabase.co').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const ACCESS_COOKIE = 'iphc_access';
const REFRESH_COOKIE = 'iphc_refresh';
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? '';
const RESEND_FROM = 'MMUSO <noreply@iphc-silo.com>';

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (request, response) => response.json({ status: 'ok' }));

type RegistrationInput = {
  phone?: string;
  email?: string;
  password?: string;
  title?: string;
  fullName?: string;
  branch?: string;
  section?: string;
  age?: number;
  biography?: string;
  qualifications?: string;
  photoUrl?: string;
  physicalAddress?: string;
  postalAddress?: string;
  marriageStatus?: string;
  nextOfKin?: { fullName?: string; relation?: string; phone?: string };
  familyMembers?: Array<{ fullName?: string; relation?: string }>;
};

type AuthUser = { id: string; phone?: string; email?: string; user_metadata?: { display_name?: string } };
type SupabaseSession = { access_token: string; refresh_token: string; expires_in?: number; user: AuthUser };
type MemberExtras = {
  title?: string;
  nextOfKin?: { fullName: string; relation: string; phone: string };
  familyMembers?: Array<{ fullName: string; relation: string }>;
};

const cookieValue = (request: Request) => {
  const cookies = request.headers.cookie?.split(';') ?? [];
  return (name: string) => {
    const cookie = cookies.find((entry) => entry.trim().startsWith(`${name}=`));
    return cookie?.trim().slice(name.length + 1);
  };
};

const setSessionCookies = (response: Response, session: SupabaseSession) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const maxAge = Math.max(session.expires_in ?? 3600, 60);
  response.setHeader('Set-Cookie', [
    `${ACCESS_COOKIE}=${session.access_token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`,
    `${REFRESH_COOKIE}=${session.refresh_token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000${secure}`,
  ]);
};

const clearSessionCookie = (response: Response) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader('Set-Cookie', [
    `${ACCESS_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`,
    `${REFRESH_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`,
  ]);
};

const supabaseRequest = async <T>(path: string, options: { method?: string; body?: unknown; token?: string; admin?: boolean } = {}) => {
  const apiKey = options.admin ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY;
  if (!apiKey) throw Object.assign(new Error(options.admin ? 'Set SUPABASE_SERVICE_ROLE_KEY in the server environment.' : 'Set SUPABASE_ANON_KEY in the server environment.'), { status: 503 });
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${options.token ?? apiKey}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.msg ?? data?.message ?? data?.error_description ?? data?.error ?? 'Supabase authentication request failed.';
    throw Object.assign(new Error(message), { status: response.status });
  }
  return data as T;
};

const memberDto = (profile: { app_users: any; members: any; roles: AppRole[] } | null) => {
  if (!profile?.members) return null;
  const appUser = profile.app_users;
  const member = profile.members;
  let extras: MemberExtras = {};
  try {
    extras = JSON.parse(member.next_of_kin || '{}');
  } catch {
    extras = member.next_of_kin ? { nextOfKin: { fullName: member.next_of_kin, relation: '', phone: '' } } : {};
  }
  return {
    id: member.id,
    name: member.full_name,
    title: extras.title ?? 'Member',
    membershipNumber: member.membership_no,
    branch: member.branches.name,
    section: member.sections.name,
    baptismNumber: '',
    photo: member.picture_path ?? '/App%20logo.png',
    phone: member.phone ?? '',
    email: member.email,
    address: member.physical_address,
    postalAddress: member.postal_address,
    age: member.age ?? undefined,
    biography: member.bio,
    qualifications: member.qualifications,
    nextOfKin: extras.nextOfKin
      ? { name: extras.nextOfKin.fullName, relation: extras.nextOfKin.relation, phone: extras.nextOfKin.phone }
      : { name: '', relation: '', phone: '' },
    marriageStatus: member.marital_status ?? 'Not provided',
    familyMembers: (extras.familyMembers ?? []).map((family, index) => ({
      id: `${member.id}-family-${index}`,
      name: family.fullName,
      relation: family.relation,
    })),
    joinYear: member.registered_at.getFullYear(),
    qrToken: member.membership_no,
    isPending: member.status === MemberStatus.PENDING,
  };
};

const createAccount = async (input: RegistrationInput) => {
  const phone = typeof input.phone === 'string' ? normalizePhone(input.phone) : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';
  const fullName = typeof input.fullName === 'string' ? input.fullName.trim() : '';
  const branch = typeof input.branch === 'string' ? input.branch.trim() : '';
  const section = typeof input.section === 'string' ? input.section.trim() : '';

  if (!phone || !/^\+?[0-9]{7,15}$/.test(phone)) {
    throw Object.assign(new Error('Enter a valid phone number including its country code.'), { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw Object.assign(new Error('A valid email address is required.'), { status: 400 });
  }
  if (password.length < 8) {
    throw Object.assign(new Error('Password must be at least 8 characters.'), { status: 400 });
  }
  if (!fullName || !branch || !section) {
    throw Object.assign(new Error('Name, branch, and section are required.'), { status: 400 });
  }

  const [branchRecord, sectionRecord] = await Promise.all([
    prisma.branches.findFirst({ where: { name: branch, is_active: true } }),
    prisma.sections.findFirst({ where: { name: section, is_active: true } }),
  ]);
  if (!branchRecord) throw Object.assign(new Error('That branch is not active in the member database.'), { status: 400 });
  if (!sectionRecord) throw Object.assign(new Error('That section is not active in the member database.'), { status: 400 });

  const authUser = await supabaseRequest<AuthUser>('/auth/v1/admin/users', {
    method: 'POST',
    admin: true,
    body: { phone, phone_confirm: true, password, user_metadata: { display_name: fullName } },
  });
  const now = new Date();
  const extras: MemberExtras = {
    title: input.title?.trim() || 'Member',
    nextOfKin: input.nextOfKin?.fullName?.trim()
      ? { fullName: input.nextOfKin.fullName.trim(), relation: input.nextOfKin.relation?.trim() || 'Other', phone: normalizePhone(input.nextOfKin.phone?.trim() || phone) }
      : undefined,
    familyMembers: (input.familyMembers ?? []).filter((person) => person.fullName?.trim()).map((person) => ({ fullName: person.fullName!.trim(), relation: person.relation?.trim() || 'Family' })),
  };
  try {
    const created = await prisma.$transaction(async (tx) => {
      const counter = await tx.branch_membership_counters.upsert({
        where: { branch_id: branchRecord.id },
        create: { branch_id: branchRecord.id, next_value: 2 },
        update: { next_value: { increment: 1 } },
      });
      const membershipNo = `${branchRecord.code}-${String(counter.next_value - 1).padStart(6, '0')}`;
      const appUser = await tx.app_users.create({
        data: { id: randomUUID(), auth_user_id: authUser.id, email, display_name: fullName, created_at: now, updated_at: now },
      });
      const member = await tx.members.create({
        data: {
          id: randomUUID(), user_id: appUser.id, branch_id: branchRecord.id, section_id: sectionRecord.id,
          membership_no: membershipNo, full_name: fullName, picture_path: input.photoUrl?.trim() || null,
          bio: input.biography?.trim() || '', qualifications: input.qualifications?.trim() || '',
          age: Number.isInteger(input.age) ? input.age : null, email, phone,
          physical_address: input.physicalAddress?.trim() || '', postal_address: input.postalAddress?.trim() || '',
          next_of_kin: JSON.stringify(extras),
          marital_status: Object.values(MaritalStatus).includes(input.marriageStatus?.toUpperCase() as MaritalStatus)
            ? input.marriageStatus!.toUpperCase() as MaritalStatus
            : null,
          status: MemberStatus.PENDING, registered_at: now, created_at: now, updated_at: now,
        },
        include: { branches: true, sections: true },
      });
      await tx.user_roles.create({ data: { id: randomUUID(), user_id: appUser.id, role: AppRole.MEMBER, created_at: now } });
      return { appUser, member, roles: [AppRole.MEMBER] };
    });
    return { authUser, profile: created };
  } catch (error) {
    await supabaseRequest(`/auth/v1/admin/users/${authUser.id}`, { method: 'DELETE', admin: true }).catch(() => undefined);
    throw error;
  }
};

const profileInclude = { members: { include: { branches: true, sections: true } }, user_roles: true } as const;

const profileForAuthUser = async (authUser: AuthUser) => {
  const appUser = await prisma.app_users.findUnique({ where: { auth_user_id: authUser.id }, include: profileInclude });
  if (!appUser || !appUser.is_active) return null;
  return { app_users: appUser, members: appUser.members, roles: appUser.user_roles.map((entry) => entry.role) };
};

const responseRole = (roles: AppRole[]) => {
  if (roles.includes(AppRole.SECURITY)) return 'SECURITY';
  return roles.some((role) => role !== AppRole.MEMBER) ? 'ADMIN' : 'MEMBER';
};

const securityProfileDto = (profile: { app_users: any; roles: AppRole[] } | null) => {
  if (!profile?.roles.includes(AppRole.SECURITY)) return null;
  return {
    name: profile.app_users.display_name,
    email: profile.app_users.email,
    role: 'SECURITY',
    branch: null,
  };
};

const requireUser = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const cookies = cookieValue(request);
    let accessToken = cookies(ACCESS_COOKIE);
    let authUser: AuthUser | null = null;
    if (accessToken) {
      try {
        authUser = await supabaseRequest<AuthUser>('/auth/v1/user', { token: accessToken });
      } catch {
        accessToken = undefined;
      }
    }
    if (!authUser) {
      const refreshToken = cookies(REFRESH_COOKIE);
      if (!refreshToken) {
        clearSessionCookie(response);
        return response.status(401).json({ error: 'Sign in to continue.' });
      }
      const session = await supabaseRequest<SupabaseSession>('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST', body: { refresh_token: refreshToken },
      });
      authUser = session.user;
      setSessionCookies(response, session);
    }
    const profile = await profileForAuthUser(authUser);
    if (!profile) {
      clearSessionCookie(response);
      return response.status(403).json({ error: 'No active member profile is linked to this account.' });
    }
    response.locals.authUser = authUser;
    response.locals.profile = profile;
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireAdmin = (request: Request, response: Response, next: NextFunction) => {
  const roles = response.locals.profile?.roles as AppRole[] | undefined;
  if (!roles?.includes(AppRole.MASTER_ADMIN)) return response.status(403).json({ error: 'Master administrator access is required.' });
  return next();
};

const signIn = (identifier: { phone: string } | { email: string }, password: string) =>
  supabaseRequest<SupabaseSession>('/auth/v1/token?grant_type=password', {
    method: 'POST', body: { ...identifier, password },
  });

app.post('/api/auth/register', async (request, response, next) => {
  try {
    const { authUser } = await createAccount(request.body as RegistrationInput);
    const phone = normalizePhone(String(request.body?.phone ?? ''));
    const session = await signIn({ phone }, String(request.body?.password ?? ''));
    setSessionCookies(response, session);
    const profile = await profileForAuthUser(authUser);
    return response.status(201).json({
      member: memberDto(profile),
      securityProfile: securityProfileDto(profile),
      role: responseRole(profile?.roles ?? []),
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/auth/login', async (request, response, next) => {
  try {
    const emailField = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
    const phoneField = normalizePhone(typeof request.body?.phone === 'string' ? request.body.phone : '');
    let identifier: { phone: string } | { email: string } | null = null;
    if (emailField.includes('@')) {
      // Accounts are created in Supabase Auth with a phone identity, so map
      // the email to the member's registered phone before asking Supabase.
      const appUser = await prisma.app_users.findUnique({ where: { email: emailField }, include: { members: true } });
      const linkedPhone = normalizePhone(appUser?.members?.phone ?? '');
      identifier = linkedPhone ? { phone: linkedPhone } : { email: emailField };
    } else {
      // The sign-in field doubles as a phone entry — accept either identifier.
      const asPhone = normalizePhone(emailField) || phoneField;
      if (/^\+?[0-9]{7,15}$/.test(asPhone)) identifier = { phone: asPhone };
    }
    if (!identifier) {
      return response.status(400).json({ error: 'Enter a valid email address or phone number.' });
    }
    const session = await signIn(identifier, String(request.body?.password ?? ''));
    const profile = await profileForAuthUser(session.user);
    if (!profile) return response.status(403).json({ error: 'No active member profile is linked to this account.' });
    setSessionCookies(response, session);
    return response.json({
      member: memberDto(profile),
      securityProfile: securityProfileDto(profile),
      role: responseRole(profile.roles),
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/auth/me', requireUser, (request, response) => {
  const profile = response.locals.profile;
  const authUser = response.locals.authUser as AuthUser;
  return response.json({
    member: memberDto(profile),
    securityProfile: securityProfileDto(profile),
    role: responseRole(profile.roles),
    phone: authUser.phone,
    email: authUser.email,
  });
});

app.post('/api/auth/logout', async (request, response, next) => {
  try {
    const accessToken = cookieValue(request)(ACCESS_COOKIE);
    if (accessToken) await supabaseRequest('/auth/v1/logout', { method: 'POST', token: accessToken }).catch(() => undefined);
    clearSessionCookie(response);
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

const appUrlFrom = (request: Request) => {
  const configured = (process.env.APP_URL ?? '').trim().replace(/\/+$/, '');
  if (configured) return configured;
  const proto = String(request.headers['x-forwarded-proto'] ?? 'http').split(',')[0].trim();
  const host = String(request.headers['x-forwarded-host'] ?? request.headers.host ?? '').split(',')[0].trim();
  return host ? `${proto}://${host}` : '';
};

const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const hashResetToken = (token: string) => createHash('sha256').update(token).digest('hex');

const sendPasswordResetEmail = async (to: string, displayName: string, resetUrl: string) => {
  if (!RESEND_API_KEY) {
    throw Object.assign(new Error('Set RESEND_API_KEY in the server environment.'), { status: 503 });
  }
  const safeName = displayName.trim() || 'Member';
  console.log(`[resend] Sending password reset email to ${to}…`);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [to],
      subject: 'Reset your IPHC MMUSO password',
      html: `
        <div style="margin:0;padding:24px;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
          <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <div style="background:#0A2A52;padding:24px;text-align:center;">
              <div style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:2px;">IPHC MMUSO</div>
              <div style="color:#8FA8C8;font-size:11px;letter-spacing:2px;margin-top:4px;">IPHC • SILO ZUURBEKOM</div>
            </div>
            <div style="padding:28px 24px;">
              <h1 style="margin:0 0 12px;font-size:18px;color:#0A2A52;">Reset your password</h1>
              <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.6;">Hi ${safeName}, we received a request to reset the password for your membership account. Tap the button below to choose a new password:</p>
              <div style="text-align:center;margin:24px 0;">
                <a href="${resetUrl}" style="background:#D13138;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:14px;font-weight:bold;display:inline-block;">Choose a new password</a>
              </div>
              <p style="margin:0 0 12px;font-size:12px;color:#64748b;line-height:1.6;">This link expires in 1 hour and can only be used once. If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="margin:0;font-size:12px;word-break:break-all;"><a href="${resetUrl}" style="color:#3F76C5;">${resetUrl}</a></p>
              <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">If you didn't request a password reset, you can safely ignore this email — your password stays unchanged.</p>
            </div>
          </div>
        </div>
      `,
      text: [
        `Hi ${safeName},`,
        '',
        'We received a request to reset the password for your IPHC MMUSO membership account.',
        '',
        'Open this link on your phone to choose a new password:',
        resetUrl,
        '',
        'The link expires in 1 hour and can only be used once.',
        '',
        "If you didn't request a password reset, you can safely ignore this email — your password stays unchanged.",
        '',
        'IPHC • Silo Zuurbekom',
      ].join('\n'),
    }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    console.error(`[resend] Password reset email to ${to} failed — Resend responded ${response.status}:`, data ?? '(no response body)');
    throw Object.assign(new Error(data?.message ?? `Could not send the reset email (Resend status ${response.status}). Please try again.`), { status: 502 });
  }
  const sent = await response.json().catch(() => null);
  console.log(`[resend] Password reset email to ${to} accepted by Resend (id: ${sent?.id ?? 'unknown'}).`);
};

app.post('/api/auth/forgot-password', async (request, response, next) => {
  try {
    const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return response.status(400).json({ error: 'Enter a valid email address.' });
    }
    // Supabase Auth identities for these accounts are phone-based, so the
    // reset token is ours: emailed via Resend, stored hashed, single use.
    const appUser = await prisma.app_users.findUnique({ where: { email } });
    if (!appUser) {
      console.log(`[auth] Password reset requested for ${email}, but no account uses that email — no email sent.`);
    } else if (!appUser.is_active) {
      console.log(`[auth] Password reset requested for ${email}, but that account is disabled — no email sent.`);
    }
    if (appUser?.is_active) {
      const token = randomBytes(32).toString('base64url');
      const now = new Date();
      await prisma.$transaction([
        prisma.password_reset_tokens.updateMany({
          where: { user_id: appUser.id, used_at: null },
          data: { used_at: now },
        }),
        prisma.password_reset_tokens.create({
          data: {
            id: randomUUID(),
            user_id: appUser.id,
            token_hash: hashResetToken(token),
            expires_at: new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MS),
          },
        }),
      ]);
      const resetUrl = `${appUrlFrom(request)}/#reset_token=${token}`;
      await sendPasswordResetEmail(email, appUser.display_name, resetUrl);
    }
    return response.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/auth/reset-password', async (request, response, next) => {
  try {
    const token = String(request.body?.token ?? '');
    const password = String(request.body?.password ?? '');
    if (!token) {
      return response.status(400).json({ error: 'Reset token is missing. Please request a new reset link.' });
    }
    if (password.length < 8) {
      return response.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    const record = await prisma.password_reset_tokens.findUnique({
      where: { token_hash: hashResetToken(token) },
      include: { app_users: true },
    });
    if (!record || record.used_at || record.expires_at < new Date()) {
      return response.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
    }
    if (!record.app_users.is_active) {
      return response.status(403).json({ error: 'This account is no longer active.' });
    }
    await supabaseRequest(`/auth/v1/admin/users/${record.app_users.auth_user_id}`, {
      method: 'PUT',
      admin: true,
      body: { password },
    });
    await prisma.password_reset_tokens.update({ where: { id: record.id }, data: { used_at: new Date() } });
    return response.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/users', requireUser, requireAdmin, async (request, response, next) => {
  try {
    const users = await prisma.app_users.findMany({ include: profileInclude, orderBy: { created_at: 'desc' } });
    return response.json(users.map((user) => {
      const roles = user.user_roles.map((entry) => entry.role);
      return {
        id: user.id,
        phone: user.members?.phone ?? '',
        email: user.email,
        role: responseRole(roles),
        status: user.is_active ? 'ACTIVE' : 'DISABLED',
        createdAt: user.created_at.toISOString(),
        member: memberDto({ app_users: user, members: user.members, roles }),
      };
    }));
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/users', requireUser, requireAdmin, async (request, response, next) => {
  try {
    const created = await createAccount(request.body as RegistrationInput);
    const user = created.profile.appUser;
    return response.status(201).json({
      id: user.id, phone: created.profile.member.phone, email: user.email, role: 'MEMBER', status: 'ACTIVE',
      createdAt: user.created_at.toISOString(),
      member: memberDto({ app_users: user, members: created.profile.member, roles: created.profile.roles }),
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/auth/options', async (_request, response, next) => {
  try {
    const [branchList, sectionList] = await Promise.all([
      prisma.branches.findMany({ where: { is_active: true }, select: { name: true }, orderBy: { name: 'asc' } }),
      prisma.sections.findMany({ where: { is_active: true }, select: { name: true }, orderBy: { name: 'asc' } }),
    ]);
    return response.json({
      branches: branchList.map((entry) => entry.name),
      sections: sectionList.map((entry) => entry.name),
    });
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// Admin: Silo event management
// ---------------------------------------------------------------------------
const adminEventDto = (event: {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  starts_at: Date;
  ends_at: Date | null;
  is_published: boolean;
  archived_at: Date | null;
  created_at: Date;
  branches: { name: string } | null;
}) => ({
  id: event.id,
  title: event.title,
  category: event.category,
  description: event.description,
  location: event.location,
  startsAt: event.starts_at.toISOString(),
  endsAt: event.ends_at ? event.ends_at.toISOString() : null,
  isPublished: event.is_published,
  archivedAt: event.archived_at ? event.archived_at.toISOString() : null,
  createdAt: event.created_at.toISOString(),
  branch: event.branches?.name ?? null,
});

app.get('/api/admin/events', requireUser, requireAdmin, async (_request, response, next) => {
  try {
    const events = await prisma.events.findMany({
      include: { branches: true },
      orderBy: [{ archived_at: 'asc' }, { starts_at: 'desc' }],
      take: 200,
    });
    return response.json(events.map(adminEventDto));
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/events', requireUser, requireAdmin, async (request, response, next) => {
  try {
    const body = request.body as {
      title?: string;
      category?: string;
      description?: string;
      location?: string;
      startsAt?: string;
      endsAt?: string;
      isPublished?: boolean;
    };
    const title = String(body?.title ?? '').trim();
    if (!title) return response.status(400).json({ error: 'Event title is required.' });
    const startsAt = new Date(String(body?.startsAt ?? ''));
    if (Number.isNaN(startsAt.getTime())) {
      return response.status(400).json({ error: 'A valid start date and time is required.' });
    }
    const endsAt = body?.endsAt ? new Date(String(body.endsAt)) : null;
    if (endsAt && Number.isNaN(endsAt.getTime())) {
      return response.status(400).json({ error: 'End date and time is invalid.' });
    }
    const actorId = response.locals.profile.app_users.id;
    const event = await prisma.events.create({
      data: {
        id: randomUUID(),
        title,
        category: String(body?.category ?? '').trim() || 'Service',
        description: String(body?.description ?? '').trim(),
        location: String(body?.location ?? '').trim() || 'Zuurbekom Headquarters (Silo)',
        starts_at: startsAt,
        ends_at: endsAt,
        is_published: body?.isPublished !== false,
        created_by: actorId,
        updated_at: new Date(),
      },
      include: { branches: true },
    });
    await prisma.audit_log.create({
      data: {
        id: randomUUID(),
        actor_id: actorId,
        action: AuditAction.EVENT_CREATED,
        entity_type: 'event',
        entity_id: event.id,
        details: { title: event.title, starts_at: event.starts_at.toISOString() },
      },
    });
    return response.status(201).json(adminEventDto(event));
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/events/:id/publish', requireUser, requireAdmin, async (request, response, next) => {
  try {
    const id = String(request.params.id);
    const isPublished = request.body?.isPublished !== false;
    const existing = await prisma.events.findFirst({ where: { id, archived_at: null } });
    if (!existing) return response.status(404).json({ error: 'Event not found.' });
    const event = await prisma.events.update({
      where: { id },
      data: { is_published: isPublished },
      include: { branches: true },
    });
    await prisma.audit_log.create({
      data: {
        id: randomUUID(),
        actor_id: response.locals.profile.app_users.id,
        action: AuditAction.EVENT_UPDATED,
        entity_type: 'event',
        entity_id: event.id,
        details: { title: event.title, is_published: isPublished },
      },
    });
    return response.json(adminEventDto(event));
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/events/:id/archive', requireUser, requireAdmin, async (request, response, next) => {
  try {
    const id = String(request.params.id);
    const existing = await prisma.events.findFirst({ where: { id, archived_at: null } });
    if (!existing) return response.status(404).json({ error: 'Event not found.' });
    const event = await prisma.events.update({
      where: { id },
      data: { archived_at: new Date(), is_published: false },
      include: { branches: true },
    });
    await prisma.audit_log.create({
      data: {
        id: randomUUID(),
        actor_id: response.locals.profile.app_users.id,
        action: AuditAction.EVENT_ARCHIVED,
        entity_type: 'event',
        entity_id: event.id,
        details: { title: event.title },
      },
    });
    return response.json(adminEventDto(event));
  } catch (error) {
    return next(error);
  }
});

const requireSecurity = (request: Request, response: Response, next: NextFunction) => {
  const roles = response.locals.profile?.roles as AppRole[] | undefined;
  if (!roles?.some((role) => role === AppRole.SECURITY || role === AppRole.MASTER_ADMIN)) {
    return response.status(403).json({ error: 'Security personnel access is required.' });
  }
  return next();
};

app.get('/api/security/events', requireUser, requireSecurity, async (_request, response, next) => {
  try {
    const now = new Date();
    const events = await prisma.events.findMany({
      where: { is_published: true, archived_at: null, ends_at: { gte: now } },
      include: { branches: true },
      orderBy: { starts_at: 'asc' },
      take: 50,
    });
    return response.json(events.map((event) => ({
      id: event.id,
      title: event.title,
      category: event.category,
      location: event.location,
      startsAt: event.starts_at.toISOString(),
      branch: event.branches?.name ?? null,
    })));
  } catch (error) {
    return next(error);
  }
});

app.post('/api/security/attendance', requireUser, requireSecurity, async (request, response, next) => {
  try {
    const eventId = String(request.body?.eventId ?? '');
    const membershipNumber = String(request.body?.membershipNumber ?? '').trim();
    if (!eventId || !membershipNumber) {
      return response.status(400).json({ error: 'Event and membership number are required.' });
    }
    const [event, member] = await Promise.all([
      prisma.events.findFirst({ where: { id: eventId, is_published: true, archived_at: null } }),
      prisma.members.findFirst({ where: { membership_no: membershipNumber }, include: { branches: true } }),
    ]);
    if (!event) return response.status(404).json({ error: 'Event not found.' });
    if (!member) return response.status(404).json({ error: 'No member found with that membership number.' });
    const attendance = await prisma.attendance.create({
      data: {
        id: randomUUID(),
        member_id: member.id,
        branch_id: member.branch_id,
        event_id: event.id,
        service_name: event.title,
        location: event.location,
        method: 'usher_scan',
        recorded_by: response.locals.profile.app_users.id,
      },
    });
    return response.status(201).json({
      attendanceId: attendance.id,
      memberName: member.full_name,
      membershipNumber: member.membership_no,
      eventName: event.title,
      checkedInAt: attendance.checked_in_at.toISOString(),
    });
  } catch (error) {
    return next(error);
  }
});

const attendanceDto = (record: {
  id: string;
  service_name: string;
  location: string;
  method: string;
  checked_in_at: Date;
  events: { title: string } | null;
  branches: { name: string };
}) => ({
  attendanceId: record.id,
  eventName: record.events?.title ?? record.service_name,
  branch: record.branches.name,
  location: record.location,
  method: (record.method === 'self_qr' ? 'self_qr' : 'usher_scan') as 'self_qr' | 'usher_scan',
  checkedInAt: record.checked_in_at.toISOString(),
});

app.get('/api/attendance/me', requireUser, async (request, response, next) => {
  try {
    const member = response.locals.profile.members;
    if (!member) return response.json([]);
    const records = await prisma.attendance.findMany({
      where: { member_id: member.id },
      include: { events: true, branches: true },
      orderBy: { checked_in_at: 'desc' },
      take: 100,
    });
    return response.json(records.map(attendanceDto));
  } catch (error) {
    return next(error);
  }
});

app.post('/api/attendance/self', requireUser, async (request, response, next) => {
  try {
    const member = response.locals.profile.members;
    if (!member) return response.status(403).json({ error: 'No member profile is linked to this account.' });
    const eventId = String(request.body?.eventId ?? '');
    if (!eventId) return response.status(400).json({ error: 'Event is required.' });
    const event = await prisma.events.findFirst({ where: { id: eventId, is_published: true, archived_at: null } });
    if (!event) return response.status(404).json({ error: 'Event not found.' });
    const existing = await prisma.attendance.findFirst({
      where: { member_id: member.id, event_id: event.id },
      include: { events: true, branches: true },
    });
    if (existing) return response.json(attendanceDto(existing));
    const attendance = await prisma.attendance.create({
      data: {
        id: randomUUID(),
        member_id: member.id,
        branch_id: member.branch_id,
        event_id: event.id,
        service_name: event.title,
        location: event.location,
        method: 'self_qr',
      },
      include: { events: true, branches: true },
    });
    return response.status(201).json(attendanceDto(attendance));
  } catch (error) {
    return next(error);
  }
});

if (process.env.VERCEL !== '1' && existsSync(resolve('dist/index.html'))) {
  app.use(express.static(resolve('dist')));
  app.get(/.*/, (request, response) => response.sendFile(resolve('dist/index.html')));
}

app.use((error: any, request: Request, response: Response, next: NextFunction) => {
  if (response.headersSent) return next(error);
  if (error?.code === 'P2002') {
    return response.status(409).json({ error: 'An account already exists with that phone number or email.' });
  }
  const status = Number(error?.status) || 500;
  if (status >= 500) console.error(error);
  return response.status(status).json({ error: status === 500 ? 'Something went wrong. Please try again.' : error.message });
});

export default app;

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`IPHC API listening on port ${PORT}`);
    if (RESEND_API_KEY) {
      console.log(`[resend] Password-reset emails enabled (key ${RESEND_API_KEY.slice(0, 3)}…${RESEND_API_KEY.slice(-4)}, from ${RESEND_FROM}).`);
    } else {
      console.warn('[resend] RESEND_API_KEY is not set — password-reset emails will fail with "Set RESEND_API_KEY in the server environment."');
    }
  });
}