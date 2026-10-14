import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { AppRole, PrismaClient } from '@prisma/client';
import { normalizePhone } from '../server/security';

const prisma = new PrismaClient();
const supabaseUrl = (process.env.SUPABASE_URL ?? 'https://zhtrpgvnbrflheismytd.supabase.co').replace(/\/$/, '');

const bootstrapAdmin = async () => {
  const phone = normalizePhone(process.env.ADMIN_PHONE ?? '');
  const password = process.env.ADMIN_PASSWORD ?? '';
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!phone || !password || password.length < 12 || !email || !serviceKey) {
    throw new Error('Set ADMIN_PHONE, ADMIN_EMAIL, SUPABASE_SERVICE_ROLE_KEY, and an ADMIN_PASSWORD of at least 12 characters.');
  }

  const profile = await prisma.app_users.findUnique({ where: { email } });
  if (!profile) {
    throw new Error('Create a member account first with this email, then run admin:bootstrap to grant it administrator access.');
  }

  const endpoint = profile.auth_user_id
    ? `${supabaseUrl}/auth/v1/admin/users/${profile.auth_user_id}`
    : `${supabaseUrl}/auth/v1/admin/users`;
  const authResponse = await fetch(endpoint, {
    method: profile.auth_user_id ? 'PUT' : 'POST',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, phone_confirm: true, password, user_metadata: { display_name: profile.display_name } }),
  });
  const authResult = await authResponse.json().catch(() => null);
  if (!authResponse.ok) throw new Error(authResult?.msg ?? authResult?.message ?? 'Supabase could not configure the administrator login.');

  if (profile.auth_user_id !== authResult.id) {
    await prisma.app_users.update({ where: { id: profile.id }, data: { auth_user_id: authResult.id, updated_at: new Date() } });
  }
  await prisma.user_roles.upsert({
    where: { user_id_role: { user_id: profile.id, role: AppRole.MASTER_ADMIN } },
    create: { id: randomUUID(), user_id: profile.id, role: AppRole.MASTER_ADMIN },
    update: {},
  });
  console.log(`Master administrator configured for ${phone}.`);
};

bootstrapAdmin()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());