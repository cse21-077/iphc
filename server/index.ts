import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient, RegistrationStatus, UserRole } from '@prisma/client';
import { createSessionToken, hashPassword, hashSessionToken, normalizePhone, verifyPassword } from './security';

const prisma = new PrismaClient();
const app = express();
const PORT = Number(process.env.API_PORT ?? 3001);
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const COOKIE_NAME = 'iphc_session';

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

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

const cookieValue = (request: Request) => {
  const cookies = request.headers.cookie?.split(';') ?? [];
  const cookie = cookies.find((entry) => entry.trim().startsWith(`${COOKIE_NAME}=`));
  return cookie?.trim().slice(COOKIE_NAME.length + 1);
};

const setSessionCookie = (response: Response, token: string) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}${secure}`
  );
};

const clearSessionCookie = (response: Response) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`);
};

const registrationInclude = {
  registration: { include: { nextOfKin: true, familyMembers: true } },
} as const;

const memberDto = (user: any) => {
  const registration = user.registration;
  if (!registration) return null;
  return {
    id: user.id,
    name: registration.fullName,
    title: registration.title,
    membershipNumber: registration.membershipNumber ?? `PENDING-${user.id.slice(-8).toUpperCase()}`,
    branch: registration.branch,
    section: registration.section,
    baptismNumber: registration.baptismNumber ?? 'PENDING',
    photo: registration.photoUrl ?? '/App%20logo.png',
    phone: user.phone,
    email: user.email ?? '',
    address: registration.physicalAddress ?? '',
    postalAddress: registration.postalAddress ?? undefined,
    age: registration.age ?? undefined,
    biography: registration.biography ?? undefined,
    qualifications: registration.qualifications ?? undefined,
    nextOfKin: registration.nextOfKin
      ? {
          name: registration.nextOfKin.fullName,
          relation: registration.nextOfKin.relation,
          phone: registration.nextOfKin.phone,
        }
      : { name: '', relation: '', phone: '' },
    marriageStatus: registration.marriageStatus ?? 'Not provided',
    familyMembers: registration.familyMembers.map((member: { id: string; fullName: string; relation: string }) => ({
      id: member.id,
      name: member.fullName,
      relation: member.relation,
    })),
    joinYear: registration.submittedAt.getFullYear(),
    qrToken: registration.qrToken ?? `PENDING-${user.id}`,
    isPending: registration.status === RegistrationStatus.PENDING,
  };
};

const createAccount = async (input: RegistrationInput, role: UserRole = UserRole.MEMBER) => {
  const phone = typeof input.phone === 'string' ? normalizePhone(input.phone) : '';
  const email = typeof input.email === 'string' && input.email.trim() ? input.email.trim().toLowerCase() : null;
  const password = typeof input.password === 'string' ? input.password : '';
  const fullName = typeof input.fullName === 'string' ? input.fullName.trim() : '';
  const branch = typeof input.branch === 'string' ? input.branch.trim() : '';
  const section = typeof input.section === 'string' ? input.section.trim() : '';

  if (!phone || !/^\+?[0-9]{7,15}$/.test(phone)) {
    throw Object.assign(new Error('Enter a valid phone number including its country code.'), { status: 400 });
  }
  if (password.length < 8) {
    throw Object.assign(new Error('Password must be at least 8 characters.'), { status: 400 });
  }
  if (!fullName || !branch || !section) {
    throw Object.assign(new Error('Name, branch, and section are required.'), { status: 400 });
  }

  const familyMembers = Array.isArray(input.familyMembers) ? input.familyMembers : [];
  const user = await prisma.user.create({
    data: {
      phone,
      email,
      passwordHash: await hashPassword(password),
      role,
      registration: {
        create: {
          title: input.title?.trim() || 'Member',
          fullName,
          branch,
          section,
          age: Number.isInteger(input.age) ? input.age : null,
          biography: input.biography?.trim() || null,
          qualifications: input.qualifications?.trim() || null,
          photoUrl: input.photoUrl?.trim() || null,
          physicalAddress: input.physicalAddress?.trim() || null,
          postalAddress: input.postalAddress?.trim() || null,
          marriageStatus: input.marriageStatus?.trim() || null,
          nextOfKin: input.nextOfKin?.fullName?.trim()
            ? {
                create: {
                  fullName: input.nextOfKin.fullName.trim(),
                  relation: input.nextOfKin.relation?.trim() || 'Other',
                  phone: normalizePhone(input.nextOfKin.phone?.trim() || phone),
                },
              }
            : undefined,
          familyMembers: {
            create: familyMembers
              .filter((member) => typeof member.fullName === 'string' && member.fullName.trim())
              .map((member) => ({
                fullName: member.fullName!.trim(),
                relation: member.relation?.trim() || 'Family',
              })),
          },
        },
      },
    },
    include: registrationInclude,
  });
  return user;
};

const requireUser = async (request: Request, response: Response, next: NextFunction) => {
  const token = cookieValue(request);
  if (!token) return response.status(401).json({ error: 'Sign in to continue.' });
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: { include: registrationInclude } },
  });
  if (!session || session.expiresAt <= new Date() || session.user.status !== 'ACTIVE') {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    clearSessionCookie(response);
    return response.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
  response.locals.user = session.user;
  return next();
};

const requireAdmin = (request: Request, response: Response, next: NextFunction) => {
  if (response.locals.user?.role !== UserRole.ADMIN) {
    return response.status(403).json({ error: 'Administrator access is required.' });
  }
  return next();
};

const issueSession = async (userId: string, response: Response) => {
  const token = createSessionToken();
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  setSessionCookie(response, token);
};

app.post('/api/auth/register', async (request, response, next) => {
  try {
    const user = await createAccount(request.body as RegistrationInput);
    await issueSession(user.id, response);
    return response.status(201).json({ member: memberDto(user), role: user.role });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/auth/login', async (request, response, next) => {
  try {
    const phone = normalizePhone(String(request.body?.phone ?? ''));
    const password = String(request.body?.password ?? '');
    const user = await prisma.user.findUnique({ where: { phone }, include: registrationInclude });
    if (!user || user.status !== 'ACTIVE' || !(await verifyPassword(password, user.passwordHash))) {
      return response.status(401).json({ error: 'Phone number or password is incorrect.' });
    }
    await issueSession(user.id, response);
    return response.json({ member: memberDto(user), role: user.role });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/auth/me', requireUser, (request, response) => {
  const user = response.locals.user;
  return response.json({ member: memberDto(user), role: user.role, phone: user.phone, email: user.email });
});

app.post('/api/auth/logout', async (request, response, next) => {
  try {
    const token = cookieValue(request);
    if (token) {
      await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
    }
    clearSessionCookie(response);
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/users', requireUser, requireAdmin, async (request, response, next) => {
  try {
    const users = await prisma.user.findMany({
      include: registrationInclude,
      orderBy: { createdAt: 'desc' },
    });
    return response.json(
      users.map((user) => ({
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        member: memberDto(user),
      }))
    );
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/users', requireUser, requireAdmin, async (request, response, next) => {
  try {
    const user = await createAccount(request.body as RegistrationInput);
    return response.status(201).json({
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      member: memberDto(user),
    });
  } catch (error) {
    return next(error);
  }
});

if (existsSync(resolve('dist/index.html'))) {
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

app.listen(PORT, () => console.log(`IPHC API listening on port ${PORT}`));