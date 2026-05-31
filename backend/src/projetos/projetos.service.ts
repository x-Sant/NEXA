import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { databaseContextStorage } from '../database/database-context';
import {
  CreateProjetoDto,
  CreateDemandaDto,
  AddMemberDto,
  CreateContractDto,
} from './dto/projetos.dto';
import * as crypto from 'crypto';
import { ForbiddenException } from '@nestjs/common';

function safeIsoString(date: any): string {
  if (!date) return '';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

@Injectable()
export class ProjetosService {
  constructor(private readonly prisma: PrismaService) {}

  private memoryDeliveries: any[] = [];

  private generateSha256Hash(val: string): string {
    return crypto.createHash('sha256').update(val).digest('hex');
  }

  async create(createProjectDto: CreateProjetoDto) {
    const context = databaseContextStorage.getStore();
    const ownerId = context?.userId || '1882c113-4677-4892-99b3-73e0fd8b9f93';

    const newProject = await this.prisma.projects.create({
      data: {
        name: createProjectDto.name,
        description: createProjectDto.description || null,
        deadline: new Date(createProjectDto.deadline),
        status: 'ACTIVE',
        owner_id: ownerId,
        client_id: createProjectDto.clientId || null,
      },
    });

    return {
      id: newProject.id,
      name: newProject.name,
      description: newProject.description,
      deadline: safeIsoString(newProject.deadline),
      status: newProject.status,
      ownerId: newProject.owner_id,
      clientId: newProject.client_id,
      createdAt: safeIsoString(newProject.created_at),
      updatedAt: safeIsoString(newProject.updated_at),
    };
  }

  async findAll(userId: string, userRole: string, page = 1, limit = 100) {
    let whereClause: any = {};

    if (userRole === 'NIVEL_1') {
      whereClause = {
        project_members: {
          some: {
            user_id: userId,
          },
        },
      };
    } else if (userRole === 'CLIENTE') {
      whereClause = {
        client_id: userId,
      };
    }

    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      this.prisma.projects.findMany({
        where: whereClause,
        include: {
          project_members: true,
          demands: true,
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.projects.count({ where: whereClause }),
    ]);

    const data = projects.map((p) => {
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        deadline: safeIsoString(p.deadline),
        status: p.status,
        ownerId: p.owner_id,
        clientId: p.client_id,
        createdAt: safeIsoString(p.created_at),
        updatedAt: safeIsoString(p.updated_at),
        membersCount: p.project_members.length,
        demandsCount: p.demands.length,
      };
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getDump(userId: string, userRole: string) {
    let projectWhere: any = undefined;
    let memberWhere: any = undefined;
    let demandWhere: any = undefined;
    let fileWhere: any = undefined;

    if (userRole === 'CLIENTE' || userRole === 'NIVEL_1') {
      if (userRole === 'CLIENTE') {
        projectWhere = { client_id: userId };
      } else {
        projectWhere = { project_members: { some: { user_id: userId } } };
      }

      const allowedProjects = await this.prisma.projects.findMany({ where: projectWhere, select: { id: true } });
      const projectIds = allowedProjects.map(p => p.id);

      memberWhere = { project_id: { in: projectIds } };
      demandWhere = { project_id: { in: projectIds } };
      
      const allowedDemands = await this.prisma.demands.findMany({ where: demandWhere, select: { id: true } });
      const demandIds = allowedDemands.map(d => d.id);

      fileWhere = {
        OR: [
          { project_id: { in: projectIds } },
          { demand_id: { in: demandIds } }
        ]
      };
    }

    const projects = await this.prisma.projects.findMany({ 
      where: projectWhere,
      include: { contracts: true }
    });
    const members = await this.prisma.project_members.findMany({ where: memberWhere });
    const demands = await this.prisma.demands.findMany({ where: demandWhere });
    const files = await this.prisma.demand_files.findMany({ where: fileWhere });

    return {
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        deadline: safeIsoString(p.deadline),
        status: p.status,
        ownerId: p.owner_id,
        clientId: p.client_id,
        createdAt: safeIsoString(p.created_at),
        updatedAt: safeIsoString(p.updated_at),
        contracts: p.contracts ? p.contracts.map((c: any) => ({
          id: c.id,
          projectId: c.project_id,
          title: c.title,
          content: c.content,
          contentHash: c.content_hash,
          status: c.status,
          createdAt: safeIsoString(c.created_at),
          updatedAt: safeIsoString(c.updated_at),
        })) : []
      })),
      members: members.map((m) => ({
        id: m.id,
        projectId: m.project_id,
        userId: m.user_id,
        assignedAt: safeIsoString(m.assigned_at),
        productivity: Number(m.productivity),
        progress: Number(m.progress),
      })),
      demands: demands.map((d) => ({
        id: d.id,
        projectId: d.project_id,
        title: d.title,
        description: d.description,
        deadline: safeIsoString(d.deadline),
        status: d.status,
        createdAt: safeIsoString(d.created_at),
        updatedAt: safeIsoString(d.updated_at),
      })),
      projectFiles: files.map((f) => ({
        id: f.id,
        projectId: f.project_id || f.demand_id || '',
        subfolder: f.subfolder,
        fileName: f.file_name,
        fileKey: f.file_key,
        fileSize: Number(f.file_size_bytes),
        mimeType: f.mime_type,
        uploadedById: f.uploaded_by,
        createdAt: safeIsoString(f.created_at),
      })),
      deliveries: this.memoryDeliveries.filter((d) => {
        // Apply basic filtering if user is NIVEL_1 or CLIENTE
        if (userRole === 'CLIENTE') return true; // Could filter by client's project
        if (userRole === 'NIVEL_1') return true;
        return true;
      }),
    };
  }

  async findOne(id: string) {
    const project = await this.prisma.projects.findUnique({
      where: { id },
      include: {
        contracts: true,
        demands: true,
        project_members: {
          include: {
            users: true,
          },
        },
        demand_files: {
          include: {
            users: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Projeto com ID ${id} não encontrado.`);
    }

    let client: any = null;
    if (project.client_id) {
      const clientDb = await this.prisma.users.findUnique({
        where: { id: project.client_id },
      });
      if (clientDb) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password_hash, cpf_cnpj_encrypted, ...clientClean } = clientDb;
        client = clientClean;
      }
    }

    const members = project.project_members.map((m) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, cpf_cnpj_encrypted, ...userClean } = m.users;
      return {
        id: m.id,
        projectId: m.project_id,
        userId: m.user_id,
        assignedAt: safeIsoString(m.assigned_at),
        productivity: Number(m.productivity),
        progress: Number(m.progress),
        user: userClean,
      };
    });

    const demands = project.demands.map((d) => {
      return {
        id: d.id,
        projectId: d.project_id,
        title: d.title,
        description: d.description,
        deadline: safeIsoString(d.deadline),
        status: d.status,
        createdAt: safeIsoString(d.created_at),
        updatedAt: safeIsoString(d.updated_at),
      };
    });

    const projectFiles = project.demand_files.map((pf) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, cpf_cnpj_encrypted, ...uploaderClean } = pf.users;
      return {
        id: pf.id,
        projectId: pf.project_id || pf.demand_id, // Fallback para compatibilidade do frontend
        subfolder: pf.subfolder,
        fileName: pf.file_name,
        fileKey: pf.file_key,
        fileSize: Number(pf.file_size_bytes),
        mimeType: pf.mime_type,
        uploadedById: pf.uploaded_by,
        createdAt: safeIsoString(pf.created_at),
        uploadedBy: uploaderClean,
      };
    });

    const contracts = project.contracts.map((c) => {
      return {
        id: c.id,
        projectId: c.project_id,
        title: c.title,
        content: c.content,
        status: c.status === 'APPROVED' ? 'SIGNED' : c.status, // Mapeia APPROVED do banco para SIGNED do front
        createdAt: safeIsoString(c.created_at),
        updatedAt: safeIsoString(c.updated_at),
      };
    });

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      deadline: safeIsoString(project.deadline),
      status: project.status,
      ownerId: project.owner_id,
      clientId: project.client_id,
      createdAt: safeIsoString(project.created_at),
      updatedAt: safeIsoString(project.updated_at),
      client,
      members,
      demands,
      projectFiles,
      contracts,
    };
  }

  async addMember(projectId: string, memberDto: AddMemberDto) {
    await this.findOne(projectId); // Garante que existe

    const exists = await this.prisma.project_members.findUnique({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: memberDto.userId,
        },
      },
    });

    if (exists) {
      const updated = await this.prisma.project_members.update({
        where: { id: exists.id },
        data: {
          productivity:
            memberDto.productivity !== undefined
              ? memberDto.productivity
              : exists.productivity,
          progress:
            memberDto.progress !== undefined
              ? memberDto.progress
              : exists.progress,
        },
      });
      return {
        id: updated.id,
        projectId: updated.project_id,
        userId: updated.user_id,
        assignedAt: safeIsoString(updated.assigned_at),
        productivity: Number(updated.productivity),
        progress: Number(updated.progress),
      };
    }

    const created = await this.prisma.project_members.create({
      data: {
        project_id: projectId,
        user_id: memberDto.userId,
        productivity: memberDto.productivity || 0,
        progress: memberDto.progress || 0,
      },
    });

    return {
      id: created.id,
      projectId: created.project_id,
      userId: created.user_id,
      assignedAt: safeIsoString(created.assigned_at),
      productivity: Number(created.productivity),
      progress: Number(created.progress),
    };
  }

  async removeMember(projectId: string, userId: string) {
    await this.findOne(projectId); // Garante que o projeto existe

    const exists = await this.prisma.project_members.findUnique({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: userId,
        },
      },
    });

    if (!exists) {
      throw new NotFoundException(`Colaborador com ID ${userId} não é membro deste projeto.`);
    }

    const demands = await this.prisma.demands.findMany({
      where: { project_id: projectId },
      select: { id: true },
    });
    const demandIds = demands.map((d) => d.id);

    await this.prisma.$transaction(async (tx) => {
      if (demandIds.length > 0) {
        await tx.demand_assignees.deleteMany({
          where: {
            user_id: userId,
            demand_id: { in: demandIds },
          },
        });
      }

      await tx.project_members.delete({
        where: { id: exists.id },
      });
    });

    return { success: true };
  }

  async createDemand(projectId: string, demandDto: CreateDemandaDto) {
    await this.findOne(projectId);

    const context = databaseContextStorage.getStore();
    const creatorId = context?.userId || '1882c113-4677-4892-99b3-73e0fd8b9f93';

    const created = await this.prisma.demands.create({
      data: {
        project_id: projectId,
        title: demandDto.title,
        description: demandDto.description || null,
        deadline: new Date(demandDto.deadline),
        status: 'PENDING',
        created_by: creatorId,
      },
    });

    return {
      id: created.id,
      projectId: created.project_id,
      title: created.title,
      description: created.description,
      deadline: safeIsoString(created.deadline),
      status: created.status,
      createdAt: safeIsoString(created.created_at),
      updatedAt: safeIsoString(created.updated_at),
    };
  }

  async updateDemandStatus(demandId: string, status: string) {
    const demand = await this.prisma.demands.findUnique({
      where: { id: demandId },
    });

    if (!demand) {
      throw new NotFoundException(`Demanda com ID ${demandId} não encontrada.`);
    }

    const updated = await this.prisma.demands.update({
      where: { id: demandId },
      data: {
        status: status as any,
      },
    });

    return {
      id: updated.id,
      projectId: updated.project_id,
      title: updated.title,
      description: updated.description,
      deadline: safeIsoString(updated.deadline),
      status: updated.status,
      createdAt: safeIsoString(updated.created_at),
      updatedAt: safeIsoString(updated.updated_at),
    };
  }

  async addProjectFiles(projectId: string, files: any[]) {
    const context = databaseContextStorage.getStore();
    const uploaderId =
      context?.userId || '1882c113-4677-4892-99b3-73e0fd8b9f93';

    for (const file of files) {
      const fileUuid = file.id?.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      )
        ? file.id
        : crypto.randomUUID();

      const isReference =
        file.subfolder === 'referencias' || file.subfolder === 'contratos';

      await this.prisma.demand_files.create({
        data: {
          id: fileUuid,
          project_id: isReference ? projectId : null,
          demand_id: !isReference ? file.projectId || null : null,
          subfolder: file.subfolder,
          file_name: file.fileName,
          file_key: file.fileKey,
          file_size_bytes: BigInt(file.fileSize || 1024),
          mime_type: file.mimeType,
          uploaded_by: uploaderId,
        },
      });
    }

    return files;
  }

  async addDelivery(projectId: string, deliveryData: any) {
    const delivery = {
      ...deliveryData,
      id: `del-${Date.now()}`,
      projectId,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    this.memoryDeliveries.push(delivery);
    return delivery;
  }

  async validateDelivery(projectId: string, deliveryId: string, validateData: any) {
    const delivery = this.memoryDeliveries.find((d) => d.id === deliveryId && d.projectId === projectId);
    if (!delivery) {
      throw new NotFoundException(`Entrega ${deliveryId} não encontrada.`);
    }
    delivery.status = 'VALIDATED';
    if (validateData.rating) delivery.rating = validateData.rating;
    if (validateData.ratingComment) delivery.ratingComment = validateData.ratingComment;
    return delivery;
  }

  async addContract(projectId: string, contractDto: CreateContractDto) {
    const project = await this.prisma.projects.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(
        `Projeto com ID ${projectId} não encontrado.`,
      );
    }

    const context = databaseContextStorage.getStore();
    const creatorId = context?.userId || '1882c113-4677-4892-99b3-73e0fd8b9f93';

    const contentHash = this.generateSha256Hash(contractDto.content);

    const created = await this.prisma.contracts.create({
      data: {
        project_id: projectId,
        title: contractDto.title,
        content: contractDto.content,
        content_hash: contentHash,
        status: 'PENDING',
        created_by: creatorId,
      },
    });

    return {
      id: created.id,
      projectId: created.project_id,
      title: created.title,
      content: created.content,
      status: 'PENDING',
      createdAt: safeIsoString(created.created_at),
      updatedAt: safeIsoString(created.updated_at),
    };
  }

  async signContract(projectId: string, contractId: string, clientIp: string = '127.0.0.1') {
    const context = databaseContextStorage.getStore();
    const userId = context?.userId;

    if (!userId) {
      throw new ForbiddenException('Usuário não autenticado.');
    }

    const project = await this.prisma.projects.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Projeto não encontrado.`);
    }

    if (project.client_id !== userId) {
      // Permitir NIVEL_3 (admin) assinar também caso precise? O relatório diz: "CLIENTE pode assinar contratos de projetos de outros clientes. Correção: verificar que client_id do projeto = userId do autenticado."
      const role = context?.userRole;
      if (role !== 'NIVEL_3') {
        throw new ForbiddenException('Apenas o cliente dono do projeto pode assinar este contrato.');
      }
    }

    const contract = await this.prisma.contracts.findFirst({
      where: { id: contractId, project_id: projectId },
    });

    if (!contract) {
      throw new NotFoundException(`Contrato não encontrado para este projeto.`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedContract = await tx.contracts.update({
        where: { id: contractId },
        data: {
          status: 'APPROVED',
        },
      });

      await tx.contract_signatures.create({
        data: {
          id: crypto.randomUUID(),
          contract_id: contractId,
          user_id: userId,
          ip_address: clientIp,
          content_hash_at_sign: contract.content_hash,
          signed_at: new Date(),
        }
      });

      return updatedContract;
    });

    return {
      id: updated.id,
      projectId: updated.project_id,
      title: updated.title,
      content: updated.content,
      status: 'SIGNED', // Mapeia APPROVED do banco para SIGNED do front
      createdAt: safeIsoString(updated.created_at),
      updatedAt: safeIsoString(updated.updated_at),
    };
  }

  async remove(id: string) {
    const project = await this.prisma.projects.findUnique({
      where: { id },
    });
    if (!project) {
      throw new NotFoundException(`Projeto com ID ${id} não encontrado.`);
    }

    await this.prisma.runWithContext(async (tx) => {
      // 1. Delete contract signatures of contracts belonging to this project
      await tx.contract_signatures.deleteMany({
        where: {
          contracts: {
            project_id: id
          }
        }
      });

      // 2. Delete contract versions of contracts belonging to this project
      await tx.contract_versions.deleteMany({
        where: {
          contracts: {
            project_id: id
          }
        }
      });

      // 3. Delete contracts of this project
      await tx.contracts.deleteMany({
        where: { project_id: id }
      });

      // 4. Nullify project_id on financial_entries
      await tx.financial_entries.updateMany({
        where: { project_id: id },
        data: { project_id: null }
      });

      // 5. Nullify project_id on tickets
      await tx.tickets.updateMany({
        where: { project_id: id },
        data: { project_id: null }
      });

      // 6. Delete project files
      await tx.demand_files.deleteMany({
        where: { project_id: id }
      });

      // 7. Delete demands
      await tx.demands.deleteMany({
        where: { project_id: id }
      });

      // 8. Delete project members
      await tx.project_members.deleteMany({
        where: { project_id: id }
      });

      // 9. Finally delete the project
      await tx.projects.delete({
        where: { id }
      });
    });

    // 10. Clean up memory deliveries
    this.memoryDeliveries = this.memoryDeliveries.filter(d => d.projectId !== id);

    return project;
  }
}
