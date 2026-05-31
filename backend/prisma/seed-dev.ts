import 'dotenv/config';
import { PrismaClient, user_role, project_status, demand_status, demand_subfolder, ticket_status, financial_type, financial_status, notification_type } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function generateSha256Hash(val: string): string {
  return crypto.createHash('sha256').update(val).digest('hex');
}

async function main() {
  console.log('🌱 Starting database seed from database.json...');

  const dbPath = path.join(__dirname, '../uploads/database.json');
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ database.json not found at ${dbPath}. Seed aborted.`);
    return;
  }

  const dbState = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

  console.log('🧹 Cleaning existing database tables...');
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      nexa.users, 
      nexa.projects, 
      nexa.project_members, 
      nexa.demands, 
      nexa.demand_files, 
      nexa.contracts, 
      nexa.contract_signatures, 
      nexa.contract_versions, 
      nexa.tickets, 
      nexa.ticket_responses, 
      nexa.financial_entries, 
      nexa.professor_comments, 
      nexa.profitability_goals 
    CASCADE;
  `);

  // Maps to convert legacy IDs to valid UUIDs
  const userMap = new Map<string, string>();
  const projectMap = new Map<string, string>();
  const demandMap = new Map<string, string>();
  const ticketMap = new Map<string, string>();

  // 1. POPULATE USERS
  console.log('👤 Seeding users...');
  for (const u of dbState.users) {
    // Generate true UUID for each user, keeping carlos's ID if we want, but better to use clean UUIDs
    // Exception: check if the legacy ID is a UUID already, otherwise generate one
    const userUuid = u.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      ? u.id
      : crypto.randomUUID();
    userMap.set(u.id, userUuid);

    const cpfHash = u.cpfCnpj ? generateSha256Hash(u.cpfCnpj) : null;

    await prisma.users.create({
      data: {
        id: userUuid,
        email: u.email,
        password_hash: u.password,
        name: u.name,
        role: u.role as user_role,
        avatar_url: u.avatarUrl || u.avatar_url || null,
        cpf_cnpj_hash: cpfHash,
        is_active: u.isActive !== undefined ? u.isActive : true,
        created_at: u.createdAt ? new Date(u.createdAt) : new Date(),
        updated_at: u.updatedAt ? new Date(u.updatedAt) : new Date(),
      },
    });

    // Encrypt CPF/CNPJ using pgcrypto sym_encrypt via direct database command
    if (u.cpfCnpj) {
      const cryptoKey = process.env.CPF_CRYPTO_KEY;
      await prisma.$executeRawUnsafe(
        `UPDATE nexa.users SET cpf_cnpj_encrypted = pgp_sym_encrypt($1, $2) WHERE id = $3::uuid`,
        u.cpfCnpj,
        cryptoKey,
        userUuid
      );
    }
  }

  // 2. POPULATE PROJECTS
  console.log('🏢 Seeding projects...');
  for (const p of dbState.projects) {
    const projectUuid = p.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      ? p.id
      : crypto.randomUUID();
    projectMap.set(p.id, projectUuid);

    const ownerUuid = userMap.get(p.ownerId);
    const clientUuid = p.clientId ? userMap.get(p.clientId) : null;

    if (!ownerUuid) {
      console.warn(`⚠️ Owner ${p.ownerId} not found for project ${p.name}. Skipping.`);
      continue;
    }

    await prisma.projects.create({
      data: {
        id: projectUuid,
        name: p.name,
        description: p.description || null,
        deadline: new Date(p.deadline),
        status: p.status as project_status,
        owner_id: ownerUuid,
        client_id: clientUuid || null,
        created_at: p.createdAt ? new Date(p.createdAt) : new Date(),
        updated_at: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      },
    });
  }

  // 3. POPULATE PROJECT MEMBERS
  console.log('👥 Seeding project members...');
  for (const pm of dbState.projectMembers) {
    const projectUuid = projectMap.get(pm.projectId);
    const userUuid = userMap.get(pm.userId);

    if (!projectUuid || !userUuid) {
      continue;
    }

    await prisma.project_members.create({
      data: {
        project_id: projectUuid,
        user_id: userUuid,
        productivity: pm.productivity || 0,
        progress: pm.progress || 0,
        assigned_at: pm.assignedAt ? new Date(pm.assignedAt) : new Date(),
      },
    });
  }

  // 4. POPULATE DEMANDS
  console.log('📝 Seeding demands...');
  for (const d of dbState.demands) {
    const demandUuid = d.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      ? d.id
      : crypto.randomUUID();
    demandMap.set(d.id, demandUuid);

    const projectUuid = projectMap.get(d.projectId);
    if (!projectUuid) {
      continue;
    }

    // Set a default user creator (like Carlos Mendes) if not present in legacy
    const creatorUuid = (d.createdBy ? userMap.get(d.createdBy) : null) || [...userMap.values()][0] || '';

    await prisma.demands.create({
      data: {
        id: demandUuid,
        project_id: projectUuid,
        title: d.title,
        description: d.description || null,
        deadline: new Date(d.deadline),
        status: d.status as demand_status,
        created_by: creatorUuid,
        created_at: d.createdAt ? new Date(d.createdAt) : new Date(),
        updated_at: d.updatedAt ? new Date(d.updatedAt) : new Date(),
      },
    });
  }

  // 5. POPULATE DEMAND/PROJECT FILES
  console.log('📎 Seeding files...');
  for (const f of dbState.projectFiles) {
    // In database.json, files were mapped under 'projectFiles' and were linked to either projects or demands via 'projectId'
    const isReference = f.subfolder === 'referencias' || f.subfolder === 'contratos';
    
    let projectUuid: string | null = null;
    let demandUuid: string | null = null;

    if (isReference) {
      projectUuid = projectMap.get(f.projectId) || null;
    } else {
      demandUuid = demandMap.get(f.projectId) || null;
    }

    // If both null, we cannot satisfy check constraint
    if (!projectUuid && !demandUuid) {
      continue;
    }

    const uploaderUuid = userMap.get(f.uploadedById) || [...userMap.values()][0] || '';

    await prisma.demand_files.create({
      data: {
        id: f.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? f.id : crypto.randomUUID(),
        demand_id: demandUuid,
        project_id: projectUuid,
        subfolder: f.subfolder as demand_subfolder,
        file_name: f.fileName,
        file_key: f.fileKey,
        file_size_bytes: BigInt(f.fileSize || 1024),
        mime_type: f.mimeType,
        uploaded_by: uploaderUuid,
        created_at: f.createdAt ? new Date(f.createdAt) : new Date(),
      },
    });
  }

  // 6. POPULATE TICKETS
  console.log('🎫 Seeding tickets...');
  for (const t of dbState.tickets) {
    const ticketUuid = t.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      ? t.id
      : crypto.randomUUID();
    ticketMap.set(t.id, ticketUuid);

    const projectUuid = t.projectId ? projectMap.get(t.projectId) : null;
    const creatorUuid = userMap.get(t.creatorId);

    if (!creatorUuid) {
      continue;
    }

    await prisma.tickets.create({
      data: {
        id: ticketUuid,
        project_id: projectUuid,
        creator_id: creatorUuid,
        subject: t.subject,
        description: t.description,
        status: t.status as ticket_status,
        sla_deadline: t.slaDeadline ? new Date(t.slaDeadline) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        created_at: t.createdAt ? new Date(t.createdAt) : new Date(),
        updated_at: t.updatedAt ? new Date(t.updatedAt) : new Date(),
      },
    });
  }

  // 7. POPULATE TICKET RESPONSES
  console.log('💬 Seeding ticket responses...');
  for (const tr of dbState.ticketResponses) {
    const ticketUuid = ticketMap.get(tr.ticketId);
    const authorUuid = userMap.get(tr.authorId);

    if (!ticketUuid || !authorUuid) {
      continue;
    }

    await prisma.ticket_responses.create({
      data: {
        ticket_id: ticketUuid,
        author_id: authorUuid,
        message: tr.message,
        created_at: tr.createdAt ? new Date(tr.createdAt) : new Date(),
      },
    });
  }

  // 8. POPULATE FINANCIAL ENTRIES
  console.log('💰 Seeding financial entries...');
  for (const fe of dbState.financialEntries) {
    const projectUuid = fe.projectId ? projectMap.get(fe.projectId) : null;
    // Set a default user creator (like Carlos Mendes)
    const creatorUuid = [...userMap.values()][0] || '';

    await prisma.financial_entries.create({
      data: {
        id: fe.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? fe.id : crypto.randomUUID(),
        type: fe.type as financial_type,
        description: fe.description,
        // Convert real Float to cents (BigInt)
        amount_cents: BigInt(Math.round(fe.amount * 100)),
        due_date: new Date(fe.dueDate),
        status: fe.status as financial_status,
        category: fe.category || null,
        project_id: projectUuid,
        created_by: creatorUuid,
        created_at: fe.createdAt ? new Date(fe.createdAt) : new Date(),
        updated_at: fe.updatedAt ? new Date(fe.updatedAt) : new Date(),
        paid_at: fe.status === 'PAID' ? (fe.updatedAt ? new Date(fe.updatedAt) : new Date()) : null,
        paid_by: fe.status === 'PAID' ? creatorUuid : null,
      },
    });
  }

  // 9. POPULATE PROFESSOR COMMENTS
  console.log('🧑‍🏫 Seeding professor comments...');
  for (const pc of dbState.professorComments) {
    const targetUuid = userMap.get(pc.targetId);
    const authorUuid = userMap.get(pc.authorId);

    if (!targetUuid || !authorUuid) {
      continue;
    }

    await prisma.professor_comments.create({
      data: {
        target_id: targetUuid,
        author_id: authorUuid,
        comment: pc.comment,
        created_at: pc.createdAt ? new Date(pc.createdAt) : new Date(),
        updated_at: pc.createdAt ? new Date(pc.createdAt) : new Date(),
      },
    });
  }

  // 10. POPULATE PROFITABILITY GOALS
  console.log('📈 Seeding profitability goals...');
  for (const pg of dbState.profitabilityGoals) {
    const userUuid = userMap.get(pg.userId);
    if (!userUuid) {
      continue;
    }

    await prisma.profitability_goals.create({
      data: {
        user_id: userUuid,
        month: pg.month,
        target_cents: BigInt(Math.round(pg.target * 100)),
        actual_cents: BigInt(Math.round(pg.actual * 100)),
      },
    });
  }

  // 11. POPULATE CONTRACTS (Extract from project contracts if present)
  console.log('📄 Seeding contracts...');
  for (const p of dbState.projects) {
    if (p.contracts && p.contracts.length > 0) {
      const projectUuid = projectMap.get(p.id);
      if (!projectUuid) continue;

      for (const c of p.contracts) {
        const creatorUuid = [...userMap.values()][0] || '';
        const contractUuid = c.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
          ? c.id
          : crypto.randomUUID();

        // Calculate simple SHA-256 for the contract content (which is the physical file path)
        const contentHash = generateSha256Hash(c.content);

        await prisma.contracts.create({
          data: {
            id: contractUuid,
            project_id: projectUuid,
            title: c.title,
            content: c.content,
            content_hash: contentHash,
            status: 'PENDING', // default initial
            created_by: creatorUuid,
            created_at: c.createdAt ? new Date(c.createdAt) : new Date(),
            updated_at: c.updatedAt ? new Date(c.updatedAt) : new Date(),
          },
        });
      }
    }
  }

  console.log('🎉 Database seed completed successfully!');
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
