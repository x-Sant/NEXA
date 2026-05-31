import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { databaseContextStorage } from '../database/database-context';
import { CreateFinanceiroDto } from './dto/create-financeiro.dto';
import { UpdateFinanceiroDto } from './dto/update-financeiro.dto';

@Injectable()
export class FinanceiroService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createFinanceiroDto: CreateFinanceiroDto) {
    const context = databaseContextStorage.getStore();
    const creatorId = context?.userId || '1882c113-4677-4892-99b3-73e0fd8b9f93';

    const isPaid = createFinanceiroDto.status === 'PAID';

    const newEntry = await this.prisma.financial_entries.create({
      data: {
        type: createFinanceiroDto.type as any,
        description: createFinanceiroDto.description,
        amount_cents: BigInt(Math.round(createFinanceiroDto.amount * 100)),
        due_date: new Date(createFinanceiroDto.dueDate),
        status: createFinanceiroDto.status as any,
        category: createFinanceiroDto.category || null,
        project_id: createFinanceiroDto.projectId || null,
        created_by: creatorId,
        paid_at: isPaid ? new Date() : null,
        paid_by: isPaid ? creatorId : null,
      },
    });

    return {
      id: newEntry.id,
      type: newEntry.type,
      description: newEntry.description,
      amount: Number(newEntry.amount_cents) / 100,
      dueDate: newEntry.due_date.toISOString(),
      status: newEntry.status,
      category: newEntry.category,
      projectId: newEntry.project_id,
      createdAt: newEntry.created_at.toISOString(),
      updatedAt: newEntry.updated_at.toISOString(),
    };
  }

  async findAll(query?: {
    type?: string;
    status?: string;
    projectId?: string;
    month?: string;
    page?: number;
    limit?: number;
  }) {
    const whereClause: any = {};

    if (query) {
      if (query.type) whereClause.type = query.type as any;
      if (query.status) whereClause.status = query.status as any;
      if (query.projectId) whereClause.project_id = query.projectId;
      if (query.month) {
        // query.month is in YYYY-MM format
        const startDate = new Date(`${query.month}-01T00:00:00Z`);
        const nextMonth = new Date(startDate);
        nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);

        whereClause.due_date = {
          gte: startDate,
          lt: nextMonth,
        };
      }
    }

    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      this.prisma.financial_entries.findMany({
        where: whereClause,
        orderBy: { due_date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.financial_entries.count({ where: whereClause }),
    ]);

    const data = entries.map((e) => ({
      id: e.id,
      type: e.type,
      description: e.description,
      amount: Number(e.amount_cents) / 100,
      dueDate: e.due_date.toISOString(),
      status: e.status,
      category: e.category,
      projectId: e.project_id,
      createdAt: e.created_at.toISOString(),
      updatedAt: e.updated_at.toISOString(),
    }));

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    const entry = await this.prisma.financial_entries.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException(
        `Lançamento financeiro com ID ${id} não encontrado.`,
      );
    }

    return {
      id: entry.id,
      type: entry.type,
      description: entry.description,
      amount: Number(entry.amount_cents) / 100,
      dueDate: entry.due_date.toISOString(),
      status: entry.status,
      category: entry.category,
      projectId: entry.project_id,
      createdAt: entry.created_at.toISOString(),
      updatedAt: entry.updated_at.toISOString(),
    };
  }

  async update(id: string, updateFinanceiroDto: UpdateFinanceiroDto) {
    await this.findOne(id); // Garante que existe
    const data: any = {};

    if (updateFinanceiroDto.type) data.type = updateFinanceiroDto.type as any;
    if (updateFinanceiroDto.description)
      data.description = updateFinanceiroDto.description;
    if (updateFinanceiroDto.amount !== undefined)
      data.amount_cents = BigInt(Math.round(updateFinanceiroDto.amount * 100));
    if (updateFinanceiroDto.dueDate)
      data.due_date = new Date(updateFinanceiroDto.dueDate);
    if (updateFinanceiroDto.status)
      data.status = updateFinanceiroDto.status as any;
    if (updateFinanceiroDto.category)
      data.category = updateFinanceiroDto.category;
    if (updateFinanceiroDto.projectId)
      data.project_id = updateFinanceiroDto.projectId;

    if (updateFinanceiroDto.status === 'PAID') {
      const context = databaseContextStorage.getStore();
      data.paid_at = new Date();
      data.paid_by = context?.userId || '1882c113-4677-4892-99b3-73e0fd8b9f93';
    }

    const updated = await this.prisma.financial_entries.update({
      where: { id },
      data,
    });

    return {
      id: updated.id,
      type: updated.type,
      description: updated.description,
      amount: Number(updated.amount_cents) / 100,
      dueDate: updated.due_date.toISOString(),
      status: updated.status,
      category: updated.category,
      projectId: updated.project_id,
      createdAt: updated.created_at.toISOString(),
      updatedAt: updated.updated_at.toISOString(),
    };
  }

  async remove(id: string) {
    const entry = await this.findOne(id);
    await this.prisma.financial_entries.delete({
      where: { id },
    });
    return entry;
  }

  async getStats() {
    const revenueAgg = await this.prisma.financial_entries.aggregate({
      _sum: { amount_cents: true },
      where: { type: 'RECEIVABLE', status: 'PAID' },
    });

    const expensesAgg = await this.prisma.financial_entries.aggregate({
      _sum: { amount_cents: true },
      where: { type: 'PAYABLE', status: 'PAID' },
    });

    const revenue = Number(revenueAgg._sum.amount_cents || 0n) / 100;
    const expenses = Number(expensesAgg._sum.amount_cents || 0n) / 100;
    const balance = revenue - expenses;

    return {
      revenue,
      expenses,
      balance,
    };
  }

  async getUserProfitability(userId: string) {
    const goals = await this.prisma.profitability_goals.findMany({
      where: { user_id: userId },
      orderBy: { month: 'desc' },
    });

    return goals.map((g) => ({
      id: g.id,
      userId: g.user_id,
      month: g.month,
      target: Number(g.target_cents) / 100,
      actual: Number(g.actual_cents) / 100,
    }));
  }
}
