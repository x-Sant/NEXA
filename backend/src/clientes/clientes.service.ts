import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { databaseContextStorage } from '../database/database-context';

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSha256Hash(val: string): string {
    return crypto.createHash('sha256').update(val).digest('hex');
  }

  async create(createClienteDto: CreateClienteDto) {
    let hashedPassword = createClienteDto.password;
    if (hashedPassword) {
      hashedPassword = await bcrypt.hash(hashedPassword, 10);
    }

    const userUuid = crypto.randomUUID();
    const emailLower = createClienteDto.email.trim().toLowerCase();
    const nameTrimmed = createClienteDto.name.trim();

    // Verificação proativa do Nome
    const existingName = await this.prisma.users.findFirst({
      where: {
        name: { equals: nameTrimmed, mode: 'insensitive' },
        role: 'CLIENTE'
      }
    });

    if (existingName) {
      throw new ConflictException('Já existe um cliente cadastrado com este Nome/Empresa na plataforma.');
    }

    // Verificação proativa para dar erro claro
    const existingUser = await this.prisma.users.findUnique({
      where: { email: emailLower }
    });
    
    if (existingUser) {
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail na plataforma.');
    }

    const cpfHash = createClienteDto.cpfCnpj
      ? this.generateSha256Hash(createClienteDto.cpfCnpj.replace(/\D/g, ''))
      : null;

    if (cpfHash) {
      const existingCpf = await this.prisma.users.findUnique({
        where: { cpf_cnpj_hash: cpfHash }
      });
      if (existingCpf) {
        throw new ConflictException('Já existe um usuário cadastrado com este Documento (CPF/CNPJ).');
      }
    }

    const newClient = await this.prisma.runWithContext(async (tx) => {
      const client = await tx.users.create({
        data: {
          id: userUuid,
          email: emailLower,
          password_hash: hashedPassword || '',
          name: nameTrimmed,
          role: 'CLIENTE',
          cpf_cnpj_hash: cpfHash,
          is_active: true,
          password_needs_change: true,
        },
      });

      if (createClienteDto.cpfCnpj) {
        const cryptoKey = process.env.CPF_CRYPTO_KEY;
        await tx.$executeRawUnsafe(
          `UPDATE nexa.users SET cpf_cnpj_encrypted = pgp_sym_encrypt($1, $2) WHERE id = $3::uuid`,
          createClienteDto.cpfCnpj,
          cryptoKey,
          userUuid,
        );
      }
      return client;
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, cpf_cnpj_encrypted, ...userClean } = newClient;
    return { ...userClean, cpfCnpj: createClienteDto.cpfCnpj };
  }

  async findAll(page = 1, limit = 100) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.users.findMany({
        where: { role: 'CLIENTE' },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.users.count({ where: { role: 'CLIENTE' } }),
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

    if (!user || user.role !== 'CLIENTE') {
      throw new NotFoundException(`Cliente com ID ${id} não encontrado.`);
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

  async update(id: string, updateClienteDto: UpdateClienteDto) {
    await this.findOne(id); // Garante que existe
    const updates: any = {};

    if (updateClienteDto.email) updates.email = updateClienteDto.email;
    if (updateClienteDto.name) updates.name = updateClienteDto.name;
    if (updateClienteDto.isActive !== undefined)
      updates.is_active = updateClienteDto.isActive;

    if (updateClienteDto.password) {
      updates.password_hash = await bcrypt.hash(updateClienteDto.password, 10);
    }

    if (updateClienteDto.cpfCnpj) {
      updates.cpf_cnpj_hash = this.generateSha256Hash(updateClienteDto.cpfCnpj);
    }

    const updatedUser = await this.prisma.runWithContext(async (tx) => {
      const user = await tx.users.update({
        where: { id },
        data: updates,
      });

      if (updateClienteDto.cpfCnpj) {
        const cryptoKey = process.env.CPF_CRYPTO_KEY;
        await tx.$executeRawUnsafe(
          `UPDATE nexa.users SET cpf_cnpj_encrypted = pgp_sym_encrypt($1, $2) WHERE id = $3::uuid`,
          updateClienteDto.cpfCnpj,
          cryptoKey,
          id,
        );
      }
      return user;
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, cpf_cnpj_encrypted, ...userClean } = updatedUser;
    return { ...userClean, cpfCnpj: updateClienteDto.cpfCnpj };
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    
    await this.prisma.runWithContext(async (tx) => {
      // 1. Delete professor comments related to this user
      await tx.professor_comments.deleteMany({
        where: {
          OR: [
            { target_id: id },
            { author_id: id }
          ]
        }
      });

      // 2. Delete responses and SLA alerts for tickets created by this client
      await tx.ticket_responses.deleteMany({
        where: {
          OR: [
            { author_id: id },
            { tickets: { creator_id: id } }
          ]
        }
      });
      await tx.sla_alerts.deleteMany({
        where: {
          tickets: { creator_id: id }
        }
      });

      // 3. Delete tickets created by this client
      await tx.tickets.deleteMany({
        where: { creator_id: id }
      });

      // 4. Delete contract signatures, versions, and contracts created by this client
      await tx.contract_signatures.deleteMany({
        where: {
          OR: [
            { user_id: id },
            { contracts: { created_by: id } }
          ]
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

      // 5. Delete demand files and demands created by this client
      await tx.demand_files.deleteMany({
        where: { uploaded_by: id }
      });
      await tx.demands.deleteMany({
        where: { created_by: id }
      });

      // 6. Delete financial entries created or paid by this client
      await tx.financial_entries.deleteMany({
        where: {
          OR: [
            { created_by: id },
            { paid_by: id }
          ]
        }
      });

      // 7. Nullify client_id on projects of this client
      await tx.projects.updateMany({
        where: { client_id: id },
        data: { client_id: null }
      });

      // 8. Delete user sessions, project members, notifications, goals, demand assignees
      await tx.user_sessions.deleteMany({ where: { user_id: id } });
      await tx.project_members.deleteMany({ where: { user_id: id } });
      await tx.notifications.deleteMany({ where: { user_id: id } });
      await tx.profitability_goals.deleteMany({ where: { user_id: id } });
      await tx.demand_assignees.deleteMany({ where: { user_id: id } });

      // 9. Finally delete the user
      await tx.users.delete({
        where: { id },
      });
    });

    return user;
  }
}
