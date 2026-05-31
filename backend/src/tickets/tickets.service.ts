import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateTicketDto } from './dto/tickets.dto';
import { NotificationsGateway } from '../socket/notifications/notifications.gateway';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(userId: string, createTicketDto: CreateTicketDto) {
    const created = await this.prisma.tickets.create({
      data: {
        creator_id: userId,
        project_id: createTicketDto.projectId || null,
        subject: createTicketDto.subject,
        description: createTicketDto.description,
        status: 'OPEN',
        sla_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Preenchido por seguranca, trigger ajusta com exatidao
      },
    });

    return {
      id: created.id,
      projectId: created.project_id,
      creatorId: created.creator_id,
      subject: created.subject,
      description: created.description,
      status: created.status,
      createdAt: created.created_at.toISOString(),
      updatedAt: created.updated_at.toISOString(),
    };
  }

  async findAll(userId: string, userRole: string, page = 1, limit = 100) {
    let whereClause: any = {};

    if (userRole === 'CLIENTE') {
      whereClause = { creator_id: userId };
    }

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.tickets.findMany({
        where: whereClause,
        include: {
          users: true,
          projects: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tickets.count({ where: whereClause }),
    ]);

    const data = tickets.map((t) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, cpf_cnpj_encrypted, ...creatorClean } = t.users;
      return {
        id: t.id,
        projectId: t.project_id,
        creatorId: t.creator_id,
        subject: t.subject,
        description: t.description,
        status: t.status,
        slaDeadline: t.sla_deadline.toISOString(),
        createdAt: t.created_at.toISOString(),
        updatedAt: t.updated_at.toISOString(),
        creator: creatorClean,
        project: t.projects
          ? {
              id: t.projects.id,
              name: t.projects.name,
            }
          : null,
      };
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getDump() {
    const tickets = await this.prisma.tickets.findMany({
      include: { users: true },
    });
    const responses = await this.prisma.ticket_responses.findMany({
      include: { users: true },
    });

    return {
      tickets: tickets.map((t) => ({
        id: t.id,
        projectId: t.project_id,
        creatorId: t.creator_id,
        subject: t.subject,
        description: t.description,
        status: t.status,
        slaDeadline: t.sla_deadline.toISOString(),
        createdAt: t.created_at.toISOString(),
        updatedAt: t.updated_at.toISOString(),
      })),
      responses: responses.map((r) => ({
        id: r.id,
        ticketId: r.ticket_id,
        authorId: r.author_id,
        message: r.message,
        createdAt: r.created_at.toISOString(),
        author: { name: r.users.name, role: r.users.role },
      })),
    };
  }

  async findOne(id: string) {
    const ticket = await this.prisma.tickets.findUnique({
      where: { id },
      include: {
        users: true,
        projects: true,
        ticket_responses: {
          include: {
            users: true,
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Chamado com ID ${id} não encontrado.`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, cpf_cnpj_encrypted, ...creatorClean } = ticket.users;

    const responses = ticket.ticket_responses.map((tr) => ({
      id: tr.id,
      ticketId: tr.ticket_id,
      authorId: tr.author_id,
      message: tr.message,
      createdAt: tr.created_at.toISOString(),
      author: { name: tr.users.name, role: tr.users.role },
    }));

    return {
      id: ticket.id,
      projectId: ticket.project_id,
      creatorId: ticket.creator_id,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      slaDeadline: ticket.sla_deadline.toISOString(),
      createdAt: ticket.created_at.toISOString(),
      updatedAt: ticket.updated_at.toISOString(),
      creator: creatorClean,
      project: ticket.projects
        ? {
            id: ticket.projects.id,
            name: ticket.projects.name,
          }
        : null,
      responses,
    };
  }

  async addResponse(ticketId: string, authorId: string, message: string) {
    const ticket = await this.findOne(ticketId); // Garante que existe

    if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') {
      throw new ConflictException('Não é possível adicionar respostas a um ticket fechado ou resolvido.');
    }

    const newResponse = await this.prisma.$transaction(async (tx) => {
      const response = await tx.ticket_responses.create({
        data: {
          ticket_id: ticketId,
          author_id: authorId,
          message,
        },
      });

      // Atualiza updatedAt do ticket correspondente
      await tx.tickets.update({
        where: { id: ticketId },
        data: { updated_at: new Date() },
      });

      return response;
    });

    if (ticket.creatorId !== authorId) {
      this.notificationsGateway.sendNotificationToUser(ticket.creatorId, {
        title: 'Nova Resposta',
        message: `Uma nova resposta foi adicionada ao chamado "${ticket.subject}"`,
        type: 'info'
      });
    } else {
      this.notificationsGateway.sendNotificationToAll({
        title: 'Nova Resposta de Cliente',
        message: `O cliente respondeu ao chamado "${ticket.subject}"`,
        type: 'info'
      });
    }

    return {
      id: newResponse.id,
      ticketId: newResponse.ticket_id,
      authorId: newResponse.author_id,
      message: newResponse.message,
      createdAt: newResponse.created_at.toISOString(),
    };
  }

  async updateStatus(ticketId: string, status: string) {
    await this.findOne(ticketId); // Garante que existe

    const updated = await this.prisma.tickets.update({
      where: { id: ticketId },
      data: {
        status: status as any,
      },
    });

    this.notificationsGateway.sendNotificationToUser(updated.creator_id, {
      title: 'Status do Chamado Atualizado',
      message: `O chamado "${updated.subject}" foi atualizado para o status ${status}`,
      type: 'success'
    });

    return {
      id: updated.id,
      projectId: updated.project_id,
      creatorId: updated.creator_id,
      subject: updated.subject,
      description: updated.description,
      status: updated.status,
      slaDeadline: updated.sla_deadline.toISOString(),
      createdAt: updated.created_at.toISOString(),
      updatedAt: updated.updated_at.toISOString(),
    };
  }
}
