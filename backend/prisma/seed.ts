import 'dotenv/config';
import { PrismaClient, user_role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting safe initialization seed...');

  const adminExists = await prisma.users.findFirst({
    where: { role: 'NIVEL_3' },
  });

  if (!adminExists) {
    console.log('👤 No admin found. Creating default admin...');
    const adminUuid = crypto.randomUUID();
    const passwordHash = await bcrypt.hash('admin123', 12);

    await prisma.users.create({
      data: {
        id: adminUuid,
        email: 'admin@nexa.com',
        password_hash: passwordHash,
        name: 'Admin NEXA',
        role: 'NIVEL_3',
        is_active: true,
      },
    });
    console.log('✅ Default admin created (admin@nexa.com / admin123). Please change password in production.');
  } else {
    console.log('✅ Admin already exists. No action required.');
  }

  console.log('🎉 Safe initialization seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
