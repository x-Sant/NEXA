import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateColaboradoreDto } from './dto/create-colaboradore.dto';
import { UpdateColaboradoreDto } from './dto/update-colaboradore.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { databaseContextStorage } from '../database/database-context';

@Injectable()
export class ColaboradoresService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSha256Hash(val: string): string {
    return crypto.createHash('sha256').update(val).digest('hex');
  }

  async create(createColaboradoreDto: CreateColaboradoreDto) {
    let hashedPassword = createColaboradoreDto.password;
    if (hashedPassword) {
      hashedPassword = await bcrypt.hash(hashedPassword, 10);
    }

    const userUuid = crypto.randomUUID();
    const cpfHash = createColaboradoreDto.cpfCnpj
      ? this.generateSha256Hash(createColaboradoreDto.cpfCnpj)
      : null;

    const newUser = await this.prisma.runWithContext(async (tx) => {
      const user = await tx.users.create({
        data: {
          id: userUuid,
          email: createColaboradoreDto.email,
          password_hash: hashedPassword || '',
          name: createColaboradoreDto.name,
          role: createColaboradoreDto.role as any,
          cpf_cnpj_hash: cpfHash,
          is_active: true,
          password_needs_change: true,
        },
      });

      if (createColaboradoreDto.cpfCnpj) {
        const cryptoKey = process.env.CPF_CRYPTO_KEY;
        await tx.$executeRawUnsafe(
          `UPDATE nexa.users SET cpf_cnpj_encrypted = pgp_sym_encrypt($1, $2) WHERE id = $3::uuid`,
          createColaboradoreDto.cpfCnpj,
          cryptoKey,
          userUuid,
        );
      }
      return user;
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, cpf_cnpj_encrypted, ...userClean } = newUser;
    return { ...userClean, cpfCnpj: createColaboradoreDto.cpfCnpj };
  }

  async findAll(page = 1, limit = 100) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.users.findMany({
        where: { role: { in: ['NIVEL_1', 'NIVEL_2', 'PROFESSOR'] } }, // Filtro correto conforme [B-L06]
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.users.count({
        where: { role: { in: ['NIVEL_1', 'NIVEL_2', 'PROFESSOR'] } },
      }),
    ]);

    const data = users.map((u) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, cpf_cnpj_encrypted, ...userClean } = u;
      return userClean;
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Colaborador com ID ${id} não encontrado.`);
    }

    let cpfCnpj: string | null = null;
    const context = databaseContextStorage.getStore();
    const currentUserId = context?.userId;
    const currentUserRole = context?.userRole;

    if (user.cpf_cnpj_hash) {
      if (currentUserRole === 'NIVEL_3' || currentUserId === id) {
        try {
          const result = await this.prisma.runWithContext(async (tx) => {
            return tx.$queryRawUnsafe(
              `SELECT nexa.fn_decrypt_cpf_cnpj($1::uuid) as decrypted`,
              user.id,
            );
          });
          cpfCnpj = result[0]?.decrypted || null;
        } catch (e) {
          // Se RLS ou nivel_3 barrar, cpfCnpj continua null
        }
      } else {
        cpfCnpj = '***.***.***-**'; // Mascarado
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, cpf_cnpj_encrypted, ...userClean } = user;
    return { ...userClean, cpfCnpj };
  }

  async update(id: string, updateColaboradoreDto: UpdateColaboradoreDto) {
    await this.findOne(id); // Garante que existe
    const updates: any = {};

    if (updateColaboradoreDto.email)
      updates.email = updateColaboradoreDto.email;
    if (updateColaboradoreDto.name) updates.name = updateColaboradoreDto.name;
    if (updateColaboradoreDto.role)
      updates.role = updateColaboradoreDto.role as any;
    if (updateColaboradoreDto.isActive !== undefined)
      updates.is_active = updateColaboradoreDto.isActive;

    if (updateColaboradoreDto.password) {
      updates.password_hash = await bcrypt.hash(
        updateColaboradoreDto.password,
        10,
      );
    }

    if (updateColaboradoreDto.cpfCnpj) {
      updates.cpf_cnpj_hash = this.generateSha256Hash(
        updateColaboradoreDto.cpfCnpj,
      );
    }

    const updatedUser = await this.prisma.runWithContext(async (tx) => {
      const user = await tx.users.update({
        where: { id },
        data: updates,
      });

      if (updateColaboradoreDto.cpfCnpj) {
        const cryptoKey = process.env.CPF_CRYPTO_KEY;
        await tx.$executeRawUnsafe(
          `UPDATE nexa.users SET cpf_cnpj_encrypted = pgp_sym_encrypt($1, $2) WHERE id = $3::uuid`,
          updateColaboradoreDto.cpfCnpj,
          cryptoKey,
          id,
        );
      }
      return user;
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, cpf_cnpj_encrypted, ...userClean } = updatedUser;
    return { ...userClean, cpfCnpj: updateColaboradoreDto.cpfCnpj };
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    await this.prisma.runWithContext(async (tx) => {
      // 1. Delete ticket responses created by this user
      await tx.ticket_responses.deleteMany({
        where: { author_id: id }
      });

      // 2. Delete/Clean tickets created by or assigned to this user
      await tx.sla_alerts.deleteMany({
        where: {
          tickets: { creator_id: id }
        }
      });
      await tx.tickets.deleteMany({
        where: { creator_id: id }
      });

      // 3. Delete contract signatures and versions created by this user
      await tx.contract_signatures.deleteMany({
        where: { user_id: id }
      });
      await tx.contract_versions.deleteMany({
        where: { created_by: id }
      });

      // 4. Delete contracts created by this user
      await tx.contract_signatures.deleteMany({
        where: {
          contracts: { created_by: id }
        }
      });
      await tx.contract_versions.deleteMany({
        where: {
          contracts: { created_by: id }
        }
      });
      await tx.contracts.deleteMany({
        where: { created_by: id }
      });

      // 5. Delete demand files and demands uploaded/created by this user
      await tx.demand_files.deleteMany({
        where: { uploaded_by: id }
      });
      await tx.demands.deleteMany({
        where: { created_by: id }
      });

      // 6. Delete financial entries created or paid by this user
      await tx.financial_entries.deleteMany({
        where: {
          OR: [
            { created_by: id },
            { paid_by: id }
          ]
        }
      });

      // 7. Delete professor comments authored by or targeting this user
      await tx.professor_comments.deleteMany({
        where: {
          OR: [
            { author_id: id },
            { target_id: id }
          ]
        }
      });

      // 8. Re-assign projects owned by this user to another administrator, and nullify client_id references
      const context = databaseContextStorage.getStore();
      const currentUserId = context?.userId;
      const admin = await tx.users.findFirst({
        where: { role: 'NIVEL_3', is_active: true, id: { not: id } }
      });
      const fallbackAdminId = admin?.id || currentUserId;
      if (fallbackAdminId) {
        await tx.projects.updateMany({
          where: { owner_id: id },
          data: { owner_id: fallbackAdminId }
        });
      }
      await tx.projects.updateMany({
        where: { client_id: id },
        data: { client_id: null }
      });

      // 9. Delete user sessions, project members, notifications, goals, demand assignees
      await tx.user_sessions.deleteMany({ where: { user_id: id } });
      await tx.project_members.deleteMany({ where: { user_id: id } });
      await tx.notifications.deleteMany({ where: { user_id: id } });
      await tx.profitability_goals.deleteMany({ where: { user_id: id } });
      await tx.demand_assignees.deleteMany({
        where: {
          OR: [
            { user_id: id },
            { assigned_by: id }
          ]
        }
      });

      // 10. Finally delete the user
      await tx.users.delete({
        where: { id },
      });
    });

    return user;
  }
}
