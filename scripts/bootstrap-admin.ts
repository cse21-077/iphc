import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword, normalizePhone } from '../server/security';

const prisma = new PrismaClient();

const bootstrapAdmin = async () => {
  const phone = normalizePhone(process.env.ADMIN_PHONE ?? '');
  const password = process.env.ADMIN_PASSWORD ?? '';
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;
  if (!phone || !password || password.length < 12) {
    throw new Error('Set ADMIN_PHONE and an ADMIN_PASSWORD of at least 12 characters in .env first.');
  }

  await prisma.user.upsert({
    where: { phone },
    create: {
      phone,
      email,
      passwordHash: await hashPassword(password),
      role: UserRole.ADMIN,
    },
    update: {
      email,
      passwordHash: await hashPassword(password),
      role: UserRole.ADMIN,
      status: 'ACTIVE',
    },
  });
  console.log(`Administrator account configured for ${phone}.`);
};

bootstrapAdmin()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());